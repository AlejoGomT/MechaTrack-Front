import { useState } from "react";
import { Container, Table, Button, Modal, Form } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import { mockClientOrders, mockVehicles } from "../data/mock";

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas Vehículo", path: "/client/query" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filtrar vehículos que tienen historial finalizado y orden pendiente
  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const hasFinalizedHistory = vehicle.history.some(
      (item) => item.status === "Finalizado"
    );
    const hasActiveOrder = mockClientOrders.some(
      (order) =>
        order.economicNumber === vehicle.Económico &&
        order.status === "En Proceso"
    );
    return hasFinalizedHistory && hasActiveOrder;
  });

  // Filtrar por búsqueda y estado
  const filteredResults = filteredVehicles.filter((vehicle) => {
    const activeOrder = mockClientOrders.find(
      (order) =>
        order.economicNumber === vehicle.Económico &&
        order.status === "En Proceso"
    );
    const matchesSearch = vehicle.Económico.toString()
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      !statusFilter || (activeOrder && activeOrder.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleShowModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <Sidebar menuItems={clientMenu} title="Consulta de Cliente" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader
          title="Consulta de Estado del Vehículo"
          subtitle="Verificar el estado y el historial de órdenes de servicio"
        />
        <Container className="mt-4">
          {/* Filtros */}
          <div className="d-flex justify-content-between mb-3">
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Buscar por Económico:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese Económico"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "200px" }}
              />
            </Form.Group>
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2">Filtrar por Estado:</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">Todos</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Finalizado">Finalizado</option>
              </Form.Select>
            </Form.Group>
          </div>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Número de Orden</th>
                <th>Número Económico</th>
                <th>Estado</th>
                <th>Fecha de Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((vehicle) => {
                  const activeOrder = mockClientOrders.find(
                    (order) =>
                      order.economicNumber === vehicle.Económico &&
                      order.status === "En Proceso"
                  );
                  return (
                    <tr key={vehicle.Económico}>
                      <td>
                        {activeOrder
                          ? activeOrder.orderNumber
                          : "Sin orden activa"}
                      </td>
                      <td>
                        <CustomButton onClick={() => handleShowModal(vehicle)}>
                          {vehicle.Económico}
                        </CustomButton>
                      </td>
                      <td>
                        {activeOrder ? activeOrder.status : "Sin actividad"}
                      </td>
                      <td>{activeOrder ? activeOrder.entryDate : "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    No hay vehículos que cumplan los criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Container>

        {/* Modal para Historial */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Historial del Vehículo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedVehicle && (
              <>
                <p>
                  <strong>Estado Actual:</strong>{" "}
                  {selectedVehicle.activeOrder
                    ? "En Proceso"
                    : "Sin orden activa"}
                </p>
                <h6>Historial de Órdenes de Servicio:</h6>
                <ul>
                  {selectedVehicle.history.map((item, index) => (
                    <li key={index}>
                      Orden {item.orderNumber} - {item.description} -{" "}
                      {item.date} ({item.status}){" "}
                      <CustomButton>Ver Orden</CustomButton>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default ClientDashboard;
