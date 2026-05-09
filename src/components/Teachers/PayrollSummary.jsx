import { useState } from 'react';
import { Teacher, CalendarTick, ArrowLeft2, ArrowRight2 } from 'iconsax-react';

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d)) return date;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const PayrollSummary = ({ teachers, logs, weekStart, setWeekStart }) => {
  const weekEnd = addDays(weekStart, 4);

  const weekLogs = logs.filter((log) => {
    const date = new Date(log.date);
    return !Number.isNaN(date) && date >= weekStart && date <= weekEnd;
  });

  const summaryRows = teachers.map((teacher) => {
    const rate = parseFloat(teacher.sald) || 0;
    const teacherLogs = weekLogs.filter((log) => log.teacher_id === teacher.id);
    const totalHours = teacherLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    return {
      id: teacher.id,
      name: `${teacher.names} ${teacher.lastNames}`,
      rate,
      totalHours,
      totalPay: totalHours * rate,
    };
  });

  const totalHours = summaryRows.reduce((sum, row) => sum + row.totalHours, 0);
  const totalToPay = summaryRows.reduce((sum, row) => sum + row.totalPay, 0);

  return (
    <div className="summary">
      {/* Header + week nav */}
      <div className="summary-top">
        <div className="summary-title-block">
          <h2>Resumen Semanal de Nómina</h2>
          <p className="week-range">{formatDate(weekStart)} — {formatDate(weekEnd)}</p>
        </div>
        <div className="week-controls">
          <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>
            <ArrowLeft2 size={15} variant='linear' color="#333"/>
          </button>
          <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>
             <ArrowRight2 size={15} variant='linear' color="#333"/>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="summary-grid">
        <div className="summary-card card-amarillo">
          <div className="card-label">
            <CalendarTick size={20} variant="Bold" color="#F2CB05" />
            <span>Total Horas</span>
          </div>
          <div className="card-value">{totalHours} hrs</div>
        </div>
        <div className="summary-card card-amarillo">
          <div className="card-label">
            <Teacher size={20} variant="Bold" color="#F2B705" />
            <span>Empleados Activos</span>
          </div>
          <div className="card-value">{teachers.length}</div>
        </div>
      </div>

      <h3 className="table-title">Calendario Semanal</h3>
      <table className="pay-table">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Horas</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {summaryRows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td className="center">{row.totalHours}</td>
              <td className="right">${row.totalPay.toLocaleString('es-CO')} COP</td>
            </tr>
          ))}
          {summaryRows.length === 0 && (
            <tr>
              <td colSpan="3" className="empty">Sin registros esta semana.</td>
            </tr>
          )}
          <tr className="total-row">
            <td>Total Semanal</td>
            <td className="center">{totalHours}</td>
            <td className="right">${totalToPay.toLocaleString('es-CO')} COP</td>
          </tr>
        </tbody>
      </table>

      <style jsx>{`
        .summary {
          background: #fff;
          border-radius: 14px;
          padding: 20px 24px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }

        .summary-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .summary-title-block h2 {
          margin: 0 0 4px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #333;
        }

        .week-range {
          margin: 0;
          font-size: 0.85rem;
          color: #888;
        }

        .week-controls {
          display: flex;
          gap: 8px;
        }

        .week-controls button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          color: #555;
          cursor: pointer;
          transition: all 0.15s;
        }

        .week-controls button:hover {
          border-color: #F2CB05;
          color: #333;
          background: rgba(242, 203, 5, 0.06);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .summary-card {
          border-radius: 10px;
          padding: 14px 16px;
        }

        .card-amarillo {
          background: rgba(242, 203, 5, 0.1);
          border: 1px solid rgba(242, 203, 5, 0.3);
        }

        .card-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #888;
          margin-bottom: 6px;
        }

        .card-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: #333;
        }

        .table-title {
          margin: 0 0 12px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #333;
        }

        .pay-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .pay-table thead tr {
          background: #f5f5f5;
        }

        .pay-table th {
          padding: 9px 12px;
          text-align: left;
          font-size: 0.78rem;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 2px solid #eee;
        }

        .pay-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f0f0f0;
          color: #333;
        }

        .pay-table tbody tr:hover td {
          background: #fafafa;
        }

        .pay-table td.center {
          text-align: center;
          font-weight: 700;
        }

        .pay-table td.right {
          text-align: right;
          font-weight: 700;
          color: #2e7d32;
        }

        .pay-table td.empty {
          text-align: center;
          color: #bbb;
          padding: 20px;
        }

        .total-row td {
          border-top: 2px solid #e0e0e0;
          border-bottom: none;
          background: rgba(46, 125, 50, 0.07) !important;
          font-weight: 800 !important;
          color: #1b5e20 !important;
        }
      `}</style>
    </div>
  );
};

export default PayrollSummary;
