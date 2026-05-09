const jsPDF = require('jspdf');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const HOURS = [6, 9, 10, 11, 16, 17, 18, 19, 20];

const formatDate = (d) => d.toISOString().split('T')[0];
const formatDateShort = (d) =>
  d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

// Configurar transporte de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

const getWeekDates = (weekStart) => {
  return WEEKDAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
};

const isScheduled = (employeeId, dayIndex, hour, scheduleSlots) =>
  scheduleSlots.has(`${employeeId}|${dayIndex}|${hour}`);

const isAttended = (employeeId, dateStr, hour, attendanceSlots) =>
  `${employeeId}|${dateStr}|${hour}` in attendanceSlots;

const getEmployeeWeekStats = (employeeId, weekStart, scheduleSlots, attendanceSlots) => {
  const weekDates = getWeekDates(weekStart);
  let assigned = 0;
  let attended = 0;

  weekDates.forEach((date, dayIndex) => {
    HOURS.forEach((hour) => {
      if (isScheduled(employeeId, dayIndex, hour, scheduleSlots)) {
        assigned++;
        if (isAttended(employeeId, formatDate(date), hour, attendanceSlots)) {
          attended++;
        }
      }
    });
  });

  const teacher = db.prepare('SELECT sald FROM employees WHERE id = ?').get(employeeId);
  const rate = parseFloat(teacher?.sald) || 0;

  return { assigned, attended, rate, pay: attended * rate };
};

const generatePayrollPDF = async (weekStart, employees) => {
  return new Promise(async (resolve, reject) => {
    try {
      const weekDates = getWeekDates(weekStart);
      const weekLabel = `${formatDateShort(weekDates[0])} – ${formatDateShort(weekDates[4])}`;

      // Obtener datos de horarios
      const scheduleData = db.prepare('SELECT * FROM employee_schedules').all();
      const scheduleSlots = new Set(
        scheduleData.map((s) => `${s.employee_id}|${s.day_index}|${s.hour}`)
      );

      // Obtener datos de asistencia
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      const logsData = db
        .prepare('SELECT * FROM teacher_logs WHERE date BETWEEN ? AND ?')
        .all(formatDate(weekStart), formatDate(weekEnd));

      const attendanceSlots = {};
      logsData.forEach((log) => {
        if (log.hour_slot != null) {
          attendanceSlots[`${log.teacher_id}|${log.date}|${log.hour_slot}`] = true;
        }
      });

      // Crear documento jsPDF
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // ===== LOGO =====
      try {
        const logoPath = path.join(__dirname, '..', 'public', 'image.png');
        if (fs.existsSync(logoPath)) {
          const imgData = fs.readFileSync(logoPath, 'base64');
          doc.addImage('data:image/png;base64,' + imgData, 'PNG', 12, 10, 22, 22);
        }
      } catch (e) {
        console.warn('Logo no disponible');
      }

      // ===== TÍTULOS =====
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Reporte de Pagos Semanal', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Semana: ${weekLabel}`, pageWidth / 2, 29, { align: 'center' });

      // ===== DATOS =====
      const tableData = employees.map((teacher) => {
        const { assigned, attended, rate, pay } = getEmployeeWeekStats(
          teacher.id,
          weekStart,
          scheduleSlots,
          attendanceSlots
        );

        return [
          `${teacher.names} ${teacher.lastNames}`,
          `${assigned}h`,
          `${attended}h`,
          `$${rate.toLocaleString()}`,
          `$${pay.toLocaleString()}`
        ];
      });

      const totalAssigned = employees.reduce(
        (sum, t) =>
          sum + getEmployeeWeekStats(t.id, weekStart, scheduleSlots, attendanceSlots).assigned,
        0
      );

      const totalAttended = employees.reduce(
        (sum, t) =>
          sum + getEmployeeWeekStats(t.id, weekStart, scheduleSlots, attendanceSlots).attended,
        0
      );

      const totalPay = employees.reduce(
        (sum, t) =>
          sum + getEmployeeWeekStats(t.id, weekStart, scheduleSlots, attendanceSlots).pay,
        0
      );

      const totalRow = [
        'TOTAL',
        `${totalAssigned}h`,
        `${totalAttended}h`,
        '',
        `$${totalPay.toLocaleString()}`
      ];

      // ===== TABLA =====
      const headers = ['Empleado', 'Horas Asignadas', 'Horas Asistidas', 'Tarifa', 'Total Pago'];

      const startX = 10;
      const startY = 48;
      const rowHeight = 11;
      const colWidths = [60, 35, 35, 28, 32];

      // Header
      let currentX = startX;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);

      headers.forEach((header, index) => {
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);

        doc.rect(currentX, startY, colWidths[index], rowHeight, 'FD');
        doc.text(header, currentX + colWidths[index] / 2, startY + 7, { align: 'center' });

        currentX += colWidths[index];
      });

      // Body
      let currentY = startY + rowHeight;
      doc.setFontSize(10);

      tableData.forEach((row) => {
        currentX = startX;

        row.forEach((cell, colIndex) => {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.setTextColor(0, 0, 0);
          doc.setLineWidth(0.4);

          doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'FD');

          const align = colIndex === 0 ? 'left' : 'center';
          const textX = colIndex === 0 ? currentX + 3 : currentX + colWidths[colIndex] / 2;

          doc.setFont(undefined, colIndex === 4 ? 'bold' : 'normal');
          doc.text(String(cell), textX, currentY + 7, { align });

          currentX += colWidths[colIndex];
        });

        currentY += rowHeight;
      });

      // Total row
      currentX = startX;
      totalRow.forEach((cell, colIndex) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
        doc.setTextColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.setFont(undefined, 'bold');

        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'FD');

        const align = colIndex === 0 ? 'left' : 'center';
        const textX = colIndex === 0 ? currentX + 3 : currentX + colWidths[colIndex] / 2;

        doc.text(String(cell), textX, currentY + 7, { align });

        currentX += colWidths[colIndex];
      });

      // Guardar PDF
      if (!fs.existsSync(path.join(__dirname, 'temp'))) {
        fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });
      }

      const fileName = `Reporte_Pagos_${formatDate(weekDates[0])}.pdf`;
      const filePath = path.join(__dirname, 'temp', fileName);

      doc.save(filePath);
      resolve(filePath);
    } catch (error) {
      reject(error);
    }
  });
};

const sendPayrollReport = async (weekStart = null, recipientEmail = null) => {
  try {
    const week = weekStart || new Date();
    // Ajustar para que el lunes sea el primer día
    const day = week.getDay();
    const diff = week.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(week.setDate(diff));

    const employees = db.prepare('SELECT * FROM employees').all();

    if (!employees || employees.length === 0) {
      console.log('No hay empleados para generar el reporte');
      return;
    }

    const pdfPath = await generatePayrollPDF(monday, employees);
    const weekDates = getWeekDates(monday);
    const weekLabel = `${formatDateShort(weekDates[0])} – ${formatDateShort(weekDates[4])}`;

    const email = recipientEmail || process.env.EMAIL_RECIPIENT || 'admin@example.com';

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: `Reporte de Pagos Semanal - ${weekLabel}`,
      html: `
        <h2>Reporte de Pagos Semanal</h2>
        <p>Semana: ${weekLabel}</p>
        <p>El reporte de pagos se adjunta a este correo.</p>
        <br>
        <p>Saludos cordiales</p>
      `,
      attachments: [
        {
          filename: `Reporte_Pagos_${formatDate(weekDates[0])}.pdf`,
          path: pdfPath
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reporte enviado a ${email}`);

    // Limpiar archivo temporal después de enviar
    fs.unlink(pdfPath, (err) => {
      if (err) console.error('Error al eliminar archivo temporal:', err);
    });
  } catch (error) {
    console.error('Error al enviar reporte:', error);
  }
};

// Programar reporte automático: Viernes a las 4pm
const schedulePayrollReport = () => {
  schedule.scheduleJob('0 21 * * 5', async () =>  {
    console.log('Ejecutando reporte de pagos programado...');
    await sendPayrollReport();
  });

  console.log('Reporte de pagos programado para viernes a las 4pm');
};

module.exports = {
  generatePayrollPDF,
  sendPayrollReport,
  schedulePayrollReport,
  getWeekDates,
  formatDate,
  formatDateShort
};
