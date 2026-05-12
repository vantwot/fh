import { useState, useEffect } from 'react';
import { CloseCircle, TickCircle, Clock } from 'iconsax-react';
import { api } from '../utils/api';
import Modal from './UI/Modal';
import Alert from './UI/Alert';

const MemberInfoModal = ({ member, onClose }) => {
  const [alert, setAlert] = useState(null);
  const [visitsRemaining, setVisitsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberData();
  }, [member.id]);

  const fetchMemberData = async () => {
    try {
      // Obtener información del miembro y restar una visita
      const response = await fetch(
        `http://localhost:3001/api/members/${member.id}/use-visit`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setVisitsRemaining(data.visitsRemaining || 0);
        setAlert({
          type: 'success',
          message: `¡Bienvenido ${member.name}! Visita registrada.`
        });
      } else {
        const error = await response.json();
        setAlert({
          type: 'warning',
          message: error.message || 'Error al registrar la visita'
        });
        setVisitsRemaining(0);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al procesar: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Información del Afiliado">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="member-info-modal">
        {member.Photo && (
          <div className="member-photo">
            <img src={member.Photo} alt={member.name} />
          </div>
        )}

        <div className="member-details">
          <h2>{member.name}{member.LastNames ? ` ${member.LastNames}` : ''}</h2>
          <p className="detail">
            <span className="label">Cédula:</span>
            <span className="value">{member.IdentificationNumber}</span>
          </p>
          <p className="detail">
            <span className="label">Estado:</span>
            <span className={`status ${member.IsActive === 1 ? 'activo' : 'inactivo'}`}>
              {member.IsActive === 1 ? 'Activo' : 'Inactivo'}
            </span>
          </p>

          {member.membership_name && (
            <p className="detail">
              <span className="label">Membresía:</span>
              <span className="value">{member.membership_name}</span>
            </p>
          )}

          <div className="visits-info">
            <Clock size={32} color="#F2CB05" />
            <div>
              <p className="visits-remaining">
                {visitsRemaining} clases disponibles
              </p>
              <p className="visits-text">
                {visitsRemaining > 0
                  ? '¡Disfruta tu clase!'
                  : 'Por favor, renueva tu membresía'}
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {visitsRemaining > 0 ? (
            <div className="success-check">
              <TickCircle size={48} variant="Bold" color="#4caf50" />
              <span>Acceso Permitido</span>
            </div>
          ) : (
            <div className="blocked-check">
              <CloseCircle size={48} variant="Bold" color="#e74c3c" />
              <span>Sin Acceso</span>
            </div>
          )}
        </div>

        <button className="close-modal-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <style jsx>{`
        .member-info-modal {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0;
        }

        .member-photo {
          width: 150px;
          height: 150px;
          margin: 0 auto;
          border-radius: 15px;
          overflow: hidden;
          border: 3px solid var(--primary);
          background: var(--bg-light);
        }

        .member-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .member-details h2 {
          margin: 0;
          color: var(--text-light);
          font-size: 1.5rem;
          text-align: center;
        }

        .detail {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin: 0;
        }

        .detail .label {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .detail .value {
          color: var(--text-light);
          font-weight: 500;
        }

        .status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status.activo {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        .status.inactivo {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }

        .visits-info {
          display: flex;
          gap: 15px;
          align-items: center;
          padding: 15px;
          background: rgba(242, 203, 5, 0.1);
          border-radius: 10px;
          margin-top: 10px;
        }

        .visits-remaining {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--primary);
        }

        .visits-text {
          margin: 5px 0 0 0;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .modal-actions {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }

        .success-check, .blocked-check {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
          border-radius: 10px;
        }

        .success-check {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }

        .blocked-check {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }

        .close-modal-btn {
          background: var(--primary);
          color: var(--bg-dark);
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          align-self: center;
        }

        .close-modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(242, 203, 5, 0.4);
        }
      `}</style>
    </Modal>
  );
};

export default MemberInfoModal;
