import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoneyRecive, Box, CardTick, UserTick, CardPos, Teacher, WalletMoney 
} from 'iconsax-react';
import FingerprintReader from '../components/FingerprintReader';
import MemberInfoModal from '../components/MemberInfoModal';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const modules = [
    {
      id: 'sales',
      title: 'Ventas',
      description: 'Registrar y reportes de ventas',
      icon: <MoneyRecive size={48} variant="Bold" color="#F2CB05" />,
      path: '/ventas',
      color: '#4ECDC4'
    },
    {
      id: 'inventory',
      title: 'Inventario',
      description: 'Control de existencias',
      icon: <Box size={48} variant="Bold" color="#F2CB05" />,
      path: '/inventario',
      color: '#96CEB4'
    },
    {
      id: 'memberships',
      title: 'Membresías',
      description: 'Gestionar membresías y pagos',
      icon: <CardTick size={48} variant="Bold" color="#F2CB05" />,
      path: '/mensualidades',
      color: '#45B7D1'
    },
    {
      id: 'members',
      title: 'Afiliados',
      description: 'Registrar y administrar afiliados',
      icon: <UserTick size={48} variant="Bold" color="#F2CB05" />,
      path: '/afiliados',
      color: '#FF6B6B'
    },
    {
      id: 'membership-payments',
      title: 'Pagos Membresía',
      description: 'Registrar pagos de membresías',
      icon: <CardPos size={48} variant="Bold" color="#F2CB05" />,
      path: '/pagos-membresia',
      color: '#F7B32B'
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Ver reportes por afiliados y pagos',
      icon: <CardTick size={48} variant="Bold" color="#F2CB05" />,
      path: '/reportes',
      color: '#45B7D1'
    },
    {
      id: 'teachers',
      title: 'Profesores',
      description: 'Gestión de instructores',
      icon: <Teacher size={48} variant="Bold" color="#F2CB05" />,
      path: '/profesores',
      color: '#FFEAA7'
    },
    {
      id: 'expenses',
      title: 'Gastos',
      description: 'Registro de gastos',
      icon: <WalletMoney size={48} variant="Bold" color="#F2CB05" />,
      path: '/gastos',
      color: '#DFE6E9'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMemberDetected = (memberData) => {
    setSelectedMember(memberData);
    setShowMemberModal(true);
  };

  return (
    <>
      <FingerprintReader onMemberDetected={handleMemberDetected} />

      <div className="dashboard-content">
        <h1 className="dashboard-title">Módulos disponibles</h1>
        <main className="modules-grid">
          {modules.map(module => (
            <div
              key={module.id}
              className="module-card"
              style={{ borderTop: `4px solid ${module.color}` }}
              onClick={() => navigate(module.path)}
            >
              <div className="card-icon">{module.icon}</div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
            </div>
          ))}
        </main>
      </div>

      {showMemberModal && selectedMember && (
        <MemberInfoModal
          member={selectedMember}
          onClose={() => setShowMemberModal(false)}
        />
      )}
    </>
  );
};

export default DashboardPage;
