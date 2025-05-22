import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import styled from "@emotion/styled";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getOrderCounts } from "../services/orderService";
import { getNotifications } from "../services/notificationService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import logo from "../assets/images/logo.jpeg";

library.add(faBell);

const HeaderContainer = styled(Navbar)`
  background-color: rgb(18, 41, 48);
  padding: 10px 20px;
  border-radius: 10px;
`;

const Logo = styled.img`
  height: 50px;
  width: 50px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: contain;
  background-color: white;
`;

const Title = styled.h1`
  color: white;
  font-size: 1.5rem;
  margin: 0;
  display: inline-block;
`;

const UserInfo = styled.div`
  color: white;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NotificationContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const NotificationBadge = styled(Badge)`
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 0.7rem;
  padding: 3px 6px;
`;

const DashboardHeader = ({ title }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [countsData, notificationsData] = await Promise.all([
          getOrderCounts({ id: user.id }),
          getNotifications(user.id),
        ]);
        const activeOrders =
          (countsData.inProcess || 0) + (countsData.pending || 0);
        const relevantNotifications = notificationsData.filter(
          (notification) => notification.type !== "order_creation"
        );
        setActiveOrdersCount(activeOrders);
        setNotificationsCount(relevantNotifications.length);
      } catch (err) {
        console.error("[DashboardHeader] Error al cargar contadores:", err);
        toast.error(err.message || "Error al cargar contadores");
        setActiveOrdersCount(0);
        setNotificationsCount(0);
      }
    };

    if (user?.id) {
      fetchCounts();
    }
  }, [user]);

  useEffect(() => {
    if (!isConnected || !socket || !user?.id) return;

    const handleNewNotification = (notification) => {
      if (
        notification.user_id === user.id &&
        notification.type !== "order_creation"
      ) {
        setNotificationsCount((prev) => prev + 1);
        console.log(
          "[DashboardHeader] Nueva notificación recibida:",
          notification
        );
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, isConnected, user]);

  const handleNotificationClick = () => {
    window.location.href = "../admin/notifications";
  };

  return (
    <HeaderContainer expand="lg">
      <Container fluid>
        <Nav className="me-auto">
          <Logo src={logo} alt="MASIM Taller Mecánico" />
          <Title>{title}</Title>
        </Nav>
        <UserInfo>
          <span>ID: {user?.id || "N/A"} | </span>
          <span>
            Usuario: {user ? `${user.first_name} ${user.last_name}` : "Usuario"}{" "}
            |{" "}
          </span>
          {user?.role !== "secretary" && user?.role !== "client" && (
            <span>Órdenes Activas: {activeOrdersCount} | </span>
          )}
          <NotificationContainer onClick={handleNotificationClick}>
            <FontAwesomeIcon
              icon={faBell}
              style={{ color: "white", fontSize: "1.2rem" }}
            />
            {notificationsCount > 0 && (
              <NotificationBadge bg="danger">
                {notificationsCount}
              </NotificationBadge>
            )}
          </NotificationContainer>
        </UserInfo>
      </Container>
    </HeaderContainer>
  );
};

export default DashboardHeader;
