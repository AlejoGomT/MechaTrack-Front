import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminInventory from './pages/AdminInventory';
import AdminParts from './pages/AdminParts';
import AdminPrices from './pages/AdminPrices';
import AdminReports from './pages/AdminReports';
import SecretaryDashboard from './pages/SecretaryDashboard';
import SecretaryBilling from './pages/SecretaryBilling';
import SecretaryHistory from './pages/SecretaryHistory';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechnicianCreateOrder from './pages/TechnicianCreateOrder';
import ClientDashboard from './pages/ClientDashboard';

// Componente para proteger rutas
const PrivateRoute = ({ children, allowedTypes }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (!allowedTypes.includes(user.userType)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedTypes={['Admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <PrivateRoute allowedTypes={['Admin']}>
              <AdminOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <PrivateRoute allowedTypes={['Admin']}>
              <AdminInventory />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/parts"
          element={
            <PrivateRoute allowedTypes={['Admin']}>
              <AdminParts />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/prices"
          element={
            <PrivateRoute allowedTypes={['Admin']}>
              <AdminPrices />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PrivateRoute allowedTypes={['Admin']}>
              <AdminReports />
            </PrivateRoute>
          }
        />
        <Route
          path="/secretary"
          element={
            <PrivateRoute allowedTypes={['Secretaria']}>
              <SecretaryDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/secretary/billing"
          element={
            <PrivateRoute allowedTypes={['Secretaria']}>
              <SecretaryBilling />
            </PrivateRoute>
          }
        />
        <Route
          path="/secretary/history"
          element={
            <PrivateRoute allowedTypes={['Secretaria']}>
              <SecretaryHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/technician"
          element={
            <PrivateRoute allowedTypes={['Tecnico']}>
              <TechnicianDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/technician/create-order"
          element={
            <PrivateRoute allowedTypes={['Tecnico']}>
              <TechnicianCreateOrder />
            </PrivateRoute>
          }
        />
        <Route
          path="/client"
          element={
            <PrivateRoute allowedTypes={['Cliente']}>
              <ClientDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;