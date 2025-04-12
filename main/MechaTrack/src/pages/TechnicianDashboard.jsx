import { useState, useEffect } from "react";
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
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar órdenes del técnico
        const ordersData = await getOrders({ technician_id: user.id });
        setOrders(ordersData);

        // Cargar vehículos
        const vehiclesData = await getVehicles();
        setVehicles(vehiclesData);
      } catch (err) {
        toast.error("Error al cargar datos");
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
  const notificationsCount = technicianOrders.filter(
    (order) => order.notifications?.length > 0
  ).length;

  const filteredOrders = activeAndPendingOrders
    .filter((order) =>
      economicNumberFilter
        ? order.vehicle_economic_number.includes(economicNumberFilter)
        : true
    )
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
        finishOrder(order);
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

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType("");
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
    setShowModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
    setModalType("pending");
    setShowModal(true);
  };

  const handleCloseOrderCardDetailsModal = () => {
    setShowOrderCardDetailsModal(false);
    setSelectedOrder(null);
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

  const handleCloseViewFinalizedModal = () => {
    setShowViewFinalizedModal(false);
    setSelectedOrder(null);
    setModalType("completed");
    setShowModal(true);
  };

  const handleUpdateOrder = async (formData) => {
    try {
      const updatedOrder = await updateOrder(selectedOrder.id, {
        description: formData.serviceDescription,
        initial_diagnosis: formData.diagnosis,
        tasks: formData.tasks,
        images: formData.images,
      });
      toast.success(`Orden #${updatedOrder.id} actualizada satisfactoriamente`);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      setShowEditModal(false);
      setSelectedOrder(updatedOrder);
      if (showOrderCardDetailsModal) {
        setShowOrderCardDetailsModal(true);
      } else {
        setModalType("pending");
        setShowModal(true);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error al actualizar la orden"
      );
    }
  };

  const finishOrder = async (order) => {
    try {
      const updatedOrder = await updateOrder(order.id, {
        status: "Pendiente",
      });
      toast.info(`Orden #${order.id} enviada para aprobación`);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Error al enviar la orden para aprobación"
      );
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
          />
          <OrderList orders={filteredOrders} />
        </Container>

        {/* Modal principal (StatCard) */}
        <StyledModal show={showModal} onHide={handleCloseModal} centered>
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
                          title={
                            order.history?.[order.history.length - 1]
                              ?.description || "Sin diagnóstico"
                          }
                        >
                          {order.history?.[order.history.length - 1]
                            ?.description || "Sin diagnóstico"}
                        </td>
                        <td>
                          {modalType === "pending" ? (
                            order.notifications?.length > 0 ? (
                              "🔔"
                            ) : (
                              "-"
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
            <Button variant="secondary" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>

        {/* Modal para detalles de órdenes desde OrderCard */}
        <OrderDetailsModal
          show={showOrderCardDetailsModal}
          onHide={handleCloseOrderCardDetailsModal}
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
              />
            )}
          </OrderDetailsBody>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseOrderCardDetailsModal}
            >
              Cerrar
            </Button>
            {selectedOrder?.status === "En Proceso" && (
              <Button variant="primary" onClick={handleEditFromOrderCardModal}>
                Actualizar Orden
              </Button>
            )}
          </Modal.Footer>
        </OrderDetailsModal>

        {/* Modal para editar órdenes */}
        <StyledModal
          show={showEditModal}
          onHide={handleCloseEditModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Actualizar Orden #{selectedOrder?.id}</Modal.Title>
          </Modal.Header>
          <ModalBody>
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                onClose={handleUpdateOrder}
                isModal={true}
                disableFields={["serviceType", "serviceDescription"]}
                hideButtons={true}
              />
            )}
          </ModalBody>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEditModal}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => document.querySelector("form").requestSubmit()}
            >
              Actualizar
            </Button>
          </Modal.Footer>
        </StyledModal>

        {/* Modal para ver órdenes finalizadas */}
        <StyledModal
          show={showViewFinalizedModal}
          onHide={handleCloseViewFinalizedModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Detalles de la Orden #{selectedOrder?.id}</Modal.Title>
          </Modal.Header>
          <ModalBody>
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                onClose={handleCloseViewFinalizedModal}
                isReadOnly={true}
                isModal={true}
                hideButtons={true}
              />
            )}
          </ModalBody>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseViewFinalizedModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>
      </Content>
    </MainContainer>
  );
};

export default TechnicianDashboard;
