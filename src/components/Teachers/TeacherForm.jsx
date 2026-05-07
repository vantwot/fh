import { useState } from 'react';
import { DISCIPLINES } from '../../constants/teachers';
import { UserAdd, CalendarAdd, Teacher } from 'iconsax-react';

const TeacherForm = ({ onAddTeacher, onLogClass, teachers }) => {
  const [activeTab, setActiveTab] = useState('log'); // 'log' or 'new'
  const [teacherForm, setTeacherForm] = useState({ name: '', discipline: 'muay_thai', hourlyRate: '' });
  const [logForm, setLogForm] = useState({ teacherId: '', hours: '', description: '' });

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!teacherForm.name || !teacherForm.hourlyRate) return;
    onAddTeacher({
      id: Date.now(),
      name: teacherForm.name,
      disciplines: [teacherForm.discipline],
      hourlyRate: parseFloat(teacherForm.hourlyRate)
    });
    setTeacherForm({ name: '', discipline: 'muay_thai', hourlyRate: '' });
  };

  const handleLogClass = (e) => {
    e.preventDefault();
    if (!logForm.teacherId || !logForm.hours) return;
    onLogClass({
      id: Date.now(),
      teacherId: parseInt(logForm.teacherId),
      hours: parseFloat(logForm.hours),
      description: logForm.description,
      date: new Date().toLocaleDateString('es-AR')
    });
    setLogForm({ teacherId: '', hours: '', description: '' });
  };

  return (
    <div className="sales-form">
      <div className="category-buttons" style={{ marginBottom: '20px' }}>
        <button 
          className={`cat-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <CalendarAdd size={18} /> Registrar Clase
        </button>
        <button 
          className={`cat-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <UserAdd size={18} /> Nuevo Profesor
        </button>
      </div>

      {activeTab === 'new' ? (
        <form onSubmit={handleAddTeacher}>
          <h2>Registrar Nuevo Profesor</h2>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input 
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
              placeholder="Ej: Carlos Ruiz"
            />
          </div>
          <div className="form-group">
            <label>Disciplina Principal</label>
            <select 
              value={teacherForm.discipline}
              onChange={(e) => setTeacherForm({...teacherForm, discipline: e.target.value})}
              style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
            >
              {DISCIPLINES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tarifa por Hora (COP)</label>
            <input 
              type="number"
              value={teacherForm.hourlyRate}
              onChange={(e) => setTeacherForm({...teacherForm, hourlyRate: e.target.value})}
              placeholder="0"
            />
          </div>
          <button type="submit" className="submit-btn">Guardar Profesor</button>
        </form>
      ) : (
        <form onSubmit={handleLogClass}>
          <h2>Registrar Horas Trabajadas</h2>
          <div className="form-group">
            <label>Seleccionar Profesor</label>
            <select 
              value={logForm.teacherId}
              onChange={(e) => setLogForm({...logForm, teacherId: e.target.value})}
              style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
            >
              <option value="">Seleccione un profesor</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Horas / Clases</label>
            <input 
              type="number"
              step="0.5"
              value={logForm.hours}
              onChange={(e) => setLogForm({...logForm, hours: e.target.value})}
              placeholder="Ej: 1.5"
            />
          </div>
          <div className="form-group">
            <label>Descripción / Observación</label>
            <input 
              value={logForm.description}
              onChange={(e) => setLogForm({...logForm, description: e.target.value})}
              placeholder="Ej: Clase Muay Thai 6pm"
            />
          </div>
          <button type="submit" className="submit-btn">Registrar Horas</button>
        </form>
      )}
    </div>
  );
};

export default TeacherForm;
