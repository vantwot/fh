import { Coffee, ShoppingBag, Calendar, Gift, Money, Send2, CloseCircle, ArrowLeft2, ArrowRight2 } from 'iconsax-react'

const CATEGORY_LABELS = {
  bebida: 'Bebida',
  insumo: 'Almacén',
  almacen: 'Almacén',
  mensualidad: 'Mensualidad',
  clase_cortesia: 'Clase Cortesía',
}

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
}

const getCategoryIcon = (categoryValue) => {
  const iconProps = { size: 16, variant: 'Bold', color: '#F2B705' }
  switch (categoryValue) {
    case 'bebida': return <Coffee {...iconProps} />
    case 'insumo': return <ShoppingBag {...iconProps} />
    case 'almacen': return <ShoppingBag {...iconProps} />
    case 'mensualidad': return <Calendar {...iconProps} />
    case 'clase_cortesia': return <Gift {...iconProps} />
    default: return null
  }
}

const getPaymentIcon = (paymentValue) => {
  const iconProps = { size: 16, variant: 'Bold', color: '#F2B705' }
  switch (paymentValue) {
    case 'efectivo': return <Money {...iconProps} />
    case 'transferencia': return <Send2 {...iconProps} />
    default: return null
  }
}

export default function SalesList({ sales, onDeleteSale, page, totalPages, totalSales, onPageChange }) {
  if (totalSales === 0) {
    return (
      <div className="sales-list">
        <h2>Ventas del día</h2>
        <p className="empty-msg">Todavía no hay ventas registradas</p>
      </div>
    )
  }

  return (
    <div className="sales-list">
      <h2>Ventas del día <span className="count">({totalSales})</span></h2>
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
                      <div>{sale.client_name}</div>
                      <div className="phone">{sale.phone}</div>
                    </div>
                  ) : (
                    sale.client_name || '—'
                  )}
                </td>
                <td>
                  {sale.category === 'clase_cortesia' ? (
                    <span className="badge">N/A</span>
                  ) : (
                    <span className={`badge badge-pay-${sale.payment_method}`}>
                      <span className="badge-icon">{getPaymentIcon(sale.payment_method)}</span>
                      <span className="badge-label">{PAYMENT_LABELS[sale.payment_method]}</span>
                    </span>
                  )}
                </td>
                <td className="amount-col">
                  {sale.category === 'clase_cortesia' ? 'N/A' : `${sale.amount.toLocaleString('es-AR')} COP`}
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onDeleteSale(sale.id)}
                    title="Eliminar venta"
                  >
                    <CloseCircle size={18} variant="Bold" color="#e74c3c" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ArrowLeft2 size={18} variant="Bold" color="currentColor" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}

          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <ArrowRight2 size={18} variant="Bold" color="currentColor" />
          </button>
        </div>
      )}
    </div>
  )
}
