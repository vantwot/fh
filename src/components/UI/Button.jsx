import './Button.css';

const Button = ({ 
  label, 
  children,
  icon, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  disabled = false,
  fullWidth = false,
  style = {}
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${fullWidth ? 'btn-block' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {label && <span className="btn-label">{label}</span>}
      {children}
    </button>
  );
};

export default Button;
