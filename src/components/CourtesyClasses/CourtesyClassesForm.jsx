import { useState, useEffect } from 'react';
import { COURTESY_CLASSES } from '../../constants/courtesy';
import Button from '../UI/Button';

const INITIAL_FORM = {
  class_name: '',
  student_name: '',
  phone: '',
  date: new Date().toISOString().split('T')[0]
};

const CourtesyClassesForm = ({ onSave, editingItem, onCancelEdit }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setForm({
        class_name: editingItem.class_name || '',
        student_name: editingItem.student_name || '',
        phone: editingItem.phone || '',
        date: editingItem.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [editingItem]);

  const validate = () => {
    const e = {};
    if (!form.class_name.trim()) e.class_name = 'Clase requerida';
    if (!form.student_name.trim()) e.student_name = 'Nombre del estudiante requerido';
    if (!form.date) e.date = 'Fecha requerida';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(form);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Clase</label>
        <select
          name="class_name"
          value={form.class_name}
          onChange={handleChange}
          className="form-input"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'var(--bg-light)',
            fontSize: '1rem'
          }}
        >
          <option value="">Selecciona una clase</option>
          {COURTESY_CLASSES.map(cls => (
            <option key={cls.value} value={cls.value}>{cls.label}</option>
          ))}
        </select>
        {errors.class_name && <span className="error">{errors.class_name}</span>}
      </div>

      <div className="form-group">
        <label>Nombre del Estudiante</label>
        <input
          name="student_name"
          value={form.student_name}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
        />
        {errors.student_name && <span className="error">{errors.student_name}</span>}
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="3001234567"
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Fecha de la Clase</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
          {errors.date && <span className="error">{errors.date}</span>}
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <Button
          label="Cancelar"
          variant="secondary"
          onClick={onCancelEdit}
          style={{ flex: 1 }}
        />
        <Button
          label={editingItem ? 'Actualizar' : 'Agregar Clase'}
          variant="primary"
          type="submit"
          style={{ flex: 1 }}
        />
      </div>
    </form>
  );
};

export default CourtesyClassesForm;
