import { useState, useEffect } from "react";
import { Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import { toast } from "react-toastify";
import io from "socket.io-client";
import { getOrders } from "../services/orderService";
import { getVehicles } from "../services/vehicleService"; // Importar getVehicles
import axios from "axios";
import { API_URL } from "../services/apiConfig";
import { StatsContainer } from "../styles/GlobalStyles";

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas de Orden", path: "/client/query" },
  { label: "Consultas de Vehículo", path: "/client/vehicles" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    inProcessOrdersCount: 0,
    vehiclesCount: 0, // Nuevo campo para vehículos
    notificationsCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, vehiclesResponse, notificationsResponse] =
          await Promise.all([
            getOrders({ limit: 1000 }),
            getVehicles({ limit: 1000 }), // Obtener todos los vehículos
            axios.get("/api/notifications", {
              headers: { Authorization: `Bearer ${token}` },
              params: { to_user_id: user.id, status: "Pendiente" },
            }),
          ]);

        const ordersData = ordersResponse;
        const vehiclesData = vehiclesResponse;
        const notifications = notificationsResponse.data;

        // Depuración
        console.log("[ClientDashboard] Respuesta de getOrders:", ordersData);
        console.log(
          "[ClientDashboard] Respuesta de getVehicles:",
          vehiclesData
        );
        console.log(
          "[ClientDashboard] Respuesta de /api/notifications:",
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
            "[ClientDashboard] Respuesta inválida de /api/orders:",
            ordersData
          );
          toast.error("Error al cargar órdenes");
        }

        // Contar órdenes en proceso
        const inProcessCount = orders.filter((order) =>
          ["En Proceso", "Pendiente", "Finalizado"].includes(order.status)
        ).length;

        // Validar vehiclesData
        let vehiclesCount = 0;
        if (
          vehiclesData &&
          typeof vehiclesData === "object" &&
          Array.isArray(vehiclesData.vehicles)
        ) {
          vehiclesCount = vehiclesData.total || vehiclesData.vehicles.length;
        } else {
          console.error(
            "[ClientDashboard] Respuesta inválida de /api/vehicles:",
            vehiclesData
          );
          toast.error("Error al cargar vehículos");
        }

        // Validar notificaciones
        const notificationsCount = Array.isArray(notifications)
          ? notifications.length
          : 0;
        if (!Array.isArray(notifications)) {
          console.warn(
            "[ClientDashboard] Respuesta inválida de /api/notifications:",
            notifications
          );
          toast.error("Error al cargar notificaciones");
        }

        setStats({
          inProcessOrdersCount: inProcessCount,
          vehiclesCount,
          notificationsCount,
        });
      } catch (error) {
        console.error("[ClientDashboard] Error al cargar datos:", error);
        toast.error("Error al cargar datos");
        setStats({
          inProcessOrdersCount: 0,
          vehiclesCount: 0,
          notificationsCount: 0,
        });
      }
    };

    if (token) fetchData();
  }, [token, user.id]);

  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL || "http://localhost:5000", {
      query: { token },
    });

    socket.on("connect", () => {
      console.log("[ClientDashboard] Conectado a Socket.IO");
    });

    socket.on("notification", (notification) => {
      console.log("[ClientDashboard] notification recibido:", notification);
      if (
        notification.to_user_id === user.id &&
        notification.status === "Pendiente" &&
        ["closure_approval", "closure_rejection", "order_creation"].includes(
          notification.type
        )
      ) {
        setStats((prev) => ({
          ...prev,
          notificationsCount: prev.notificationsCount + 1,
        }));
        toast.info("Nueva notificación recibida");
      }
    });

    socket.on("order_updated", (updatedOrder) => {
      console.log("[ClientDashboard] order_updated recibido:", updatedOrder);
      if (
        ["En Proceso", "Pendiente", "Finalizado"].includes(updatedOrder.status)
      ) {
        setStats((prev) => ({
          ...prev,
          inProcessOrdersCount: prev.inProcessOrdersCount + 1,
        }));
        toast.info(`Nueva orden en proceso: #${updatedOrder.id}`);
      } else if (
        updatedOrder.status === "Pendiente de Facturación" &&
        stats.inProcessOrdersCount > 0
      ) {
        setStats((prev) => ({
          ...prev,
          inProcessOrdersCount: prev.inProcessOrdersCount - 1,
        }));
      }
    });

    // Opcional: Escuchar eventos de vehículos (si el backend los emite)
    socket.on("vehicle_created", () => {
      console.log("[ClientDashboard] vehicle_created recibido");
      setStats((prev) => ({
        ...prev,
        vehiclesCount: prev.vehiclesCount + 1,
      }));
      toast.info("Nuevo vehículo registrado");
    });

    socket.on("vehicle_deleted", () => {
      console.log("[ClientDashboard] vehicle_deleted recibido");
      setStats((prev) => ({
        ...prev,
        vehiclesCount: prev.vehiclesCount > 0 ? prev.vehiclesCount - 1 : 0,
      }));
      toast.info("Vehículo eliminado");
    });

    socket.on("connect_error", (error) => {
      console.error("[ClientDashboard] Error de conexión Socket.IO:", error);
      toast.error("Error de conexión en tiempo real");
    });

    return () => {
      socket.disconnect();
      console.log("[ClientDashboard] Desconectado de Socket.IO");
    };
  }, [token, user.id, stats.inProcessOrdersCount]);

  const statCards = [
    {
      title: "Consultas de Orden",
      content: `${stats.inProcessOrdersCount} órdenes en proceso`,
      buttonText: "Ver Consultas",
      onClick: () => navigate("/client/query"),
    },
    {
      title: "Consultas de Vehículo",
      content: `${stats.vehiclesCount} vehículos registrados`,
      buttonText: "Ver Consultas",
      onClick: () => navigate("/client/vehicles"),
    },
    {
      title: "Notificaciones",
      content: `${stats.notificationsCount} notificaciones pendientes`,
      buttonText: "Ver Notificaciones",
      onClick: () => navigate("/client/notifications"),
    },
  ];

  return (
    <>
      <Sidebar menuItems={clientMenu} title="Consulta de Cliente" />
      <div className="content" style={{ marginLeft: "250px", padding: "20px" }}>
        <DashboardHeader
          title="Panel del Cliente"
          subtitle="Consulta el estado de tus vehículos y notificaciones"
          userName={`${user?.first_name} ${user?.last_name}`}
        />
        <Container className="mt-4">
          <StatsContainer>
            {statCards.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </StatsContainer>
        </Container>
      </div>
    </>
  );
};

export default ClientDashboard;
