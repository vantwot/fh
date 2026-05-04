import { useState } from 'react'
import { Coffee, ShoppingBag, Calendar, Gift, Money, Send2, Bag2 } from 'iconsax-react'
import { CATEGORIES, PAYMENT_METHODS, DRINKS, ALMACEN, CLASSES, MEMBERSHIP_TYPES, MEMBERSHIPS } from '../constants'

const INITIAL = {
  category: 'bebida',
  description: '',
  amount: '',
  paymentMethod: 'efectivo',
  clientName: '',
  phone: '',
  selectedClass: '',
  membershipType: '',
  selectedMembership: '',
  systemCode: '',
}

export default function SalesForm({ onAddSale }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    
    if (form.category === 'clase_cortesia') {
      if (!form.clientName.trim()) e.clientName = 'Nombre requerido'
      if (!form.phone.trim()) e.phone = 'Teléfono requerido'
      if (!form.selectedClass) e.selectedClass = 'Selecciona una clase'
    } else if (form.category === 'mensualidad') {
      if (!form.clientName.trim()) e.clientName = 'Nombre requerido'
      if (!form.phone.trim()) e.phone = 'Teléfono requerido'
      if (!form.membershipType) e.membershipType = 'Selecciona un tipo'
      if (!form.selectedMembership) e.selectedMembership = 'Selecciona una mensualidad'
    } else if (form.category === 'bebida' || form.category === 'almacen') {
      // Para bebida y almacén, la descripción y monto se completan automáticamente
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

  const handleDrinkSelect = (drinkId) => {
    const drink = DRINKS.find(d => d.id === drinkId)
    if (drink) {
      setForm(prev => ({
        ...prev,
        description: drink.name,
        amount: drink.price.toString()
      }))
      setErrors(prev => ({ ...prev, description: undefined, amount: undefined }))
    }
  }

  const handleAlmacenSelect = (almacenId) => {
    const item = ALMACEN.find(a => a.id === almacenId)
    if (item) {
      setForm(prev => ({
        ...prev,
        description: item.name,
        amount: item.price.toString()
      }))
      setErrors(prev => ({ ...prev, description: undefined, amount: undefined }))
    }
  }

  const handleMembershipSelect = (membershipId) => {
    const membership = MEMBERSHIPS[form.membershipType].find(m => m.id === membershipId)
    if (membership) {
      setForm(prev => ({
        ...prev,
        selectedMembership: membershipId,
        description: membership.name,
        amount: membership.price.toString()
      }))
      setErrors(prev => ({ ...prev, selectedMembership: undefined }))
    }
  }

  const handleMembershipTypeChange = (type) => {
    setForm(prev => ({ ...prev, membershipType: type, selectedMembership: '', description: '', amount: '' }))
    setErrors(prev => ({ ...prev, membershipType: undefined, selectedMembership: undefined }))
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
      membershipType: '',
      selectedMembership: '',
      systemCode: ''
    }))
    setErrors({})
  }

  const getCategoryIcon = (categoryValue, isActive) => {
    const iconProps = { size: 20, variant: 'Bold', color: isActive ? '#020202' : '#9ddde9' }
    switch (categoryValue) {
      case 'bebida': return <Coffee {...iconProps} />
      case 'almacen': return <ShoppingBag {...iconProps} />
      case 'mensualidad': return <Calendar {...iconProps} />
      case 'clase_cortesia': return <Gift {...iconProps} />
      default: return null
    }
  }

  const getPaymentIcon = (paymentValue, isActive) => {
    const iconProps = { size: 20, variant: 'Bold', color: isActive ? '#020202' : '#9ddde9' }
    switch (paymentValue) {
      case 'efectivo': return <Money {...iconProps} />
      case 'transferencia': return <Send2 {...iconProps} />
      default: return null
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    
    let saleData
    if (form.category === 'clase_cortesia') {
      saleData = { 
        category: form.category,
        clientName: form.clientName,
        phone: form.phone,
        description: form.selectedClass,
        amount: 0,
        paymentMethod: 'efectivo'
      }
    } else if (form.category === 'mensualidad') {
      saleData = {
        category: form.category,
        clientName: form.clientName,
        phone: form.phone,
        description: form.description,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        systemCode: form.systemCode || null,
        membershipType: form.membershipType
      }
    } else {
      saleData = { ...form, amount: parseFloat(form.amount) }
    }
    
    onAddSale(saleData)
    setForm(INITIAL)
  }

  const getSubmitButtonText = () => {
    if (form.category === 'clase_cortesia') return <><Bag2 size={20} color="#1a1510" /> Registrar Clase de Cortesía</>
    if (form.category === 'mensualidad') return <><Bag2 size={20} color="#1a1510" /> Registrar Mensualidad</>
    return <><Bag2 size={20} color="#1a1510" /> Registrar Venta</>
  }

  return (
    <form className="sales-form" onSubmit={handleSubmit}>
      <h2>
        {form.category === 'clase_cortesia' && 'Clase de Cortesía'}
        {form.category === 'mensualidad' && 'Mensualidad'}
        {form.category !== 'clase_cortesia' && form.category !== 'mensualidad' && 'Nueva Venta'}
      </h2>

      <div className="form-group">
        <label>Categoría</label>
        <div className="category-buttons">
          {CATEGORIES.map(c => {
            const isActive = form.category === c.value
            return (
              <button
                type="button"
                key={c.value}
                className={`cat-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryChange(c.value)}
                title={c.label}
              >
                <span className="icon">{getCategoryIcon(c.value, isActive)}</span>
                <span className="label">{c.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {form.category === 'bebida' && (
        <div className="form-group">
          <label>Seleccionar bebida</label>
          <div className="drinks-grid">
            {DRINKS.map(drink => (
              <button
                type="button"
                key={drink.id}
                className={`drink-btn ${form.description === drink.name ? 'selected' : ''}`}
                onClick={() => handleDrinkSelect(drink.id)}
              >
                <div className="drink-name">{drink.name}</div>
                <div className="drink-price">{drink.price.toLocaleString('es-AR')} COP</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {form.category === 'almacen' && (
        <div className="form-group">
          <label>Seleccionar producto</label>
          <div className="almacen-grid">
            {ALMACEN.map(item => (
              <button
                type="button"
                key={item.id}
                className={`almacen-btn ${form.description === item.name ? 'selected' : ''}`}
                onClick={() => handleAlmacenSelect(item.id)}
              >
                <div className="almacen-name">{item.name}</div>
                <div className="almacen-price">{item.price.toLocaleString('es-AR')} COP</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {form.category === 'clase_cortesia' && (
        <>
          <div className="form-group">
            <label htmlFor="clientName">Nombre *</label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              placeholder="Nombre del cliente"
              value={form.clientName}
              onChange={handleChange}
            />
            {errors.clientName && <span className="error">{errors.clientName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Teléfono"
              value={form.phone}
              onChange={handleChange}
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>Clase *</label>
            <div className="class-buttons">
              {CLASSES.map(c => (
                <button
                  type="button"
                  key={c.value}
                  className={`class-btn ${form.selectedClass === c.value ? 'active' : ''}`}
                  onClick={() => {
                    setForm(prev => ({ ...prev, selectedClass: c.value }))
                    setErrors(prev => ({ ...prev, selectedClass: undefined }))
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {errors.selectedClass && <span className="error">{errors.selectedClass}</span>}
          </div>
        </>
      )}

      {form.category === 'mensualidad' && (
        <>
          <div className="form-group">
            <label htmlFor="clientName">Nombre *</label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              placeholder="Nombre del cliente"
              value={form.clientName}
              onChange={handleChange}
            />
            {errors.clientName && <span className="error">{errors.clientName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Teléfono"
              value={form.phone}
              onChange={handleChange}
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>Tipo *</label>
            <div className="membership-type-buttons">
              {MEMBERSHIP_TYPES.map(mt => (
                <button
                  type="button"
                  key={mt.value}
                  className={`type-btn ${form.membershipType === mt.value ? 'active' : ''}`}
                  onClick={() => handleMembershipTypeChange(mt.value)}
                >
                  {mt.label}
                </button>
              ))}
            </div>
            {errors.membershipType && <span className="error">{errors.membershipType}</span>}
          </div>

          {form.membershipType && (
            <div className="form-group">
              <label>Mensualidad *</label>
              <div className="membership-grid">
                {MEMBERSHIPS[form.membershipType].map(mem => (
                  <button
                    type="button"
                    key={mem.id}
                    className={`membership-btn ${form.selectedMembership === mem.id ? 'selected' : ''}`}
                    onClick={() => handleMembershipSelect(mem.id)}
                  >
                    <div className="mem-name">{mem.name}</div>
                    <div className="mem-price">{mem.price.toLocaleString('es-AR')} COP</div>
                  </button>
                ))}
              </div>
              {errors.selectedMembership && <span className="error">{errors.selectedMembership}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="systemCode">Código del sistema (opcional)</label>
            <input
              id="systemCode"
              name="systemCode"
              type="text"
              placeholder="Código"
              value={form.systemCode}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {form.category !== 'bebida' && form.category !== 'clase_cortesia' && form.category !== 'mensualidad' && form.category !== 'almacen' && (
        <div className="form-group">
          <label htmlFor="clientName">Cliente (opcional)</label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            placeholder="Nombre del cliente"
            value={form.clientName}
            onChange={handleChange}
          />
        </div>
      )}

      {form.category !== 'clase_cortesia' && form.category !== 'mensualidad' && form.category !== 'bebida' && form.category !== 'almacen' && (
        <>
          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Ej: Guantes talla M, Clase lunes..."
              value={form.description}
              onChange={handleChange}
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Monto (COP) *</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.amount}
              onChange={handleChange}
            />
            {errors.amount && <span className="error">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label>Forma de Pago</label>
            <div className="payment-buttons">
              {PAYMENT_METHODS.map(p => {
                const isActive = form.paymentMethod === p.value
                return (
                  <button
                    type="button"
                    key={p.value}
                    className={`pay-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, paymentMethod: p.value }))}
                    title={p.label}
                  >
                    <span className="icon">{getPaymentIcon(p.value, isActive)}</span>
                    <span className="label">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {form.category === 'bebida' && (
        <div className="form-group">
          <label>Forma de Pago</label>
          <div className="payment-buttons">
            {PAYMENT_METHODS.map(p => {
              const isActive = form.paymentMethod === p.value
              return (
                <button
                  type="button"
                  key={p.value}
                  className={`pay-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, paymentMethod: p.value }))}
                  title={p.label}
                >
                  <span className="icon">{getPaymentIcon(p.value, isActive)}</span>
                  <span className="label">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {form.category === 'almacen' && (
        <div className="form-group">
          <label>Forma de Pago</label>
          <div className="payment-buttons">
            {PAYMENT_METHODS.map(p => {
              const isActive = form.paymentMethod === p.value
              return (
                <button
                  type="button"
                  key={p.value}
                  className={`pay-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, paymentMethod: p.value }))}
                  title={p.label}
                >
                  <span className="icon">{getPaymentIcon(p.value, isActive)}</span>
                  <span className="label">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {form.category === 'mensualidad' && (
        <div className="form-group">
          <label>Forma de Pago</label>
          <div className="payment-buttons">
            {PAYMENT_METHODS.map(p => {
              const isActive = form.paymentMethod === p.value
              return (
                <button
                  type="button"
                  key={p.value}
                  className={`pay-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, paymentMethod: p.value }))}
                  title={p.label}
                >
                  <span className="icon">{getPaymentIcon(p.value, isActive)}</span>
                  <span className="label">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button type="submit" className="submit-btn">{getSubmitButtonText()}</button>
    </form>
  )
}
