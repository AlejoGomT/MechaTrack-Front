import { Container, Table, Form, Button } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import CustomButton from '../components/CustomButton';

const adminMenu = [
  { label: 'Inicio', path: '/admin' },
  { label: 'Órdenes de Servicio', path: '/admin/orders' },
  { label: 'Inventario', path: '/admin/inventory' },
  { label: 'Gestión de Repuestos', path: '/admin/parts' },
  { label: 'Precios', path: '/admin/prices' },
  { label: 'Informes', path: '/admin/reports' },
  { label: 'Cerrar Sesión', path: '/' },
];

const AdminOrders = () => {
  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Órdenes de Servicio"
          subtitle="Gestión de órdenes de servicio en proceso"
        />
        <Container className="mt-4">
          <div className="d-flex justify-content-between mb-3">
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Filtrar por estado:</Form.Label>
              <Form.Select style={{ width: '200px' }}>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="finalizada">Finalizada</option>
                <option value="repuesto">Repuesto Pendiente</option>
              </Form.Select>
            </Form.Group>
            <CustomButton>Nueva Orden</CustomButton>
          </div>
          <Table striped bordered hover className="order-table">
            <thead>
              <tr>
                <th>Número de Orden</th>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>001</td>
                <td>ABC-123</td>
                <td>Toyota Corolla</td>
                <td>En Proceso</td>
                <td>
                  <CustomButton>Ver Detalles</CustomButton>{' '}
                  <CustomButton>Aprobar Repuestos</CustomButton>
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

export default AdminOrders;