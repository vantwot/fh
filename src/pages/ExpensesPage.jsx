import { useState, useEffect } from 'react';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseStats from '../components/Expenses/ExpenseStats';
import { WalletMoney } from 'iconsax-react';
import { api } from '../utils/api';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expense) => {
    try {
      const saved = await api.addExpense(expense);
      setExpenses(prev => [saved, ...prev]);
    } catch (err) {
      alert('Error al registrar gasto: ' + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      try {
        await api.deleteExpense(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        alert('Error al eliminar gasto: ' + err.message);
      }
    }
  };

  if (loading) return <div className="placeholder">Cargando gastos...</div>;

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>
          <WalletMoney size={32} variant="Bold" color="#F2CB05" /> 
          Gastos Personales y Academia
        </h1>
      </header>
      <div className="app-content">
        <ExpenseForm onAddExpense={handleAddExpense} />
        <div className="right-panel">
          <ExpenseStats expenses={expenses} />
          <ExpenseList 
            expenses={expenses} 
            onDeleteExpense={handleDeleteExpense} 
          />
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
