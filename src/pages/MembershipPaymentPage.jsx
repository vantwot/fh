import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MoneyTick, ArrowLeft, Receipt2, SearchNormal1, User, Calendar, DirectboxSend, TickCircle, Clock } from 'iconsax-react';
import { api } from '../utils/api';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';

const MembershipPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { member: initialMember } = location.state || {};

  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(initialMember || null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [includeRegistration, setIncludeRegistration] = useState(false);
  const [totalDebtInfo, setTotalDebtInfo] = useState({ balance: 0, totalExpected: 0, totalPaid: 0, visitsRemaining: 0 });

  const [paymentData, setPaymentData] = useState({
    member_id: initialMember?.id || '',
    membership_id: initialMember?.membership_id || '',
    total_value: 0,
    discount: 0,
    registration_fee: 0,
    amount_paid: 0,
    payment_method: 'efectivo',
    observation: '',
    date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    visits: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const calculateNextMonthEnd = (dateString) => {
    if (!dateString) return '';
    const start = new Date(dateString);
    start.setMonth(start.getMonth() + 1);
    return start.toISOString().split('T')[0];
  };

  useEffect(() => {
    setPaymentData(prev => ({
      ...prev,
      registration_fee: includeRegistration ? 40000 : 0
    }));
  }, [includeRegistration]);

  const fetchInitialData = async () => {
    try {
      const mbData = await api.getMemberships(1, 100);
      setMemberships(mbData.items);
      
      const mData = await api.getMembers(1, 1000);
      setMembers(mData.items);

      if (initialMember) {
        handleMemberSelect(initialMember);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberExtras = async (memberId) => {
    try {
      const balance = await api.getMemberBalance(memberId);
      setTotalDebtInfo(balance);
      
      const history = await api.getMemberPayments(memberId);
      setPaymentHistory(history);
      
      return balance;
    } catch (err) {
      console.error("Error fetching extras:", err);
      return { balance: 0, totalExpected: 0, totalPaid: 0 };
    }
  };

  const handleMemberSelect = async (member) => {
    setSelectedMember(member);
    setSearchTerm('');
    const selectedMb = memberships.find(m => m.id === member.membership_id);
    
    const balanceInfo = await fetchMemberExtras(member.id);
    const startDate = balanceInfo.membershipStart || paymentData.start_date;
    const endDate = balanceInfo.membershipEnd || calculateNextMonthEnd(startDate);

    if (balanceInfo.balance > 0) {
      setPaymentData(prev => ({
        ...prev,
        member_id: member.id,
        membership_id: member.membership_id || '',
        total_value: balanceInfo.balance,
        amount_paid: balanceInfo.balance,
        discount: 0,
        registration_fee: 0,
        visits: selectedMb ? (selectedMb.number_duration || 0) : 0,
        start_date: startDate,
        end_date: endDate,
        observation: `Pago de saldo pendiente (Membresía: $${(selectedMb?.cost || 0).toLocaleString()})`
      }));
      setIncludeRegistration(false);
    } else {
      setPaymentData(prev => ({
        ...prev,
        member_id: member.id,
        membership_id: member.membership_id || '',
        total_value: selectedMb ? selectedMb.cost : 0,
        amount_paid: selectedMb ? selectedMb.cost : 0,
        discount: 0,
        registration_fee: 0,
        visits: selectedMb ? (selectedMb.number_duration || 0) : 0,
        start_date: startDate,
        end_date: endDate,
        observation: ''
      }));
      setIncludeRegistration(false);
    }
  };

  const handleMembershipChange = (e) => {
    const mbId = e.target.value;
    const selectedMb = memberships.find(m => m.id === mbId);
    setPaymentData(prev => ({
      ...prev,
      membership_id: mbId,
      total_value: selectedMb ? selectedMb.cost : 0,
      amount_paid: selectedMb ? selectedMb.cost : 0,
      visits: selectedMb ? (selectedMb.number_duration || 0) : 0
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'start_date' ? { end_date: calculateNextMonthEnd(value) } : {})
    }));
  };

  const calculateBalances = () => {
    const total = parseFloat(paymentData.total_value) || 0;
    const disc = parseFloat(paymentData.discount) || 0;
    const regFee = parseFloat(paymentData.registration_fee) || 0;
    const paid = parseFloat(paymentData.amount_paid) || 0;

    const netValue = total - disc + regFee;
    const saleBalance = netValue - paid;
    const finalDebtAfterThis = (totalDebtInfo.balance > 0 ? totalDebtInfo.balance : netValue) - paid;

    return {
      netValue,
      saleBalance,
      finalDebtAfterThis
    };
  };

  const selectedMembership = memberships.find(mb => mb.id === paymentData.membership_id);
  const membershipCost = selectedMembership ? selectedMembership.cost : 0;
  const { netValue, saleBalance, finalDebtAfterThis } = calculateBalances();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const membershipEndDate = totalDebtInfo.membershipEnd ? new Date(totalDebtInfo.membershipEnd) : null;
  const isMembershipExpired = membershipEndDate ? membershipEndDate < today : false;
  const showMembershipExpiredNotice = isMembershipExpired && paymentHistory.length > 0;
  const showAlreadyPaidNotice = !showMembershipExpiredNotice && totalDebtInfo.balance <= 0 && paymentHistory.length > 0 && totalDebtInfo.visitsRemaining > 0;
  const showVisitsExhaustedNotice = !showMembershipExpiredNotice && totalDebtInfo.balance <= 0 && paymentHistory.length > 0 && totalDebtInfo.visitsRemaining === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setAlert({ type: 'error', message: 'Por favor selecciona un afiliado' });
      return;
    }
    try {
      await api.processMembershipPayment(paymentData);
      setAlert({ type: 'success', message: 'Pago procesado correctamente' });
      
      // Update data instead of clearing if there's still debt, or just refresh
      fetchMemberExtras(selectedMember.id);
      
      // Optionally reset partial fields
      setPaymentData(prev => ({
        ...prev,
        amount_paid: 0,
        observation: ''
      }));
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al procesar pago: ' + err.message });
    }
  };

  const filteredMembers = searchTerm.length > 2 
    ? members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.identification?.includes(searchTerm)
      )
    : [];

  if (loading) return <div className="placeholder">Cargando...</div>;

  return (
    <div className="page-container wide">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <header className="app-header">
        <h1>
          <MoneyTick size={32} variant="linear" color="#F2CB05" />
          Pagos de Membresía
        </h1>
      </header>

      <div className="app-content">
        <div className="payment-card-horizontal">
          <div className="search-section">
            <label>Buscar Afiliado</label>
            <div className="search-input-wrapper">
              <SearchNormal1 size={20} variant="linear" color="#0D0D0D" className="search-icon" />
              <input 
                type="text" 
                placeholder="Nombre o identificación..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredMembers.length > 0 && (
              <div className="search-results">
                {filteredMembers.map(m => (
                  <div key={m.id} className="search-item" onClick={() => handleMemberSelect(m)}>
                    <User size={18} />
                    <div className="search-item-info">
                      <strong>{`${m.name} - ${m.identification}`}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedMember && (
            <div className="selected-member-card">
              <div className="member-info-header">
                <Receipt2 size={40} color="var(--primary)" />
                <div>
                  <h3>{selectedMember.name}</h3>
                  <p>ID: {selectedMember.identification} | <span className="debt-indicator">Deuda Actual: ${totalDebtInfo.balance.toLocaleString()}</span></p>
                </div>
                <button className="change-member-btn" onClick={() => {
                  setSelectedMember(null);
                  setPaymentHistory([]);
                  setTotalDebtInfo({ balance: 0, totalExpected: 0, totalPaid: 0 });
                }}>Cambiar</button>
              </div>

              <div className="form-history-container">
                <form onSubmit={handleSubmit} className="payment-form-grid">
                  <div className="col-left">
                    <div className="form-section">
                      <h4>Membresía y Vigencia</h4>
                      <div className="form-grid-col">
                        <div className="form-group">
                          <label>Membresía</label>
                          <select 
                            name="membership_id" 
                            value={paymentData.membership_id} 
                            onChange={handleMembershipChange}
                            required
                          >
                            <option value="">Selecciona una membresía</option>
                            {memberships.map(mb => (
                              <option key={mb.id} value={mb.id}>{mb.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label><Calendar size={14} /> Fecha Inicial</label>
                            <input type="date" name="start_date" value={paymentData.start_date} onChange={handleChange} required />
                          </div>
                          <div className="form-group">
                            <label><Calendar size={14} /> Fecha Final</label>
                            <input type="date" name="end_date" value={paymentData.end_date} readOnly className="read-only" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label><DirectboxSend size={14} /> Visitas Incluidas</label>
                          <input type="number" name="visits" value={paymentData.visits} onChange={handleChange} />
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h4>Liquidación</h4>
                      <div className="form-grid-col">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Valor Membresía</label>
                            <input type="number" name="total_value" value={paymentData.total_value} readOnly className="read-only" />
                          </div>
                          <div className="form-group">
                            <label>Descuento</label>
                            <input type="number" name="discount" value={paymentData.discount} onChange={handleChange} />
                          </div>
                        </div>
                        
                        <div className="registration-fee-box">
                          <label className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={includeRegistration} 
                              onChange={(e) => setIncludeRegistration(e.target.checked)} 
                            />
                            <span className="label-text">Cobrar Inscripción ($40.000)</span>
                          </label>
                          {includeRegistration && <div className="fee-value">+$40,000</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-right">
                    <div className="form-section highlight">
                      {showAlreadyPaidNotice ? (
                        <div className="paid-notice">
                          <h4>Pago al día</h4>
                          <p>Este afiliado ya tiene la membresía completamente pagada y aún tiene visitas disponibles. No es necesario procesar un nuevo pago por ahora.</p>
                        </div>
                      ) : (
                        <>
                          {showMembershipExpiredNotice && (
                            <div className="paid-notice">
                              <h4>Membresía vencida</h4>
                              <p>La membresía se venció el {totalDebtInfo.membershipEnd}. Puedes procesar un nuevo pago para renovar el periodo y reactivar al afiliado.</p>
                            </div>
                          )}
                          {showVisitsExhaustedNotice && (
                            <div className="paid-notice">
                              <h4>Visitas agotadas</h4>
                              <p>El afiliado ha agotado las visitas de su membresía antes de que termine el periodo. Puedes registrar un nuevo pago para renovar o extender su plan.</p>
                            </div>
                          )}
                          <h4>Procesar Pago</h4>
                          <div className="membership-current-box">
                            <span>Valor de membresía del afiliado</span>
                            <strong>${membershipCost.toLocaleString()}</strong>
                          </div>
                          <div className="form-grid-col">
                            <div className="form-group">
                              <label>{totalDebtInfo.balance > 0 ? 'Saldo Pendiente a Pagar' : 'Valor a Pagar (Neto)'}</label>
                              <div className="amount-display-large">${netValue.toLocaleString()}</div>
                            </div>

                            <div className="form-group">
                              <label>Monto Recibido</label>
                              <input 
                                type="number" 
                                name="amount_paid" 
                                value={paymentData.amount_paid} 
                                onChange={handleChange} 
                                className="payment-input"
                                required 
                              />
                            </div>

                            <div className="form-group">
                              <label>Forma de Pago</label>
                              <select name="payment_method" value={paymentData.payment_method} onChange={handleChange}>
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                              </select>
                            </div>

                            <div className="status-summary-box">
                              <div className="status-item">
                                <span className="label">Saldo Restante Final:</span>
                                <span className={`value ${finalDebtAfterThis > 0 ? 'debt' : ''}`}>
                                  ${finalDebtAfterThis.toLocaleString()}
                                </span>
                              </div>
                              <div className="status-indicator">
                                {finalDebtAfterThis <= 0 ? (
                                  <div className="paid-tag"><TickCircle size={16} variant="Bold" /> PAGADO COMPLETAMENTE</div>
                                ) : (
                                  <div className="pending-tag">PAGO PENDIENTE</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Observación</label>
                            <textarea 
                              name="observation" 
                              value={paymentData.observation} 
                              onChange={handleChange} 
                              rows="3"
                              placeholder="Notas adicionales..."
                            />
                          </div>

                          <div className="form-actions">
                            <Button type="submit" variant="primary" style={{ width: '100%', padding: '18px', fontSize: '1.2rem' }}>
                              Confirmar y Guardar Pago
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </form>

                {/* HISTORY SECTION */}
                <div className="history-section">
                  <div className="section-title">
                    <Clock size={20} />
                    <h4>Historial de Pagos de este Afiliado</h4>
                  </div>
                  <div className="history-table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Membresía</th>
                          <th>Monto Pagado</th>
                          <th>F. Pago</th>
                          <th>Obs.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.length > 0 ? (
                          paymentHistory.map(p => (
                            <tr key={p.id}>
                              <td>{p.date}</td>
                              <td>{p.membership_name}</td>
                              <td style={{ fontWeight: 700 }}>${p.amount_paid.toLocaleString()}</td>
                              <td>{p.payment_method}</td>
                              <td style={{ fontSize: '0.85rem' }}>{p.observation}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No hay pagos registrados.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-container.wide {
          max-width: 1200px;
          margin: 0 auto;
        }
        .payment-card-horizontal {
          width: 100%;
          background: var(--bg-card);
          padding: 35px;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          box-sizing: border-box;
        }
        .search-section {
          margin-bottom: 35px;
          position: relative;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .search-section label {
          display: block;
          margin-bottom: 10px;
          font-weight: 700;
          color: var(--text-dark);
        }
        .search-input-wrapper {
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }
        .search-input-wrapper input {
          width: 100%;
          padding: 16px 16px 16px 50px;
          background: #fff;
          border: 2px solid var(--border);
          border-radius: 14px;
          color: #333;
          font-size: 1.1rem;
          box-sizing: border-box;
        }
        .search-input-wrapper .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #777;
        }
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          width: 100%;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-top: 8px;
          z-index: 100;
          max-height: 350px;
          overflow-y: auto;
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
          box-sizing: border-box;
        }
        .search-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
          color: #333;
        }
        .search-item:hover {
          background: #f9f9f9;
        }
        .payment-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .member-info-header {
          display: flex;
          align-items: center;
          gap: 25px;
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          margin-bottom: 30px;
        }
        .debt-indicator {
          color: #ff4757;
          font-weight: 700;
        }
        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          border-radius: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .form-section.highlight {
          background: rgba(242, 203, 5, 0.04);
          border: 1px solid rgba(242, 203, 5, 0.15);
        }
        h4 {
          margin: 0 0 20px;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--primary);
          font-weight: 700;
        }
        .form-grid-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .membership-current-box {
          padding: 18px 20px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          color: var(--text-dark);
          font-weight: 600;
        }
        .membership-current-box strong {
          font-size: 1.2rem;
          color: var(--primary);
        }
        input, select, textarea {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #ccc;
          background: #fff;
          color: #333;
        }
        input.read-only {
          background: #f5f5f5;
        }
        .registration-fee-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }
        .checkbox-container {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 600;
          color: #333;
        }
        .checkbox-container input {
          width: 18px;
          height: 18px;
          margin: 0;
        }
        .checkbox-container .label-text {
          margin-left: 6px;
        }
        .amount-display-large {
          padding: 20px;
          background: #111;
          color: var(--primary);
          border-radius: 14px;
          font-weight: 800;
          font-size: 2.5rem;
          text-align: center;
          border: 2px solid var(--primary);
        }
        .status-summary-box {
          margin-top: 15px;
          margin-bottom: 24px;
          padding: 20px;
          background: #111;
          border-radius: 14px;
          border-left: 5px solid var(--primary);
        }
        .status-item .value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
        }
        .debt { color: #ff4757 !important; }
        
        /* HISTORY STYLES */
        .history-section {
          background: rgba(255,255,255,0.02);
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          color: var(--primary);
        }
        .section-title h4 {
          margin: 0;
        }
        .history-table-wrapper {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          color: var(--text-light);
        }
        th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid var(--border);
          color: var(--text-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        tr:last-child td {
          border-bottom: none;
        }
        
        .paid-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4caf50;
          font-weight: 800;
          font-size: 0.9rem;
          background: rgba(76, 175, 80, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
        }
        .pending-tag {
          color: #ff4757;
          font-weight: 800;
          font-size: 0.9rem;
          background: rgba(255, 71, 87, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
        }

        .paid-notice {
          padding: 24px;
          border-radius: 16px;
          background: rgba(76, 175, 80, 0.08);
          border: 1px solid rgba(76, 175, 80, 0.15);
          color: #2d6a4f;
          margin-bottom: 24px;
        }
        .paid-notice h4 {
          margin-top: 0;
          color: #1b4332;
          font-size: 1.1rem;
        }
        .paid-notice p {
          margin: 12px 0 0;
          line-height: 1.6;
          color: #1b4332;
        }
        
        .change-member-btn {
          margin-left: auto;
          background: rgba(242, 203, 5, 0.1);
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
        }
        
        @media (max-width: 1000px) {
          .payment-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MembershipPaymentPage;
