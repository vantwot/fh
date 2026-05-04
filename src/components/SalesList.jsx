import { Coffee, ShoppingBag, Calendar, Gift, Money, Send2, CloseCircle } from 'iconsax-react'

const CATEGORY_LABELS = {
  bebida: 'Bebida',
  almacen: 'Almacén',
  mensualidad: 'Mensualidad',
  clase_cortesia: 'Clase Cortesía',
}

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
}

const getCategoryIcon = (categoryValue) => {
  const iconProps = { size: 16, variant: 'Bold', color: '#9ddde9' }
  switch (categoryValue) {
    case 'bebida': return <Coffee {...iconProps} />
    case 'almacen': return <ShoppingBag {...iconProps} />
    case 'mensualidad': return <Calendar {...iconProps} />
    case 'clase_cortesia': return <Gift {...iconProps} />
    default: return null
  }
}

const getPaymentIcon = (paymentValue) => {
  const iconProps = { size: 16, variant: 'Bold', color: '#9ddde9' }
  switch (paymentValue) {
    case 'efectivo': return <Money {...iconProps} />
    case 'transferencia': return <Send2 {...iconProps} />
    default: return null
  }
}

export default function SalesList({ sales, onDeleteSale }) {
  if (sales.length === 0) {
    return (
      <div className="sales-list">
        <h2>Ventas del día</h2>
        <p className="empty-msg">Todavía no hay ventas registradas</p>
      </div>
    )
  }

  return (
    <div className="sales-list">
      <h2>Ventas del día <span className="count">({sales.length})</span></h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Cliente / Teléfono</th>
              <th>Pago</th>
              <th className="amount-col">Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td className="date-col">{sale.date}</td>
                <td>
                  <span className={`badge badge-${sale.category}`}>
                    <span className="badge-icon">{getCategoryIcon(sale.category)}</span>
                    <span className="badge-label">{CATEGORY_LABELS[sale.category]}</span>
                  </span>
                </td>
                <td>{sale.description}</td>
                <td>
                  {sale.category === 'clase_cortesia' ? (
                    <div className="client-info">
                      <div>{sale.clientName}</div>
                      <div className="phone">{sale.phone}</div>
                    </div>
                  ) : (
                    sale.clientName || '—'
                  )}
                </td>
                <td>
                  <span className={`badge badge-pay-${sale.paymentMethod}`}>
                    <span className="badge-icon">{getPaymentIcon(sale.paymentMethod)}</span>
                    <span className="badge-label">{PAYMENT_LABELS[sale.paymentMethod]}</span>
                  </span>
                </td>
                <td className="amount-col">{sale.amount.toLocaleString('es-AR')} COP</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onDeleteSale(sale.id)}
                    title="Eliminar"
                  >
                    <CloseCircle size={18} variant="Bold" color="#e74c3c" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
