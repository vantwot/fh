import { useState, useEffect } from 'react'
import { Coffee, ShoppingBag, Calendar, Gift, Money, Send2, Bag2 } from 'iconsax-react'
import Modal from '../UI/Modal'
import { CATEGORIES, PAYMENT_METHODS, CLASSES } from '../../constants/sales'
import { api } from '../../utils/api'

const INITIAL = {
  category: 'bebida',
  description: '',
  amount: '',
  paymentMethod: 'efectivo',
  clientName: '',
  phone: '',
  selectedClass: '',
  systemCode: '',
}

export default function SalesForm({ onAddSale }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [inventory, setInventory] = useState([])
  const [stockWarning, setStockWarning] = useState('')

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await api.getInventory(1, 100);
      setInventory(data.items || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const validate = () => {
    const e = {}

    if (form.category === 'clase_cortesia') {
      if (!form.clientName.trim()) e.clientName = 'Nombre requerido'
      if (!form.phone.trim()) e.phone = 'Teléfono requerido'
      if (!form.selectedClass) e.selectedClass = 'Selecciona una clase'
    } else if (form.category === 'bebida' || form.category === 'insumo') {
      if (!form.description.trim()) e.description = 'Selecciona un producto'
      if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
        e.amount = 'Ingresá un monto válido'
    } else {
      if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
        e.amount = 'Ingresá un monto válido'
      if (!form.description.trim()) e.description = 'Descripción requerida'
    }

    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleProductSelect = (product) => {
    if (product.stock <= 0) {
      setStockWarning('¡Atención! No hay stock disponible para este producto.')
      return
    }

    setForm(prev => ({
      ...prev,
      description: product.name,
      amount: product.price.toString()
    }))
    setErrors(prev => ({ ...prev, description: undefined, amount: undefined }))
  }

  const handleCategoryChange = (category) => {
    setForm(prev => ({
      ...prev,
      category,
      description: '',
      amount: '',
      clientName: '',
      phone: '',
      selectedClass: '',
      systemCode: ''
    }))
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const eList = validate()
    if (Object.keys(eList).length > 0) {
      setErrors(eList)
      return
    }

    const saleData = {
      ...form,
      amount: form.category === 'clase_cortesia' ? 0 : Number(form.amount),
      paymentMethod: form.category === 'clase_cortesia' ? '' : form.paymentMethod,
    }

    await onAddSale(saleData)

    if (form.category === 'bebida' || form.category === 'insumo') {
      fetchInventory()
    }

    setForm({
      ...INITIAL,
      category: form.category,
    })
  }

  const getCategoryIcon = (categoryValue, isActive) => {
    const iconProps = { size: 20, variant: 'Bold', color: isActive ? 'var(--bg-dark)' : 'var(--primary-dark)' }
    switch (categoryValue) {
      case 'bebida': return <Coffee {...iconProps} />
      case 'insumo': return <ShoppingBag {...iconProps} />
      case 'almacen': return <ShoppingBag {...iconProps} />
      case 'mensualidad': return <Calendar {...iconProps} />
      case 'clase_cortesia': return <Gift {...iconProps} />
      default: return <Bag2 {...iconProps} />
    }
  }

  const getPaymentIcon = (paymentValue, isActive) => {
    const iconProps = { size: 20, variant: 'Bold', color: isActive ? 'var(--bg-dark)' : 'var(--primary-dark)' }
    switch (paymentValue) {
      case 'efectivo': return <Money {...iconProps} />
      case 'transferencia': return <Send2 {...iconProps} />
      default: return null
    }
  }

  const filteredInventory = inventory.filter(item => item.category === form.category);

  return (
    <form className="sales-form" onSubmit={handleSubmit}>
      <h2>Registrar Venta</h2>

      <div className="form-group">
        <label>Categoría</label>
        <div className="category-buttons">
          {CATEGORIES.map(cat => {
            const isActive = form.category === cat.value
            return (
              <button
                type="button"
                key={cat.value}
                className={`cat-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.value)}
              >
                <span className="icon">{getCategoryIcon(cat.value, isActive)}</span>
                <span className="label">{cat.label}</span>
              </button>
            )
          })}
        </div>
        {errors.category && <span className="error">{errors.category}</span>}
      </div>

      {form.category === 'bebida' && (
        <div className="form-group">
          <label>Seleccionar bebida</label>
          <div className="drinks-grid">
            {filteredInventory.map(item => (
              <button
                type="button"
                key={item.id}
                className={`drink-btn ${form.description === item.name ? 'selected' : ''}`}
                onClick={() => handleProductSelect(item)}
                style={{ position: 'relative' }}
              >
                <div className="drink-name">{item.name}</div>
                <div className="drink-price">{item.price.toLocaleString('es-AR')} COP</div>
                <div className="stock-badge" style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: item.stock === 0 ? '#e74c3c' : '#27ae60',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {item.stock}
                </div>
              </button>
            ))}
            {filteredInventory.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>No hay bebidas registradas</p>}
          </div>
          {errors.description && <span className="error">{errors.description}</span>}
        </div>
      )}

      {form.category === 'insumo' && (
        <div className="form-group">
          <label>Seleccionar producto</label>
          <div className="product-scroll-container">
            {filteredInventory.map(item => (
              <button
                type="button"
                key={item.id}
                className={`product-card ${form.description === item.name ? 'selected' : ''}`}
                onClick={() => handleProductSelect(item)}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="product-thumb" />
                ) : (
                  <div className="product-thumb-placeholder">
                    <ShoppingBag size={20} variant="linear" color="#bbb" />
                  </div>
                )}
                <div className="product-info">
                  <div className="product-name">{item.name}</div>
                  <div className="product-price">{item.price.toLocaleString('es-AR')} COP</div>
                </div>
                <div className="product-stock-badge" style={{
                  background: item.stock === 0 ? '#e74c3c' : '#27ae60',
                }}>
                  {item.stock}
                </div>
              </button>
            ))}
            {filteredInventory.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '16px 0' }}>No hay productos registrados en esta categoría</p>}
          </div>
          {errors.description && <span className="error">{errors.description}</span>}
        </div>
      )}

      {form.category === 'clase_cortesia' && (
        <>
          <div className="form-group">
            <label>Seleccionar Clase</label>
            <div className="class-buttons">
              {CLASSES.map(cls => (
                <button
                  type="button"
                  key={cls.value}
                  className={`class-btn ${form.selectedClass === cls.value ? 'active' : ''}`}
                  onClick={() => {
                    setForm(prev => ({ ...prev, selectedClass: cls.value, description: `Clase Cortesia: ${cls.label}`, amount: '0' }))
                    setErrors(prev => ({ ...prev, selectedClass: undefined }))
                  }}
                >
                  {cls.label}
                </button>
              ))}
            </div>
            {errors.selectedClass && <span className="error">{errors.selectedClass}</span>}
          </div>

          <div className="form-group">
            <label>Nombre del Cliente</label>
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              placeholder="Ej: Juan Perez"
            />
            {errors.clientName && <span className="error">{errors.clientName}</span>}
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Ej: 11 1234 5678"
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>
        </>
      )}

      {(form.category === 'personalizado' || form.category === 'otros') && (
        <>
          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ej: Venta de guantes"
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Monto (COP)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0"
            />
            {errors.amount && <span className="error">{errors.amount}</span>}
          </div>
        </>
      )}

      {form.category !== 'clase_cortesia' && (
        <div className="form-group">
          <label>Método de Pago</label>
          <div className="payment-buttons">
            {PAYMENT_METHODS.map(method => {
              const isActive = form.paymentMethod === method.value
              return (
                <button
                  type="button"
                  key={method.value}
                  className={`pay-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, paymentMethod: method.value }))}
                >
                  <span className="icon">{getPaymentIcon(method.value, isActive)}</span>
                  <span className="label">{method.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button type="submit" className="submit-btn">
        Registrar Venta
      </button>

      <Modal isOpen={!!stockWarning} onClose={() => setStockWarning('')} title="Sin stock">
        <p>{stockWarning}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            className="submit-btn"
            style={{ padding: '8px 16px' }}
            onClick={() => setStockWarning('')}
          >
            Entendido
          </button>
        </div>
      </Modal>
    </form>
  )
}
