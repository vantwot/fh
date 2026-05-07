import { useState, useEffect } from 'react';
import { AddCircle, Edit, CloseCircle } from 'iconsax-react';
import Button from '../UI/Button';

const MembershipsForm = ({ onSave, editingItem, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    number_duration: '',
    type_duration: 'Visitas',
    expired_number_duration: '1',
    expired_type_duration: 'Meses',
    is_active: 1,
    is_promotional: 0,
    monday: 1,
    tuesday: 1,
    wednesday: 1,
    thursday: 1,
    friday: 1,
    saturday: 1,
    sunday: 1,
    number_person: 1
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        cost: editingItem.cost?.toString() || '',
        number_duration: editingItem.number_duration?.toString() || ''
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingItem ? editingItem.id : crypto.randomUUID().toUpperCase(),
      cost: parseFloat(formData.cost) || 0,
      number_duration: parseInt(formData.number_duration) || 0,
      expired_number_duration: parseInt(formData.expired_number_duration) || 1,
      number_person: parseInt(formData.number_person) || 1
    });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre de la Mensualidad</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Mensualidad Grupal BOXEO 3 veces x sem"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Costo (COP)</label>
          <input
            type="number"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            placeholder="0"
            required
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Cantidad (Visitas/Días)</label>
          <input
            type="number"
            name="number_duration"
            value={formData.number_duration}
            onChange={handleChange}
            placeholder="8"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Tipo de Duración</label>
        <select name="type_duration" value={formData.type_duration} onChange={handleChange}>
          <option value="Visitas">Visitas</option>
          <option value="Días">Días</option>
          <option value="Meses">Meses</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Vencimiento (Valor)</label>
          <input
            type="number"
            name="expired_number_duration"
            value={formData.expired_number_duration}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Vencimiento (Unidad)</label>
          <select name="expired_type_duration" value={formData.expired_type_duration} onChange={handleChange}>
            <option value="Días">Días</option>
            <option value="Semanas">Semanas</option>
            <option value="Meses">Meses</option>
            <option value="Años">Años</option>
          </select>
        </div>
      </div>

      <div className="form-group checkboxes">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active === 1}
            onChange={handleChange}
          />
          <span>Activa</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_promotional"
            checked={formData.is_promotional === 1}
            onChange={handleChange}
          />
          <span>Promocional</span>
        </label>
      </div>

      <div className="form-group">
        <label>Disponibilidad Semanal</label>
        <div className="days-grid">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <label key={day} className="day-checkbox">
              <input
                type="checkbox"
                name={day}
                checked={formData[day] === 1}
                onChange={handleChange}
              />
              <span className="day-name">{day.slice(0, 2).toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <Button 
          label="Cancelar"
          variant="secondary"
          icon={<CloseCircle size={20} variant="linear" color="#F2CB05" />}
          onClick={onCancelEdit}
          style={{ flex: 1 }}
        />
        <Button 
          type="submit"
          label={editingItem ? 'Actualizar Mensualidad' : 'Guardar Mensualidad'}
          variant="primary"
          icon={editingItem ? <Edit size={20} variant="linear" color="#0D0D0D" /> : <AddCircle size={20} variant="Bold" color="#0D0D0D" />}
          style={{ flex: 2 }}
        />
      </div>

      <style jsx>{`
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .form-row .form-group {
          min-width: 0;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.1);
          background: var(--bg-light);
          color: var(--text-light);
          outline: none;
          font-size: 1rem;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary);
        }
        .checkboxes {
          flex-direction: row;
          gap: 30px;
          padding: 5px 0;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: var(--text-light);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .checkbox-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          background: var(--bg-light);
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .day-checkbox {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
        .day-checkbox input {
          width: 16px;
          height: 16px;
        }
        .day-name {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 800;
        }
      `}</style>
    </form>
  );
};

export default MembershipsForm;
