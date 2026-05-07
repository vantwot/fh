import { Trash, WalletMoney, Building, User } from 'iconsax-react';
import { EXPENSE_CATEGORIES } from '../../constants/expenses';

const ExpenseList = ({ expenses, onDeleteExpense }) => {
  const getCategoryLabel = (type, val) => {
    return EXPENSE_CATEGORIES[type]?.find(c => c.value === val)?.label || val;
  };

  return (
    <div className="sales-list">
      <h2>Listado de Gastos <span className="count">({expenses.length})</span></h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Pago</th>
              <th className="amount-col">Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>No hay gastos registrados</td></tr>
            ) : (
              expenses.map(expense => (
                <tr key={expense.id}>
                  <td className="date-col">{expense.date}</td>
                  <td>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: expense.type === 'academia' ? '#34495e' : '#f39c12'
                    }}>
                      {expense.type === 'academia' ? <Building size={14} /> : <User size={14} />}
                      {expense.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{getCategoryLabel(expense.type, expense.category)}</td>
                  <td>{expense.description || '—'}</td>
                  <td>
                    <span className={`badge badge-pay-${expense.paymentMethod}`}>
                      {expense.paymentMethod}
                    </span>
                  </td>
                  <td className="amount-col" style={{ color: '#e74c3c' }}>
                    - {expense.amount.toLocaleString('es-AR')} COP
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => onDeleteExpense(expense.id)}>
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;
