import { useState } from "react";
import {
  Container,
  Table,
  Form,
  Modal,
  Alert,
  Button,
  Row,
  Col,
  FormControl,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import TechnicianCreateOrder from "./TechnicianCreateOrder";
import { mockClientOrders, mockVehicles } from "../data/mock";
import { StyledModal, ModalBody } from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const adminMenu = [
  { label: "Inicio", path: "/admin" },
  { label: "Órdenes de Servicio", path: "/admin/orders" },
  { label: "Inventario", path: "/admin/inventory" },
  { label: "Gestión de Usuarios", path: "/admin/users" },
  { label: "Notificaciones", path: "/admin/notifications" },
  { label: "Informes", path: "/admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const StatusIcon = styled.span`
  margin-right: 5px;
  color: ${({ status }) => {
    switch (status) {
      case "Finalizado":
        return "#28a745"; // Verde
      case "En Proceso":
        return "#fd7e14"; // Naranja
      case "Pendiente":
        return "#ffc107"; // Amarillo
      case "Pendiente de Facturación":
        return "#17a2b8"; // Cyan
      default:
        return "#6c757d"; // Gris
    }
  }};
`;

const HistorySidebar = styled.div`
  width: 300px;
  background-color: #f8f9fa;
  padding: 15px;
  border-right: 1px solid #dee2e6;
  height: 100%;
  overflow-y: auto;
`;

const HistoryItem = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HistoryTitle = styled.h6`
  margin: 0;
  font-size: 0.9rem;
  color: #343a40;
`;

const HistoryDate = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6c757d;
`;

const ActionSection = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f1f3f5;
  border-radius: 5px;
`;

const AdminOrders = () => {
  const { user } = useAuth();
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [editedParts, setEditedParts] = useState([]);

  const branches = [...new Set(mockVehicles.map((v) => v.Sucursal))];
  const activeOrdersCount = mockClientOrders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = mockClientOrders.filter(
    (o) => o.notifications?.length > 0
  ).length;

  const filteredOrders = mockClientOrders.filter((order) => {
    const vehicle = mockVehicles.find(
      (v) => v.Económico === order.vehicleEconomicNumber
    );
    return (
      (!branchFilter || vehicle?.Sucursal === branchFilter) &&
      (!statusFilter || order.status === statusFilter) &&
      (!economicNumberFilter ||
        order.vehicleEconomicNumber.includes(economicNumberFilter)) &&
      (!orderNumberFilter || order.id.includes(orderNumberFilter))
    );
  });

  const handleViewDetails = (order) => {
    const vehicle = mockVehicles.find(
      (v) => v.Económico === order.vehicleEconomicNumber
    );
    const enrichedOrder = {
      ...order,
      branch: vehicle?.Sucursal || "",
      vehicleEconomicNumber: vehicle?.Económico || order.vehicleEconomicNumber,
      kilometraje: vehicle?.Kilometraje || order.kilometraje || "",
      vin: vehicle?.VIN || order.vin || "",
    };
    setSelectedOrder(enrichedOrder);
    setEditedParts(enrichedOrder.parts || []);
    setShowModal(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePartAction = (partIndex, action) => {
    const updatedOrder = { ...selectedOrder };
    const part = updatedOrder.parts[partIndex];
    if (action === "accept") {
      part.status = "Aprobado";
      part.authorizedBy = user.id;
      toast.success(`Repuesto ${part.name} aprobado`);
    } else if (action === "reject" && rejectionNote) {
      part.status = "Rechazado";
      part.authorizedBy = user.id;
      updatedOrder.notifications = updatedOrder.notifications || [];
      updatedOrder.notifications.push({
        message: `Repuesto ${part.name} rechazado: ${rejectionNote}`,
        to: selectedOrder.technicianId,
        status: "Pendiente",
        date: new Date().toISOString().split("T")[0],
      });
      toast.error(`Repuesto ${part.name} rechazado`);
      setRejectionNote("");
    }
    const orderIndex = mockClientOrders.findIndex(
      (o) => o.id === updatedOrder.id
    );
    mockClientOrders[orderIndex] = updatedOrder;
    setSelectedOrder(updatedOrder);
  };

  const handleFinalizeAction = (action) => {
    const updatedOrder = { ...selectedOrder };
    if (action === "accept") {
      updatedOrder.status = "Pendiente de Facturación";
      updatedOrder.history.push({
        description: "Finalización aprobada por administrador",
        date: new Date().toISOString().split("T")[0],
        status: "Pendiente de Facturación",
      });
      toast.success(`Orden #${updatedOrder.id} aprobada para facturación`);
    } else if (action === "reject" && rejectionNote) {
      updatedOrder.status = "En Proceso";
      updatedOrder.notifications = updatedOrder.notifications || [];
      updatedOrder.notifications.push({
        message: `Finalización rechazada: ${rejectionNote}`,
        to: updatedOrder.technicianId,
        status: "Pendiente",
        date: new Date().toISOString().split("T")[0],
      });
      updatedOrder.history.push({
        description: `Finalización rechazada: ${rejectionNote}`,
        date: new Date().toISOString().split("T")[0],
        status: "En Proceso",
      });
      toast.error(`Orden #${updatedOrder.id} rechazada`);
      setRejectionNote("");
    }
    const orderIndex = mockClientOrders.findIndex(
      (o) => o.id === updatedOrder.id
    );
    mockClientOrders[orderIndex] = updatedOrder;
    setSelectedOrder(updatedOrder);
  };

  const handlePartEdit = (index, field, value) => {
    const updatedParts = [...editedParts];
    updatedParts[index][field] = field === "quantity" ? Number(value) : value;
    setEditedParts(updatedParts);
  };

  const saveEditedParts = () => {
    const updatedOrder = { ...selectedOrder, parts: editedParts };
    const orderIndex = mockClientOrders.findIndex(
      (o) => o.id === updatedOrder.id
    );
    mockClientOrders[orderIndex] = updatedOrder;
    setSelectedOrder(updatedOrder);
    toast.success("Repuestos actualizados");
  };

  const userData = {
    userId: user?.id,
    userName: user?.name,
    activeOrdersCount,
    notificationsCount,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Órdenes de Servicio" {...userData} />
        <Container className="mt-4">
          <div className="d-flex flex-wrap gap-3 mb-3">
            <Form.Group>
              <Form.Label>Sucursal</Form.Label>
              <Form.Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Estado</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">Todos</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Pendiente de Facturación">
                  Pendiente de Facturación
                </option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Número Económico</Form.Label>
              <Form.Control
                type="text"
                value={economicNumberFilter}
                onChange={(e) => setEconomicNumberFilter(e.target.value)}
                placeholder="Filtrar por N° Económico"
                style={{ width: "200px" }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Número de Orden</Form.Label>
              <Form.Control
                type="text"
                value={orderNumberFilter}
                onChange={(e) => setOrderNumberFilter(e.target.value)}
                placeholder="Filtrar por N° Orden"
                style={{ width: "200px" }}
              />
            </Form.Group>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Número Económico</th>
                <th>Número de Orden</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const vehicle = mockVehicles.find(
                  (v) => v.Económico === order.vehicleEconomicNumber
                );
                return (
                  <tr key={order.id}>
                    <td>{order.vehicleEconomicNumber}</td>
                    <td>{order.id}</td>
                    <td>{vehicle?.Sucursal || "-"}</td>
                    <td>
                      <StatusIcon status={order.status}>
                        <FontAwesomeIcon icon={faCircle} />
                      </StatusIcon>
                      {order.status}
                    </td>
                    <td>
                      <CustomButton onClick={() => handleViewDetails(order)}>
                        Ver Detalles
                      </CustomButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Container>
      </div>

      {/* Modal de detalles */}
      <StyledModal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Orden #{selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <ModalBody style={{ display: "flex", padding: 0 }}>
          {/* Barra lateral del historial */}
          <HistorySidebar>
            <h5>Historial</h5>
            {selectedOrder?.history?.length > 0 ? (
              selectedOrder.history.map((entry, index) => (
                <HistoryItem key={index}>
                  <HistoryTitle>
                    <StatusIcon status={entry.status}>
                      <FontAwesomeIcon icon={faCircle} />
                    </StatusIcon>
                    {entry.description}
                  </HistoryTitle>
                  <HistoryDate>{formatDate(entry.date)}</HistoryDate>
                </HistoryItem>
              ))
            ) : (
              <p>Sin historial disponible</p>
            )}
            {selectedOrder?.status === "Pendiente de Facturación" && (
              <>
                <HistoryItem>
                  <HistoryTitle>Número de Factura</HistoryTitle>
                  <HistoryDate>
                    FAC-{selectedOrder.id}-2025 (Simulado)
                  </HistoryDate>
                </HistoryItem>
                <HistoryItem>
                  <HistoryTitle>Pedido de Albarán</HistoryTitle>
                  <HistoryDate>
                    ALB-{selectedOrder.id}-2025 (Simulado)
                  </HistoryDate>
                </HistoryItem>
              </>
            )}
          </HistorySidebar>

          {/* Contenido principal */}
          <div style={{ flex: 1, padding: "15px" }}>
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                isReadOnly={selectedOrder.status !== "Pendiente"}
                isModal={true}
              />
            )}

            {/* Acciones según estado */}
            {selectedOrder?.status === "En Proceso" &&
              selectedOrder?.notifications?.length > 0 && (
                <ActionSection>
                  <h6>Solicitudes de Repuestos Pendientes</h6>
                  {selectedOrder.parts
                    .filter((part) => part.status === "Solicitado")
                    .map((part, index) => (
                      <Row key={index} className="mb-2 align-items-center">
                        <Col>
                          {part.name} (Cantidad: {part.quantity})
                        </Col>
                        <Col>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handlePartAction(index, "accept")}
                          >
                            <FontAwesomeIcon icon={faCheck} /> Aceptar
                          </Button>{" "}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              rejectionNote && handlePartAction(index, "reject")
                            }
                            disabled={!rejectionNote}
                          >
                            <FontAwesomeIcon icon={faTimes} /> Rechazar
                          </Button>
                        </Col>
                      </Row>
                    ))}
                  <Form.Group className="mt-2">
                    <Form.Label>
                      Observaciones (obligatorio para rechazar)
                    </Form.Label>
                    <FormControl
                      as="textarea"
                      rows={2}
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Motivo del rechazo"
                    />
                  </Form.Group>
                </ActionSection>
              )}

            {selectedOrder?.status === "Pendiente" && (
              <ActionSection>
                <h6>Revisión de Finalización</h6>
                {selectedOrder.parts?.length > 0 && (
                  <>
                    <h6>Editar Repuestos</h6>
                    {editedParts.map((part, index) => (
                      <Row key={index} className="mb-2 align-items-center">
                        <Col>{part.name}</Col>
                        <Col>
                          <FormControl
                            type="number"
                            value={part.quantity}
                            onChange={(e) =>
                              handlePartEdit(index, "quantity", e.target.value)
                            }
                            placeholder="Cantidad"
                            style={{ width: "100px" }}
                          />
                        </Col>
                        <Col>
                          <FormControl
                            type="number"
                            value={part.price || 0}
                            onChange={(e) =>
                              handlePartEdit(index, "price", e.target.value)
                            }
                            placeholder="Precio"
                            style={{ width: "100px" }}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button
                      variant="primary"
                      onClick={saveEditedParts}
                      className="mb-3"
                    >
                      Guardar Cambios
                    </Button>
                  </>
                )}
                <Row className="mt-3">
                  <Col>
                    <Button
                      variant="success"
                      onClick={() => handleFinalizeAction("accept")}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Aceptar Finalización
                    </Button>{" "}
                    <Button
                      variant="danger"
                      onClick={() =>
                        rejectionNote && handleFinalizeAction("reject")
                      }
                      disabled={!rejectionNote}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Rechazar Finalización
                    </Button>
                  </Col>
                </Row>
                <Form.Group className="mt-2">
                  <Form.Label>
                    Observaciones (obligatorio para rechazar)
                  </Form.Label>
                  <FormControl
                    as="textarea"
                    rows={2}
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Motivo del rechazo"
                  />
                </Form.Group>
              </ActionSection>
            )}
          </div>
        </ModalBody>
        <Modal.Footer>
          <CustomButton onClick={() => setShowModal(false)}>
            Cerrar
          </CustomButton>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default AdminOrders;
