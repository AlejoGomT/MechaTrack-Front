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

const AdminReports = () => {
  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader
          title="Generación de Informes"
          subtitle="Descarga informes semanales sobre órdenes de servicio y repuestos utilizados"
        />
        <Container className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex">
              <Form.Group className="d-flex align-items-center me-3">
                <Form.Label className="me-2">Fecha Inicio:</Form.Label>
                <Form.Control type="date" style={{ width: '200px' }} />
              </Form.Group>
              <Form.Group className="d-flex align-items-center">
                <Form.Label className="me-2">Fecha Fin:</Form.Label>
                <Form.Control type="date" style={{ width: '200px' }} />
              </Form.Group>
            </div>
            <CustomButton>Generar Informe</CustomButton>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Sucursal</th>
                <th>Órdenes Completadas</th>
                <th>Repuestos Utilizados</th>
                <th>Descargar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>01/03/2025 - 07/03/2025</td>
                <td>Monterrey</td>
                <td>15</td>
                <td>30</td>
                <td>
                  <CustomButton>PDF</CustomButton>{' '}
                  <CustomButton>Excel</CustomButton>
                </td>
              </tr>
            </tbody>
          </Table>
        </Container>
      </div>
    </>
  );
};

export default AdminReports;