import { Container, Table, Form } from 'react-bootstrap';
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

const AdminPrices = () => {
  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Gestión de Precios"
          subtitle="Administrar los precios de la mano de obra y repuestos"
        />
        <Container className="mt-4">
          <div className="d-flex justify-content-between mb-3">
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Buscar:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Trabajo o Repuesto"
                style={{ width: '200px' }}
              />
            </Form.Group>
            <CustomButton>Agregar Precio</CustomButton>
          </div>
          <Table striped bordered hover className="price-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cambio de aceite</td>
                <td>Mano de Obra</td>
                <td>$500</td>
                <td>
                  <CustomButton>Actualizar</CustomButton>{' '}
                  <CustomButton>Eliminar</CustomButton>
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

export default AdminPrices;