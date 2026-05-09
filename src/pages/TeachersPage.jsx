import { useState, useEffect } from 'react';
import WeeklyCalendar from '../components/Teachers/WeeklyCalendar';
// import WeeklyPayrollReport from '../components/Teachers/WeeklyPayrollReport';
import PayrollSummary from '../components/Teachers/PayrollSummary';
import { Teacher } from 'iconsax-react';
import { api } from '../utils/api';

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const TeachersPage = () => {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeeData, logsData] = await Promise.all([
        api.getEmployees(1, 1000), // Traer todos los empleados
        api.getTeacherLogs()
      ]);
      // Pasar datos completos del empleado sin transformar
      console.log('Loaded employees:', employeeData.items);
      console.log('Loaded logs:', logsData);
      setEmployees(employeeData.items);
      setLogs(logsData);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      alert('Error cargando empleados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshLogs = async () => {
    try {
      const logsData = await api.getTeacherLogs();
      setLogs(logsData);
    } catch (err) {
      console.error('Error refreshing logs:', err);
    }
  };

  const handleAddEmployee = async (employee) => {
    // Los empleados ya vienen de EmployeesPage, no se crean aquí
    alert('Los empleados se gestionan en el módulo de Empleados');
  };

  const handleLogHours = async (log) => {
    try {
      if (!log.teacherId) {
        throw new Error('TeacherId no especificado');
      }
      console.log('Adding teacher log:', log);
      const saved = await api.addTeacherLog(log);
      setLogs(prev => [saved, ...prev]);
    } catch (err) {
      console.error('Error in handleLogHours:', err);
      alert('Error al guardar horas: ' + err.message);
      throw err;
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

  if (loading) return <div className="placeholder">Cargando empleados...</div>;

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>
          <Teacher size={32} variant="Bold" color="#F2CB05" /> 
          Pagos Empleados
        </h1>
      </header>
      <div className="app-content">
        <div style={{ flex: '1 1 auto', minWidth: '0' }}>
          {/* <WeeklyPayrollReport 
            teachers={employees}
            weekStart={weekStart}
          /> */}
          <WeeklyCalendar 
            teachers={employees}
            onAttendanceChange={refreshLogs}
            weekStart={weekStart}
            setWeekStart={setWeekStart}
          />
        </div>
        <div className="right-panel">
          <PayrollSummary teachers={employees} logs={logs} weekStart={weekStart} setWeekStart={setWeekStart} />
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
