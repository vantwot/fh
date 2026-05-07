import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import InventoryPage from './pages/InventoryPage';
import TeachersPage from './pages/TeachersPage';
import ExpensesPage from './pages/ExpensesPage';
import MembershipsPage from './pages/MembershipsPage';
import MembersPage from './pages/MembersPage';
import MembershipPaymentPage from './pages/MembershipPaymentPage';
import ReportsPage from './pages/ReportsPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/ventas" 
        element={
          <ProtectedRoute>
            <SalesPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/inventario" 
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/mensualidades" 
        element={
          <ProtectedRoute>
            <MembershipsPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/afiliados" 
        element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/reportes" 
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/pagos-membresia" 
        element={
          <ProtectedRoute>
            <MembershipPaymentPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profesores" 
        element={
          <ProtectedRoute>
            <TeachersPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/gastos" 
        element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
