import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import { toast } from "react-toastify";
import io from "socket.io-client";
import { getOrders } from "../services/orderService";
import axios from "axios";

const secretaryMenu = [
  { label: "Inicio", path: "/secretary" },
  { label: "Facturación", path: "/secretary/billing" },
  { label: "Historial de Facturaciones", path: "/secretary/history" },
  { label: "Notificaciones", path: "/secretary/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const SecretaryDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingBillingOrdersCount: 0,
    billedOrdersCount: 0,
    notificationsCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, notificationsResponse] = await Promise.all([
          getOrders({ limit: 1000 }), // Obtener todas las órdenes con límite
          axios.get("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
            params: { to_user_id: user.id, status: "Pendiente" },
          }),
        ]);

        const ordersData = ordersResponse;
        const notifications = notificationsResponse.data;

        // Depuración detallada
        console.log(
          "[SecretaryDashboard] Respuesta completa de getOrders:",
          ordersData
        );
        console.log(
          "[SecretaryDashboard] Respuesta de /api/notifications:",
          notifications
        );

        // Validar ordersData
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
          toast.error("Error al cargar órdenes");
        }

        // Filtrar órdenes por estado
        const pendingBillingCount = orders.filter(
          (order) => order.status === "Pendiente de Facturación"
        ).length;
        const billedCount = orders.filter(
          (order) => order.status === "Facturado"
        ).length;

        // Validar notificaciones
        const notificationsCount = Array.isArray(notifications)
          ? notifications.length
          : 0;
        if (!Array.isArray(notifications)) {
          console.warn(
            "[SecretaryDashboard] Respuesta inválida de /api/notifications, se esperaba un arreglo:",
            notifications
          );
          toast.error("Error al cargar notificaciones");
        }

        setStats({
          pendingBillingOrdersCount: pendingBillingCount,
          billedOrdersCount: billedCount,
          notificationsCount,
        });
      } catch (error) {
        console.error("[SecretaryDashboard] Error al cargar datos:", error);
        toast.error("Error al cargar datos");
        setStats({
          pendingBillingOrdersCount: 0,
          billedOrdersCount: 0,
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
      console.log("[SecretaryDashboard] order_updated recibido:", updatedOrder);
      if (updatedOrder.status === "Pendiente de Facturación") {
        setStats((prev) => ({
          ...prev,
          pendingBillingOrdersCount: prev.pendingBillingOrdersCount + 1,
        }));
        toast.info(`Nueva orden pendiente de facturación: #${updatedOrder.id}`);
      } else if (updatedOrder.status === "Facturado") {
        setStats((prev) => ({
          ...prev,
          billedOrdersCount: prev.billedOrdersCount + 1,
          pendingBillingOrdersCount:
            prev.pendingBillingOrdersCount > 0
              ? prev.pendingBillingOrdersCount - 1
              : prev.pendingBillingOrdersCount,
        }));
        toast.info(`Orden facturada: #${updatedOrder.id}`);
      } else if (stats.pendingBillingOrdersCount > 0) {
        setStats((prev) => ({
          ...prev,
          pendingBillingOrdersCount: prev.pendingBillingOrdersCount - 1,
        }));
      }
    });

    socket.on("notification_created", (notification) => {
      console.log(
        "[SecretaryDashboard] notification_created recibido:",
        notification
      );
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
  }, [token, user.id, stats.pendingBillingOrdersCount]);

  const statCards = [
    {
      title: "Órdenes Pendientes de Facturación",
      content: `${stats.pendingBillingOrdersCount} órdenes esperando facturación`,
      buttonText: "Ver Facturación",
      onClick: () => navigate("/secretary/billing"),
    },
    {
      title: "Historial de Facturaciones",
      content: `${stats.billedOrdersCount} órdenes facturadas`,
      buttonText: "Ver Historial",
      onClick: () => navigate("/secretary/history"),
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

export default SecretaryDashboard;
