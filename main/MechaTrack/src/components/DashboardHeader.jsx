import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import styled from "@emotion/styled";
import logo from "../assets/images/logo.jpeg";

const HeaderContainer = styled(Navbar)`
  background-color: #343a40;
  padding: 10px 20px;
`;

const Logo = styled.img`
  height: 50px;
  width: 50px; /* Aseguramos que el ancho y alto sean iguales para un círculo perfecto */
  border-radius: 50%; /* Hace que el logo sea circular */
  margin-right: 15px;
  object-fit: contain; /* Asegura que el logo se ajuste bien dentro del círculo */
  background-color: white; /* Fondo blanco para mejor contraste con el header oscuro */
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
  return (
    <HeaderContainer expand="lg">
      <Container fluid>
        <Nav className="me-auto">
          <Logo src={logo} alt="MASIM Taller Mecánico" />
          <Title>{title}</Title>
        </Nav>
        <UserInfo>
          <span>ID: {userId} | </span>
          <span>Usuario: {userName} | </span>
          <span>
            Órdenes Activas: {activeOrdersCount} |{" "}
            <Badge bg="danger">{notificationsCount} Notificaciones</Badge>
          </span>
        </UserInfo>
      </Container>
    </HeaderContainer>
  );
};

export default DashboardHeader;
