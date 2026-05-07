import { useState, useEffect, useRef } from 'react';
import { AddCircle, Edit, CloseCircle, Camera, FingerScan, Trash, TickCircle } from 'iconsax-react';
import Button from '../UI/Button';
import { api } from '../../utils/api';

const MembersForm = ({ onSave, editingItem, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    phone: '',
    email: '',
    birth_date: '',
    status: 'Activo',
    membership_id: '',
    registration_date: new Date().toISOString().split('T')[0],
    photo: '',
    fingerprint: ''
  });

  const [memberships, setMemberships] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReadingFingerprint, setIsReadingFingerprint] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchMemberships();
    if (editingItem) {
      setFormData({
        ...editingItem,
        membership_id: editingItem.membership_id || '',
        photo: editingItem.photo || '',
        fingerprint: editingItem.fingerprint || ''
      });
    }
  }, [editingItem]);

  const fetchMemberships = async () => {
    try {
      const data = await api.getMemberships(1, 100);
      setMemberships(data.items);
    } catch (err) {
      console.error('Error fetching memberships', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No se pudo acceder a la cámara");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/webp');
      setFormData(prev => ({ ...prev, photo: photoData }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const handleFingerprint = async () => {
    setIsReadingFingerprint(true);
    
    try {
      // Llamar al endpoint del servidor que integra con fprintd
      const response = await fetch('http://localhost:3001/api/fingerprint/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error desconocido');
      }

      const data = await response.json();
      if (data.fingerprint || data.template) {
        setFormData(prev => ({ 
          ...prev, 
          fingerprint: data.fingerprint || data.template 
        }));
      } else {
        throw new Error('No se obtuvo datos de huella');
      }
      
    } catch (err) {
      console.error("Error al leer huella:", err);
      alert(`Error al leer la huella digital:\n${err.message}\n\nAsegúrate de que:\n1. El servidor está corriendo (npm start en /server)\n2. El lector ELAN está conectado\n3. fprintd está en funcionamiento`);
    } finally {
      setIsReadingFingerprint(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="bio-section">
        <div className="photo-container">
          {formData.photo ? (
            <div className="captured-photo">
              <img src={formData.photo} alt="Member" />
              <button type="button" className="remove-photo" onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}>
                <Trash size={16} variant="Bold" />
              </button>
            </div>
          ) : isCameraOpen ? (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted />
              <button type="button" className="capture-btn" onClick={capturePhoto}>
                <div className="inner-circle" />
              </button>
            </div>
          ) : (
            <div className="photo-placeholder" onClick={startCamera}>
              <Camera size={40} variant="linear" color="var(--text-muted)" />
              <span>Tomar Foto</span>
            </div>
          )}
        </div>

        <div className="fingerprint-container">
          <div className={`finger-box ${formData.fingerprint ? 'success' : ''} ${isReadingFingerprint ? 'scanning' : ''}`} onClick={!formData.fingerprint ? handleFingerprint : null}>
            {isReadingFingerprint ? (
              <div className="scan-animation">
                <FingerScan size={40} variant="linear" color="var(--primary)" />
                <div className="scan-line" />
              </div>
            ) : formData.fingerprint ? (
              <>
                <TickCircle size={40} variant="Bold" color="#4caf50" />
                <span className="fp-status">Huella Registrada</span>
                <button type="button" className="reset-fp" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, fingerprint: '' })); }}>
                  Reiniciar
                </button>
              </>
            ) : (
              <>
                <FingerScan size={40} variant="linear" color="var(--text-muted)" />
                <span>Registrar Huella</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Nombre Completo</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Identificación / Cédula</label>
          <input
            type="text"
            name="identification"
            value={formData.identification}
            onChange={handleChange}
            placeholder="Documento de identidad"
            required
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Teléfono</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="300 000 0000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Estado</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Membresía Actual</label>
          <select name="membership_id" value={formData.membership_id} onChange={handleChange}>
            <option value="">Sin membresía</option>
            {memberships.map(mb => (
              <option key={mb.id} value={mb.id}>{mb.name}</option>
            ))}
          </select>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

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
          label={editingItem ? 'Actualizar Afiliado' : 'Guardar Afiliado'}
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
        .bio-section {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
        }
        .photo-container, .fingerprint-container {
          flex: 1;
          height: 180px;
          border-radius: 15px;
          overflow: hidden;
          background: var(--bg-light);
          border: 2px dashed rgba(0,0,0,0.1);
          position: relative;
        }
        .photo-placeholder, .finger-box {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s;
        }
        .photo-placeholder:hover, .finger-box:hover:not(.scanning):not(.success) {
          border-color: var(--primary);
          background: rgba(242, 203, 5, 0.05);
          color: var(--text-light);
        }
        .camera-view {
          width: 100%;
          height: 100%;
          position: relative;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .capture-btn {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          border: 4px solid rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .inner-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid #333;
        }
        .captured-photo {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .captured-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-photo {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(231, 76, 60, 0.9);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .finger-box.scanning {
          cursor: wait;
        }
        .scan-animation {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
          box-shadow: 0 0 10px var(--primary);
          animation: scan 2s infinite;
        }
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .finger-box.success {
          background: rgba(76, 175, 80, 0.05);
          border-color: #4caf50;
          color: #4caf50;
          cursor: default;
        }
        .fp-status {
          font-weight: 700;
        }
        .reset-fp {
          font-size: 0.7rem;
          background: none;
          border: 1px solid #4caf50;
          color: #4caf50;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 5px;
          cursor: pointer;
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
        .form-group input, .form-group select {
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
        @media (max-width: 500px) {
          .bio-section {
            flex-direction: column;
          }
        }
      `}</style>
    </form>
  );
};

export default MembersForm;
