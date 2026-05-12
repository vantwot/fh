const { Database } = require('bun:sqlite');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    client_name TEXT,
    phone TEXT,
    system_code TEXT,
    membership_type TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    price REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    disciplines TEXT, -- JSON string
    hourly_rate REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS teacher_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    hours REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- academia, personal
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courtesy_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    phone TEXT,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    number_duration INTEGER,
    type_duration TEXT,
    cost REAL,
    is_promotional INTEGER,
    date_expired TEXT,
    number_person INTEGER,
    is_active INTEGER,
    monday INTEGER,
    tuesday INTEGER,
    wednesday INTEGER,
    thursday INTEGER,
    friday INTEGER,
    saturday INTEGER,
    sunday INTEGER,
    auditory TEXT,
    expired_type_duration TEXT,
    expired_number_duration INTEGER,
    contains_class INTEGER,
    number_class INTEGER,
    observation TEXT,
    year_init INTEGER,
    year_end INTEGER,
    subsidy TEXT,
    multi_sede INTEGER
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, -- AffiliateId
    Code TEXT,
    name TEXT,
    LastNames TEXT,
    IdentificationTypeId TEXT,
    IdentificationNumber TEXT NOT NULL,
    IsActive INTEGER DEFAULT 1,
    Photo TEXT,
    FingerPrint TEXT,
    membership_id TEXT,
    MembershipInit TEXT,
    MembershipExpired TEXT,
    NumberVisits INTEGER DEFAULT 0,
    FOREIGN KEY (membership_id) REFERENCES memberships(id)
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY, -- EmployeeId
    names TEXT NOT NULL,
    lastNames TEXT,
    identification_type_id TEXT,
    identification TEXT,
    phone TEXT,
    birth_date TEXT,
    charge TEXT,
    isActive INTEGER DEFAULT 1,
    photo TEXT,
    fingerprint TEXT,
    sald REAL
  );

  CREATE TABLE IF NOT EXISTS membership_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL,
    membership_id TEXT NOT NULL,
    total_value REAL NOT NULL,
    discount REAL DEFAULT 0,
    registration_fee REAL DEFAULT 0,
    amount_paid REAL NOT NULL,
    payment_method TEXT NOT NULL, -- efectivo, transferencia
    observation TEXT,
    date TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    visits INTEGER,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (membership_id) REFERENCES memberships(id)
  );
`);

// Migration: recreate teacher_logs without FK constraint (manual validation is done in the API)
try {
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='teacher_logs'").get();
  if (tableInfo && tableInfo.sql.includes('REFERENCES teachers')) {
    // Old schema referenced the old 'teachers' table — migrate
    db.exec(`
      CREATE TABLE teacher_logs_backup AS SELECT * FROM teacher_logs;
      DROP TABLE teacher_logs;
      CREATE TABLE teacher_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id TEXT NOT NULL,
        hours REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL
      );
      INSERT INTO teacher_logs SELECT * FROM teacher_logs_backup;
      DROP TABLE teacher_logs_backup;
    `);
    console.log('Migration: teacher_logs table recreated without old FK');
  } else if (tableInfo && tableInfo.sql.includes('FOREIGN KEY')) {
    // Has some FK constraint — drop and recreate to remove it
    db.exec(`
      CREATE TABLE teacher_logs_backup AS SELECT * FROM teacher_logs;
      DROP TABLE teacher_logs;
      CREATE TABLE teacher_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id TEXT NOT NULL,
        hours REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL
      );
      INSERT INTO teacher_logs SELECT * FROM teacher_logs_backup;
      DROP TABLE teacher_logs_backup;
    `);
    console.log('Migration: teacher_logs FK constraint removed');
  }
} catch (e) {
  console.warn('Migration warning for teacher_logs:', e.message);
}

// Add employee_schedules table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS employee_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    day_index INTEGER NOT NULL,
    hour INTEGER NOT NULL,
    UNIQUE(employee_id, day_index, hour)
  );
`);

// Migration: add hour_slot column to teacher_logs if missing
const tlCols = db.prepare("SELECT name FROM pragma_table_info('teacher_logs')").all();
const hasHourSlot = tlCols.some(c => c.name === 'hour_slot');
if (!hasHourSlot) {
  db.exec('ALTER TABLE teacher_logs ADD COLUMN hour_slot INTEGER');
  console.log('Migration: added hour_slot column to teacher_logs');
}

// Migration: convert Photo and FingerPrint columns in members from BLOB to TEXT
try {
  const membersCols = db.prepare("SELECT name, type FROM pragma_table_info('members')").all();
  const photoCol = membersCols.find(c => c.name === 'Photo');
  
  if (photoCol && photoCol.type.toLowerCase() === 'blob') {
    console.log('Migration: Converting Photo column from BLOB to TEXT and cleaning old data...');
    db.exec(`
      CREATE TABLE members_backup AS SELECT * FROM members;
      DROP TABLE members;
      CREATE TABLE members (
        id TEXT PRIMARY KEY,
        Code TEXT,
        name TEXT,
        LastNames TEXT,
        IdentificationTypeId TEXT,
        IdentificationNumber TEXT NOT NULL,
        IsActive INTEGER DEFAULT 1,
        Photo TEXT,
        FingerPrint TEXT,
        membership_id TEXT,
        MembershipInit TEXT,
        MembershipExpired TEXT,
        NumberVisits INTEGER DEFAULT 0,
        FOREIGN KEY (membership_id) REFERENCES memberships(id)
      );
      INSERT INTO members (id, Code, name, LastNames, IdentificationTypeId, IdentificationNumber, IsActive, Photo, FingerPrint, membership_id, MembershipInit, MembershipExpired, NumberVisits)
      SELECT id, Code, name, LastNames, IdentificationTypeId, IdentificationNumber, IsActive, NULL, NULL, membership_id, MembershipInit, MembershipExpired, NumberVisits FROM members_backup;
      DROP TABLE members_backup;
    `);
    console.log('Migration: Photo and FingerPrint columns converted to TEXT and old BLOB data cleared');
  }
} catch (e) {
  console.warn('Migration warning for members table Photo column:', e.message);
}

// Migration: remove member_id FK from membership_payments (now references Affiliates, not members)
try {
  const mpInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='membership_payments'").get();
  if (mpInfo && mpInfo.sql.includes('REFERENCES members')) {
    db.exec(`
      CREATE TABLE membership_payments_backup AS SELECT * FROM membership_payments;
      DROP TABLE membership_payments;
      CREATE TABLE membership_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        membership_id TEXT NOT NULL,
        total_value REAL NOT NULL,
        discount REAL DEFAULT 0,
        registration_fee REAL DEFAULT 0,
        amount_paid REAL NOT NULL,
        payment_method TEXT NOT NULL,
        observation TEXT,
        date TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        visits INTEGER,
        FOREIGN KEY (membership_id) REFERENCES memberships(id)
      );
      INSERT INTO membership_payments SELECT * FROM membership_payments_backup;
      DROP TABLE membership_payments_backup;
    `);
    console.log('Migration: removed member_id FK from membership_payments (now uses Affiliates)');
  }
} catch (e) {
  console.warn('Migration warning for membership_payments:', e.message);
}

// Migration: recreate courtesy_classes without observation column
try {
  const ccCols = db.prepare("SELECT name FROM pragma_table_info('courtesy_classes')").all();
  const hasObservation = ccCols.some(c => c.name === 'observation');
  
  if (hasObservation) {
    console.log('Migration: Removing observation column from courtesy_classes...');
    db.exec(`
      CREATE TABLE courtesy_classes_backup AS SELECT id, class_name, student_name, phone, date FROM courtesy_classes;
      DROP TABLE courtesy_classes;
      CREATE TABLE courtesy_classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        student_name TEXT NOT NULL,
        phone TEXT,
        date TEXT NOT NULL
      );
      INSERT INTO courtesy_classes SELECT id, class_name, student_name, phone, date FROM courtesy_classes_backup;
      DROP TABLE courtesy_classes_backup;
    `);
    console.log('Migration: courtesy_classes table updated successfully');
  }
} catch (e) {
  console.warn('Migration warning for courtesy_classes:', e.message);
}

// Insert default admin if not exists
const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!admin) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'fh2026', 'admin');
}

const mariana = db.prepare('SELECT * FROM users WHERE username = ?').get('mariana');
if (!mariana) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('mariana', 'fh2026', 'auxiliar');
}

// Initial drinks
const DRINKS = [
  { name: 'RECOVER', price: 6000, category: 'bebida' },
  { name: 'GATORADE', price: 5000, category: 'bebida' },
  { name: 'AGUA 600ml', price: 3000, category: 'bebida' },
  { name: 'AGUA 1L', price: 4000, category: 'bebida' },
  { name: 'REDBULL', price: 9500, category: 'bebida' },
  { name: 'SPEED pq', price: 3000, category: 'bebida' },
  { name: 'SPEED gr', price: 4000, category: 'bebida' }
];

DRINKS.forEach(drink => {
  const exists = db.prepare('SELECT * FROM inventory WHERE name = ?').get(drink.name);
  if (!exists) {
    db.prepare('INSERT INTO inventory (name, price, category, stock) VALUES (?, ?, ?, ?)')
      .run(drink.name, drink.price, drink.category, 5);
  }
});

// Database migrations and extensions are now integrated into CREATE TABLE

// Initial Memberships
const MEMBERSHIPS = require('./initial_memberships.json');

MEMBERSHIPS.forEach(m => {
  const exists = db.prepare('SELECT * FROM memberships WHERE id = ?').get(m.MembershipId);
  if (!exists) {
    db.prepare(`
      INSERT INTO memberships (
        id, name, number_duration, type_duration, cost, is_promotional,
        date_expired, number_person, is_active, monday, tuesday, wednesday,
        thursday, friday, saturday, sunday, auditory, expired_type_duration,
        expired_number_duration, contains_class, number_class, observation,
        year_init, year_end, subsidy, multi_sede
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      m.MembershipId, m.Name, m.NumberDuration, m.TypeDuration, m.Cost, m.IsPromotional,
      m.DateExpired, m.NumberPerson, m.IsActive, m.Monday, m.Tuesday, m.Wednesday,
      m.Thursday, m.Friday, m.Saturday, m.Sunday, m.Auditory, m.ExpiredTypeDuration,
      m.ExpiredNumberDuration, m.ContainsClass, m.NumberClass, m.Observation,
      m.YearInit, m.YearEnd, m.Subsidy, m.MultiSede
    );
  }
});

module.exports = db;