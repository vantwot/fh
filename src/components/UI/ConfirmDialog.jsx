import Modal from './Modal';
import Button from './Button';
import { Danger, Trash, CloseCircle } from 'iconsax-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Acción',
  message = '¿Estás seguro de que deseas realizar esta acción?',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirm-dialog-body" style={{ textAlign: 'center', padding: '10px 0' }}>
        <div className="confirm-icon" style={{ marginBottom: '20px' }}>
          <Danger size={60} variant="Bold" color="#e74c3c" />
        </div>
        <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '30px', lineHeight: '1.5' }}>
          {message}
        </p>

        <div className="confirm-actions" style={{ display: 'flex', gap: '12px' }}>
          <Button
            label={cancelLabel}
            variant="secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          />
          <Button
            label={confirmLabel}
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
