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

const AdminParts = () => {
  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Gestión de Repuestos"
          subtitle="Administrar repuestos disponibles para el servicio técnico"
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
          <Table striped bordered hover className="repuestos-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Orden de Servicio</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>RP-001</td>
                <td>Filtro de Aire</td>
                <td>#OS-1023</td>
                <td>
                  <Form.Control type="number" defaultValue="200" style={{ width: '100px' }} />
                </td>
                <td>
                  <CustomButton>Actualizar Precio</CustomButton>
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

export default AdminParts;