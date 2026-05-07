import { useState, useEffect } from 'react';
import InventoryForm from '../components/Inventory/InventoryForm';
import InventoryList from '../components/Inventory/InventoryList';
import { Box, AddCircle } from 'iconsax-react';
import { api } from '../utils/api';
import Modal from '../components/UI/Modal';
import Alert from '../components/UI/Alert';
import ConfirmDialog from '../components/UI/ConfirmDialog';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
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
    fetchInventory(page);
  }, [page]);

  const fetchInventory = async (p) => {
    try {
      const data = await api.getInventory(p, 10);
      setInventory(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      showAlert('error', 'Error al cargar el inventario');
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
        await api.updateInventoryItem(editingItem.id, itemData);
        showAlert('success', 'Producto actualizado correctamente');
      } else {
        await api.addInventoryItem(itemData);
        showAlert('success', 'Producto agregado correctamente');
      }
      fetchInventory(page);
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
      await api.deleteInventoryItem(itemToDelete);
      showAlert('success', 'Producto eliminado');
      fetchInventory(page);
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

  if (loading && inventory.length === 0) return <div className="placeholder">Cargando inventario...</div>;

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
          <Box size={32} variant="linear" color="#F2CB05" />
          Gestión de Inventario
        </h1>
        <button className="add-main-btn" onClick={handleOpenNewModal}>
          <AddCircle size={24} variant="linear" color="#0D0D0D" />
          <span>Nuevo Producto</span>
        </button>
      </header>

      <div className="app-content single-col">
        <InventoryList
          inventory={inventory}
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
        title={editingItem ? 'Editar Producto' : 'Agregar Nuevo Producto'}
      >
        <InventoryForm
          onSave={handleSaveItem}
          editingItem={editingItem}
          onCancelEdit={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
      />

      <style jsx>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
        }
        .app-header h1 {
          margin: 0;
          justify-content: flex-start;
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
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryPage;
