import { Coffee, ShoppingBag, Calendar, Gift, Money, Send2 } from 'iconsax-react'

const getCategoryIcon = (categoryValue) => {
  const iconProps = { size: 18, variant: 'Bold', color: '#F2B705' }
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
  const iconProps = { size: 20, variant: 'Bold', color: '#F2B705' }
  switch (paymentValue) {
    case 'efectivo': return <Money {...iconProps} />
    case 'transferencia': return <Send2 {...iconProps} />
    default: return null
  }
}

export default function Summary({ summary }) {
  if (!summary) return null

  return (
    <div className="summary">
      <h2>Resumen</h2>

      <div className="summary-total">
        <span>Total general</span>
        <strong>{summary.total.toLocaleString('es-AR')} COP</strong>
      </div>

      <div className="summary-grid">
        <div className="summary-card card-efectivo">
          <div className="card-label">
            <span className="card-icon">{getPaymentIcon('efectivo')}</span>
            <span>Efectivo</span>
          </div>
          <div className="card-value">{summary.efectivo.toLocaleString('es-AR')} COP</div>
        </div>
        <div className="summary-card card-transferencia">
          <div className="card-label">
            <span className="card-icon">{getPaymentIcon('transferencia')}</span>
            <span>Transferencia</span>
          </div>
          <div className="card-value">{summary.transferencia.toLocaleString('es-AR')} COP</div>
        </div>
      </div>

      <div className="summary-categories">
        <h3>Por categoría</h3>
        <div className="category-row">
          <span className="category-label">
            <span className="cat-icon">{getCategoryIcon('bebida')}</span>
            <span>Bebidas</span>
          </span>
          <span>{summary.bebida.toLocaleString('es-AR')} COP</span>
        </div>
        <div className="category-row">
          <span className="category-label">
            <span className="cat-icon">{getCategoryIcon('insumo')}</span>
            <span>Almacén / Insumos</span>
          </span>
          <span>{summary.almacen.toLocaleString('es-AR')} COP</span>
        </div>
        <div className="category-row">
          <span className="category-label">
            <span className="cat-icon">{getCategoryIcon('mensualidad')}</span>
            <span>Mensualidades</span>
          </span>
          <span>{summary.mensualidad.toLocaleString('es-AR')} COP</span>
        </div>
        <div className="category-row">
          <span className="category-label">
            <span className="cat-icon">{getCategoryIcon('clase_cortesia')}</span>
            <span>Clases Cortesía</span>
          </span>
          <span>{summary.clase_cortesia.toLocaleString('es-AR')} COP</span>
        </div>
      </div>
    </div>
  )
}
