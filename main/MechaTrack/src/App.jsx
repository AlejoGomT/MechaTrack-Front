import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminInventory from "./pages/AdminInventory";
import AdminUsers from "./pages/AdminUsers";
import AdminNotifications from "./pages/AdminNotifications";
import AdminReports from "./pages/AdminReports";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import SecretaryBilling from "./pages/SecretaryBilling";
import SecretaryHistory from "./pages/SecretaryHistory";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianCreateOrder from "./pages/TechnicianCreateOrder";
import TechnicianHistory from "./pages/TechnicianHistory";
import ClientDashboard from "./pages/ClientDashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminVehicles from "./pages/AdminVehicles";

// Componente para proteger rutas
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminInventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminVehicles />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminNotifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminReports />
              </PrivateRoute>
            }
          />
          <Route
            path="/secretary"
            element={
              <PrivateRoute allowedRoles={["secretary"]}>
                <SecretaryDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/secretary/billing"
            element={
              <PrivateRoute allowedRoles={["secretary"]}>
                <SecretaryBilling />
              </PrivateRoute>
            }
          />
          <Route
            path="/secretary/history"
            element={
              <PrivateRoute allowedRoles={["secretary"]}>
                <SecretaryHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/technician"
            element={
              <PrivateRoute allowedRoles={["technician"]}>
                <TechnicianDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/technician/create-order"
            element={
              <PrivateRoute allowedRoles={["technician"]}>
                <TechnicianCreateOrder />
              </PrivateRoute>
            }
          />
          <Route
            path="/technician/history"
            element={
              <PrivateRoute allowedRoles={["technician"]}>
                <TechnicianHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/client"
            element={
              <PrivateRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
