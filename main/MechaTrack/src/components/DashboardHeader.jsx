import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import styled from "@emotion/styled";
import { useAuth } from "../context/AuthContext";
import { getOrders, getNotifications } from "../services/orderService";
import logo from "../assets/images/logo.jpeg";

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
`;

const DashboardHeader = ({ title }) => {
  const { user } = useAuth();
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const ordersData = await getOrders({ id: user.id });
        const notificationsData = await getNotifications(user.id);
        const activeOrders = ordersData.orders.filter((order) =>
          ["En Proceso", "Pendiente"].includes(order.status)
        );
        setActiveOrdersCount(activeOrders.length);
        setNotificationsCount(notificationsData.length);
      } catch (err) {
        console.error("Error al cargar contadores:", err);
        toast.error(err.message || "Error al cargar contadores");
      }
    };
    if (user?.id) {
      fetchCounts();
    }
  }, [user]);

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
          <span>
            {user?.role !== "secretary" && user?.role !== "client" && (
              <>Órdenes Activas: {activeOrdersCount} | </>
            )}
            <Badge bg="danger">{notificationsCount} Notificaciones</Badge>
          </span>
        </UserInfo>
      </Container>
    </HeaderContainer>
  );
};

export default DashboardHeader;
