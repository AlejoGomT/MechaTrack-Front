import { Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import { mockClientOrders, mockUsers } from "../data/mock";

const adminMenu = [
  { label: "Inicio", path: "/admin" },
  { label: "Órdenes de Servicio", path: "/admin/orders" },
  { label: "Inventario", path: "/admin/inventory" },
  { label: "Gestión de Usuarios", path: "/admin/users" },
  { label: "Notificaciones", path: "/admin/notifications" },
  { label: "Informes", path: "/admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Contadores para el administrador (todas las órdenes, no filtradas por técnico)
  const activeOrdersCount = mockClientOrders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const pendingOrdersCount = mockClientOrders.filter(
    (o) => o.status === "Pendiente"
  ).length;
  const closedOrdersCount = mockClientOrders.filter(
    (o) => o.status === "Finalizado"
  ).length;
  const notificationsCount = mockClientOrders.filter(
    (o) => o.notifications?.length > 0
  ).length;
  const usersCount = mockUsers.filter((u) => u.role !== "admin").length;

  const stats = [
    {
      title: "Órdenes",
      content: `Activas: ${activeOrdersCount} | Pendientes: ${pendingOrdersCount} | Cerradas: ${closedOrdersCount}`,
      buttonText: "Ver Órdenes",
      onClick: () => navigate("/admin/orders"),
    },
    {
      title: "Inventario",
      content: "Gestión de repuestos disponibles",
      buttonText: "Ver Inventario",
      onClick: () => navigate("/admin/inventory"),
    },
    {
      title: "Mensajes",
      content: `${notificationsCount} mensajes pendientes`,
      buttonText: "Ver Notificaciones",
      onClick: () => navigate("/admin/notifications"),
    },
    {
      title: "Usuarios de Plataforma",
      content: `${usersCount} usuarios registrados`,
      buttonText: "Ver Usuarios",
      onClick: () => navigate("/admin/users"),
    },
  ];

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
        <DashboardHeader title="Panel Administrador" {...userData} />
        <Container className="mt-4">
          <Row className="justify-content-between">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
