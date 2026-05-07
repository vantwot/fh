import './Alert.css';
import { TickCircle, Danger, CloseCircle } from 'iconsax-react';
import { useEffect } from 'react';

const Alert = ({ type = 'success', message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <TickCircle size={24} variant="Bold" color="#27ae60" />,
    error: <Danger size={24} variant="Bold" color="#e74c3c" />,
    warning: <Danger size={24} variant="Bold" color="#F2CB05" />
  };

  return (
    <div className={`alert-container ${type}`}>
      <div className="alert-icon">
        {icons[type]}
      </div>
      <div className="alert-message">{message}</div>
      <button className="alert-close" onClick={onClose}>
        <CloseCircle size={18} color="#8C8C8C" />
      </button>
    </div>
  );
};

export default Alert;
