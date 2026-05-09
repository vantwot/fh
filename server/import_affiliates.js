const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'database.sqlite'));
db.pragma('foreign_keys = OFF');
const sqlPath = path.join(__dirname, 'afiliados_viejos_202605091212.sql');

function hexToBase64(hex) {
  if (!hex || hex === 'NULL') return null;
  // Limpiar posibles comillas, prefijos N' o 0x, y espacios
  let cleanHex = hex.trim();
  if (cleanHex.startsWith("N'")) cleanHex = cleanHex.substring(2, cleanHex.length - 1);
  if (cleanHex.startsWith("'")) cleanHex = cleanHex.substring(1, cleanHex.length - 1);
  if (cleanHex.startsWith("0x")) cleanHex = cleanHex.substring(2);
  
  try {
    return Buffer.from(cleanHex, 'hex').toString('base64');
  } catch (e) {
    console.warn('Error converting hex to base64:', e.message);
    return null;
  }
}

async function importData() {
  console.log('Recreating members table...');
  db.exec(`
    DROP TABLE IF EXISTS members;
    CREATE TABLE members (
      id TEXT PRIMARY KEY, -- AffiliateId
      code TEXT,
      names TEXT NOT NULL,
      lastNames TEXT,
      identification_type_id TEXT,
      identification TEXT,
      isActive INTEGER DEFAULT 1,
      photo TEXT,
      fingerprint TEXT,
      membership_id TEXT,
      membershipInit TEXT,
      membershipExpired TEXT,
      numberVisits INTEGER,
      -- Existing columns for compatibility
      name TEXT,
      phone TEXT,
      email TEXT,
      birth_date TEXT,
      status TEXT DEFAULT 'Activo',
      registration_date TEXT,
      FOREIGN KEY (membership_id) REFERENCES memberships(id)
    );
  `);

  console.log('Processing SQL file in chunks...');
  const fd = fs.openSync(sqlPath, 'r');
  const bufferSize = 1024 * 1024; // 1MB chunks
  const buffer = Buffer.alloc(bufferSize);
  
  let leftover = '';
  let rowCount = 0;

  const insertStmt = db.prepare(`
    INSERT INTO members (
      id, code, names, lastNames, identification_type_id, 
      identification, isActive, photo, fingerprint, membership_id, 
      membershipInit, membershipExpired, numberVisits, name, status, phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');

  try {
    let bytesRead;
    let foundValues = false;

    while ((bytesRead = fs.readSync(fd, buffer, 0, bufferSize)) > 0) {
      let content = leftover + buffer.toString('utf8', 0, bytesRead);
      
      if (!foundValues) {
        const valuesIndex = content.indexOf('VALUES');
        if (valuesIndex !== -1) {
          content = content.substring(valuesIndex + 6);
          foundValues = true;
        } else {
          leftover = content;
          continue;
        }
      }

      // Split by row delimiter
      let parts = content.split(/\),\s*\(/);
      leftover = parts.pop();

      for (let rowStr of parts) {
        processRow(rowStr);
      }
    }

    if (leftover) {
      let rowStr = leftover.trim();
      if (rowStr.endsWith(';')) rowStr = rowStr.substring(0, rowStr.length - 1);
      if (rowStr.endsWith(')')) rowStr = rowStr.substring(0, rowStr.length - 1);
      processRow(rowStr);
    }

    function processRow(rowStr) {
      rowStr = rowStr.trim();
      if (rowStr.startsWith('(')) rowStr = rowStr.substring(1);
      
      const values = [];
      let currentVal = '';
      let inStr = false;
      for (let j = 0; j < rowStr.length; j++) {
        const char = rowStr[j];
        if (char === "'" && rowStr[j-1] !== "\\") {
          inStr = !inStr;
          currentVal += char;
        } else if (char === "," && !inStr) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      if (values.length >= 13) {
        const clean = (val) => {
          if (!val || val === 'NULL') return null;
          if (val.startsWith("N'")) return val.substring(2, val.length - 1);
          if (val.startsWith("'")) return val.substring(1, val.length - 1);
          return val;
        };

        const id = clean(values[0]);
        const code = clean(values[1]);
        const names = clean(values[2]);
        const lastNames = clean(values[3]);
        const id_type = clean(values[4]);
        const id_num = clean(values[5]);
        const phone = clean(values[6]);
        const isActive = parseInt(clean(values[7])) || 0;
        
        const photoHex = values[8];
        const photo = photoHex && photoHex !== 'NULL' ? `data:image/jpeg;base64,${hexToBase64(photoHex)}` : null;
        
        const fingerprintHex = values[9];
        const fingerprint = fingerprintHex && fingerprintHex !== 'NULL' ? hexToBase64(fingerprintHex) : null;
        
        const membership_id = clean(values[10]);
        const membershipInit = clean(values[11]);
        const membershipExpired = clean(values[12]);
        const numberVisits = parseInt(clean(values[13])) || 0;
        
        const displayName = `${names || ''} ${lastNames || ''}`.trim();
        const status = isActive === 1 ? 'Activo' : 'Inactivo';

        try {
          insertStmt.run(
            id, code, names, lastNames, id_type, 
            id_num, isActive, photo, fingerprint, membership_id, 
            membershipInit, membershipExpired, numberVisits, displayName, status, phone
          );
          rowCount++;
          if (rowCount % 100 === 0) console.log(`Processed ${rowCount} rows...`);
        } catch (e) {
          console.warn(`Skipping row with ID ${id}: ${e.message}`);
        }
      }
    }

    db.exec('COMMIT');
    console.log(`Import successful! Processed ${rowCount} rows.`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Import failed:', err);
  } finally {
    fs.closeSync(fd);
    db.close();
  }
}

importData();
