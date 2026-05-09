import { Link, useLocation } from 'react-router-dom';
import {
  MoneyRecive,
  Box,
  Teacher,
  WalletMoney,
  Logout,
  CardTick,
  UserTick,
  CardPos,
  Home,
  UserSquare
} from 'iconsax-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', label: 'Inicio', icon: <Home size={24} color="#F2CB05" /> },
    { path: '/ventas', label: 'Ventas', icon: <MoneyRecive size={24} color="#F2CB05" /> },
    { path: '/inventario', label: 'Inventario', icon: <Box size={24} color="#F2CB05" /> },
    { path: '/mensualidades', label: 'Mensualidades', icon: <CardTick size={24} color="#F2CB05" /> },
    { path: '/afiliados', label: 'Afiliados', icon: <UserTick size={24} color="#F2CB05" /> },
    { path: '/pagos-membresia', label: 'Pagos Membresía', icon: <CardPos size={24} color="#F2CB05" /> },
    { path: '/employee-payments', label: 'Pagos Empleados', icon: <CardPos size={24} color="#F2CB05" /> },
    { path: '/empleados', label: 'Empleados', icon: <UserSquare size={24} color="#F2CB05" /> },
    { path: '/reportes', label: 'Reportes', icon: <CardTick size={24} color="#F2CB05" /> },
    { path: '/gastos', label: 'Gastos', icon: <WalletMoney size={24} color="#F2CB05" /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/image.png" alt="Logo" />
        
        {user && (
          <div className="user-greeting">
            <span className="welcome-text">Bienvenido</span>
            <h2 className="user-name">{user.username}</h2>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <Logout size={24} color="#F2CB05" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
