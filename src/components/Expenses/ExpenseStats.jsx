import { WalletMoney, Building, User } from 'iconsax-react';

const ExpenseStats = ({ expenses }) => {
  const academiaTotal = expenses
    .filter(e => e.type === 'academia')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const personalTotal = expenses
    .filter(e => e.type === 'personal')
    .reduce((sum, e) => sum + e.amount, 0);

  const total = academiaTotal + personalTotal;

  return (
    <div className="summary">
      <h2>Resumen de Gastos</h2>
      <div className="summary-total" style={{ background: 'linear-gradient(135deg, #c0392b, #e74c3c)' }}>
        <span>Egreso Total</span>
        <strong>{total.toLocaleString('es-AR')} COP</strong>
      </div>

      <div className="summary-grid" style={{ marginTop: '16px' }}>
        <div className="summary-card" style={{ background: '#f4f6f7', border: '2px solid #34495e' }}>
          <div className="card-label">
            <Building size={20} variant="Bold" color="#34495e" />
            <span style={{ color: '#34495e' }}>Academia</span>
          </div>
          <div className="card-value" style={{ color: '#34495e' }}>{academiaTotal.toLocaleString('es-AR')}</div>
        </div>
        
        <div className="summary-card" style={{ background: '#fef9e7', border: '2px solid #f1c40f' }}>
          <div className="card-label">
            <User size={20} variant="Bold" color="#f1c40f" />
            <span style={{ color: '#f39c12' }}>Personales</span>
          </div>
          <div className="card-value" style={{ color: '#f39c12' }}>{personalTotal.toLocaleString('es-AR')}</div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseStats;
