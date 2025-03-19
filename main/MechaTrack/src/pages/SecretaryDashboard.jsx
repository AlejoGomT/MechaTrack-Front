import { Container } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';

const secretaryMenu = [
  { label: 'Inicio', path: '/secretary' },
  { label: 'Facturación', path: '/secretary/billing' },
  { label: 'Historial de Facturaciones', path: '/secretary/history' },
  { label: 'Cerrar Sesión', path: '/' },
];

const SecretaryDashboard = () => {
  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Panel Secretaría"
          subtitle="Gestión de facturación y órdenes"
        />
        <Container className="mt-4">
          <p>Contenido del dashboard de secretaría (personalizable).</p>
        </Container>
      </div>
    </>
  );
};

export default SecretaryDashboard;