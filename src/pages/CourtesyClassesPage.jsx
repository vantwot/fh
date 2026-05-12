import { useState, useEffect } from 'react';
import CourtesyClassesForm from '../components/CourtesyClasses/CourtesyClassesForm';
import CourtesyClassesList from '../components/CourtesyClasses/CourtesyClassesList';
import { Book1, AddCircle } from 'iconsax-react';
import { api } from '../utils/api';
import Modal from '../components/UI/Modal';
import Alert from '../components/UI/Alert';
import ConfirmDialog from '../components/UI/ConfirmDialog';

const CourtesyClassesPage = () => {
  const [classes, setClasses] = useState([]);
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
    fetchClasses(page);
  }, [page]);

  const fetchClasses = async (p) => {
    try {
      const data = await api.getCourtesyClasses(p, 10);
      setClasses(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      showAlert('error', 'Error al cargar las clases');
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
        await api.updateCourtesyClass(editingItem.id, itemData);
        showAlert('success', 'Clase actualizada correctamente');
      } else {
        await api.addCourtesyClass(itemData);
        showAlert('success', 'Clase agregada correctamente');
      }
      fetchClasses(page);
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
      await api.deleteCourtesyClass(itemToDelete);
      showAlert('success', 'Clase eliminada');
      fetchClasses(page);
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

  if (loading && classes.length === 0) return <div className="placeholder">Cargando clases de cortesía...</div>;

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
          <Book1 size={32} variant="linear" color="#F2CB05" />
          Clases de Cortesía
        </h1>
        <button className="add-main-btn" onClick={handleOpenNewModal}>
          <AddCircle size={24} variant="linear" color="#0D0D0D" />
          <span>Nueva Clase</span>
        </button>
      </header>

      <div className="app-content single-col">
        <CourtesyClassesList
          classes={classes}
          onEdit={handleEditItem}
          onDelete={handleDeleteClick}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Clase de Cortesía' : 'Agregar Nueva Clase de Cortesía'}
      >
        <CourtesyClassesForm
          onSave={handleSaveItem}
          editingItem={editingItem}
          onCancelEdit={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Clase de Cortesía"
        message="¿Estás seguro de que deseas eliminar esta clase? Esta acción no se puede deshacer."
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
          color: var(--text-light);
        }
        .add-main-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--primary);
          color: var(--text-dark);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .add-main-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default CourtesyClassesPage;
