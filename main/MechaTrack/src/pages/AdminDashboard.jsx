import { Container, Row } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import StatCard from '../components/StatCard';

const adminMenu = [
  { label: 'Inicio', path: '/admin' },
  { label: 'Órdenes de Servicio', path: '/admin/orders' },
  { label: 'Inventario', path: '/admin/inventory' },
  { label: 'Gestión de Repuestos', path: '/admin/parts' },
  { label: 'Precios', path: '/admin/prices' },
  { label: 'Informes', path: '/admin/reports' },
  { label: 'Cerrar Sesión', path: '/' },
];

const AdminDashboard = () => {
  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Panel Administrador"
          subtitle="Órdenes Pendientes | Órdenes Finalizadas | Repuestos Pendientes | Sucursal"
        />
        <Container className="mt-4">
          <Row className="justify-content-between">
            <StatCard
              title="Órdenes Pendientes"
              content="Detalles sobre órdenes pendientes"
              buttonText="Ver Órdenes"
            />
            <StatCard
              title="Órdenes Finalizadas"
              content="Detalles sobre órdenes finalizadas"
              buttonText="Ver Órdenes"
            />
          </Row>
          <Row className="justify-content-between mt-4">
            <StatCard
              title="Repuestos Pendientes"
              content="Detalles sobre repuestos pendientes de aprobación"
              buttonText="Ver Repuestos"
            />
            <StatCard
              title="Inventario"
              content="Detalles del inventario disponible"
              buttonText="Ver Inventario"
            />
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;