// components/DashboardHeader.jsx
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import styled from "@emotion/styled";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/images/logo.jpeg";

const HeaderContainer = styled(Navbar)`
  background-color: #343a40;
  padding: 10px 20px;
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

const DashboardHeader = ({
  title,
  userId,
  userName,
  activeOrdersCount,
  notificationsCount,
}) => {
  const { user } = useAuth();

  // Usar valores de las props si existen, de lo contrario usar el contexto o valores por defecto
  const displayUserId = userId !== undefined ? userId : user?.id || "N/A";
  const displayUserName =
    userName !== undefined ? userName : user?.name || "Usuario";
  const displayActiveOrders =
    activeOrdersCount !== undefined ? activeOrdersCount : 0;
  const displayNotifications =
    notificationsCount !== undefined ? notificationsCount : 0;

  return (
    <HeaderContainer expand="lg">
      <Container fluid>
        <Nav className="me-auto">
          <Logo src={logo} alt="MASIM Taller Mecánico" />
          <Title>{title}</Title>
        </Nav>
        <UserInfo>
          <span>ID: {displayUserId} | </span>
          <span>Usuario: {displayUserName} | </span>
          <span>
            Órdenes Activas: {displayActiveOrders} |{" "}
            <Badge bg="danger">{displayNotifications} Notificaciones</Badge>
          </span>
        </UserInfo>
      </Container>
    </HeaderContainer>
  );
};

export default DashboardHeader;
