import { useState, useEffect } from 'react'
import './App.css'
import SalesForm from './components/SalesForm'
import SalesList from './components/SalesList'
import Summary from './components/Summary'
import { MoneyRecive } from 'iconsax-react'

function App() {
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sales')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales))
  }, [sales])

  const addSale = (saleData) => {
    const newSale = { id: Date.now(), date: new Date().toLocaleDateString('es-AR'), ...saleData }
    setSales(prev => [newSale, ...prev])
  }

  const deleteSale = (id) => {
    setSales(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1><MoneyRecive size={32} variant="Bold" color="#f7d82f" style={{ marginRight: '10px' }} /> Sistema de Ventas</h1>
      </header>
      <div className="app-content">
        <SalesForm onAddSale={addSale} />
        <div className="right-panel">
          <Summary sales={sales} />
          <SalesList sales={sales} onDeleteSale={deleteSale} />
        </div>
      </div>
    </div>
  )
}

export default App
