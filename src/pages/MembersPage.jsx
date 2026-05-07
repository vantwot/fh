import { useState, useEffect } from 'react';
import MembersList from '../components/Members/MembersList';
import MembersForm from '../components/Members/MembersForm';
import { UserTick, UserAdd } from 'iconsax-react';
import { api } from '../utils/api';
import Modal from '../components/UI/Modal';
import Alert from '../components/UI/Alert';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

const MembersPage = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // State for deletion
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchMembers(page);
  }, [page]);

  const fetchMembers = async (p) => {
    try {
      const data = await api.getMembers(p, 10);
      setMembers(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      showAlert('error', 'Error al cargar los afiliados');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (editingItem) {
        await api.updateMember(editingItem.id, itemData);
        showAlert('success', 'Afiliado actualizado correctamente');
        fetchMembers(page);
      } else {
        const result = await api.addMember(itemData);
        showAlert('success', 'Afiliado agregado correctamente. Redirigiendo a pago...');
        
        // Wait a bit to show the success message
        setTimeout(() => {
          navigate('/pagos-membresia', { 
            state: { 
              member: { ...itemData, id: result.id },
              fromCreation: true 
            } 
          });
        }, 1500);
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      showAlert('error', 'Error al guardar: ' + err.message);
    }
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteMember(itemToDelete);
      showAlert('success', 'Afiliado eliminado');
      fetchMembers(page);
    } catch (err) {
      showAlert('error', 'Error al eliminar: ' + err.message);
    }
    setItemToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleVisitItem = async (member) => {
    try {
      const data = await api.useMemberVisit(member.id);
      showAlert('success', `Visita registrada para ${member.name}. Visitas restantes: ${data.visitsRemaining}`);
      fetchMembers(page);
    } catch (err) {
      showAlert('error', 'Error al registrar visita: ' + err.message);
    }
  };

  const handleOpenNewModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  if (loading && members.length === 0) return <div className="placeholder">Cargando afiliados...</div>;

  return (
    <div className="page-container">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <header className="app-header">
        <h1>
          <UserTick size={32} variant="linear" color="#F2CB05" />
          Gestión de Afiliados
        </h1>
        <button className="add-main-btn" onClick={handleOpenNewModal}>
          <UserAdd size={24} variant="linear" color="#0D0D0D" />
          <span>Nuevo Afiliado</span>
        </button>
      </header>

      <div className="app-content single-col">
        <MembersList
          members={members}
          onEdit={handleEditItem}
          onDelete={handleDeleteClick}
          onVisit={handleVisitItem}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Afiliado' : 'Agregar Nuevo Afiliado'}
      >
        <MembersForm
          onSave={handleSaveItem}
          editingItem={editingItem}
          onCancelEdit={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Afiliado"
        message="¿Estás seguro de que deseas eliminar este afiliado? Esta acción no se puede deshacer."
      />

      <style jsx>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          margin-bottom: 30px;
        }
        .app-header h1 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: flex-start;
          color: var(--text-light);
          font-size: 1.8rem;
        }
        .add-main-btn {
          background: var(--primary);
          color: var(--bg-dark);
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .add-main-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(242, 203, 5, 0.4);
        }
        .single-col {
          display: block !important;
        }
        @media (max-width: 600px) {
          .app-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
          .app-header h1 {
            justify-content: center;
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MembersPage;
