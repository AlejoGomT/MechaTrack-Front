import { Container, Table, Form } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import CustomButton from '../components/CustomButton';

const secretaryMenu = [
  { label: 'Inicio', path: '/secretary' },
  { label: 'Facturación', path: '/secretary/billing' },
  { label: 'Historial de Facturaciones', path: '/secretary/history' },
  { label: 'Cerrar Sesión', path: '/' },
];

const SecretaryBilling = () => {
  return (
    <>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Facturación"
          subtitle="Listado de órdenes listas para facturación"
        />
        <Container className="mt-4">
          <div className="d-flex justify-content-between mb-3">
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Buscar Orden:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Número de Orden o Sucursal"
                style={{ width: '200px' }}
              />
            </Form.Group>
            <CustomButton>Filtrar</CustomButton>
          </div>
          <Table striped bordered hover className="factura-table">
            <thead>
              <tr>
                <th>Número de Orden</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OS-001</td>
                <td>Juan Pérez</td>
                <td>$3,500</td>
                <td>Pendiente</td>
                <td>
                  <CustomButton>Registrar Factura</CustomButton>
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

export default SecretaryBilling;