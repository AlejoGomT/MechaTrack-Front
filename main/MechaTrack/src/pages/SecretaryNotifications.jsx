import { useState, useEffect } from "react";
import { Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import axios from "axios";
import { toast } from "react-toastify";
import io from "socket.io-client";

const secretaryMenu = [
  { label: "Inicio", path: "/secretary" },
  { label: "Facturación", path: "/secretary/billing" },
  { label: "Historial de Facturaciones", path: "/secretary/history" },
  { label: "Notificaciones", path: "/secretary/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const SecretaryNotifications = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingBillingOrdersCount: 0,
    notificationsCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, notificationsResponse] = await Promise.all([
          axios.get("/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
            params: { status: "Pendiente de Facturación", limit: 1000 },
          }),
          axios.get("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
            params: { to_user_id: user.id, status: "Pendiente" },
          }),
        ]);

        const ordersData = ordersResponse.data;
        const notifications = notificationsResponse.data;

        // Depuración: Imprimir la respuesta de /api/orders
        console.log(
          "[SecretaryDashboard] Respuesta de /api/orders:",
          ordersData
        );

        // Validar ordersData.orders
        let orders = [];
        if (
          ordersData &&
          typeof ordersData === "object" &&
          Array.isArray(ordersData.orders)
        ) {
          orders = ordersData.orders;
        } else {
          console.error(
            "[SecretaryDashboard] Respuesta inválida de /api/orders, se esperaba un objeto con orders:",
            ordersData
          );
          toast.error("Respuesta inválida al cargar órdenes");
        }

        setStats({
          pendingBillingOrdersCount: orders.length,
          notificationsCount: notifications.length,
        });
      } catch (error) {
        console.error("[SecretaryDashboard] Error al cargar datos:", error);
        toast.error(error.message || "Error al cargar estadísticas");
        setStats({
          pendingBillingOrdersCount: 0,
          notificationsCount: 0,
        });
      }
    };

    if (token) fetchData();
  }, [token, user.id]);

  useEffect(() => {
    if (!token) return;

    // Configurar Socket.IO
    const socket = io("/", {
      query: { token },
    });

    socket.on("connect", () => {
      console.log("[SecretaryDashboard] Conectado a Socket.IO");
    });

    socket.on("order_updated", (updatedOrder) => {
      if (updatedOrder.status === "Pendiente de Facturación") {
        setStats((prev) => ({
          ...prev,
          pendingBillingOrdersCount: prev.pendingBillingOrdersCount + 1,
        }));
        toast.info(`Nueva orden pendiente de facturación: #${updatedOrder.id}`);
      } else if (
        (prev) =>
          prev.pendingBillingOrdersCount > 0 &&
          updatedOrder.status !== "Pendiente de Facturación"
      ) {
        setStats((prev) => ({
          ...prev,
          pendingBillingOrdersCount: prev.pendingBillingOrdersCount - 1,
        }));
      }
    });

    socket.on("notification_created", (notification) => {
      if (
        notification.to_user_id === user.id &&
        notification.status === "Pendiente"
      ) {
        setStats((prev) => ({
          ...prev,
          notificationsCount: prev.notificationsCount + 1,
        }));
        toast.info("Nueva notificación recibida");
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[SecretaryDashboard] Error de conexión Socket.IO:", error);
      toast.error("Error de conexión en tiempo real");
    });

    return () => {
      socket.disconnect();
      console.log("[SecretaryDashboard] Desconectado de Socket.IO");
    };
  }, [token, user.id]);

  const statCards = [
    {
      title: "Órdenes Pendientes de Facturación",
      content: `${stats.pendingBillingOrdersCount} órdenes esperando facturación`,
      buttonText: "Ver Facturación",
      onClick: () => navigate("/secretary/billing"),
    },
    {
      title: "Mensajes",
      content: `${stats.notificationsCount} mensajes pendientes`,
      buttonText: "Ver Notificaciones",
      onClick: () => navigate("/secretary/notifications"),
    },
  ];

  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader
          title="Panel Secretaría"
          subtitle="Gestión de facturación y órdenes"
          userName={`${user?.first_name} ${user?.last_name}`}
        />
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

export default SecretaryNotifications;
