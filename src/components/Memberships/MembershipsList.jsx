import { CloseSquare, Edit, ArrowLeft2, ArrowRight2, CardTick } from 'iconsax-react';

const MembershipsList = ({ memberships, onEdit, onDelete, page, totalPages, totalItems, onPageChange }) => {
  return (
    <div className="sales-list">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Mensualidades Registradas <span className="count">({totalItems})</span></h2>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Nombre</th>
              <th style={{ textAlign: 'center' }}>Duración</th>
              <th style={{ textAlign: 'center' }}>Vencimiento</th>
              <th className="amount-col">Costo</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {memberships.length > 0 ? (
              memberships.map(m => {
                const isActive = m.is_active === 1;
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 8, 
                        background: 'rgba(242, 203, 5, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }}>
                        <CardTick size={20} variant="linear" color="#F2CB05" />
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{m.name}</span>
                        {m.is_promotional === 1 && (
                          <span style={{ fontSize: '0.7rem', color: '#F2CB05', fontWeight: 700 }}>PROMO</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {m.number_duration} {m.type_duration}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {m.expired_number_duration} {m.expired_type_duration}
                    </td>
                    <td className="amount-col">{(m.cost || 0).toLocaleString('es-AR')} COP</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${isActive ? 'badge-bebida' : 'badge-default'}`} style={{ 
                        background: isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: isActive ? '#4caf50' : '#888'
                      }}>
                        {isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                          className="action-btn edit"
                          onClick={() => onEdit(m)}
                          style={{ background: 'none', border: 'none', color: '#F2CB05', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Editar Mensualidad"
                        >
                          <Edit size={22} variant="linear" color="#F2CB05" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => onDelete(m.id)}
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Eliminar Mensualidad"
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
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No hay mensualidades para mostrar en esta página
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

export default MembershipsList;
