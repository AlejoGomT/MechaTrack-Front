import { useState, useEffect } from "react";
import { Container, Form, Modal, Row, Col, Pagination } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import OrderDetails from "../components/OrderDetails";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  FilterInput,
  StyledModal,
  ModalBody,
  StyledTable,
  ActionsContainer,
  TableWrapper,
} from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faCheck,
  faTimes,
  faEye,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { toast } from "react-toastify";
import {
  requestPart,
  updatePartAdmin,
  processPartReturn,
} from "../services/partService";
import {
  getOrders,
  getOrderById,
  updateOrderNumbers,
  updateOrderStatus,
  finalizeOrder,
} from "../services/orderService";
import {
  updateAdminOrder,
  deleteAdminPart,
} from "../services/adminOrderService";
import { downloadOrderReportPdf } from "../services/reportService";

library.add(faCircle, faCheck, faTimes, faEye, faHistory);

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Vehiculos", path: "../admin/vehicles" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
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
  display: flex;
  flex-direction: column;
  background-color: #f1f3f5;
  border-radius: 5px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const AdminOrders = () => {
  const { user, token } = useAuth();
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
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
  const isAdmin = user?.role === "admin";
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getOrders({
          status: statusFilter,
          economicNumber: economicNumberFilter,
          orderNumber: orderNumberFilter,
          page: pagination.page,
          limit: pagination.limit,
        });
        console.log("[AdminOrders] Respuesta de getOrders:", response);
        setOrders(response.orders || []);
        setPagination({
          ...pagination,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        });
        const uniqueBranches = [
          ...new Set(
            (response.orders || []).map((o) => o.branch).filter(Boolean)
          ),
        ];
        setBranches(uniqueBranches);
      } catch (error) {
        console.error("[AdminOrders] Error al cargar órdenes:", error);
        toast.error(error.message || "Error al cargar órdenes");
        setOrders([]);
        setBranches([]);
        setPagination({
          ...pagination,
          total: 0,
          totalPages: 1,
        });
      }
    };
    if (token) fetchData();
  }, [
    statusFilter,
    economicNumberFilter,
    orderNumberFilter,
    pagination.page,
    token,
  ]);

  const activeOrdersCount = orders.filter(
    (o) => o.status === "En Proceso"
  ).length;
  const notificationsCount = orders.filter(
    (o) => o.notifications?.length > 0
  ).length;

  const handleViewDetails = async (order) => {
    try {
      const response = await getOrderById(order.id);
      setSelectedOrder(response);
      setEditedOrder(response);
      setEditedParts(response.parts || []);
      setOrderNumber(response.order_number || "");
      setDeliveryNoteNumber(response.invoice?.delivery_note_number || "");
      setIsEditingNumbers(
        !(response.order_number || response.invoice?.delivery_note_number)
      );
      setShowModal(true);
    } catch (error) {
      toast.error("Error al cargar detalles de la orden");
      console.error("[AdminOrders] Error al cargar detalles:", error);
    }
  };

  const handlePartAction = async (partId, action, note) => {
    const part = editedParts.find((p) => p.part_id === partId);
    if (!part) {
      toast.error("Repuesto no encontrado");
      return;
    }
    try {
      if (action === "acceptReturn" || action === "rejectReturn") {
        const status =
          action === "acceptReturn"
            ? "Devolución Aprobada"
            : "Devolución Rechazada";
        await processPartReturn(selectedOrder.id, partId, status, note || "");
        const updatedOrder = await getOrderById(selectedOrder.id);
        setSelectedOrder(updatedOrder);
        setEditedParts(updatedOrder.parts || []);
        toast.success(
          `Devolución de ${part.name} ${
            action === "acceptReturn" ? "aprobada" : "rechazada"
          }`
        );
      } else {
        const status = action === "accept" ? "Aprobado" : "Rechazado";
        if (action === "reject" && (!note || note.trim().length < 5)) {
          toast.error("El motivo de rechazo debe tener al menos 5 caracteres");
          return;
        }
        await updatePartAdmin(
          selectedOrder.id,
          part.part_id,
          {
            quantity: part.quantity,
            status,
            price: part.price || null,
            note: action === "reject" ? note : "",
          },
          user.id
        );
        const updatedOrder = await getOrderById(selectedOrder.id);
        setSelectedOrder(updatedOrder);
        setEditedParts(updatedOrder.parts || []);
        toast.success(
          `Repuesto ${part.name} ${
            action === "accept" ? "aprobado" : "rechazado"
          }`
        );
      }
    } catch (error) {
      toast.error(error.message || "Error al procesar repuesto");
      console.error("[AdminOrders] Error al procesar repuesto:", error);
    }
  };

  const handleEditPartById = (partId, updates) => {
    const updatedParts = editedParts.map((part) =>
      part.part_id === partId ? { ...part, ...updates } : part
    );
    setEditedParts(updatedParts);
  };

  const handleDeletePart = async (partId) => {
    try {
      await deleteAdminPart(selectedOrder.id, partId, user.id);
      setEditedParts(editedParts.filter((part) => part.part_id !== partId));
      toast.success("Repuesto eliminado");
    } catch (error) {
      console.error("[AdminOrders] Error al eliminar repuesto:", error);
      toast.error(
        error.message || error.details || "Error al eliminar repuesto"
      );
    }
  };

  const handleAddPart = async (part) => {
    try {
      await requestPart(selectedOrder.id, part);
      const updatedOrder = await getOrderById(selectedOrder.id);
      setEditedParts(updatedOrder.parts || []);
      setSelectedOrder(updatedOrder);
    } catch (error) {
      throw error;
    }
  };

  const handleEditOrderField = (field, value) => {
    if (field === "parts") {
      setEditedParts(value);
    } else if (typeof field === "string" && typeof value === "object") {
      handleEditPartById(field, value);
    } else {
      setEditedOrder({ ...editedOrder, [field]: value });
    }
  };

  const saveEditedOrder = async () => {
    try {
      if (isAdmin && selectedOrder.status === "Finalizado") {
        if (!editedOrder.type || !editedOrder.description) {
          toast.error("Tipo y descripción son obligatorios");
          return;
        }
        const refreshedOrder = await getOrderById(selectedOrder.id);
        const updatedParts = refreshedOrder.parts.map((part) => {
          const editedPart = editedParts.find(
            (p) => p.part_id === part.part_id
          );
          return editedPart
            ? {
                ...part,
                quantity: Number(editedPart.quantity),
                price: editedPart.price ? Number(editedPart.price) : null,
                status: editedPart.status || "Aprobado",
                requested_by:
                  editedPart.requested_by_id || editedPart.requested_by,
                authorized_by:
                  editedPart.authorized_by_id ||
                  editedPart.authorized_by ||
                  null,
              }
            : part;
        });

        const response = await updateAdminOrder(selectedOrder.id, {
          ...editedOrder,
          parts: updatedParts,
          existingImages: editedOrder.images || [],
          vehicle_economic_number: editedOrder.vehicle_economic_number,
          plate: editedOrder.plate,
          brand: editedOrder.brand,
          model: editedOrder.model,
          year: editedOrder.year,
          branch: editedOrder.branch,
          mileage: editedOrder.mileage,
        });

        console.log("[AdminOrders] Respuesta de updateAdminOrder:", {
          response,
          vehicleData: {
            vehicle_economic_number: response.vehicle_economic_number,
            plate: response.plate,
            brand: response.brand,
            model: response.model,
            year: response.year,
            branch: response.branch,
            mileage: response.mileage,
          },
        });

        // Refrescar nuevamente después de guardar
        const finalOrder = await getOrderById(selectedOrder.id);
        console.log("[AdminOrders] Orden refrescada después de guardar:", {
          finalOrder,
          vehicleData: {
            vehicle_economic_number: finalOrder.vehicle_economic_number,
            plate: finalOrder.plate,
            brand: finalOrder.brand,
            model: finalOrder.model,
            year: finalOrder.year,
            branch: finalOrder.branch,
            mileage: finalOrder.mileage,
          },
        });

        setSelectedOrder(finalOrder);
        setEditedOrder(finalOrder);
        setEditedParts(
          finalOrder.parts.map((part) => ({
            ...part,
            requested_by_id: part.requested_by_id,
            requested_by: part.requested_by,
            authorized_by_id: part.authorized_by_id,
            authorized_by: part.authorized_by,
          }))
        );
        setOrders((prev) =>
          prev.map((o) => (o.id === finalOrder.id ? finalOrder : o))
        );
        toast.success("Orden actualizada");
      } else {
        const response = await getOrderById(selectedOrder.id);
        console.log("[AdminOrders] Orden refrescada:", {
          response,
          vehicleData: {
            vehicle_economic_number: response.vehicle_economic_number,
            plate: response.plate,
            brand: response.brand,
            model: response.model,
            year: response.year,
            branch: response.branch,
            mileage: response.mileage,
          },
        });
        setSelectedOrder(response);
        setEditedOrder(response);
        setEditedParts(
          response.parts.map((part) => ({
            ...part,
            requested_by_id: part.requested_by_id,
            authorized_by_id: part.authorized_by_id,
          }))
        );
        setOrders((prev) =>
          prev.map((o) => (o.id === response.id ? response : o))
        );
        toast.success("Orden refrescada");
      }
    } catch (error) {
      toast.error(error.message || error.details || "Error al guardar orden");
      console.error("[AdminOrders] Error al guardar orden:", error);
    }
  };

  const handleFinalizeAction = async (action) => {
    try {
      if (action === "accept") {
        const pendingParts = editedParts.filter(
          (part) => part.status === "Solicitado"
        );
        if (pendingParts.length > 0) {
          toast.error(
            "No se puede aceptar la orden con repuestos pendientes. Por favor, apruebe o rechace todos los repuestos."
          );
          return;
        }
      }

      const newStatus = action === "accept" ? "Finalizado" : "En Proceso";
      await finalizeOrder(selectedOrder.id, {
        action,
        note: rejectionNote,
        status: newStatus,
      });
      const updatedOrder = await getOrderById(selectedOrder.id);
      setSelectedOrder(updatedOrder);
      setEditedOrder(updatedOrder);
      setEditedParts(updatedOrder.parts || []);
      toast.success(
        `Orden #${selectedOrder.id} ${
          action === "accept" ? "aprobada" : "rechazada"
        }`
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      setRejectionNote("");
      if (action === "accept") {
        setShowModal(false);
      }
    } catch (error) {
      toast.error(error.message || "Error al procesar finalización");
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
      const updatedOrder = await getOrderById(selectedOrder.id);
      setSelectedOrder(updatedOrder);
      setEditedOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    } catch (error) {
      toast.error(error.message || "Error al actualizar números");
      console.error("[AdminOrders] Error al actualizar números:", error);
    }
  };

  const handleSendToBilling = () => {
    setConfirmAction(() => async () => {
      try {
        await saveEditedOrder();
        await updateOrderStatus(selectedOrder.id, "Pendiente de Facturación");
        const updatedOrder = await getOrderById(selectedOrder.id);
        setSelectedOrder(updatedOrder);
        setEditedOrder(updatedOrder);
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
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
        const updatedOrder = await getOrderById(selectedOrder.id);
        setSelectedOrder(updatedOrder);
        setEditedOrder(updatedOrder);
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
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

  const handleDownloadReport = async () => {
    try {
      await downloadOrderReportPdf(selectedOrder.id);
      toast.success("Informe PDF descargado");
    } catch (error) {
      console.error("[AdminOrders] Error al descargar informe PDF:", error);
      if (
        error.response?.data instanceof Blob &&
        error.response.data.type === "application/json"
      ) {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        console.error("[AdminOrders] Detalles del error:", errorData);
        toast.error(errorData.message || "Error al descargar el informe PDF");
      } else {
        toast.error(error.message || "Error al descargar el informe PDF");
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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
        <Container className="mt-4 d-flex flex-column align-items-center gap-3">
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Sucursal</FilterLabel>
              <FilterSelect
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Estado</FilterLabel>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Pendiente de Facturación">
                  Pendiente de Facturación
                </option>
                <option value="Facturado">Facturado</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número Económico</FilterLabel>
              <FilterInput
                type="text"
                value={economicNumberFilter}
                onChange={(e) => setEconomicNumberFilter(e.target.value)}
                placeholder="Filtrar por N° Económico"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número de Orden</FilterLabel>
              <FilterInput
                type="text"
                value={orderNumberFilter}
                onChange={(e) => setOrderNumberFilter(e.target.value)}
                placeholder="Filtrar por N° Orden"
              />
            </FilterGroup>
          </FiltersContainer>
          <TableWrapper>
            <StyledTable>
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
                      <td className="actions">
                        <ActionsContainer>
                          <CustomButton
                            onClick={() => handleViewDetails(order)}
                            title="Ver Detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </CustomButton>
                        </ActionsContainer>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </StyledTable>
          </TableWrapper>
          <Pagination>
            <Pagination.Prev
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            />
            {[...Array(pagination.totalPages).keys()].map((i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === pagination.page}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            />
          </Pagination>
        </Container>
      </div>

      <StyledModal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <HeaderContainer>
            <Modal.Title>Detalles de la Orden #{selectedOrder?.id}</Modal.Title>
            {selectedOrder?.notifications?.length > 0 && (
              <CustomButton
                onClick={() => {
                  setShowModal(false);
                  setShowHistoryModal(true);
                }}
                title="Ver Historial de Notificaciones"
                style={{ marginLeft: "10px", color: "white" }}
              >
                <FontAwesomeIcon icon={faHistory} /> Historial
              </CustomButton>
            )}
          </HeaderContainer>
        </Modal.Header>
        <ModalBody>
          {selectedOrder && (
            <>
              <ActionSection>
                <h6>N° de solicitud de pedido</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <FilterLabel>Número de Pedido</FilterLabel>
                      <FilterInput
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
                      <FilterLabel>Número de Solicitud de Albarán</FilterLabel>
                      <FilterInput
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
                    <CustomButton
                      variant="secondary"
                      onClick={() => setIsEditingNumbers(true)}
                      disabled={
                        selectedOrder.status === "Pendiente de Facturación" ||
                        selectedOrder.status === "Facturado"
                      }
                    >
                      Editar
                    </CustomButton>
                  ) : (
                    <CustomButton
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
                    </CustomButton>
                  )}
                </div>
              </ActionSection>

              <OrderDetails
                order={editedOrder}
                setOrder={setEditedOrder}
                isReadOnly={isReadOnly}
                onPartAction={handlePartAction}
                onEditPart={handleEditOrderField}
                onDeletePart={handleDeletePart}
                onAddPart={handleAddPart}
                editedParts={editedParts}
                setEditedParts={setEditedParts}
                canEditParts={canEditParts}
                userId={user.id}
                isAdmin={user?.role === "admin"}
              />

              {selectedOrder.status === "Pendiente" && (
                <ActionSection>
                  <h6>Revisión de Finalización</h6>
                  <div className="d-flex justify-content-around">
                    <Form.Group className="mt-2" style={{ width: "60%" }}>
                      <FilterLabel>
                        Observaciones (obligatorio para rechazar)
                      </FilterLabel>
                      <FilterInput
                        as="textarea"
                        rows={2}
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        placeholder="Motivo del rechazo"
                      />
                    </Form.Group>
                    <div className="d-flex flex-column justify-content-around">
                      <CustomButton
                        variant="success"
                        onClick={() => handleFinalizeAction("accept")}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Aceptar Finalización
                      </CustomButton>{" "}
                      <CustomButton
                        variant="danger"
                        onClick={() =>
                          rejectionNote && handleFinalizeAction("reject")
                        }
                        disabled={!rejectionNote}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Rechazar Finalización
                      </CustomButton>
                    </div>
                  </div>
                </ActionSection>
              )}

              {selectedOrder.status === "Finalizado" && (
                <ActionSection>
                  <h6>Acciones</h6>
                  <ActionsContainer>
                    <CustomButton
                      variant="primary"
                      onClick={saveEditedOrder}
                      className="me-2"
                    >
                      Guardar Cambios
                    </CustomButton>
                    <CustomButton
                      variant="success"
                      onClick={handleSendToBilling}
                    >
                      Guardar y Enviar a Facturación
                    </CustomButton>
                  </ActionsContainer>
                </ActionSection>
              )}

              {selectedOrder.status === "Pendiente de Facturación" && (
                <ActionSection>
                  <div className="d-flex justify-content-around align-items-center">
                    <h6>Acciones</h6>
                    <CustomButton
                      variant="danger"
                      onClick={handleCancelBilling}
                      className="w-25"
                    >
                      Cancelar Solicitud de Facturación
                    </CustomButton>
                  </div>
                </ActionSection>
              )}

              {selectedOrder.status === "Facturado" && (
                <ActionSection>
                  <div className="d-flex justify-content-around align-items-center">
                    <h6>Acciones</h6>
                    <CustomButton
                      variant="primary"
                      onClick={handleDownloadReport}
                    >
                      Descargar Informe
                    </CustomButton>
                  </div>
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
        show={showHistoryModal}
        onHide={() => {
          setShowHistoryModal(false);
          setShowModal(true);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Historial de Notificaciones - Orden #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <ModalBody>
          {selectedOrder?.notifications?.length > 0 ? (
            <StyledTable>
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th>Fecha de Creación</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="text-wrap">{notification.message || "-"}</td>
                    <td>{formatDate(notification.created_at)}</td>
                    <td>
                      {notification.details ? (
                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                          {notification.details.vehicle_economic_number && (
                            <li>
                              Número Económico:{" "}
                              {notification.details.vehicle_economic_number}
                            </li>
                          )}
                          {notification.details.branch && (
                            <li>Sucursal: {notification.details.branch}</li>
                          )}
                        </ul>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          ) : (
            <p>No hay notificaciones para esta orden.</p>
          )}
        </ModalBody>
        <Modal.Footer>
          <CustomButton
            onClick={() => {
              setShowHistoryModal(false);
              setShowModal(true);
            }}
          >
            Cerrar
          </CustomButton>
        </Modal.Footer>
      </StyledModal>

      <StyledModal
        variant="alertModal"
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
          <CustomButton
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </CustomButton>
          <CustomButton
            variant="primary"
            onClick={async () => {
              await confirmAction();
              setShowConfirmModal(false);
            }}
          >
            Confirmar
          </CustomButton>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default AdminOrders;
