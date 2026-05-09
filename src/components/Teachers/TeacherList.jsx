import { Trash, Teacher as TeacherIcon } from 'iconsax-react';

const TeacherList = ({ teachers, logs, onDeleteLog }) => {
  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id === id);
    return teacher ? `${teacher.names} ${teacher.lastNames}` : 'Desconocido';
  };
  
  const getTeacherRate = (id) => {
    const teacher = teachers.find(t => t.id === id);
    return teacher ? parseFloat(teacher.sald) || 0 : 0;
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString('es-AR');
  };

  return (
    <div className="sales-list">
      <h2>Registro de Actividades <span className="count">({logs.length})</span></h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empleado</th>
              <th>Descripción</th>
              <th style={{ textAlign: 'center' }}>Horas</th>
              <th className="amount-col">Pago</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>No hay actividades registradas</td></tr>
            ) : (
              logs.map(log => {
                const rate = getTeacherRate(log.teacher_id);
                const payment = log.hours * rate;
                return (
                  <tr key={log.id}>
                    <td className="date-col">{formatDate(log.date)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <TeacherIcon size={16} color="#F2B705" />
                        {getTeacherName(log.teacher_id)}
                      </div>
                    </td>
                    <td>{log.description || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{log.hours}</td>
                    <td className="amount-col">{payment.toLocaleString('es-AR')} COP</td>
                    <td>
                      <button className="delete-btn" onClick={() => onDeleteLog(log.id)}>
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherList;
