import { useState, useEffect, useCallback } from 'react';
import { DocumentDownload } from 'iconsax-react';
import jsPDF from 'jspdf';
import { api } from '../../utils/api';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const HOURS = [6, 9, 10, 11, 16, 17, 18, 19, 20];

const formatDate = (d) => d.toISOString().split('T')[0];

const formatDateShort = (d) =>
  d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short'
  });

const WeeklyPayrollReport = ({ teachers, weekStart }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState(new Set());
  const [attendanceSlots, setAttendanceSlots] = useState({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const loadData = async () => {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);

      const [scheduleData, logsData] = await Promise.all([
        api.getEmployeeSchedules().catch(() => []),

        api
          .getTeacherLogs(
            formatDate(weekStart),
            formatDate(weekEnd)
          )
          .catch(() => [])
      ]);

      setScheduleSlots(
        new Set(
          scheduleData.map(
            (s) => `${s.employee_id}|${s.day_index}|${s.hour}`
          )
        )
      );

      const slots = {};

      logsData.forEach((log) => {
        if (log.hour_slot != null) {
          slots[
            `${log.teacher_id}|${log.date}|${log.hour_slot}`
          ] = true;
        }
      });

      setAttendanceSlots(slots);
    } catch (err) {
      console.error(err);
    }
  };

  const getWeekDates = useCallback(() => {
    return WEEKDAYS.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const isScheduled = (employeeId, dayIndex, hour) =>
    scheduleSlots.has(`${employeeId}|${dayIndex}|${hour}`);

  const isAttended = (employeeId, dateStr, hour) =>
    `${employeeId}|${dateStr}|${hour}` in attendanceSlots;

  const getEmployeeWeekStats = (employeeId) => {
    const weekDates = getWeekDates();

    let assigned = 0;
    let attended = 0;

    weekDates.forEach((date, dayIndex) => {
      HOURS.forEach((hour) => {
        if (isScheduled(employeeId, dayIndex, hour)) {
          assigned++;

          if (
            isAttended(employeeId, formatDate(date), hour)
          ) {
            attended++;
          }
        }
      });
    });

    const teacher = teachers.find((t) => t.id === employeeId);

    const rate = parseFloat(teacher?.sald) || 0;

    return {
      assigned,
      attended,
      rate,
      pay: attended * rate
    };
  };

  const sendViaEmail = async () => {
    try {
      const email = prompt('¿A qué correo deseas enviarlo?', 'admin@example.com');
      if (!email) return;

      const response = await fetch('/api/payroll-report/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        alert('Reporte enviado correctamente');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error enviando reporte:', error);
      alert('Error al enviar el reporte');
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const weekDates = getWeekDates();

      const weekLabel = `${formatDateShort(
        weekDates[0]
      )} – ${formatDateShort(weekDates[4])}`;

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // =========================
      // LOGO
      // =========================

      try {
        const img = new Image();
        img.src = '/image.png';

        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        doc.addImage(img, 'PNG', 12, 10, 22, 22);
      } catch (e) {
        console.warn('Logo no disponible');
      }

      // =========================
      // TITULOS
      // =========================

      doc.setTextColor(0, 0, 0);

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');

      doc.text(
        'Reporte de Pagos Semanal',
        pageWidth / 2,
        20,
        {
          align: 'center'
        }
      );

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      doc.text(
        `Semana: ${weekLabel}`,
        pageWidth / 2,
        29,
        {
          align: 'center'
        }
      );

      // =========================
      // DATOS
      // =========================

      const tableData = teachers.map((teacher) => {
        const { assigned, attended, rate, pay } =
          getEmployeeWeekStats(teacher.id);

        return [
          `${teacher.names} ${teacher.lastNames}`,
          `${assigned}h`,
          `${attended}h`,
          `$${rate.toLocaleString()}`,
          `$${pay.toLocaleString()}`
        ];
      });

      const totalAssigned = teachers.reduce(
        (sum, t) =>
          sum + getEmployeeWeekStats(t.id).assigned,
        0
      );

      const totalAttended = teachers.reduce(
        (sum, t) =>
          sum + getEmployeeWeekStats(t.id).attended,
        0
      );

      const totalPay = teachers.reduce(
        (sum, t) =>
          sum + getEmployeeWeekStats(t.id).pay,
        0
      );

      const totalRow = [
        'TOTAL',
        `${totalAssigned}h`,
        `${totalAttended}h`,
        '',
        `$${totalPay.toLocaleString()}`
      ];

      // =========================
      // TABLA
      // =========================

      const headers = [
        'Empleado',
        'Horas Asignadas',
        'Horas Asistidas',
        'Tarifa',
        'Total Pago'
      ];

      const startX = 10;
      const startY = 48;

      const rowHeight = 11;

      const colWidths = [60, 35, 35, 28, 32];

      // =========================
      // HEADER
      // =========================

      let currentX = startX;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);

      headers.forEach((header, index) => {
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);

        doc.rect(
          currentX,
          startY,
          colWidths[index],
          rowHeight,
          'FD'
        );

        doc.text(
          header,
          currentX + colWidths[index] / 2,
          startY + 7,
          {
            align: 'center'
          }
        );

        currentX += colWidths[index];
      });

      // =========================
      // BODY
      // =========================

      let currentY = startY + rowHeight;

      doc.setFontSize(10);

      tableData.forEach((row) => {
        currentX = startX;

        row.forEach((cell, colIndex) => {
          // fondo blanco
          doc.setFillColor(255, 255, 255);

          // borde negro
          doc.setDrawColor(0, 0, 0);

          // texto negro
          doc.setTextColor(0, 0, 0);

          doc.setLineWidth(0.4);

          // dibujar celda
          doc.rect(
            currentX,
            currentY,
            colWidths[colIndex],
            rowHeight,
            'FD'
          );

          // alineacion
          const align =
            colIndex === 0 ? 'left' : 'center';

          const textX =
            colIndex === 0
              ? currentX + 3
              : currentX + colWidths[colIndex] / 2;

          // total pago bold
          doc.setFont(
            undefined,
            colIndex === 4 ? 'bold' : 'normal'
          );

          doc.text(
            String(cell),
            textX,
            currentY + 7,
            {
              align
            }
          );

          currentX += colWidths[colIndex];
        });

        currentY += rowHeight;
      });

      // =========================
      // TOTAL
      // =========================

      currentX = startX;

      totalRow.forEach((cell, colIndex) => {
        doc.setFillColor(255, 255, 255);

        doc.setDrawColor(0, 0, 0);

        doc.setTextColor(0, 0, 0);

        doc.setLineWidth(0.5);

        doc.setFont(undefined, 'bold');

        doc.rect(
          currentX,
          currentY,
          colWidths[colIndex],
          rowHeight,
          'FD'
        );

        const align =
          colIndex === 0 ? 'left' : 'center';

        const textX =
          colIndex === 0
            ? currentX + 3
            : currentX + colWidths[colIndex] / 2;

        doc.text(
          String(cell),
          textX,
          currentY + 7,
          {
            align
          }
        );

        currentX += colWidths[colIndex];
      });

      const fileName = `Reporte_Pagos_${formatDate(
        weekDates[0]
      )}.pdf`;

      doc.save(fileName);
    } catch (error) {
      console.error(error);

      alert(
        'Error al generar el PDF: ' + error.message
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="payroll-report-container">
      <div className="report-header">
        <h3>Reporte de Pagos Semanal</h3>

        <div className="button-group">
          <button
            className="btn-download-pdf"
            onClick={generatePDF}
            disabled={isGenerating}
          >
            <DocumentDownload size={18} />

            <span>
              {isGenerating
                ? 'Generando...'
                : 'Descargar PDF'}
            </span>
          </button>

          <button
            className="btn-send-email"
            onClick={sendViaEmail}
            disabled={isGenerating}
          >
            <DocumentDownload size={18} />
            <span>Enviar por Email</span>
          </button>
        </div>
      </div>

      <div className="payroll-summary">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Horas Asignadas</th>
              <th>Horas Asistidas</th>
              <th>Tarifa</th>
              <th>Total Pago</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => {
              const {
                assigned,
                attended,
                rate,
                pay
              } = getEmployeeWeekStats(teacher.id);

              return (
                <tr key={teacher.id}>
                  <td>
                    {teacher.names} {teacher.lastNames}
                  </td>

                  <td>{assigned}h</td>

                  <td>{attended}h</td>

                  <td>
                    ${rate.toLocaleString()}
                  </td>

                  <td>
                    ${pay.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .payroll-report-container {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .btn-download-pdf,
        .btn-send-email {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          background: #f2cb05;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-download-pdf:hover:not(:disabled),
        .btn-send-email:hover:not(:disabled) {
          background: #e6b803;
        }

        .btn-download-pdf:disabled,
        .btn-send-email:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payroll-table {
          width: 100%;
          border-collapse: collapse;
        }

        .payroll-table th {
          background: #000;
          color: #fff;
          padding: 12px;
          border: 1px solid #000;
          font-weight: 700;
          text-align: center;
        }

        .payroll-table td {
          padding: 12px;
          border: 1px solid #000;
          background: #fff;
          color: #000;
        }
      `}</style>
    </div>
  );
};

export default WeeklyPayrollReport;