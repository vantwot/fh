import { useState, useEffect } from 'react';
import TeacherForm from '../components/Teachers/TeacherForm';
import TeacherList from '../components/Teachers/TeacherList';
import PayrollSummary from '../components/Teachers/PayrollSummary';
import { Teacher } from 'iconsax-react';
import { api } from '../utils/api';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersData, logsData] = await Promise.all([
        api.getTeachers(),
        api.getTeacherLogs()
      ]);
      setTeachers(teachersData);
      setLogs(logsData);
    } catch (err) {
      console.error('Error fetching teachers data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (teacher) => {
    try {
      const saved = await api.addTeacher(teacher);
      setTeachers(prev => [...prev, saved]);
    } catch (err) {
      alert('Error al agregar profesor: ' + err.message);
    }
  };

  const handleLogClass = async (log) => {
    try {
      const saved = await api.addTeacherLog(log);
      setLogs(prev => [saved, ...prev]);
    } catch (err) {
      alert('Error al registrar horas: ' + err.message);
    }
  };

  const handleDeleteLog = async (id) => {
    if (window.confirm('¿Eliminar este registro de horas?')) {
      try {
        await api.deleteTeacherLog(id);
        setLogs(prev => prev.filter(l => l.id !== id));
      } catch (err) {
        alert('Error al eliminar registro: ' + err.message);
      }
    }
  };

  if (loading) return <div className="placeholder">Cargando profesores...</div>;

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>
          <Teacher size={32} variant="Bold" color="#F2CB05" /> 
          Planillas de Profesores
        </h1>
      </header>
      <div className="app-content">
        <TeacherForm 
          teachers={teachers} 
          onAddTeacher={handleAddTeacher} 
          onLogClass={handleLogClass} 
        />
        <div className="right-panel">
          <PayrollSummary teachers={teachers} logs={logs} />
          <TeacherList 
            teachers={teachers} 
            logs={logs} 
            onDeleteLog={handleDeleteLog} 
          />
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
