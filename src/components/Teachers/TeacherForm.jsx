import { useState } from 'react';
import { CalendarAdd, ArrowLeft, ArrowRight } from 'iconsax-react';

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
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

const TeacherForm = ({ onLogClass, teachers }) => {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [logForm, setLogForm] = useState({ employeeId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] });

  const handleLogClass = (e) => {
    e.preventDefault();
    if (!logForm.employeeId || !logForm.hours || !logForm.date) return;
    onLogClass({
      id: Date.now(),
      teacherId: parseInt(logForm.employeeId),
      hours: parseFloat(logForm.hours),
      description: logForm.description,
      date: logForm.date
    });
    setLogForm({ employeeId: '', hours: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const weekEnd = addDays(weekStart, 4);

  return (
    <div className="sales-form">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Registrar Horas Trabajadas</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, -7))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <ArrowLeft size={20} color="#F2CB05" />
            </button>
            <span style={{ fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </span>
            <button type="button" onClick={() => setWeekStart((prev) => addDays(prev, 7))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <ArrowRight size={20} color="#F2CB05" />
            </button>
          </div>
        </div>

        <form onSubmit={handleLogClass}>
          <div className="form-grid-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label>Empleado</label>
              <select 
                value={logForm.employeeId}
                onChange={(e) => setLogForm({ ...logForm, employeeId: e.target.value })}
                style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', width: '100%' }}
              >
                <option value="">Seleccione</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={logForm.date}
                onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label>Horas</label>
              <input 
                type="number"
                step="0.5"
                value={logForm.hours}
                onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                placeholder="0"
                style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label>Observación</label>
              <input 
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                placeholder="Ej: Turno mañana"
                style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', width: '100%' }}
              />
            </div>

            <button type="submit" className="submit-btn" style={{ padding: '10px 20px', height: 'fit-content' }}>
              <CalendarAdd size={18} /> Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherForm;
