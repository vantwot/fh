import { useState, useEffect } from 'react';
import { UserTick, CardTick, WalletMoney, Clock } from 'iconsax-react';
import { api } from '../utils/api';

const ReportsPage = () => {
  const [stats, setStats] = useState({
    activeMemberships: 0,
    expiredMemberships: 0,
    paymentsCount: 0,
    paymentsTotal: 0,
    notReturned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const summary = await api.getReportSummary();
        setStats(summary);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos del reporte');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Afiliados con membresía activa',
      value: stats.activeMemberships,
      subtitle: 'Membresías vigentes al día',
      icon: <UserTick size={28} variant="Bold" color="#4ECDC4" />,
      color: '#4ECDC4'
    },
    {
      title: 'Afiliados con membresía finalizada',
      value: stats.expiredMemberships,
      subtitle: 'Membresías cuyo periodo ya venció',
      icon: <CardTick size={28} variant="Bold" color="#FF6B6B" />,
      color: '#FF6B6B'
    },
    {
      title: 'Pagos afiliados',
      value: stats.paymentsCount,
      subtitle: `Total pagado: $${stats.paymentsTotal.toLocaleString()}`,
      icon: <WalletMoney size={28} variant="Bold" color="#F7B32B" />,
      color: '#F7B32B'
    },
    {
      title: 'Afiliados que no han vuelto',
      value: stats.notReturned,
      subtitle: 'Miembros inactivos sin renovación reciente',
      icon: <Clock size={28} variant="Bold" color="#45B7D1" />,
      color: '#45B7D1'
    }
  ];

  return (
    <div className="page-container wide">
      <header className="app-header">
        <h1>Reportes</h1>
      </header>

      <div className="app-content">
        {loading ? (
          <div className="placeholder">Cargando reportes...</div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : (
          <div className="reports-grid">
            {cards.map(card => (
              <div key={card.title} className="report-card" style={{ borderTopColor: card.color }}>
                <div className="card-icon">{card.icon}</div>
                <div className="card-content">
                  <h3>{card.title}</h3>
                  <p className="card-value">{card.value}</p>
                  <p className="card-subtitle">{card.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .app-header {
          margin-bottom: 24px;
        }
        .app-header h1 {
          margin: 0;
          color: var(--text-light);
          font-size: 2rem;
        }
        .reports-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
        }
        .report-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-top: 6px solid #4ECDC4;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-content h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-light);
          line-height: 1.4;
        }
        .card-value {
          margin: 12px 0 0;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
        }
        .card-subtitle {
          margin: 8px 0 0;
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .error-box {
          padding: 20px;
          border-radius: 16px;
          background: rgba(242,77,62,0.08);
          border: 1px solid rgba(242,77,62,0.15);
          color: #f24d3e;
        }
        @media (max-width: 1100px) {
          .reports-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 700px) {
          .reports-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
