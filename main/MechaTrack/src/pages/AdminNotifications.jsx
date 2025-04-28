import { useState, useEffect } from "react";
import { Container, Table, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "react-toastify";

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminNotifications = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
          params: { to_user_id: user.id, status: "Pendiente" },
        });
        setNotifications(response.data);
      } catch (error) {
        toast.error("Error al cargar notificaciones");
        console.error(
          "[AdminNotifications] Error al cargar notificaciones:",
          error
        );
      }
    };
    if (token) fetchNotifications();
  }, [token, user.id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(
        `/api/notifications/${notificationId}`,
        { status: "Leída" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notificación marcada como leída");
    } catch (error) {
      toast.error("Error al marcar notificación");
      console.error(
        "[AdminNotifications] Error al marcar notificación:",
        error
      );
    }
  };

  const userData = {
    userId: user?.id,
    userName: `${user?.first_name} ${user?.last_name}`,
    activeOrdersCount: 0,
    notificationsCount: notifications.length,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Notificaciones" {...userData} />
        <Container className="mt-4">
          {notifications.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th>Tipo</th>
                  <th>Orden</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.message}</td>
                    <td>
                      {notification.type === "order_approval"
                        ? "Aprobación de Orden"
                        : notification.type === "part_request"
                        ? "Solicitud de Repuesto"
                        : "Rechazo de Orden"}
                    </td>
                    <td>
                      {notification.order_id ? (
                        <Button
                          variant="link"
                          onClick={() =>
                            navigate(
                              `/admin/orders?orderNumber=${notification.order_id}`
                            )
                          }
                        >
                          #{notification.order_id}
                        </Button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {new Date(notification.created_at).toLocaleDateString(
                        "es-ES"
                      )}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Marcar como Leída
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No hay notificaciones pendientes.</p>
          )}
        </Container>
      </div>
    </>
  );
};

export default AdminNotifications;
