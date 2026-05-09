import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, ArrowLeft2, ArrowRight2 } from 'iconsax-react';
import { api } from '../../utils/api';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const HOURS = [6, 9, 10, 11, 16, 17, 18, 19, 20]; // 6am, 9am-12pm, 4pm-9pm

const formatHour = (h) => {
  const ampm = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  const nextH = h + 1;
  const nextAmpm = nextH < 12 ? 'am' : 'pm';
  const nextH12 = nextH % 12 || 12;
  return `${h12}:00${ampm} - ${nextH12}:00${nextAmpm}`;
};
const formatDate = (d) => d.toISOString().split('T')[0];
const formatDateShort = (d) =>
  d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const WeeklyCalendar = ({ teachers, onAttendanceChange, weekStart, setWeekStart }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleSlots, setScheduleSlots] = useState(new Set());
  const [attendanceSlots, setAttendanceSlots] = useState({});
  const [selectedEmployer, setSelectedEmployer] = useState(() => teachers[0]?.id ?? '');
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingSlot, setSavingSlot] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendance();
    }
  }, [weekStart, activeTab]);

  const loadSchedule = async () => {
    try {
      const data = await api.getEmployeeSchedules();
      setScheduleSlots(new Set(data.map(s => `${s.employee_id}|${s.day_index}|${s.hour}`)));
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const loadAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      const logs = await api.getTeacherLogs(formatDate(weekStart), formatDate(weekEnd));
      const slots = {};
      logs.forEach(log => {
        if (log.hour_slot != null) {
          slots[`${log.teacher_id}|${log.date}|${log.hour_slot}`] = log.id;
        }
      });
      setAttendanceSlots(slots);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoadingAttendance(false);
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

  const handleToggleSchedule = async (employeeId, dayIndex, hour) => {
    const key = `${employeeId}|${dayIndex}|${hour}`;
    setSavingSlot(key);
    const prevSlots = new Set(scheduleSlots);
    setScheduleSlots(cur => {
      const next = new Set(cur);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    try {
      await api.toggleScheduleSlot({ employeeId, dayIndex, hour });
    } catch (err) {
      setScheduleSlots(prevSlots);
      alert('Error al actualizar horario: ' + err.message);
    } finally {
      setSavingSlot(null);
    }
  };

  const handleToggleAttendance = async (employeeId, dateStr, hour) => {
    const key = `${employeeId}|${dateStr}|${hour}`;
    setSavingSlot(key);
    const prevSlots = { ...attendanceSlots };
    setAttendanceSlots(cur => {
      const next = { ...cur };
      if (key in next) {
        delete next[key];
      } else {
        next[key] = 'pending';
      }
      return next;
    });
    try {
      const result = await api.toggleAttendance({ teacherId: employeeId, date: dateStr, hourSlot: hour });
      if (result.action === 'added') {
        setAttendanceSlots(cur => ({ ...cur, [key]: result.id }));
      }
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setAttendanceSlots(prevSlots);
      alert('Error al registrar asistencia: ' + err.message);
    } finally {
      setSavingSlot(null);
    }
  };

  const getEmployeeWeekStats = (employeeId) => {
    const weekDates = getWeekDates();
    let assigned = 0;
    let attended = 0;
    weekDates.forEach((date, dayIndex) => {
      HOURS.forEach(hour => {
        if (isScheduled(employeeId, dayIndex, hour)) {
          assigned++;
          if (isAttended(employeeId, formatDate(date), hour)) attended++;
        }
      });
    });
    const teacher = teachers.find(t => t.id === employeeId);
    const rate = parseFloat(teacher?.sald) || 0;
    return { assigned, attended, rate, pay: attended * rate };
  };

  const getEmployeeScheduleTotal = (employeeId) => {
    let total = 0;
    WEEKDAYS.forEach((_, dayIndex) => {
      HOURS.forEach(hour => {
        if (isScheduled(employeeId, dayIndex, hour)) total++;
      });
    });
    return total;
  };

  const filteredTeachers = teachers.filter(t => t.id === selectedEmployer);

  const weekDates = getWeekDates();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);
  const weekLabel = `${formatDateShort(weekDates[0])} – ${formatDateShort(weekDates[4])}`;

  if (loadingSchedule) {
    return (
      <div className="wc-container">
        <div className="loading-state">Cargando horarios...</div>
      </div>
    );
  }

  return (
    <div className="wc-container">
      {/* Tabs */}
      <div className="wc-tabs">
        <button
          className={`wc-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Clock size={16} /> Horario Base
        </button>
        <button
          className={`wc-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Calendar size={16} /> Asistencia Semanal
        </button>
      </div>

      {/* Header */}
      <div className="wc-header">
        <div>
          {activeTab === 'schedule' ? (
            <p className="wc-subtitle">
              Asigna el horario base por empleado. Haz clic en cada casilla para
              activar o desactivar. Los cambios se guardan automáticamente.
            </p>
          ) : (
            <div className="week-nav">
              <button className="week-btn" onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })}>
                <ArrowLeft2 size={16} variant="Linear" color='#333' />
              </button>
              <span className="week-label">{weekLabel}</span>
              <button className="week-btn" onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })}>
                <ArrowRight2 size={16} variant="Linear" color='#333' />
              </button>
              <button className="week-today-btn" onClick={() => setWeekStart(getMondayOfWeek(new Date()))}>
                Hoy
              </button>
              {loadingAttendance && <span className="loading-inline">Cargando...</span>}
            </div>
          )}
        </div>
        <div className="employer-selector">
          <label>Empleado:</label>
          <select value={selectedEmployer} onChange={e => setSelectedEmployer(e.target.value)}>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.names} {t.lastNames}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="table-wrapper">
          <table className="wc-table">
            <thead>
              <tr>
                <th className="hour-col">Hora</th>
                {filteredTeachers.map(t => (
                  <th key={t.id} colSpan="5" className="emp-col-header">
                    <div className="emp-name">{t.names} {t.lastNames}</div>
                    <div className="emp-badge">{getEmployeeScheduleTotal(t.id)}h / sem</div>
                  </th>
                ))}
              </tr>
              <tr className="days-row">
                <th className="hour-col"></th>
                {filteredTeachers.map(t => (
                  WEEKDAYS.map(d => (
                    <th key={`${t.id}-${d}`} className="day-header">
                      <span className="day-chip">{d}</span>
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="hour-cell">{formatHour(hour)}</td>
                  {filteredTeachers.map(t => (
                    WEEKDAYS.map((day, dayIndex) => {
                      const scheduled = isScheduled(t.id, dayIndex, hour);
                      const key = `${t.id}|${dayIndex}|${hour}`;
                      return (
                        <td key={key} className="slot-cell-single">
                          <button
                            className={`slot-btn ${scheduled ? 'assigned' : ''} ${savingSlot === key ? 'saving' : ''}`}
                            onClick={() => handleToggleSchedule(t.id, dayIndex, hour)}
                            disabled={savingSlot === key}
                            title={`${day} ${formatHour(hour)} — ${scheduled ? 'Quitar' : 'Asignar'}`}
                          >
                            {scheduled ? '✓' : ''}
                          </button>
                        </td>
                      );
                    })
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="table-wrapper">
          <table className="wc-table">
            <thead>
              <tr>
                <th className="hour-col">Hora</th>
                {filteredTeachers.map(t => {
                  const { assigned, attended, rate, pay } = getEmployeeWeekStats(t.id);
                  return (
                    <th key={t.id} colSpan="5" className="emp-col-header">
                      <div className="emp-name">{t.names} {t.lastNames}</div>
                      <div className="emp-stats-row">
                        <span className="stat-pill">
                          <span className="sp-label">Asignadas</span>
                          <span className="sp-val">{assigned}h</span>
                        </span>
                        <span className="stat-pill green-pill">
                          <span className="sp-label">Asistidas</span>
                          <span className="sp-val">{attended}h</span>
                        </span>
                        <span className="stat-pill">
                          <span className="sp-label">Tarifa</span>
                          <span className="sp-val">${rate.toLocaleString()}/h</span>
                        </span>
                        <span className="stat-pill pay-pill">
                          <span className="sp-label">Total sem.</span>
                          <span className="sp-val">${pay.toLocaleString()}</span>
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="days-row">
                <th className="hour-col"></th>
                {filteredTeachers.map(t => (
                  weekDates.map((date, i) => (
                    <th key={`${t.id}-${i}`} className="day-header">
                      <span className="day-chip date-chip">
                        <span>{WEEKDAYS[i]}</span>
                        <span className="chip-date">{formatDateShort(date)}</span>
                      </span>
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="hour-cell">{formatHour(hour)}</td>
                  {filteredTeachers.map(t => (
                    weekDates.map((date, dayIndex) => {
                      const dateStr = formatDate(date);
                      const scheduled = isScheduled(t.id, dayIndex, hour);
                      const attended = isAttended(t.id, dateStr, hour);
                      const key = `${t.id}|${dateStr}|${hour}`;
                      return (
                        <td key={key} className="slot-cell-single">
                          {!scheduled ? (
                            <div className="slot-empty" />
                          ) : (
                            <button
                              className={`slot-btn ${attended ? 'attended' : 'scheduled'} ${savingSlot === key ? 'saving' : ''}`}
                              onClick={() => handleToggleAttendance(t.id, dateStr, hour)}
                              disabled={savingSlot === key}
                              title={`${WEEKDAYS[dayIndex]} ${formatDateShort(date)} ${formatHour(hour)} — ${attended ? 'Asistió ✓ (clic para quitar)' : 'No asistió (clic para marcar)'}`}
                            >
                              {attended ? '✓' : ''}
                            </button>
                          )}
                        </td>
                      );
                    })
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .wc-container {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .loading-state {
          padding: 48px;
          text-align: center;
          color: #999;
          font-size: 0.9rem;
        }

        .wc-tabs {
          display: flex;
          border-bottom: 2px solid #f0f0f0;
          background: #fafafa;
        }

        .wc-tab {
          flex: 1;
          padding: 14px 20px;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          background: none;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .wc-tab.active {
          color: #333;
          border-bottom-color: #F2CB05;
          background: #fff;
        }

        .wc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          gap: 16px;
          flex-wrap: wrap;
          border-bottom: 1px solid #f0f0f0;
        }

        .wc-subtitle {
          margin: 0;
          color: #888;
          font-size: 0.85rem;
          max-width: 500px;
        }

        .week-nav {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .week-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: all 0.15s;
        }

        .week-btn:hover {
          border-color: #F2CB05;
          color: #333;
        }

        .week-label {
          font-weight: 700;
          color: #333;
          font-size: 0.95rem;
          min-width: 180px;
          text-align: center;
        }

        .week-today-btn {
          padding: 6px 12px;
          border: 1px solid #F2CB05;
          border-radius: 8px;
          background: rgba(242, 203, 5, 0.1);
          color: #333;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .week-today-btn:hover {
          background: rgba(242, 203, 5, 0.25);
        }

        .loading-inline {
          font-size: 0.8rem;
          color: #aaa;
        }

        .employer-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .employer-selector label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
        }

        .employer-selector select {
          padding: 7px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fff;
          font-size: 0.9rem;
          cursor: pointer;
          min-width: 180px;
        }

        .employer-selector select:focus {
          outline: none;
          border-color: #F2CB05;
        }

        .table-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .wc-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .hour-col {
          min-width: 76px;
          padding: 10px 12px;
          text-align: left;
          border-right: 2px solid #e0e0e0;
          font-weight: 700;
          color: #666;
          font-size: 0.78rem;
          background: #f5f5f5;
          position: sticky;
          left: 0;
          z-index: 1;
        }

        .emp-col-header {
          padding: 12px 10px;
          text-align: center;
          border-right: 2px solid #e0e0e0;
          vertical-align: top;
        }

        .emp-col-header:last-child {
          border-right: none;
        }

        .emp-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: #333;
          margin-bottom: 8px;
        }

        .emp-badge {
          display: inline-block;
          font-size: 0.75rem;
          color: #888;
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 10px;
          border-radius: 20px;
        }

        .emp-stats-row {
          display: flex;
          gap: 6px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0, 0, 0, 0.04);
          padding: 4px 8px;
          border-radius: 8px;
          min-width: 64px;
        }

        .stat-pill.green-pill {
          background: rgba(76, 175, 80, 0.1);
        }

        .stat-pill.pay-pill {
          background: rgba(46, 125, 50, 0.12);
        }

        .sp-label {
          font-size: 0.62rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .sp-val {
          font-size: 0.8rem;
          font-weight: 700;
          color: #333;
        }

        .green-pill .sp-val {
          color: #388e3c;
        }

        .pay-pill .sp-val {
          color: #1b5e20;
        }

        .days-row {
          background: #fff9e6;
          height: auto;
        }

        .day-header {
          padding: 12px 8px;
          border-right: 1px solid #e8e8e8;
          text-align: center;
          vertical-align: middle;
          background: #fff9e6;
        }

        .day-header:last-child {
          border-right: none;
        }

        .day-chip {
          display: block;
          padding: 6px 2px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #333;
          border-radius: 6px;
          text-align: center;
          background: rgba(242, 203, 5, 0.25);
          border: 1px solid rgba(242, 203, 5, 0.4);
        }

        .date-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .chip-date {
          font-size: 0.65rem;
          font-weight: 500;
          color: #666;
        }

        .wc-table tbody tr {
          border-bottom: 1px solid #f5f5f5;
        }

        .wc-table tbody tr:hover {
          background: #fdfdf5;
        }

        .hour-cell {
          padding: 10px 12px;
          font-weight: 600;
          color: #888;
          font-size: 0.8rem;
          background: #f9f9f9;
          border-right: 2px solid #e0e0e0;
          white-space: nowrap;
          position: sticky;
          left: 0;
          z-index: 1;
        }

        .slot-cell-single {
          padding: 8px 4px;
          border-right: 1px solid #eeeeee;
          vertical-align: middle;
          text-align: center;
          min-width: 70px;
        }

        .slot-cell-single:last-child {
          border-right: none;
        }

        .slot-btn {
          padding: 8px 4px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background: #fafafa;
          font-size: 0.85rem;
          font-weight: 600;
          color: #ccc;
          cursor: pointer;
          transition: all 0.12s;
          min-height: 40px;
          width: 100%;
        }

        .slot-btn:hover:not(:disabled) {
          border-color: #F2CB05;
          color: #666;
          background: rgba(242, 203, 5, 0.06);
        }

        .slot-btn.assigned {
          background: rgba(242, 203, 5, 0.18);
          border-color: #F2CB05;
          color: #7a6300;
        }

        .slot-btn.scheduled {
          background: rgba(242, 203, 5, 0.06);
          border-color: #e0d080;
          color: #aaa;
        }

        .slot-btn.scheduled:hover:not(:disabled) {
          background: rgba(242, 203, 5, 0.15);
          color: #888;
        }

        .slot-btn.attended {
          background: rgba(76, 175, 80, 0.18);
          border-color: #66bb6a;
          color: #2e7d32;
          font-size: 1rem;
        }

        .slot-btn.saving {
          opacity: 0.45;
          cursor: wait;
        }

        .slot-empty {
          min-height: 40px;
          width: 100%;
          border-radius: 5px;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default WeeklyCalendar;
