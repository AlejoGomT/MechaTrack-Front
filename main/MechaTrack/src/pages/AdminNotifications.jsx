import { Container } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import { mockClientOrders } from "../data/mock";

const adminMenu = [
  { label: "Inicio", path: "/admin" },
  { label: "Órdenes de Servicio", path: "/admin/orders" },
  { label: "Inventario", path: "/admin/inventory" },
  { label: "Gestión de Usuarios", path: "/admin/users" },
  { label: "Notificaciones", path: "/admin/notifications" },
  { label: "Informes", path: "/admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminNotifications = () => {
  const { user } = useAuth();
  const activeOrdersCount = mockClientOrders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = mockClientOrders.filter(
    (o) => o.notifications?.length > 0
  ).length;

  const userData = {
    userId: user?.id,
    userName: user?.name,
    activeOrdersCount,
    notificationsCount,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Notificaciones" {...userData} />
        <Container className="mt-4">
          <p>Página de notificaciones en desarrollo.</p>
        </Container>
      </div>
    </>
  );
};

export default AdminNotifications;
