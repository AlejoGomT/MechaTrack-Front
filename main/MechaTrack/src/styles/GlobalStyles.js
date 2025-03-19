import styled from '@emotion/styled';
import { Container, Row, Col, Form, Button, Alert, Carousel, Card, Nav, Modal, Table } from 'react-bootstrap';

// Exportamos colors para que pueda ser usado en otros archivos
export const colors = {
  primary: '#d74a49',
  primaryHover: '#ff6b6b',
  backgroundDark: '#1b4552',
  backgroundLight: '#183e4b',
  backgroundNavDefault: '#1c2526',
  inputBg: '#2a5e6e',
  inputBgFocus: '#3a7a8e',
  overlayDark: 'rgba(0, 0, 0, 0.3)',
  overlayCarousel: 'rgba(0, 0, 0, 0.4)',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
};

// --- Estilos específicos para Login ---
export const LoginWrapper = styled.div`
  background: url(${props => props.background}) no-repeat center center fixed;
  background-size: cover;
  height: 100vh;
  position: relative;
  overflow: hidden;
`;

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${colors.overlayDark};
  z-index: 0;
`;

export const LoginCol = styled(Col)`
  background: ${colors.backgroundDark};
  height: 80vh;
  border-radius: 0 15px 15px 0;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5);
  z-index: 1;
  transition: transform 0.3s ease;
  transform: translateX(0);
  &:hover {
    transform: translateX(-5px);
  }
`;

export const CarouselCol = styled(Col)`
  height: 80vh;
  border-radius: 15px 0 0 15px;
  background: ${colors.backgroundLight};
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StyledCarousel = styled(Carousel)`
  width: 100%;
`;

export const CarouselItemDiv = styled.div`
  background: url(${props => props.image}) no-repeat center center;
  background-size: cover;
  height: 60vh;
  border-radius: 15px;
  position: relative;
  transition: opacity 0.5s ease;
`;

export const OverlayText = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${colors.overlayCarousel};
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FormInput = styled(Form.Control)`
  background: ${colors.inputBg};
  border: none;
  color: white;
  transition: background 0.3s;
  &:focus {
    background: ${colors.inputBgFocus};
  }
  &:blur {
    background: ${colors.inputBg};
  }
`;

export const StyledButton = styled(Button)`
  background-color: ${colors.primary};
  border: none;
  padding: 10px;
  font-size: 1.1rem;
  transition: background-color 0.3s, transform 0.3s;
  &:hover {
    background-color: ${colors.primaryHover};
    transform: scale(1.05);
  }
  &:active {
    background-color: ${colors.primary};
    transform: scale(1);
  }
`;

// --- Estilos comunes para las otras páginas (/admin, /technician, /secretary, /client) ---

export const MainContainer = styled(Container)`
  padding: 0;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  width: 100%;
  height: 100%;
  margin: 0;
`;

export const StyledNav = styled.nav`
  background-color: ${colors.backgroundDark};
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

export const NavLink = styled.a`
  color: white;
  font-family: 'Arial, sans-serif';
  font-weight: bold;
  text-decoration: none;
  margin: 0 15px;
  transition: color 0.3s;
  &:hover {
    color: ${colors.primaryHover};
  }
`;

export const ContentWrapper = styled.div`
  margin-top: 20px;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex: 1;
`;

export const SectionTitle = styled.h2`
  font-family: 'Arial, sans-serif';
  font-weight: bold;
  color: ${colors.backgroundDark};
  margin-bottom: 20px;
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  th,
  td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
  }
  th {
    background-color: ${colors.backgroundLight};
    color: white;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  tr:hover {
    background-color: #f1f1f1;
  }
`;

export const ActionButton = styled(Button)`
  background-color: ${colors.primary};
  border: none;
  padding: 8px 16px;
  transition: background-color 0.3s;
  &:hover {
    background-color: ${colors.primaryHover};
  }
`;

// --- Estilos para TechnicianDashboard ---

export const Sidebar = styled.aside`
  width: 250px;
  background-color: ${colors.backgroundDark};
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  padding: 1rem;
  color: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  transition: transform 0.3s ease-in-out;
  @media (max-width: 768px) {
    transform: translateX(-100%);
    &.open {
      transform: translateX(0);
    }
  }
`;

export const SidebarTitle = styled.h3`
  font-family: 'Arial, sans-serif';
  font-weight: bold;
  margin-bottom: 20px;
`;

export const SidebarNav = styled(Nav)`
  &.flex-column {
    .nav-link {
      color: white !important;
      text-decoration: none;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-radius: 0.25rem;
      background-color: ${colors.backgroundNavDefault};
      transition: background-color 0.3s;
      &.active {
        background-color: ${colors.primary} !important;
      }
      &:hover {
        background-color: ${colors.primaryHover};
      }
    }
  }
`;

export const DashboardHeader = styled.div`
  background-color: ${colors.primary};
  padding: 1rem;
  border-radius: 0.25rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  h2 {
    font-family: 'Arial, sans-serif';
    font-weight: bold;
    margin: 0;
    font-size: 1.5rem;
  }
  .user-info {
    font-family: 'Arial, sans-serif';
    font-size: 0.9rem;
    text-align: right;
  }
  .links {
    display: flex;
    gap: 1rem;
    a {
      color: white;
      text-decoration: none;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: color 0.3s;
      &:hover {
        color: ${colors.primaryHover};
      }
      &.bell::before {
        content: '🔔'; // Icono de campana (puedes reemplazar con un ícono de biblioteca como FontAwesome)
        font-size: 1rem;
      }
    }
  }
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    text-align: center;
    .user-info, .links {
      margin-top: 0.5rem;
    }
  }
`;

export const OrderCard = styled(Card)`
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  .card-title {
    font-family: 'Arial, sans-serif';
    font-weight: bold;
    color: ${colors.backgroundDark};
    margin: 0 0 10px;
  }
  .card-text {
    color: #6c757d;
  }
`;

export const CustomButton = styled(Button)`
  background-color: ${colors.backgroundLight};
  border: none;
  padding: 8px 16px;
  font-size: 1rem;
  transition: background-color 0.3s, transform 0.3s;
  &:hover {
    background-color: ${colors.primaryHover};
    transform: scale(1.05);
  }
  &:active {
    background-color: ${colors.backgroundLight};
    transform: scale(1);
  }
`;

export const StatCard = styled(Card)`
  width: 48%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  .card-title {
    font-family: 'Arial, sans-serif';
    font-weight: bold;
    color: ${colors.backgroundDark};
    margin: 0 0 10px;
  }
  .card-text {
    color: #6c757d;
  }
  .btn-view {
    background-color: ${colors.backgroundLight};
    border: none;
    padding: 8px 16px;
    font-size: 1rem;
    transition: background-color 0.3s;
    &:hover {
      background-color: ${colors.primaryHover};
    }
  }
  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 1rem;
  }
`;

export const Content = styled.div`
  flex: 1;
  margin-left: 250px;
  padding: 20px;
  min-height: 100vh;
  transition: margin-left 0.3s ease-in-out;
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 10px;
  }
`;

export const ContentBtn = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  h3 {
    font-family: 'Arial, sans-serif';
    font-weight: bold;
    color: ${colors.backgroundDark};
  }
`;

// --- Nuevos estilos para TechnicianDashboard ---

export const MobileToggleButton = styled(Button)`
  display: none;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1002;
  background-color: ${colors.primary};
  border: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

export const StyledModal = styled(Modal)`
  .modal-dialog {
    max-width: 900px; /* Equivalente a size="lg", ajustable */
  }
`;

export const ModalBody = styled(Modal.Body)`
  max-height: 60vh;
  overflow-y: auto;
  padding: 1rem;
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
`;

export const StyledTableModal = styled(Table)`
  th, td {
    vertical-align: middle;
  }
  th:nth-type(1), td:nth-type(1) { /* Núm. Económico */
    min-width: 100px;
  }
  th:nth-type(2), td:nth-type(2) { /* Orden */
    min-width: 100px;
  }
  th:nth-type(3), td:nth-type(3) { /* Fecha Ingreso */
    min-width: 120px;
  }
  th:nth-type(4), td:nth-type(4) { /* Diagnóstico */
    min-width: 200px;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  th:nth-type(5), td:nth-type(5) { /* Notificación */
    min-width: 80px;
    text-align: center;
  }
  th:nth-type(6), td:nth-type(6) { /* Acción */
    min-width: 80px;
    text-align: center;
  }
  td:nth-type(4) { /* Tooltip para Diagnóstico */
    cursor: pointer;
  }
`;
