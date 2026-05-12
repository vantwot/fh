import { Edit, CloseSquare, ArrowLeft2, ArrowRight2 } from 'iconsax-react';
import { COURTESY_CLASSES } from '../../constants/courtesy';

const CourtesyClassesList = ({ classes, onEdit, onDelete, page, totalPages, onPageChange }) => {
  const getClassName = (value) => {
    return COURTESY_CLASSES.find(c => c.value === value)?.label || value;
  };

  return (
    <div className="list-container">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Clase</th>
              <th>Estudiante</th>
              <th>Teléfono</th>
              <th>Fecha</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {classes && classes.length > 0 ? (
              classes.map(c => (
                <tr key={c.id}>
                  <td>{getClassName(c.class_name)}</td>
                  <td>{c.student_name}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="action-btn"
                        onClick={() => onEdit(c)}
                        title="Editar"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#F2CB05',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '4px 8px'
                        }}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => onDelete(c.id)}
                        title="Eliminar"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e74c3c',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '4px 8px'
                        }}
                      >
                        <CloseSquare size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No hay clases para mostrar
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
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ArrowLeft2 size={18} /> Anterior
          </button>
          <span className="page-info">Página {page} de {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Siguiente <ArrowRight2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CourtesyClassesList;
