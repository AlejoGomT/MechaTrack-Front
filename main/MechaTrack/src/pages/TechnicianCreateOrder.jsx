import { Container, Form, Row, Col, Button } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import CustomButton from '../components/CustomButton';

const technicianMenu = [
  { label: 'Crear Orden de Servicio', path: '/technician/create-order' },
  { label: 'Historial de Órdenes', path: '/technician' },
  { label: 'Buscar Orden', path: '/technician/search' },
  { label: 'Cerrar Sesión', path: '/' },
];

const TechnicianCreateOrder = () => {
  return (
    <>
      <Sidebar menuItems={technicianMenu} title="Menú" />
      <div className="content" style={{ marginLeft: '270px', padding: '20px' }}>
        <DashboardHeader title="Crear Orden de Servicio" />
        <Container className="mt-4 form-container p-4 bg-white rounded shadow">
          <h4 className="form-header">Datos del Vehículo y Cliente</h4>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Orden</Form.Label>
                  <Form.Control type="text" placeholder="Número de Orden" disabled />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Placa del Vehículo</Form.Label>
                  <Form.Control type="text" placeholder="Placa del Vehículo" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca y Modelo</Form.Label>
                  <Form.Control type="text" placeholder="Marca y Modelo del Vehículo" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Año del Vehículo</Form.Label>
                  <Form.Control type="number" placeholder="Año de Fabricación" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kilometraje</Form.Label>
                  <Form.Control type="number" placeholder="Kilometraje Actual" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Serie (VIN)</Form.Label>
                  <Form.Control type="text" placeholder="Número de Serie del Vehículo" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>N° Económico</Form.Label>
                  <Form.Control type="text" placeholder="Número interno del vehículo" />
                </Form.Group>
              </Col>
            </Row>

            <h4 className="form-header mt-4">Descripción del Servicio</h4>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Servicio</Form.Label>
              <Form.Select>
                <option>Reparación</option>
                <option>Mantenimiento</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción del Servicio</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Detalles del servicio solicitado"
              />
            </Form.Group>

            <h4 className="form-header mt-4">Diagnóstico y Tareas</h4>
            <Form.Group className="mb-3">
              <Form.Label>Diagnóstico Inicial</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Observaciones del mecánico"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tareas a Realizar</Form.Label>
              <Form.Control as="textarea" rows={4} placeholder="Listado de tareas" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Repuestos Necesarios</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Lista de repuestos necesarios"
              />
            </Form.Group>

            <h4 className="form-header mt-4">Fotos de Evidencia</h4>
            <Form.Group className="mb-3">
              <Form.Label>Subir Fotos</Form.Label>
              <Form.Control type="file" multiple />
              <Form.Text className="text-muted">
                Puedes subir varias fotos relacionadas con la orden de servicio.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Autorizo la reparación/servicio"
                id="authorization"
              />
            </Form.Group>

            <div className="text-center">
              <CustomButton type="submit">Crear Orden</CustomButton>{' '}
              <CustomButton type="reset">Cancelar</CustomButton>
            </div>
          </Form>
        </Container>
      </div>
    </>
  );
};

export default TechnicianCreateOrder;