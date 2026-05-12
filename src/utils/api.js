// const API_URL = 'https://fh-0ckg.onrender.com/api';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const handleResponse = async (response) => {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    let message = data?.error || data?.message || text || 'Algo salió mal';
    if (typeof message === 'string' && message.trim().startsWith('<')) {
      message = response.statusText || `Error del servidor (${response.status})`;
    }
    console.error('API error:', response.status, message);
    throw new Error(message);
  }

  return data;
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
  getTeacherLogs: (startDate, endDate) => {
    const params = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
    return fetch(`${API_URL}/teacher-logs${params}`).then(handleResponse);
  },
  addTeacherLog: (log) => 
    fetch(`${API_URL}/teacher-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    }).then(handleResponse),
  toggleAttendance: (data) =>
    fetch(`${API_URL}/teacher-logs/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  deleteTeacherLog: (id) => fetch(`${API_URL}/teacher-logs/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Employee Schedules
  getEmployeeSchedules: () => fetch(`${API_URL}/employee-schedules`).then(handleResponse),
  toggleScheduleSlot: (data) =>
    fetch(`${API_URL}/employee-schedules/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

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
  getMembers: (page = 1, limit = 10, search = '') => fetch(`${API_URL}/members?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).then(handleResponse),
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

  // Employees
  getEmployees: (page = 1, limit = 10, search = '') => fetch(`${API_URL}/employees?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).then(handleResponse),
  addEmployee: (employee) => 
    fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    }).then(handleResponse),
  updateEmployee: (id, employee) => 
    fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    }).then(handleResponse),
  deleteEmployee: (id) => fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Courtesy Classes
  getCourtesyClasses: (page = 1, limit = 10) => fetch(`${API_URL}/courtesy-classes?page=${page}&limit=${limit}`).then(handleResponse),
  addCourtesyClass: (courtesyClass) => 
    fetch(`${API_URL}/courtesy-classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courtesyClass)
    }).then(handleResponse),
  updateCourtesyClass: (id, courtesyClass) => 
    fetch(`${API_URL}/courtesy-classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courtesyClass)
    }).then(handleResponse),
  deleteCourtesyClass: (id) => fetch(`${API_URL}/courtesy-classes/${id}`, { method: 'DELETE' }).then(handleResponse),
};
