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
import OrderDetails from "../components/OrderDetails";
import { StyledModal, ModalBody } from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import {
  updateOrderNumbers,
  updateOrderStatus,
  updateOrder,
  updatePartQuantity,
  requestPart,
  updatePartAdmin,
} from "../services/orderService";

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [editedParts, setEditedParts] = useState([]);
  const [editedOrder, setEditedOrder] = useState({});
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [isEditingNumbers, setIsEditingNumbers] = useState(false);

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
      setEditedOrder(response.data);
      setEditedParts(response.data.parts || []);
      setOrderNumber(response.data.order_number || "");
      setDeliveryNoteNumber(response.data.invoice?.delivery_note_number || "");
      setIsEditingNumbers(
        !(
          response.data.order_number ||
          response.data.invoice?.delivery_note_number
        )
      );
      setShowModal(true);
    } catch (error) {
      toast.error("Error al cargar detalles de la orden");
      console.error("[AdminOrders] Error al cargar detalles:", error);
    }
  };

  const handlePartAction = async (partIndex, action, note) => {
    const part = editedParts[partIndex];
    try {
      const status = action === "accept" ? "Aprobado" : "Rechazado";
      // Pasar el nombre completo del usuario como authorizedBy para aprobaciones, null para rechazos
      const authorizedBy =
        action === "accept" ? `${user.first_name} ${user.last_name}` : null;
      await updatePartAdmin(
        selectedOrder.id,
        part.part_id,
        {
          quantity: part.quantity,
          status,
          price: part.price || null,
          note: action === "reject" ? note : "",
        },
        authorizedBy
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

  const handleDeletePart = async (index) => {
    const part = editedParts[index];
    try {
      await updatePartQuantity(selectedOrder.id, part.part_id, 0);
      const updatedParts = editedParts.filter((_, i) => i !== index);
      setEditedParts(updatedParts);
      toast.success(`Repuesto ${part.name} eliminado`);
    } catch (error) {
      toast.error("Error al eliminar repuesto");
      console.error("[AdminOrders] Error al eliminar repuesto:", error);
    }
  };

  const handleAddPart = async (part) => {
    try {
      await requestPart(selectedOrder.id, part);
      const updatedOrder = await axios.get(`/api/orders/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditedParts(updatedOrder.data.parts || []);
      setSelectedOrder(updatedOrder.data);
    } catch (error) {
      throw error;
    }
  };

  const handleEditOrderField = (field, value) => {
    setEditedOrder({ ...editedOrder, [field]: value });
  };

  const saveEditedOrder = async () => {
    try {
      await updateOrder(selectedOrder.id, {
        ...editedOrder,
        parts: editedParts,
      });
      const updatedOrder = await axios.get(`/api/orders/${selectedOrder.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(updatedOrder.data);
      setEditedOrder(updatedOrder.data);
      setEditedParts(updatedOrder.data.parts || []);
      toast.success("Orden actualizada");
    } catch (error) {
      toast.error("Error al guardar orden");
      console.error("[AdminOrders] Error al guardar orden:", error);
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
      setEditedOrder(updatedOrder.data);
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
      setEditedOrder(updatedOrder.data);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.data.id ? updatedOrder.data : o))
      );
    } catch (error) {
      toast.error(error.message || "Error al actualizar números");
      console.error("[AdminOrders] Error al actualizar números:", error);
    }
  };

  const handleSendToBilling = () => {
    setConfirmAction(() => async () => {
      try {
        await updateOrderStatus(selectedOrder.id, "Pendiente de Facturación");
        const updatedOrder = await axios.get(
          `/api/orders/${selectedOrder.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSelectedOrder(updatedOrder.data);
        setEditedOrder(updatedOrder.data);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updatedOrder.data.id ? updatedOrder.data : o
          )
        );
        toast.success(`Orden #${selectedOrder.id} enviada a facturación`);
        setShowModal(false);
      } catch (error) {
        toast.error("Error al enviar a facturación");
        console.error("[AdminOrders] Error al enviar a facturación:", error);
      }
    });
    setShowConfirmModal(true);
  };

  const handleCancelBilling = async () => {
    setConfirmAction(() => async () => {
      try {
        await updateOrderStatus(selectedOrder.id, "Finalizado");
        const updatedOrder = await axios.get(
          `/api/orders/${selectedOrder.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSelectedOrder(updatedOrder.data);
        setEditedOrder(updatedOrder.data);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updatedOrder.data.id ? updatedOrder.data : o
          )
        );
        toast.success(`Orden #${selectedOrder.id} devuelta a Finalizado`);
        setShowModal(false);
      } catch (error) {
        toast.error("Error al cancelar facturación");
        console.error("[AdminOrders] Error al cancelar facturación:", error);
      }
    });
    setShowConfirmModal(true);
  };

  const handleDownloadReport = () => {
    const report = {
      order: selectedOrder,
      invoice: selectedOrder.invoice,
      parts: editedParts,
      total: editedParts
        .reduce((sum, part) => sum + part.quantity * (part.price || 0), 0)
        .toFixed(2),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order_${selectedOrder.id}_report.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Informe descargado");
  };

  const userData = {
    userId: user?.id,
    userName: `${user?.first_name} ${user?.last_name}`,
    activeOrdersCount,
    notificationsCount,
  };

  const isReadOnly = [
    "Pendiente",
    "Pendiente de Facturación",
    "Facturado",
  ].includes(selectedOrder?.status);
  const canEditParts = selectedOrder?.status === "Finalizado";

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
        <ModalBody>
          {selectedOrder && (
            <>
              <ActionSection>
                <h6>N° de solicitud de pedido</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Pedido</Form.Label>
                      <Form.Control
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="Ej: PED-12345"
                        disabled={
                          !isEditingNumbers ||
                          selectedOrder.status === "Pendiente de Facturación" ||
                          selectedOrder.status === "Facturado"
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Solicitud de Albarán</Form.Label>
                      <Form.Control
                        type="text"
                        value={deliveryNoteNumber}
                        onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                        placeholder="Ej: ALB-12345"
                        disabled={
                          !isEditingNumbers ||
                          selectedOrder.status === "Pendiente de Facturación" ||
                          selectedOrder.status === "Facturado"
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-center align-items-center">
                  {(orderNumber || deliveryNoteNumber) && !isEditingNumbers ? (
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditingNumbers(true)}
                      disabled={
                        selectedOrder.status === "Pendiente de Facturación" ||
                        selectedOrder.status === "Facturado"
                      }
                    >
                      Editar
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={async () => {
                        await handleSaveNumbers();
                        setIsEditingNumbers(false);
                      }}
                      disabled={
                        (!orderNumber && !deliveryNoteNumber) ||
                        selectedOrder.status === "Pendiente de Facturación" ||
                        selectedOrder.status === "Facturado"
                      }
                    >
                      Guardar Números
                    </Button>
                  )}
                </div>
              </ActionSection>

              <OrderDetails
                order={editedOrder}
                isReadOnly={isReadOnly}
                onPartAction={handlePartAction}
                onEditPart={handleEditOrderField}
                onDeletePart={handleDeletePart}
                onAddPart={handleAddPart}
                editedParts={editedParts}
                setEditedParts={setEditedParts}
                canEditParts={canEditParts}
                userId={user.id}
              />

              {selectedOrder.status === "Pendiente" && (
                <ActionSection>
                  <h6>Revisión de Finalización</h6>
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

              {selectedOrder.status === "Finalizado" && (
                <ActionSection>
                  <h6>Acciones</h6>
                  <Button
                    variant="primary"
                    onClick={saveEditedOrder}
                    className="me-2"
                  >
                    Guardar Cambios
                  </Button>
                  <Button variant="success" onClick={handleSendToBilling}>
                    Enviar a Facturación
                  </Button>
                </ActionSection>
              )}

              {selectedOrder.status === "Pendiente de Facturación" && (
                <ActionSection>
                  <h6>Acciones</h6>
                  <Button variant="danger" onClick={handleCancelBilling}>
                    Cancelar Solicitud de Facturación
                  </Button>
                </ActionSection>
              )}

              {selectedOrder.status === "Facturado" && (
                <ActionSection>
                  <h6>Acciones</h6>
                  <Button variant="primary" onClick={handleDownloadReport}>
                    Descargar Informe
                  </Button>
                </ActionSection>
              )}
            </>
          )}
        </ModalBody>
        <Modal.Footer>
          <CustomButton onClick={() => setShowModal(false)}>
            Cerrar
          </CustomButton>
        </Modal.Footer>
      </StyledModal>

      <StyledModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        size="sm"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Acción</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <p>¿Está seguro de realizar esta acción?</p>
        </ModalBody>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await confirmAction();
              setShowConfirmModal(false);
            }}
          >
            Confirmar
          </Button>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default AdminOrders;
