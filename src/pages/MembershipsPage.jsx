import { useState, useEffect } from 'react';
import MembershipsForm from '../components/Memberships/MembershipsForm';
import MembershipsList from '../components/Memberships/MembershipsList';
import { CardTick, AddCircle } from 'iconsax-react';
import { api } from '../utils/api';
import Modal from '../components/UI/Modal';
import Alert from '../components/UI/Alert';
import ConfirmDialog from '../components/UI/ConfirmDialog';

const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
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
    fetchMemberships(page);
  }, [page]);

  const fetchMemberships = async (p) => {
    try {
      const data = await api.getMemberships(p, 10);
      setMemberships(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      showAlert('error', 'Error al cargar las membresías');
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
        await api.updateMembership(editingItem.id, itemData);
        showAlert('success', 'Membresía actualizada correctamente');
      } else {
        await api.addMembership(itemData);
        showAlert('success', 'Membresía agregada correctamente');
      }
      fetchMemberships(page);
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
      await api.deleteMembership(itemToDelete);
      showAlert('success', 'Membresía eliminada');
      fetchMemberships(page);
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

  const handleOpenNewModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  if (loading && memberships.length === 0) return <div className="placeholder">Cargando mensualidades...</div>;

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
          <CardTick size={32} variant="linear" color="#F2CB05" />
          Gestión de Mensualidades
        </h1>
        <button className="add-main-btn" onClick={handleOpenNewModal}>
          <AddCircle size={24} variant="linear" color="#0D0D0D" />
          <span>Nueva Mensualidad</span>
        </button>
      </header>

      <div className="app-content single-col">
        <MembershipsList
          memberships={memberships}
          onEdit={handleEditItem}
          onDelete={handleDeleteClick}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Mensualidad' : 'Agregar Nueva Mensualidad'}
      >
        <MembershipsForm
          onSave={handleSaveItem}
          editingItem={editingItem}
          onCancelEdit={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Mensualidad"
        message="¿Estás seguro de que deseas eliminar esta mensualidad? Esta acción no se puede deshacer."
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

export default MembershipsPage;
