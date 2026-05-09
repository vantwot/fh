require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const fingerprint = require('./fingerprint');
const crypto = require('crypto');
const { sendPayrollReport, schedulePayrollReport } = require('./payroll-report');

const app = express();
app.use(cors({
  origin: '*'
}));app.use(express.json({ limit: '10mb' }));

// --- AUTH ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (user && user.password === password) {
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

// --- SALES ---
app.get('/api/sales', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
  const sales = db.prepare('SELECT * FROM sales ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);

  res.json({
    sales,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

app.get('/api/sales/summary', (req, res) => {
  const total = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM sales').get().total;
  const efectivo = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE payment_method = 'efectivo'").get().total;
  const transferencia = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE payment_method = 'transferencia'").get().total;
  const bebida = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE category = 'bebida'").get().total;
  const almacen = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE category IN ('almacen', 'insumo')").get().total;
  const mensualidad = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE category = 'mensualidad'").get().total;
  const clase_cortesia = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE category = 'clase_cortesia'").get().total;

  res.json({ total, efectivo, transferencia, bebida, almacen, mensualidad, clase_cortesia });
});

app.post('/api/sales', (req, res) => {
  const { 
    date, 
    category, 
    description, 
    amount, 
    paymentMethod, 
    clientName, 
    phone, 
    systemCode, 
    membershipType 
  } = req.body;
  
  // Transaction to ensure atomicity
  const transaction = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO sales (date, category, description, amount, payment_method, client_name, phone, system_code, membership_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(date, category, description, amount, paymentMethod, clientName, phone, systemCode, membershipType);

    // Decrement stock if it's a physical product
    if (category === 'bebida' || category === 'insumo' || category === 'almacen' || category === 'equipamiento') {
      db.prepare('UPDATE inventory SET stock = stock - 1 WHERE name = ? AND stock > 0').run(description);
    }

    return info.lastInsertRowid;
  });

  try {
    const id = transaction();
    res.json({ id, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sales/:id', (req, res) => {
  db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- INVENTORY ---
app.get('/api/inventory', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
  const items = db.prepare('SELECT * FROM inventory LIMIT ? OFFSET ?').all(limit, offset);
  
  res.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

app.post('/api/inventory', (req, res) => {
  const { name, category, stock, price, image } = req.body;
  const info = db.prepare(`
    INSERT INTO inventory (name, category, stock, price, image)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, category, stock, price, image || null);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

app.put('/api/inventory/:id', (req, res) => {
  const { name, category, stock, price, image } = req.body;
  db.prepare(`
    UPDATE inventory SET name = ?, category = ?, stock = ?, price = ?, image = ?
    WHERE id = ?
  `).run(name, category, stock, price, image || null, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/inventory/:id', (req, res) => {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- TEACHERS ---
app.get('/api/teachers', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers').all();
  res.json(teachers.map(t => ({ ...t, disciplines: JSON.parse(t.disciplines || '[]') })));
});

app.post('/api/teachers', (req, res) => {
  const { name, disciplines, hourlyRate } = req.body;
  const info = db.prepare(`
    INSERT INTO teachers (name, disciplines, hourly_rate)
    VALUES (?, ?, ?)
  `).run(name, JSON.stringify(disciplines), hourlyRate);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

app.get('/api/teacher-logs', (req, res) => {
  const { startDate, endDate } = req.query;
  if (startDate && endDate) {
    const logs = db.prepare('SELECT * FROM teacher_logs WHERE date >= ? AND date <= ? ORDER BY date ASC, hour_slot ASC').all(startDate, endDate);
    res.json(logs);
  } else {
    const logs = db.prepare('SELECT * FROM teacher_logs ORDER BY id DESC').all();
    res.json(logs);
  }
});

app.post('/api/teacher-logs', (req, res) => {
  const { teacherId, hours, description, date } = req.body;
  
  console.log('POST /api/teacher-logs received:', req.body);
  
  // Validar que teacherId sea válido
  if (!teacherId) {
    console.error('Missing teacherId in request');
    return res.status(400).json({ error: 'teacherId es requerido' });
  }

  // Verificar que el empleado existe
  const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(teacherId);
  if (!employee) {
    console.error('Employee not found with ID:', teacherId);
    return res.status(400).json({ error: `Empleado con ID ${teacherId} no encontrado` });
  }

  try {
    const info = db.prepare(`
      INSERT INTO teacher_logs (teacher_id, hours, description, date)
      VALUES (?, ?, ?, ?)
    `).run(teacherId, hours, description, date);
    
    console.log('Teacher log inserted successfully:', info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
    console.error('Error inserting teacher log:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/teacher-logs/:id', (req, res) => {
  db.prepare('DELETE FROM teacher_logs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST toggle attendance for a specific slot (date + hour)
app.post('/api/teacher-logs/toggle', (req, res) => {
  const { teacherId, date, hourSlot } = req.body;
  if (!teacherId || !date || hourSlot === undefined || hourSlot === null) {
    return res.status(400).json({ error: 'teacherId, date, hourSlot son requeridos' });
  }
  const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(teacherId);
  if (!employee) return res.status(400).json({ error: 'Empleado no encontrado' });

  const existing = db.prepare('SELECT id FROM teacher_logs WHERE teacher_id = ? AND date = ? AND hour_slot = ?').get(teacherId, date, hourSlot);
  if (existing) {
    db.prepare('DELETE FROM teacher_logs WHERE id = ?').run(existing.id);
    res.json({ action: 'removed' });
  } else {
    const info = db.prepare('INSERT INTO teacher_logs (teacher_id, date, hours, hour_slot, description) VALUES (?, ?, 1, ?, ?)').run(teacherId, date, hourSlot, `${hourSlot}:00`);
    res.json({ action: 'added', id: info.lastInsertRowid });
  }
});

// --- EMPLOYEE SCHEDULES ---
app.get('/api/employee-schedules', (req, res) => {
  const schedules = db.prepare('SELECT * FROM employee_schedules').all();
  res.json(schedules);
});

app.post('/api/employee-schedules/toggle', (req, res) => {
  const { employeeId, dayIndex, hour } = req.body;
  if (!employeeId || dayIndex === undefined || hour === undefined) {
    return res.status(400).json({ error: 'employeeId, dayIndex, hour son requeridos' });
  }
  const existing = db.prepare('SELECT id FROM employee_schedules WHERE employee_id = ? AND day_index = ? AND hour = ?').get(employeeId, dayIndex, hour);
  if (existing) {
    db.prepare('DELETE FROM employee_schedules WHERE id = ?').run(existing.id);
    res.json({ action: 'removed' });
  } else {
    const info = db.prepare('INSERT OR IGNORE INTO employee_schedules (employee_id, day_index, hour) VALUES (?, ?, ?)').run(employeeId, dayIndex, hour);
    res.json({ action: 'added', id: info.lastInsertRowid });
  }
});

// --- EXPENSES ---
app.get('/api/expenses', (req, res) => {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY id DESC').all();
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const { type, category, description, amount, paymentMethod, date } = req.body;
  const info = db.prepare(`
    INSERT INTO expenses (type, category, description, amount, payment_method, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(type, category, description, amount, paymentMethod, date);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

app.delete('/api/expenses/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- MEMBERSHIPS ---
app.get('/api/memberships', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM memberships').get().count;
  const items = db.prepare('SELECT * FROM memberships ORDER BY name ASC LIMIT ? OFFSET ?').all(limit, offset);

  res.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

app.post('/api/memberships', (req, res) => {
  const fields = [
    'id', 'name', 'number_duration', 'type_duration', 'cost', 'is_promotional',
    'date_expired', 'number_person', 'is_active', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday', 'sunday', 'auditory', 'expired_type_duration',
    'expired_number_duration', 'contains_class', 'number_class', 'observation',
    'year_init', 'year_end', 'subsidy', 'multi_sede'
  ];
  
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => req.body[f] !== undefined ? req.body[f] : null);

  const info = db.prepare(`
    INSERT INTO memberships (${fields.join(', ')})
    VALUES (${placeholders})
  `).run(...values);

  res.json({ id: req.body.id, ...req.body });
});

app.put('/api/memberships/:id', (req, res) => {
  const fields = [
    'name', 'number_duration', 'type_duration', 'cost', 'is_promotional',
    'date_expired', 'number_person', 'is_active', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday', 'sunday', 'auditory', 'expired_type_duration',
    'expired_number_duration', 'contains_class', 'number_class', 'observation',
    'year_init', 'year_end', 'subsidy', 'multi_sede'
  ];

  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f] !== undefined ? req.body[f] : null);

  db.prepare(`
    UPDATE memberships SET ${sets}
    WHERE id = ?
  `).run(...values, req.params.id);

  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/memberships/:id', (req, res) => {
  db.prepare('DELETE FROM memberships WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- MEMBERS (AFILIADOS) ---
app.get('/api/members', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  const searchPattern = `%${search}%`;
  const searchWhere = search ? `WHERE COALESCE(m.name, m.names || ' ' || m.lastNames) LIKE ? OR m.identification LIKE ?` : '';

  let countQuery = 'SELECT COUNT(*) as count FROM members m';
  let dataQuery = `
    SELECT m.*, mb.name as membership_name,
      COALESCE(mp.visits, mb.number_duration, 0) as visitsRemaining
    FROM members m
    LEFT JOIN memberships mb ON m.membership_id = mb.id
    LEFT JOIN membership_payments mp ON mp.id = (
      SELECT id FROM membership_payments
      WHERE member_id = m.id AND membership_id = m.membership_id
      ORDER BY date DESC
      LIMIT 1
    )
    ${searchWhere}
    ORDER BY CASE WHEN m.isActive = 1 THEN 0 ELSE 1 END ASC, COALESCE(m.name, m.names || ' ' || m.lastNames) ASC LIMIT ? OFFSET ?
  `;

  let total, items;
  if (search) {
    countQuery += ' ' + searchWhere;
    total = db.prepare(countQuery).get(searchPattern, searchPattern).count;
    items = db.prepare(dataQuery).all(searchPattern, searchPattern, limit, offset);
  } else {
    total = db.prepare(countQuery).get().count;
    items = db.prepare(dataQuery).all(limit, offset);
  }

  res.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

app.get('/api/reports/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const activeStats = db.prepare(`
    SELECT COUNT(*) as count
    FROM members m
    JOIN membership_payments mp ON mp.id = (
      SELECT id FROM membership_payments
      WHERE member_id = m.id AND membership_id = m.membership_id
      ORDER BY date DESC
      LIMIT 1
    )
    WHERE m.membership_id IS NOT NULL AND mp.end_date >= ?
  `).get(today);

  const expiredStats = db.prepare(`
    SELECT COUNT(*) as count
    FROM members m
    JOIN membership_payments mp ON mp.id = (
      SELECT id FROM membership_payments
      WHERE member_id = m.id AND membership_id = m.membership_id
      ORDER BY date DESC
      LIMIT 1
    )
    WHERE m.membership_id IS NOT NULL AND mp.end_date < ?
  `).get(today);

  const notReturnedStats = db.prepare(`
    SELECT COUNT(*) as count
    FROM members m
    JOIN membership_payments mp ON mp.id = (
      SELECT id FROM membership_payments
      WHERE member_id = m.id AND membership_id = m.membership_id
      ORDER BY date DESC
      LIMIT 1
    )
    WHERE m.membership_id IS NOT NULL AND mp.end_date < ? AND m.status = 'Inactivo'
  `).get(today);

  const paymentsStats = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount_paid), 0) as totalPaid
    FROM membership_payments
  `).get();

  res.json({
    activeMemberships: activeStats.count,
    expiredMemberships: expiredStats.count,
    paymentsCount: paymentsStats.count,
    paymentsTotal: paymentsStats.totalPaid,
    notReturned: notReturnedStats.count
  });
});

app.post('/api/members', (req, res) => {
  const { 
    name, identification, phone, email, birth_date, status, registration_date, 
    membership_id, photo, fingerprint, names, lastNames, code, 
    identification_type_id, isActive, membershipInit, membershipExpired, numberVisits 
  } = req.body;
  
  try {
    const id = req.body.id || crypto.randomUUID();
    const displayName = name || `${names || ''} ${lastNames || ''}`.trim();
    
    db.prepare(`
      INSERT INTO members (
        id, names, lastNames, name, code, identification_type_id, 
        identification, isActive, photo, fingerprint, membership_id, 
        membershipInit, membershipExpired, numberVisits, phone, email, 
        birth_date, status, registration_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, names || '', lastNames || '', displayName, code || '', 
      identification_type_id || '', identification, isActive !== undefined ? isActive : 1, 
      photo, fingerprint, membership_id, membershipInit, membershipExpired, 
      numberVisits || 0, phone, email, birth_date, status || 'Activo', registration_date
    );
    res.json({ id, ...req.body, name: displayName });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/members/:id', (req, res) => {
  const { 
    name, identification, phone, email, birth_date, status, registration_date, 
    membership_id, photo, fingerprint, names, lastNames, code, 
    identification_type_id, isActive, membershipInit, membershipExpired, numberVisits 
  } = req.body;
  
  try {
    const displayName = name || `${names || ''} ${lastNames || ''}`.trim();
    
    db.prepare(`
      UPDATE members SET 
        names = ?, lastNames = ?, name = ?, code = ?, 
        identification_type_id = ?, identification = ?, isActive = ?, 
        photo = ?, fingerprint = ?, membership_id = ?, 
        membershipInit = ?, membershipExpired = ?, numberVisits = ?, 
        phone = ?, email = ?, birth_date = ?, status = ?, registration_date = ?
      WHERE id = ?
    `).run(
      names || '', lastNames || '', displayName, code || '', 
      identification_type_id || '', identification, isActive !== undefined ? isActive : 1, 
      photo, fingerprint, membership_id, membershipInit, membershipExpired, 
      numberVisits || 0, phone, email, birth_date, status, registration_date, req.params.id
    );
    res.json({ id: req.params.id, ...req.body, name: displayName });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/members/:id', (req, res) => {
  const memberId = req.params.id;
  try {
    const deleteMemberTransaction = db.transaction(() => {
      db.prepare('DELETE FROM membership_payments WHERE member_id = ?').run(memberId);
      db.prepare('DELETE FROM members WHERE id = ?').run(memberId);
    });

    deleteMemberTransaction();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(400).json({ error: err.message });
  }
});

// --- EMPLOYEES ---
app.get('/api/employees', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  const searchPattern = '%' + search + '%';
  const searchWhere = search ? "WHERE names || ' ' || lastNames LIKE ? OR identification LIKE ?" : '';

  let countQuery = 'SELECT COUNT(*) as count FROM employees';
  let dataQuery = 'SELECT * FROM employees ' + searchWhere + ' ORDER BY CASE WHEN isActive = 1 THEN 0 ELSE 1 END ASC, names || \' \' || lastNames ASC LIMIT ? OFFSET ?';

  let total, items;
  if (search) {
    countQuery += ' ' + searchWhere;
    total = db.prepare(countQuery).get(searchPattern, searchPattern).count;
    items = db.prepare(dataQuery).all(searchPattern, searchPattern, limit, offset);
  } else {
    total = db.prepare(countQuery).get().count;
    items = db.prepare(dataQuery).all(limit, offset);
  }

  res.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

app.post('/api/employees', (req, res) => {
  const { 
    names, lastNames, identification_type_id, identification, phone, 
    birth_date, charge, isActive, photo, fingerprint, sald 
  } = req.body;
  
  try {
    const id = req.body.id || crypto.randomUUID();
    
    db.prepare(`
      INSERT INTO employees (
        id, names, lastNames, identification_type_id, identification, phone, 
        birth_date, charge, isActive, photo, fingerprint, sald
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, names || '', lastNames || '', identification_type_id || '', identification, phone, 
      birth_date, charge, isActive !== undefined ? isActive : 1, photo, fingerprint, sald || 0
    );
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  const { 
    names, lastNames, identification_type_id, identification, phone, 
    birth_date, charge, isActive, photo, fingerprint, sald 
  } = req.body;
  
  try {
    db.prepare(`
      UPDATE employees SET 
        names = ?, lastNames = ?, identification_type_id = ?, identification = ?, 
        phone = ?, birth_date = ?, charge = ?, isActive = ?, photo = ?, 
        fingerprint = ?, sald = ?
      WHERE id = ?
    `).run(
      names || '', lastNames || '', identification_type_id || '', identification, 
      phone, birth_date, charge, isActive !== undefined ? isActive : 1, 
      photo, fingerprint, sald || 0, req.params.id
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Buscar empleado por huella digital verificada
app.get('/api/employees/by-fingerprint', (req, res) => {
  const fingerprint = req.query.fingerprint;
  
  if (!fingerprint) {
    return res.status(400).json({ success: false, error: 'Se requiere parámetro fingerprint' });
  }

  try {
    if (fingerprint.startsWith('VERIFIED_')) {
      const employee = db.prepare(`
        SELECT * FROM employees
        WHERE fingerprint IS NOT NULL AND fingerprint != '' AND isActive = 1
        LIMIT 1
      `).get();

      if (!employee) return res.status(404).json({ success: false, error: 'No hay empleados con huella registrada' });
      res.json({ success: true, employee, detectionMethod: 'verified' });
    } else {
      const employee = db.prepare(`
        SELECT * FROM employees
        WHERE fingerprint = ? AND isActive = 1
      `).get(fingerprint);

      if (!employee) return res.status(404).json({ success: false, error: 'Huella no registrada o empleado inactivo' });
      res.json({ success: true, employee, detectionMethod: 'exact-match' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// Buscar miembro por huella digital verificada
// Este endpoint busca el miembro que pasó verificación de huella
app.get('/api/members/by-fingerprint', (req, res) => {
  const fingerprint = req.query.fingerprint;
  
  if (!fingerprint) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere parámetro fingerprint' 
    });
  }

  try {
    // Si el fingerprint comienza con VERIFIED_, significa que la huella fue verificada
    // En este caso, buscamos el PRIMER miembro activo que tenga fingerprint enrollado
    // (Asumiendo que típicamente hay un usuario por terminal)
    if (fingerprint.startsWith('VERIFIED_')) {
      const member = db.prepare(`
        SELECT m.*, mb.name as membership_name 
        FROM members m
        LEFT JOIN memberships mb ON m.membership_id = mb.id
        WHERE m.fingerprint IS NOT NULL 
        AND m.fingerprint != '' 
        AND m.status = 'Activo'
        ORDER BY m.registration_date DESC
        LIMIT 1
      `).get();

      if (!member) {
        return res.status(404).json({ 
          success: false, 
          error: 'No hay miembros con huella registrada' 
        });
      }

      res.json({ 
        success: true, 
        member,
        detectionMethod: 'verified'
      });
    } else {
      // Para búsquedas antiguas (templates exactos)
      const member = db.prepare(`
        SELECT m.*, mb.name as membership_name 
        FROM members m
        LEFT JOIN memberships mb ON m.membership_id = mb.id
        WHERE m.fingerprint = ? AND m.status = 'Activo'
      `).get(fingerprint);

      if (!member) {
        return res.status(404).json({ 
          success: false, 
          error: 'Huella no registrada o miembro inactivo' 
        });
      }

      res.json({ 
        success: true, 
        member,
        detectionMethod: 'exact-match'
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Restar una visita al miembro
app.post('/api/members/:id/use-visit', (req, res) => {
  const memberId = req.params.id;

  try {
    // Obtener datos del miembro y su membresía
    const member = db.prepare(`
      SELECT m.*, mp.visits, mb.name as membership_name
      FROM members m
      LEFT JOIN membership_payments mp ON m.id = mp.member_id AND mp.membership_id = m.membership_id
      LEFT JOIN memberships mb ON m.membership_id = mb.id
      WHERE m.id = ? AND m.status = 'Activo'
      ORDER BY mp.date DESC
      LIMIT 1
    `).get(memberId);

    if (!member) {
      return res.status(404).json({ 
        error: 'Miembro no encontrado o inactivo',
        visitsRemaining: 0
      });
    }

    const visitsRemaining = Math.max(0, (member.visits || 0) - 1);

    // Actualizar visitas en membership_payments (la entrada más reciente)
    if (member.visits !== null) {
      db.prepare(`
        UPDATE membership_payments 
        SET visits = ? 
        WHERE member_id = ? AND membership_id = ?
        ORDER BY date DESC
        LIMIT 1
      `).run(visitsRemaining, memberId, member.membership_id);
    }

    // Si no hay visitas, cambiar estado a inactivo
    if (visitsRemaining <= 0) {
      db.prepare('UPDATE members SET status = ? WHERE id = ?').run('Inactivo', memberId);
    }

    res.json({ 
      success: true,
      member: {
        ...member,
        visits: visitsRemaining
      },
      visitsRemaining,
      message: `Visita registrada. ${visitsRemaining} clases restantes.`
    });
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      visitsRemaining: 0
    });
  }
});

app.get('/api/members/:id/balance', (req, res) => {
  const memberId = req.params.id;
  const member = db.prepare(`
    SELECT m.membership_id, mb.cost, mb.name as membership_name,
      COALESCE(mp.visits, mb.number_duration, 0) as visits, mp.start_date, mp.end_date
    FROM members m
    LEFT JOIN memberships mb ON m.membership_id = mb.id
    LEFT JOIN membership_payments mp ON mp.id = (
      SELECT id FROM membership_payments
      WHERE member_id = m.id AND membership_id = m.membership_id
      ORDER BY date DESC
      LIMIT 1
    )
    WHERE m.id = ?
  `).get(memberId);
  
  if (!member || !member.membership_id) {
    return res.json({ balance: 0, totalPaid: 0, totalExpected: 0, visitsRemaining: 0 });
  }

  const stats = db.prepare(`
    SELECT 
      SUM(amount_paid) as total_paid,
      MAX(discount) as total_discount,
      MAX(registration_fee) as reg_fee
    FROM membership_payments 
    WHERE member_id = ? AND membership_id = ?
  `).get(memberId, member.membership_id);

  const totalPaid = stats.total_paid || 0;
  const discount = stats.total_discount || 0;
  const registrationFee = stats.reg_fee || 0;
  
  const totalExpected = (member.cost || 0) - discount + registrationFee;
  const balance = totalExpected - totalPaid;
  const visitsRemaining = member.visits != null ? member.visits : 0;

  res.json({ 
    balance: balance > 0 ? balance : 0, 
    totalPaid, 
    totalExpected,
    membershipName: member.membership_name,
    visitsRemaining,
    membershipStart: member.start_date,
    membershipEnd: member.end_date
  });
});

app.get('/api/members/:id/payments', (req, res) => {
  const memberId = req.params.id;
  const payments = db.prepare(`
    SELECT p.*, m.name as membership_name 
    FROM membership_payments p
    JOIN memberships m ON p.membership_id = m.id
    WHERE p.member_id = ?
    ORDER BY p.date DESC
  `).all(memberId);
  res.json(payments);
});

// --- MEMBERSHIP PAYMENTS ---
app.post('/api/membership-payments', (req, res) => {
  const { 
    member_id, membership_id, total_value, discount, 
    registration_fee, amount_paid, payment_method, 
    observation, date, start_date, end_date, visits
  } = req.body;
  
  try {
    const info = db.prepare(`
      INSERT INTO membership_payments (
        member_id, membership_id, total_value, discount, 
        registration_fee, amount_paid, payment_method, 
        observation, date, start_date, end_date, visits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      member_id, membership_id, total_value, discount, 
      registration_fee, amount_paid, payment_method, 
      observation, date, start_date, end_date, visits
    );
    
    // Also record this in the general sales table for accounting
    db.prepare(`
      INSERT INTO sales (date, category, description, amount, payment_method, client_name)
      SELECT ?, 'mensualidad', 'Pago de membresía', ?, ?, name FROM members WHERE id = ?
    `).run(date, amount_paid, payment_method, member_id);

    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- FINGERPRINT ---
app.post('/api/fingerprint/scan', async (req, res) => {
  try {
    console.log('Solicitando lectura de huella digital...');
    const result = await fingerprint.readFingerprint();
    
    if (result === 'verified') {
      // La huella coincidió con la enrollada
      // Retornamos un ID único combinando timestamp + usuario actual
      // Esto nos permite buscar después en la base de datos
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fingerprintId = `VERIFIED_${timestamp}_${random}`;
      
      console.log('Huella verificada exitosamente:', fingerprintId);
      res.json({ 
        fingerprint: fingerprintId,
        template: fingerprintId,
        success: true,
        verified: true
      });
    } else {
      // No se detectó huella o no coincidió
      res.json({
        fingerprint: null,
        template: null,
        success: false,
        verified: false
      });
    }
  } catch (err) {
    console.error('Error al leer huella:', err);
    res.json({
      fingerprint: null,
      success: false,
      verified: false,
      error: err.message
    });
  }
});

// Endpoint para obtener todos los miembros que tienen fingerprint registrado
app.get('/api/members/with-fingerprint', (req, res) => {
  try {
    const members = db.prepare(`
      SELECT m.*, mb.name as membership_name 
      FROM members m
      LEFT JOIN memberships mb ON m.membership_id = mb.id
      WHERE m.fingerprint IS NOT NULL AND m.fingerprint != '' AND m.status = 'Activo'
    `).all();

    res.json({
      success: true,
      members,
      total: members.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/api/fingerprint/available', async (req, res) => {
  try {
    const available = await fingerprint.isFingerprintAvailable();
    res.json({ available });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
});

// --- PAYROLL REPORT ---
app.post('/api/payroll-report/send', async (req, res) => {
  try {
    const { email } = req.body;
    await sendPayrollReport(null, email);
    res.json({ success: true, message: 'Reporte enviado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

// Inicializar scheduler de reportes
schedulePayrollReport();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});