import { useState } from "react";
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
import { mockClientOrders, mockVehicles } from "../data/mock";
import { updateOrder } from "../services/orderService";
import { toast } from "react-toastify";

const baseTechnicianMenu = [
  { label: "Inicio", path: "/technician" },
  { label: "Crear Orden de Servicio", path: "/technician/create-order" },
  { label: "Historial de Órdenes", path: "/technician/history" },
  { label: "Notificaciones", path: "/technician/notifications" },
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

  const technicianOrders = mockClientOrders.filter(
    (order) => order.technicianId === user.id
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
        ? order.vehicleEconomicNumber.includes(economicNumberFilter)
        : true
    )
    .map((order) => ({
      id: order.id,
      title: `Orden #${order.id}`,
      content: `Vehículo ${order.vehicleEconomicNumber} - ${order.status} (Ingreso: ${order.createdAt})`,
      status: order.status,
      onViewClick: (id) => {
        const order = technicianOrders.find((o) => o.id === id);
        const vehicle = mockVehicles.find(
          (v) => v.Económico === order.vehicleEconomicNumber
        );
        const enrichedOrder = {
          ...order,
          branch: vehicle?.Sucursal || order.branch || "",
          vehicleEconomicNumber:
            vehicle?.Económico || order.vehicleEconomicNumber,
          kilometraje: vehicle?.Kilometraje || order.kilometraje || "",
          vin: vehicle?.VIN || order.vin || "",
        };
        setSelectedOrder(enrichedOrder);
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

  const userData = {
    userId: user.id,
    userName: user.name,
    activeOrdersCount: activeAndPendingOrders.length,
    notificationsCount,
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleCloseModal = () => {
    setShowModal(false);
    setModalType("");
  };
  const handleEditOrder = (order) => {
    const vehicle = mockVehicles.find(
      (v) => v.Económico === order.vehicleEconomicNumber
    );
    const enrichedOrder = {
      ...order,
      branch: vehicle?.Sucursal || order.branch || "",
      vehicleEconomicNumber: vehicle?.Económico || order.vehicleEconomicNumber,
      kilometraje: vehicle?.Kilometraje || order.kilometraje || "",
      vin: vehicle?.VIN || order.vin || "",
    };
    setSelectedOrder(enrichedOrder);
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
    const vehicle = mockVehicles.find(
      (v) => v.Económico === order.vehicleEconomicNumber
    );
    const enrichedOrder = {
      ...order,
      branch: vehicle?.Sucursal || order.branch || "",
      vehicleEconomicNumber: vehicle?.Económico || order.vehicleEconomicNumber,
      kilometraje: vehicle?.Kilometraje || order.kilometraje || "",
      vin: vehicle?.VIN || order.vin || "",
    };
    setSelectedOrder(enrichedOrder);
    setShowViewFinalizedModal(true);
    setShowModal(false);
  };
  const handleCloseViewFinalizedModal = () => {
    setShowViewFinalizedModal(false);
    setSelectedOrder(null);
    setModalType("completed");
    setShowModal(true); // Restauramos el comportamiento original
  };

  const handleUpdateOrder = (formData) => {
    const updatedOrder = {
      ...selectedOrder,
      ...formData,
      history: [
        ...selectedOrder.history,
        {
          description: formData.diagnosis,
          date: new Date().toISOString().split("T")[0],
          status: selectedOrder.status,
        },
      ],
    };
    updateOrder(updatedOrder);
    toast.success(`Orden #${updatedOrder.id} actualizada satisfactoriamente`);
    setShowEditModal(false);
    setSelectedOrder(updatedOrder);
    if (showOrderCardDetailsModal) {
      setShowOrderCardDetailsModal(true); // Volver al modal de detalles
    } else {
      setModalType("pending");
      setShowModal(true); // Volver al modal de pendientes
    }
  };

  const finishOrder = (order) => {
    const updatedOrder = {
      ...order,
      status: "Pendiente",
      notifications: order.notifications
        ? [
            ...order.notifications,
            {
              message: `Orden ${order.id} finalizada, esperando aprobación`,
              to: "U001",
              status: "Pendiente",
              date: new Date().toISOString().split("T")[0],
            },
          ]
        : [
            {
              message: `Orden ${order.id} finalizada, esperando aprobación`,
              to: "U001",
              status: "Pendiente",
              date: new Date().toISOString().split("T")[0],
            },
          ],
    };
    updateOrder(updatedOrder);
    toast.info(`Orden #${order.id} enviada para aprobación`);
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
        <DashboardHeader title="Panel de Técnico" {...userData} />
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
                        <td>{order.vehicleEconomicNumber}</td>
                        <td>{order.id}</td>
                        <td>{order.createdAt}</td>
                        <td
                          title={
                            order.history[order.history.length - 1]
                              ?.description || "Sin diagnóstico"
                          }
                        >
                          {order.history[order.history.length - 1]
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
                hideButtons={true} // Ocultamos el botón "Cerrar" interno
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
