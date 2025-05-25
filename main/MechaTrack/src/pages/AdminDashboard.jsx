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
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Vehiculos", path: "../admin/vehicles" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
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
    branchesCount: 0,
    vehiclesCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, notificationsResponse, vehiclesResponse] =
          await Promise.all([
            axios.get("/api/orders", {
              headers: { Authorization: `Bearer ${token}` },
              params: { limit: 1000 }, // Añadir límite para consistencia
            }),
            axios.get("/api/notifications", {
              headers: { Authorization: `Bearer ${token}` },
              params: { to_user_id: user.id, status: "Pendiente" },
            }),
            axios.get("/api/vehicles", {
              headers: { Authorization: `Bearer ${token}` },
              params: { limit: 1000 }, // Obtener todos los vehículos
            }),
          ]);

        const ordersData = ordersResponse.data;
        const notifications = notificationsResponse.data;
        let vehiclesData = vehiclesResponse.data;

        let orders = [];
        if (
          ordersData &&
          typeof ordersData === "object" &&
          Array.isArray(ordersData.orders)
        ) {
          orders = ordersData.orders;
        } else {
          console.error(
            "[AdminDashboard] Respuesta inválida de /api/orders, se esperaba un objeto con orders:",
            ordersData
          );
          toast.error("Respuesta inválida al cargar órdenes");
        }

        // Normalizar vehiclesData
        let vehicles = [];
        let totalVehicles = 0;
        if (vehiclesData && typeof vehiclesData === "object") {
          vehicles = Array.isArray(vehiclesData.vehicles)
            ? vehiclesData.vehicles
            : [];
          totalVehicles = vehiclesData.total || vehicles.length;
        } else {
          console.warn(
            "[AdminDashboard] vehiclesData no es válido, usando valores por defecto"
          );
        }

        // Calcular estadísticas de vehículos
        const uniqueBranches = [
          ...new Set(vehicles.map((vehicle) => vehicle.branch)),
        ];

        // Calcular estadísticas de órdenes
        setStats({
          activeOrdersCount: orders.filter((o) => o.status === "En Proceso")
            .length,
          pendingOrdersCount: orders.filter((o) => o.status === "Pendiente")
            .length,
          closedOrdersCount: orders.filter((o) => o.status === "Finalizado")
            .length,
          notificationsCount: notifications.length,
          branchesCount: uniqueBranches.length,
          vehiclesCount: totalVehicles,
        });
      } catch (error) {
        console.error("[AdminDashboard] Error al cargar datos:", error);
        toast.error(error.message || "Error al cargar estadísticas");
        setStats({
          activeOrdersCount: 0,
          pendingOrdersCount: 0,
          closedOrdersCount: 0,
          notificationsCount: 0,
          branchesCount: 0,
          vehiclesCount: 0,
        });
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
      title: "Vehiculos",
      content: `Sedes: ${stats.branchesCount} | Vehículos: ${stats.vehiclesCount}`,
      buttonText: "Ver Vehiculos",
      onClick: () => navigate("/admin/vehicles"),
    },
    {
      title: "Mensajes",
      content: `${stats.notificationsCount} mensajes pendientes`,
      buttonText: "Ver Notificaciones",
      onClick: () => navigate("/admin/notifications"),
    },
    {
      title: "Usuarios",
      content: "Gestión de cuentas de usuarios",
      buttonText: "Ver Usuarios",
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Informes",
      content: "Crear y revisar informes del sistema",
      buttonText: "Ver Informes",
      onClick: () => navigate("/admin/reports"),
    },
  ];

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Panel Administrador" />
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
