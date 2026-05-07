import { useState, useEffect, useRef } from 'react';
import { INVENTORY_CATEGORIES } from '../../constants/inventory';
import { AddCircle, Edit, CloseCircle, GalleryAdd, GalleryRemove } from 'iconsax-react';
import Button from '../UI/Button';

const INITIAL_FORM = {
  name: '',
  category: 'bebida',
  stock: '',
  price: '',
  image: ''
};

const InventoryForm = ({ onSave, editingItem, onCancelEdit }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingItem) {
      setForm({
        ...editingItem,
        stock: editingItem.stock.toString(),
        price: editingItem.price.toString(),
        image: editingItem.image || ''
      });
      setImagePreview(editingItem.image || null);
    } else {
      setForm(INITIAL_FORM);
      setImagePreview(null);
    }
  }, [editingItem]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.stock || isNaN(form.stock)) e.stock = 'Stock inválido';
    if (!form.price || isNaN(form.price)) e.price = 'Precio inválido';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave({
      ...form,
      stock: parseInt(form.stock),
      price: parseFloat(form.price)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'La imagen debe ser menor a 2MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setForm(prev => ({ ...prev, image: base64 }));
      setImagePreview(base64);
      setErrors(prev => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre del Producto</label>
        <input 
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Ej: Camisetas XL"
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>Categoría</label>
        <select 
          name="category"
          value={form.category}
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
          {INVENTORY_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Stock Actual</label>
          <input 
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="0"
          />
          {errors.stock && <span className="error">{errors.stock}</span>}
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Precio Unitario (COP)</label>
          <input 
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="0"
          />
          {errors.price && <span className="error">{errors.price}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Imagen del Producto (opcional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
        {imagePreview ? (
          <div className="image-preview-wrapper">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button type="button" className="remove-image-btn" onClick={removeImage}>
              <GalleryRemove size={18} variant="Bold" color="#e74c3c" />
              <span>Quitar</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="upload-image-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <GalleryAdd size={22} variant="linear" color="var(--primary-dark)" />
            <span>Subir imagen</span>
          </button>
        )}
        {errors.image && <span className="error">{errors.image}</span>}
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
          label={editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
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
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .form-group input[type="text"],
        .form-group input[type="number"] {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.1);
          background: var(--bg-light);
          outline: none;
        }
        .form-group input:focus {
          border-color: var(--primary);
        }
        .error {
          color: #e74c3c;
          font-size: 0.75rem;
        }
        .upload-image-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          border: 2px dashed rgba(0,0,0,0.15);
          border-radius: 10px;
          background: var(--bg-light);
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
          transition: all 0.2s;
        }
        .upload-image-btn:hover {
          border-color: var(--primary);
          background: #fff9e6;
        }
        .image-preview-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .image-preview {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid rgba(0,0,0,0.08);
        }
        .remove-image-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #fdecea;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 0.8rem;
          color: #e74c3c;
          transition: all 0.2s;
        }
        .remove-image-btn:hover {
          background: #fdecea;
        }
      `}</style>
    </form>
  );
};

export default InventoryForm;
