import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Form,
  Modal,
  Button,
  Row,
  Col,
  FormControl,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import TechnicianCreateOrder from "./TechnicianCreateOrder";
import { StyledModal, ModalBody } from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { updateOrderNumbers } from "../services/orderService"; // Añadir import

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
        return "#28a745";
      case "En Proceso":
        return "#fd7e14";
      case "Pendiente":
        return "#ffc107";
      case "Pendiente de Facturación":
        return "#17a2b8";
      case "Facturado":
        return "#6c757d";
      default:
        return "#6c757d";
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
  const { user, token } = useAuth();
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [editedParts, setEditedParts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orderNumber, setOrderNumber] = useState(""); // Nuevo estado
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState(""); // Nuevo estado

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: statusFilter,
            economicNumber: economicNumberFilter,
            orderNumber: orderNumberFilter,
          },
        });
        setOrders(response.data);
        const uniqueBranches = [
          ...new Set(response.data.map((o) => o.branch).filter(Boolean)),
        ];
        setBranches(uniqueBranches);
      } catch (error) {
        toast.error("Error al cargar órdenes");
        console.error("[AdminOrders] Error al cargar órdenes:", error);
      }
    };
    if (token) fetchData();
  }, [statusFilter, economicNumberFilter, orderNumberFilter, token]);

  const activeOrdersCount = orders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = orders.filter(
    (o) => o.notifications?.length > 0
  ).length;

  const handleViewDetails = async (order) => {
    try {
      const response = await axios.get(`/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(response.data);
      setEditedParts(response.data.parts || []);
      setOrderNumber(response.data.order_number || ""); // Inicializar con valor actual
      setDeliveryNoteNumber(response.data.invoice?.delivery_note_number || ""); // Inicializar con valor actual
      setShowModal(true);
    } catch (error) {
      toast.error("Error al cargar detalles de la orden");
      console.error("[AdminOrders] Error al cargar detalles:", error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePartAction = async (partIndex, action) => {
    const part = selectedOrder.parts[partIndex];
    try {
      await axios.put(
        `/api/orders/${selectedOrder.id}/parts/${part.part_id}`,
        { action, note: rejectionNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = await axios.get(`/api/orders/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(updatedOrder.data);
      setEditedParts(updatedOrder.data.parts || []);
      toast.success(
        `Repuesto ${part.name} ${
          action === "accept" ? "aprobado" : "rechazado"
        }`
      );
      setRejectionNote("");
    } catch (error) {
      toast.error("Error al procesar repuesto");
      console.error("[AdminOrders] Error al procesar repuesto:", error);
    }
  };

  const handleEditPart = (index, field, value) => {
    const updatedParts = [...editedParts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setEditedParts(updatedParts);
  };

  const saveEditedParts = async () => {
    try {
      await axios.put(
        `/api/orders/${selectedOrder.id}`,
        { ...selectedOrder, parts: editedParts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = await axios.get(`/api/orders/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(updatedOrder.data);
      setEditedParts(updatedOrder.data.parts || []);
      toast.success("Repuestos actualizados");
    } catch (error) {
      toast.error("Error al guardar repuestos");
      console.error("[AdminOrders] Error al guardar repuestos:", error);
    }
  };

  const handleFinalizeAction = async (action) => {
    try {
      const newStatus = action === "accept" ? "Finalizado" : "En Proceso";
      await axios.put(
        `/api/orders/${selectedOrder.id}/finalize`,
        { action, note: rejectionNote, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = await axios.get(`/api/orders/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(updatedOrder.data);
      setEditedParts(updatedOrder.data.parts || []);
      toast.success(
        `Orden #${selectedOrder.id} ${
          action === "accept" ? "aprobada" : "rechazada"
        }`
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.data.id ? updatedOrder.data : o))
      );
      setRejectionNote("");
      if (action === "accept") {
        setShowModal(false);
      }
    } catch (error) {
      toast.error("Error al procesar finalización");
      console.error("[AdminOrders] Error al procesar finalización:", error);
    }
  };

  const handleSaveNumbers = async () => {
    try {
      await updateOrderNumbers(selectedOrder.id, {
        orderNumber,
        deliveryNoteNumber,
      });
      toast.success(`Números actualizados para orden #${selectedOrder.id}`);
      const updatedOrder = await axios.get(`/api/orders/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(updatedOrder.data);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.data.id ? updatedOrder.data : o))
      );
    } catch (error) {
      toast.error(error.message || "Error al actualizar números");
      console.error("[AdminOrders] Error al actualizar números:", error);
    }
  };

  const userData = {
    userId: user?.id,
    userName: `${user?.first_name} ${user?.last_name}`,
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
                <option value="Facturado">Facturado</option>
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
              {orders
                .filter((order) =>
                  branchFilter ? order.branch === branchFilter : true
                )
                .map((order) => (
                  <tr key={order.id}>
                    <td>{order.vehicle_economic_number}</td>
                    <td>{order.id}</td>
                    <td>{order.branch || "-"}</td>
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
                ))}
            </tbody>
          </Table>
        </Container>
      </div>

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
            {selectedOrder?.order_number && (
              <HistoryItem>
                <HistoryTitle>Número de Pedido</HistoryTitle>
                <HistoryDate>{selectedOrder.order_number}</HistoryDate>
              </HistoryItem>
            )}
            {selectedOrder?.invoice && (
              <>
                {selectedOrder.invoice.invoice_number && (
                  <HistoryItem>
                    <HistoryTitle>Número de Factura</HistoryTitle>
                    <HistoryDate>
                      {selectedOrder.invoice.invoice_number}
                    </HistoryDate>
                  </HistoryItem>
                )}
                {selectedOrder.invoice.delivery_note_number && (
                  <HistoryItem>
                    <HistoryTitle>Número de Albarán</HistoryTitle>
                    <HistoryDate>
                      {selectedOrder.invoice.delivery_note_number}
                    </HistoryDate>
                  </HistoryItem>
                )}
              </>
            )}
          </HistorySidebar>
          <div style={{ flex: 1, padding: "15px" }}>
            {selectedOrder && (
              <>
                <TechnicianCreateOrder
                  order={selectedOrder}
                  isReadOnly={selectedOrder.status !== "Pendiente"}
                  isModal={true}
                />
                {selectedOrder.status !== "Facturado" && (
                  <ActionSection>
                    <h6>Gestión de Números</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Pedido</Form.Label>
                      <Form.Control
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="Ej: PED-12345"
                        disabled={selectedOrder.status === "Facturado"}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Solicitud de Albarán</Form.Label>
                      <Form.Control
                        type="text"
                        value={deliveryNoteNumber}
                        onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                        placeholder="Ej: ALB-12345"
                        disabled={selectedOrder.status === "Facturado"}
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      onClick={handleSaveNumbers}
                      disabled={
                        (!orderNumber && !deliveryNoteNumber) ||
                        selectedOrder.status === "Facturado"
                      }
                    >
                      Guardar Números
                    </Button>
                  </ActionSection>
                )}
              </>
            )}
            {selectedOrder?.status === "En Proceso" &&
              selectedOrder?.parts?.some((p) => p.status === "Solicitado") && (
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
                {editedParts.length > 0 && (
                  <div className="mb-3">
                    <h6>Editar Repuestos</h6>
                    {editedParts.map((part, index) => (
                      <Row key={index} className="mb-2 align-items-center">
                        <Col>{part.name}</Col>
                        <Col>
                          <Form.Control
                            type="number"
                            value={part.quantity}
                            onChange={(e) =>
                              handleEditPart(index, "quantity", e.target.value)
                            }
                            placeholder="Cantidad"
                            style={{ width: "100px" }}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button
                      variant="primary"
                      onClick={saveEditedParts}
                      className="mt-2"
                    >
                      Guardar Repuestos
                    </Button>
                  </div>
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
