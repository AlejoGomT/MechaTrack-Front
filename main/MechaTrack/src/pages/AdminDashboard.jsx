import { useState, useEffect } from "react";
import { Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import axios from "axios";
import { toast } from "react-toastify";

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
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeOrdersCount: 0,
    pendingOrdersCount: 0,
    closedOrdersCount: 0,
    notificationsCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, notificationsResponse] = await Promise.all([
          axios.get("/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
            params: { to_user_id: user.id, status: "Pendiente" },
          }),
        ]);

        const orders = ordersResponse.data;
        const notifications = notificationsResponse.data;

        setStats({
          activeOrdersCount: orders.filter((o) => o.status === "En Proceso")
            .length,
          pendingOrdersCount: orders.filter((o) => o.status === "Pendiente")
            .length,
          closedOrdersCount: orders.filter((o) => o.status === "Finalizado")
            .length,
          notificationsCount: notifications.length,
        });
      } catch (error) {
        console.error("[AdminDashboard] Error al cargar datos:", error);
        toast.error("Error al cargar estadísticas");
      }
    };
    if (token) fetchData();
  }, [token, user.id]);

  const statCards = [
    {
      title: "Órdenes",
      content: `Activas: ${stats.activeOrdersCount} | Pendientes: ${stats.pendingOrdersCount} | Cerradas: ${stats.closedOrdersCount}`,
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
      content: `${stats.notificationsCount} mensajes pendientes`,
      buttonText: "Ver Notificaciones",
      onClick: () => navigate("/admin/notifications"),
    },
  ];

  const userData = {
    userId: user?.id,
    userName: `${user?.first_name} ${user?.last_name}`,
    activeOrdersCount: stats.activeOrdersCount,
    notificationsCount: stats.notificationsCount,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Panel Administrador" {...userData} />
        <Container className="mt-4">
          <Row className="justify-content-between">
            {statCards.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
