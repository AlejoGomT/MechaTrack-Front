import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Modal } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCardsContainer from "../components/StatCardsContainer";
import OrderFilters from "../components/OrderFilters";
import OrderList from "../components/OrderList";
import CustomButton from "../components/CustomButton";
import TechnicianCreateOrder from "./TechnicianCreateOrder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import {
  MainContainer,
  Content,
  ContentBtn,
  MobileToggleButton,
  StyledModal,
  ModalBody,
  TableWrapper,
  StyledTableModal,
  OrderDetailsModal,
  OrderDetailsBody,
} from "../styles/GlobalStyles";
import { Container } from "react-bootstrap";
import { getOrders, getVehicles, updateOrder } from "../services/orderService";
import { toast } from "react-toastify";

const baseTechnicianMenu = [
  { label: "Inicio", path: "../technician" },
  { label: "Crear Orden de Servicio", path: "../technician/create-order" },
  { label: "Historial de Órdenes", path: "../technician/history" },
  { label: "Notificaciones", path: "../technician/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderCardDetailsModal, setShowOrderCardDetailsModal] =
    useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewFinalizedModal, setShowViewFinalizedModal] = useState(false);
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, vehiclesData] = await Promise.all([
          getOrders({ technician_id: user.id }),
          getVehicles(),
        ]);
        setOrders(ordersData);
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        toast.error(err.message || "Error al cargar datos");
      }
    };
    fetchData();
  }, [user.id]);

  const technicianOrders = orders.filter(
    (order) => order.technician_id === user.id
  );
  const activeAndPendingOrders = technicianOrders.filter((order) =>
    ["En Proceso", "Pendiente"].includes(order.status)
  );
  const pendingOrdersCount = technicianOrders.filter(
    (order) => order.status === "En Proceso"
  ).length;
  const completedOrdersCount = technicianOrders.filter(
    (order) => order.status === "Finalizado"
  ).length;

  const filteredOrders = activeAndPendingOrders
    .filter((order) => {
      const matchesStatus =
        statusFilter === "Todos" || order.status === statusFilter;
      const matchesOrderNumber = orderNumberFilter
        ? String(order.id).includes(orderNumberFilter)
        : true;
      const matchesEconomicNumber = economicNumberFilter
        ? order.vehicle_economic_number.includes(economicNumberFilter)
        : true;
      return matchesStatus && matchesOrderNumber && matchesEconomicNumber;
    })
    .map((order) => ({
      id: order.id,
      title: `Orden #${order.id}`,
      content: `Vehículo ${order.vehicle_economic_number} - ${
        order.status
      } (Ingreso: ${new Date(order.created_at).toLocaleDateString("es-ES")})`,
      status: order.status,
      onViewClick: (id) => {
        const order = technicianOrders.find((o) => o.id === id);
        setSelectedOrder(order);
        setShowOrderCardDetailsModal(true);
      },
      onEditClick: (id) => {
        const order = technicianOrders.find((o) => o.id === id);
        submitForApproval(order);
      },
    }));

  const stats = [
    {
      title: "Órdenes Pendientes",
      content: pendingOrdersCount.toString(),
      buttonText: "Ver Detalles",
      onClick: () => {
        setModalType("pending");
        setShowModal(true);
      },
    },
    {
      title: "Órdenes Finalizadas",
      content: completedOrdersCount.toString(),
      buttonText: "Ver Detalles",
      onClick: () => {
        setModalType("completed");
        setShowModal(true);
      },
    },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const closeModal = (type, nextModal = null, nextModalType = null) => {
    if (type === "main") {
      setShowModal(false);
      setModalType("");
    } else if (type === "edit") {
      setShowEditModal(false);
      setSelectedOrder(null);
    } else if (type === "details") {
      setShowOrderCardDetailsModal(false);
      setSelectedOrder(null);
    } else if (type === "finalized") {
      setShowViewFinalizedModal(false);
      setSelectedOrder(null);
    }
    if (nextModal === "main") {
      setModalType(nextModalType || "pending");
      setShowModal(true);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
    setShowModal(false);
  };

  const handleEditFromOrderCardModal = () => {
    setShowOrderCardDetailsModal(false);
    setShowEditModal(true);
  };

  const handleViewFinalizedOrder = (order) => {
    setSelectedOrder(order);
    setShowViewFinalizedModal(true);
    setShowModal(false);
  };

  const handleUpdateOrder = async () => {
    if (isSubmitting || !formRef.current) return;
    setIsSubmitting(true);
    try {
      formRef.current.requestSubmit();
    } catch (err) {
      console.error("Error al actualizar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForApproval = async (order) => {
    try {
      console.log(
        `[TechnicianDashboard] Enviando orden #${order.id} para aprobación con estado Pendiente`
      );
      const updatedOrder = await updateOrderStatus(order.id, "Pendiente");
      console.log(`[TechnicianDashboard] Orden actualizada:`, updatedOrder);
      toast.success(`Orden #${order.id} enviada para aprobación`);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    } catch (err) {
      console.error(
        `[TechnicianDashboard] Error al enviar orden #${order.id}:`,
        err
      );
      toast.error(err.message || "Error al enviar la orden para aprobación");
    }
  };

  const modalOrders = technicianOrders.filter((order) =>
    modalType === "pending"
      ? order.status === "En Proceso"
      : order.status === "Finalizado"
  );

  return (
    <MainContainer fluid>
      <Sidebar
        menuItems={baseTechnicianMenu}
        title="Menú"
        className={isSidebarOpen ? "open" : ""}
      />
      <Content>
        <MobileToggleButton onClick={toggleSidebar}>
          {isSidebarOpen ? "Cerrar" : "Menú"}
        </MobileToggleButton>
        <DashboardHeader title="Panel de Técnico" />
        <Container fluid>
          <ContentBtn>
            <h3>Estadísticas</h3>
          </ContentBtn>
          <StatCardsContainer stats={stats} />
          <ContentBtn>
            <h3>Órdenes de Servicio</h3>
            <CustomButton onClick={() => navigate("/technician/create-order")}>
              Nueva Orden
            </CustomButton>
          </ContentBtn>
          <OrderFilters
            economicNumberFilter={economicNumberFilter}
            setEconomicNumberFilter={setEconomicNumberFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            orderNumberFilter={orderNumberFilter}
            setOrderNumberFilter={setOrderNumberFilter}
          />
          <OrderList orders={filteredOrders} />
        </Container>

        <StyledModal
          show={showModal}
          onHide={() => closeModal("main")}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {modalType === "pending"
                ? "Órdenes Pendientes"
                : "Órdenes Finalizadas"}
            </Modal.Title>
          </Modal.Header>
          <ModalBody>
            {modalOrders.length > 0 ? (
              <TableWrapper>
                <StyledTableModal striped bordered hover>
                  <thead>
                    <tr>
                      <th>Núm. Económico</th>
                      <th>Orden</th>
                      <th>Fecha Ingreso</th>
                      <th>Diagnóstico</th>
                      <th>
                        {modalType === "pending" ? "Notificación" : "Acción"}
                      </th>
                      {modalType === "pending" && <th>Acción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {modalOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.vehicle_economic_number}</td>
                        <td>{order.id}</td>
                        <td>
                          {new Date(order.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </td>
                        <td
                          title={order.initial_diagnosis || "Sin diagnóstico"}
                        >
                          {(
                            order.initial_diagnosis || "Sin diagnóstico"
                          ).substring(0, 50) +
                            (order.initial_diagnosis?.length > 50 ? "..." : "")}
                        </td>
                        <td>
                          {modalType === "pending" ? (
                            order.notifications?.length > 0 ? (
                              "🔔"
                            ) : (
                              "Ninguna"
                            )
                          ) : (
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => handleViewFinalizedOrder(order)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                          )}
                        </td>
                        {modalType === "pending" && (
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                            >
                              Actualizar
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </StyledTableModal>
              </TableWrapper>
            ) : (
              <p>
                No hay órdenes{" "}
                {modalType === "pending" ? "pendientes" : "finalizadas"}.
              </p>
            )}
          </ModalBody>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => closeModal("main")}>
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>

        <OrderDetailsModal
          show={showOrderCardDetailsModal}
          onHide={() => closeModal("details")}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Detalles de la Orden #{selectedOrder?.id}</Modal.Title>
          </Modal.Header>
          <OrderDetailsBody>
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                isReadOnly={true}
                isModal={true}
                hideButtons={true}
              />
            )}
          </OrderDetailsBody>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => closeModal("details")}>
              Cerrar
            </Button>
            {selectedOrder?.status === "En Proceso" && (
              <Button variant="primary" onClick={handleEditFromOrderCardModal}>
                Actualizar Orden
              </Button>
            )}
          </Modal.Footer>
        </OrderDetailsModal>

        <StyledModal
          show={showEditModal}
          onHide={() => closeModal("edit", "main")}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Actualizar Orden #{selectedOrder?.id}</Modal.Title>
          </Modal.Header>
          <ModalBody>
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                onClose={(updatedOrder) => {
                  if (updatedOrder) {
                    setOrders((prev) =>
                      prev.map((o) =>
                        o.id === updatedOrder.id
                          ? {
                              ...o,
                              ...updatedOrder,
                              vehicle_economic_number:
                                updatedOrder.vehicle_economic_number ||
                                o.vehicle_economic_number,
                              branch: updatedOrder.branch || o.branch,
                              kilometraje:
                                updatedOrder.kilometraje || o.kilometraje,
                              vin: updatedOrder.vin || o.vin,
                              plate: updatedOrder.plate || o.plate,
                              brand: updatedOrder.brand || o.brand,
                              model: updatedOrder.model || o.model,
                              year: updatedOrder.year || o.year,
                              parts: updatedOrder.parts || o.parts,
                            }
                          : o
                      )
                    );
                    setSelectedOrder({
                      ...selectedOrder,
                      ...updatedOrder,
                      vehicle_economic_number:
                        updatedOrder.vehicle_economic_number ||
                        selectedOrder.vehicle_economic_number,
                      branch: updatedOrder.branch || selectedOrder.branch,
                      kilometraje:
                        updatedOrder.kilometraje || selectedOrder.kilometraje,
                      vin: updatedOrder.vin || selectedOrder.vin,
                      plate: updatedOrder.plate || selectedOrder.plate,
                      brand: updatedOrder.brand || selectedOrder.brand,
                      model: updatedOrder.model || selectedOrder.model,
                      year: updatedOrder.year || selectedOrder.year,
                      parts: updatedOrder.parts || selectedOrder.parts,
                    });
                  }
                  closeModal("edit", "main", "pending");
                }}
                isModal={true}
                disableFields={["serviceType", "serviceDescription"]}
                formRef={formRef}
              />
            )}
          </ModalBody>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => closeModal("edit", "main")}
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateOrder}
              disabled={isSubmitting}
            >
              Actualizar
            </Button>
          </Modal.Footer>
        </StyledModal>

        <StyledModal
          show={showViewFinalizedModal}
          onHide={() => closeModal("finalized", "main", "completed")}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Detalles de la Orden #{selectedOrder?.id}</Modal.Title>
          </Modal.Header>
          <ModalBody>
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                isReadOnly={true}
                isModal={true}
                hideButtons={true}
              />
            )}
          </ModalBody>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => closeModal("finalized", "main", "completed")}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>
      </Content>
    </MainContainer>
  );
};

export default TechnicianDashboard;
