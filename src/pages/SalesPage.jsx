import { useState, useEffect } from 'react';
import SalesForm from '../components/Sales/SalesForm';
import SalesList from '../components/Sales/SalesList';
import Summary from '../components/Sales/Summary';
import { MoneyRecive } from 'iconsax-react';
import { api } from '../utils/api';

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    fetchSales(page);
  }, [page]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSales = async (p) => {
    try {
      const data = await api.getSales(p, 10);
      setSales(data.sales);
      setTotalPages(data.totalPages);
      setTotalSales(data.total);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await api.getSalesSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const addSale = async (saleData) => {
    try {
      const newSale = {
        date: new Date().toLocaleDateString('es-AR'),
        ...saleData
      };
      await api.addSale(newSale);
      // Refresh both list and summary
      setPage(1);
      await Promise.all([fetchSales(1), fetchSummary()]);
    } catch (err) {
      alert('Error al guardar la venta: ' + err.message);
    }
  };

  const deleteSale = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      try {
        await api.deleteSale(id);
        await Promise.all([fetchSales(page), fetchSummary()]);
      } catch (err) {
        alert('Error al eliminar la venta: ' + err.message);
      }
    }
  };

  if (loading) return <div className="placeholder">Cargando ventas...</div>;

  return (
    <div className="page-container">
      <header className="app-header">
        <h1>
          <MoneyRecive size={32} variant="linear" color="#F2CB05" />
          Registro de Ventas
        </h1>
      </header>
      <div className="app-content">
        <SalesForm onAddSale={addSale} />
        <div className="right-panel">
          <Summary summary={summary} />
          <SalesList 
            sales={sales} 
            onDeleteSale={deleteSale}
            page={page}
            totalPages={totalPages}
            totalSales={totalSales}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
