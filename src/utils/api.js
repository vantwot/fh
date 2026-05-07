const API_URL = 'https://fh-0ckg.onrender.com/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Algo salió mal');
  }
  return response.json();
};

export const api = {
  // Auth
  login: (username, password) => 
    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(handleResponse),

  // Sales
  getSales: (page = 1, limit = 10) => fetch(`${API_URL}/sales?page=${page}&limit=${limit}`).then(handleResponse),
  getSalesSummary: () => fetch(`${API_URL}/sales/summary`).then(handleResponse),
  addSale: (sale) => 
    fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    }).then(handleResponse),
  deleteSale: (id) => fetch(`${API_URL}/sales/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Inventory
  getInventory: (page = 1, limit = 10) => fetch(`${API_URL}/inventory?page=${page}&limit=${limit}`).then(handleResponse),
  addInventoryItem: (item) => 
    fetch(`${API_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).then(handleResponse),
  updateInventoryItem: (id, item) => 
    fetch(`${API_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).then(handleResponse),
  deleteInventoryItem: (id) => fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Teachers
  getTeachers: () => fetch(`${API_URL}/teachers`).then(handleResponse),
  addTeacher: (teacher) => 
    fetch(`${API_URL}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher)
    }).then(handleResponse),
  
  // Teacher Logs
  getTeacherLogs: () => fetch(`${API_URL}/teacher-logs`).then(handleResponse),
  addTeacherLog: (log) => 
    fetch(`${API_URL}/teacher-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    }).then(handleResponse),
  deleteTeacherLog: (id) => fetch(`${API_URL}/teacher-logs/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Expenses
  getExpenses: () => fetch(`${API_URL}/expenses`).then(handleResponse),
  addExpense: (expense) => 
    fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    }).then(handleResponse),
  deleteExpense: (id) => fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }).then(handleResponse),
  
  // Memberships
  getMemberships: (page = 1, limit = 10) => fetch(`${API_URL}/memberships?page=${page}&limit=${limit}`).then(handleResponse),
  addMembership: (membership) => 
    fetch(`${API_URL}/memberships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(membership)
    }).then(handleResponse),
  updateMembership: (id, membership) => 
    fetch(`${API_URL}/memberships/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(membership)
    }).then(handleResponse),
  deleteMembership: (id) => fetch(`${API_URL}/memberships/${id}`, { method: 'DELETE' }).then(handleResponse),
  
  // Members
  getMembers: (page = 1, limit = 10) => fetch(`${API_URL}/members?page=${page}&limit=${limit}`).then(handleResponse),
  addMember: (member) => 
    fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    }).then(handleResponse),
  updateMember: (id, member) => 
    fetch(`${API_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    }).then(handleResponse),
  deleteMember: (id) => fetch(`${API_URL}/members/${id}`, { method: 'DELETE' }).then(handleResponse),
  getMemberBalance: (id) => fetch(`${API_URL}/members/${id}/balance`).then(handleResponse),
  getMemberPayments: (id) => fetch(`${API_URL}/members/${id}/payments`).then(handleResponse),
  useMemberVisit: (id) => fetch(`${API_URL}/members/${id}/use-visit`, { method: 'POST' }).then(handleResponse),
  getReportSummary: () => fetch(`${API_URL}/reports/summary`).then(handleResponse),

  // Membership Payments
  processMembershipPayment: (payment) => 
    fetch(`${API_URL}/membership-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    }).then(handleResponse),
};
