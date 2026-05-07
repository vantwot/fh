import { useState } from 'react';
import { EXPENSE_TYPES, EXPENSE_CATEGORIES } from '../../constants/expenses';
import { PAYMENT_METHODS } from '../../constants/sales';
import { AddCircle } from 'iconsax-react';

const ExpenseForm = ({ onAddExpense }) => {
  const [form, setForm] = useState({
    type: 'academia',
    category: 'arriendo',
    amount: '',
    description: '',
    paymentMethod: 'efectivo'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount)) return;
    
    onAddExpense({
      ...form,
      id: Date.now(),
      amount: parseFloat(form.amount),
      date: new Date().toLocaleDateString('es-AR')
    });
    
    setForm({
      ...form,
      amount: '',
      description: ''
    });
  };

  return (
    <form className="sales-form" onSubmit={handleSubmit}>
      <h2>Registrar Gasto</h2>

      <div className="form-group">
        <label>Tipo de Gasto</label>
        <div className="category-buttons">
          {EXPENSE_TYPES.map(t => (
            <button 
              key={t.value}
              type="button"
              className={`cat-btn ${form.type === t.value ? 'active' : ''}`}
              onClick={() => setForm({...form, type: t.value, category: EXPENSE_CATEGORIES[t.value][0].value})}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Categoría</label>
        <select 
          value={form.category}
          onChange={(e) => setForm({...form, category: e.target.value})}
          style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
        >
          {EXPENSE_CATEGORIES[form.type].map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Monto (COP)</label>
        <input 
          type="number"
          value={form.amount}
          onChange={(e) => setForm({...form, amount: e.target.value})}
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label>Descripción</label>
        <input 
          value={form.description}
          onChange={(e) => setForm({...form, description: e.target.value})}
          placeholder="Ej: Pago arriendo Mayo"
        />
      </div>

      <div className="form-group">
        <label>Método de Pago</label>
        <div className="payment-buttons">
          {PAYMENT_METHODS.map(p => (
            <button 
              key={p.value}
              type="button"
              className={`pay-btn ${form.paymentMethod === p.value ? 'active' : ''}`}
              onClick={() => setForm({...form, paymentMethod: p.value})}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="submit-btn">
        <AddCircle size={20} /> Registrar Gasto
      </button>
    </form>
  );
};

export default ExpenseForm;
