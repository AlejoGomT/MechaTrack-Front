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

const AdminInventory = () => {
  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Inventario"
          subtitle="Gestión de repuestos e inventario disponible"
        />
        <Container className="mt-4">
          <div className="d-flex justify-content-between mb-3">
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Buscar Repuesto:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nombre o Código"
                style={{ width: '200px' }}
              />
            </Form.Group>
            <CustomButton>Agregar Repuesto</CustomButton>
          </div>
          <Table striped bordered hover className="inventory-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>RP-001</td>
                <td>Filtro de Aire</td>
                <td>50</td>
                <td>$200</td>
                <td>
                  <CustomButton>Ver Detalles</CustomButton>{' '}
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

export default AdminInventory;