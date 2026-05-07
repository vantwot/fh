import { Danger, CloseSquare, Edit, ArrowLeft2, ArrowRight2 } from 'iconsax-react';
import { INVENTORY_CATEGORIES } from '../../constants/inventory';

const InventoryList = ({ inventory, onEdit, onDelete, page, totalPages, totalItems, onPageChange }) => {
  const getCategoryLabel = (val) => {
    return INVENTORY_CATEGORIES.find(c => c.value === val)?.label || val;
  };

  return (
    <div className="sales-list">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Productos en Stock <span className="count">({totalItems})</span></h2>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'center' }}>Stock</th>
              <th className="amount-col">Precio</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map(item => {
                const isOutOffStock = item.stock === 0;
                return (
                  <tr key={item.id} style={isOutOffStock ? { background: '#fff5f5' } : {}}>
                    <td>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          style={{ 
                            width: 40, 
                            height: 40, 
                            objectFit: 'cover', 
                            borderRadius: 8, 
                            border: '2px solid rgba(0,0,0,0.06)' 
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 8, 
                          background: '#f0f0f0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          color: '#aaa'
                        }}>—</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      <span className={`badge badge-${item.category === 'bebida' ? 'bebida' : (item.category === 'insumo' || item.category === 'equipamiento' ? 'almacen' : 'default')}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: isOutOffStock ? '#e74c3c' : 'inherit'
                        }}>
                          {item.stock}
                        </span>
                        {isOutOffStock && <Danger size={16} variant="Bold" color="#e74c3c" title="Sin Stock" />}
                      </div>
                    </td>
                    <td className="amount-col">{item.price.toLocaleString('es-AR')} COP</td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                          className="action-btn edit"
                          onClick={() => onEdit(item)}
                          style={{ background: 'none', border: 'none', color: '#F2CB05', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Editar Producto"
                        >
                          <Edit size={22} variant="linear" color="#F2CB05" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => onDelete(item.id)}
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Eliminar Producto"
                        >
                          <CloseSquare size={22} variant="linear" color="#F2CB05" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No hay productos para mostrar en esta página
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ArrowLeft2 size={18} variant="Bold" color="currentColor" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}

          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <ArrowRight2 size={18} variant="Bold" color="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
