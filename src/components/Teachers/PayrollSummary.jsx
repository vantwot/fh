import { Teacher, WalletMoney, CalendarTick } from 'iconsax-react';

const PayrollSummary = ({ teachers, logs }) => {
  const totalToPay = logs.reduce((sum, log) => {
    const teacher = teachers.find(t => t.id === log.teacherId);
    return sum + (log.hours * (teacher?.hourlyRate || 0));
  }, 0);

  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);

  return (
    <div className="summary">
      <h2>Resumen de Planilla</h2>
      <div className="summary-grid">
        <div className="summary-card card-efectivo">
          <div className="card-label">
            <CalendarTick size={20} variant="Bold" color="#F2CB05" />
            <span>Total Horas</span>
          </div>
          <div className="card-value">{totalHours} hrs</div>
        </div>
        
        <div className="summary-card card-transferencia">
          <div className="card-label">
            <Teacher size={20} variant="Bold" color="#F2B705" />
            <span>Profesores Activos</span>
          </div>
          <div className="card-value">{teachers.length}</div>
        </div>
      </div>

      <div className="summary-total" style={{ marginTop: '16px', background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}>
        <span>Total a Pagar</span>
        <strong>{totalToPay.toLocaleString('es-AR')} COP</strong>
      </div>
    </div>
  );
};

export default PayrollSummary;
