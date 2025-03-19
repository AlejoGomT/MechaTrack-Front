import { Container, Table } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import CustomButton from '../components/CustomButton';

const secretaryMenu = [
  { label: 'Inicio', path: '/secretary' },
  { label: 'Facturación', path: '/secretary/billing' },
  { label: 'Historial de Facturaciones', path: '/secretary/history' },
  { label: 'Cerrar Sesión', path: '/' },
];

const SecretaryHistory = () => {
  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Historial de Facturaciones"
          subtitle="Órdenes completadas con factura y pedido de albarán"
        />
        <Container className="mt-4">
          <Table striped bordered hover className="facturacion-table">
            <thead>
              <tr>
                <th>Número de Orden</th>
                <th>Número de Factura</th>
                <th>Número de Pedido de Albarán</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OS-1023</td>
                <td>F-78945</td>
                <td>PA-45678</td>
                <td>05/03/2025</td>
                <td>
                  <CustomButton>Descargar</CustomButton>
                </td>
              </tr>
              {/* Más filas según necesites */}
            </tbody>
          </Table>
        </Container>
      </div>
    </>
  );
};

export default SecretaryHistory;