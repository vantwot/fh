import { CloseSquare, Edit, ArrowLeft2, ArrowRight2, User, FingerScan } from 'iconsax-react';

import { SearchNormal1 } from 'iconsax-react';

const MembersList = ({ members, onEdit, onDelete, onVisit, page, totalPages, totalItems, onPageChange, searchTerm, onSearch }) => {
  return (
    <div className="sales-list">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2>Afiliados Registrados <span className="count">({totalItems})</span></h2>
        <div style={{ position: 'relative', width: '300px' }}>
          <SearchNormal1 size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o identificación..." 
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 38px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-light)',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Nombre</th>
              <th>Identificación</th>
              <th style={{ textAlign: 'center' }}>Huella</th>
              <th>Membresía</th>
              <th style={{ textAlign: 'center' }}>Visitas</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map(m => {
                const isActive = m.IsActive === 1;
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
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {m.Photo && typeof m.Photo === 'string' && m.Photo.length > 0 ? (
                          <img src={m.Photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <User size={20} variant="linear" color="#F2CB05" />
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.name}{m.LastNames ? ` ${m.LastNames}` : ''}</td>
                    <td>{m.IdentificationNumber || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {m.FingerPrint ? (
                        <FingerScan size={20} variant="Bold" color="#4caf50" title="Huella Registrada" />
                      ) : (
                        <FingerScan size={20} variant="linear" color="#ccc" title="Sin Huella" />
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {m.membership_name || 'Sin membresía'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0D0D0D' }}>
                        {m.visitsRemaining != null ? m.visitsRemaining : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${isActive ? 'badge-bebida' : 'badge-default'}`} style={{ 
                        background: isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: isActive ? '#4caf50' : '#888'
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                          className="action-btn visit"
                          onClick={() => onVisit(m)}
                          style={{ background: 'none', border: '1px solid #F2CB05', color: '#F2CB05', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '10px' }}
                          title="Registrar Visita"
                        >
                          Visita
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => onEdit(m)}
                          style={{ background: 'none', border: 'none', color: '#F2CB05', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Editar Afiliado"
                        >
                          <Edit size={22} variant="linear" color="#F2CB05" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => onDelete(m.id)}
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Eliminar Afiliado"
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
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No hay afiliados para mostrar en esta página
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
          
          {(() => {
            const getPages = () => {
              if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
              if (page <= 3) return [1, 2, 3, 4, '...', totalPages - 1, totalPages];
              if (page >= totalPages - 2) return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
              return [1, '...', page - 1, page, page + 1, '...', totalPages - 1, totalPages];
            };

            return getPages().map((p, index) => (
              p === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis" style={{ padding: '0 10px', color: '#888' }}>...</span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              )
            ));
          })()}

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

export default MembersList;
