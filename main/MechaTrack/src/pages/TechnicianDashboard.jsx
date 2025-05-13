import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Modal, Pagination, Container } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCardsContainer from "../components/StatCardsContainer";
import OrderFilters from "../components/OrderFilters";
import OrderList from "../components/OrderList";
import CustomButton from "../components/CustomButton";
import TechnicianCreateOrder from "./TechnicianCreateOrder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import {
  StatusDiv,
  MainContainer,
  Content,
  ContentBtn,
  MobileToggleButton,
  StyledModal,
  ModalBody,
  TableWrapper,
  StyledTable,
  ActionsContainer,
  StatusIcon,
  OrderDetailsModal,
  OrderDetailsBody,
} from "../styles/GlobalStyles";
import {
  getOrders,
  getVehicles,
  updateOrderStatus,
  getOrderCounts,
} from "../services/orderService";
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
  const [showViewPendingApprovalModal, setShowViewPendingApprovalModal] =
    useState(false);
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [inProcessOrdersCount, setInProcessOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const pageSize = 5;
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, vehiclesData, countsData] = await Promise.all([
          getOrders({
            technician_id: user.id,
            page: currentPage,
            limit: pageSize,
            economicNumber: economicNumberFilter,
            status: statusFilter === "Todos" ? undefined : statusFilter,
            orderNumber: orderNumberFilter,
            startDate: startDateFilter,
            endDate: endDateFilter,
          }),
          getVehicles({ limit: 1000 }),
          getOrderCounts({ technician_id: user.id }),
        ]);
        console.log(
          "[TechnicianDashboard] Respuesta de getOrders:",
          ordersData
        );
        console.log(
          "[TechnicianDashboard] Respuesta de getOrderCounts:",
          countsData
        );

        if (!Array.isArray(ordersData.orders)) {
          console.error(
            "[TechnicianDashboard] Respuesta inválida de getOrders, se esperaba un arreglo en orders:",
            ordersData
          );
          setOrders([]);
          toast.error("Respuesta inválida al cargar órdenes");
          return;
        }

        if (
          !countsData ||
          typeof countsData !== "object" ||
          !("inProcess" in countsData)
        ) {
          console.error(
            "[TechnicianDashboard] Respuesta inválida de getOrderCounts:",
            countsData
          );
          setInProcessOrdersCount(0);
          setPendingOrdersCount(0);
          setCompletedOrdersCount(0);
          toast.error("Respuesta inválida al cargar conteos");
        } else {
          setInProcessOrdersCount(countsData.inProcess || 0);
          setPendingOrdersCount(countsData.pending || 0);
          setCompletedOrdersCount(countsData.completed || 0);
        }

        setOrders(ordersData.orders);
        setTotalPages(
          Math.ceil((ordersData.total || ordersData.orders.length) / pageSize)
        );
        setVehicles(
          Array.isArray(vehiclesData.vehicles) ? vehiclesData.vehicles : []
        );
      } catch (err) {
        console.error("[TechnicianDashboard] Error al cargar datos:", err);
        toast.error(err.message || "Error al cargar datos");
        setOrders([]);
        setVehicles([]);
        setInProcessOrdersCount(0);
        setPendingOrdersCount(0);
        setCompletedOrdersCount(0);
      }
    };
    fetchData();
  }, [
    user.id,
    currentPage,
    economicNumberFilter,
    statusFilter,
    orderNumberFilter,
    startDateFilter,
    endDateFilter,
  ]);

  useEffect(() => {
    if (showModal && modalType) {
      const fetchModalOrders = async () => {
        try {
          const status =
            modalType === "in-process"
              ? "En Proceso"
              : modalType === "pending-approval"
              ? "Pendiente"
              : "Finalizado";
          const ordersData = await getOrders({
            technician_id: user.id,
            status,
            page: modalCurrentPage,
            limit: pageSize,
            startDate: startDateFilter,
            endDate: endDateFilter,
          });

          if (!Array.isArray(ordersData.orders)) {
            setOrders([]);
            toast.error("Respuesta inválida al cargar órdenes");
            return;
          }

          setOrders(ordersData.orders);
          setModalTotalPages(
            Math.ceil((ordersData.total || ordersData.orders.length) / pageSize)
          );
        } catch (err) {
          toast.error(err.message || "Error al cargar órdenes");
          setOrders([]);
        }
      };
      fetchModalOrders();
    }
  }, [
    modalType,
    modalCurrentPage,
    user.id,
    showModal,
    startDateFilter,
    endDateFilter,
  ]);

  const technicianOrders = orders.filter(
    (order) => order.technician_id === user.id
  );
  const activeAndPendingOrders = technicianOrders.filter((order) =>
    ["En Proceso", "Pendiente"].includes(order.status)
  );

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
      const matchesDateRange =
        startDateFilter && endDateFilter
          ? new Date(order.created_at) >= new Date(startDateFilter) &&
            new Date(order.created_at) <= new Date(endDateFilter)
          : true;
      return (
        matchesStatus &&
        matchesOrderNumber &&
        matchesEconomicNumber &&
        matchesDateRange
      );
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
      title: "Órdenes En Proceso",
      content: inProcessOrdersCount.toString(),
      buttonText: "Ver Detalles",
      onClick: () => {
        setModalType("in-process");
        setModalCurrentPage(1);
        setShowModal(true);
      },
    },
    {
      title: "Órdenes Pendientes por Aprobación",
      content: pendingOrdersCount.toString(),
      buttonText: "Ver Detalles",
      onClick: () => {
        setModalType("pending-approval");
        setModalCurrentPage(1);
        setShowModal(true);
      },
    },
    {
      title: "Órdenes Finalizadas",
      content: completedOrdersCount.toString(),
      buttonText: "Ver Detalles",
      onClick: () => {
        setModalType("completed");
        setModalCurrentPage(1);
        setShowModal(true);
      },
    },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const closeModal = (type, nextModal = null, nextModalType = null) => {
    if (type === "main") {
      setShowModal(false);
      setModalType("");
      setModalCurrentPage(1);
    } else if (type === "edit") {
      setShowEditModal(false);
      setSelectedOrder(null);
    } else if (type === "details") {
      setShowOrderCardDetailsModal(false);
      setSelectedOrder(null);
    } else if (type === "finalized") {
      setShowViewFinalizedModal(false);
      setSelectedOrder(null);
    } else if (type === "pending-approval") {
      setShowViewPendingApprovalModal(false);
      setSelectedOrder(null);
    }
    if (nextModal === "main") {
      setModalType(nextModalType || "in-process");
      setModalCurrentPage(1);
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

  const handleViewPendingApprovalOrder = (order) => {
    setSelectedOrder(order);
    setShowViewPendingApprovalModal(true);
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
      const countsData = await getOrderCounts({ technician_id: user.id });
      setInProcessOrdersCount(countsData.inProcess || 0);
      setPendingOrdersCount(countsData.pending || 0);
      setCompletedOrdersCount(countsData.completed || 0);
    } catch (err) {
      console.error(
        `[TechnicianDashboard] Error al enviar orden #${order.id}:`,
        err
      );
      toast.error(err.message || "Error al enviar la orden para aprobación");
    }
  };

  const modalOrders = technicianOrders.filter((order) => {
    if (modalType === "in-process") return order.status === "En Proceso";
    if (modalType === "pending-approval") return order.status === "Pendiente";
    if (modalType === "completed") return order.status === "Finalizado";
    return false;
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleModalPageChange = (page) => {
    setModalCurrentPage(page);
  };

  const renderPagination = (current, total, onPageChange) => {
    const items = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, current - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(total, startPage + maxPagesToShow - 1);

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => current > 1 && onPageChange(current - 1)}
        disabled={current === 1}
      />
    );

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === current}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => current < total && onPageChange(current + 1)}
        disabled={current === total}
      />
    );

    return <Pagination>{items}</Pagination>;
  };

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
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
          />
          <OrderList orders={filteredOrders} />
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              {renderPagination(currentPage, totalPages, handlePageChange)}
            </div>
          )}
        </Container>

        <StyledModal
          show={showModal}
          onHide={() => closeModal("main")}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {modalType === "in-process"
                ? "Órdenes En Proceso"
                : modalType === "pending-approval"
                ? "Órdenes Pendientes por Aprobación"
                : "Órdenes Finalizadas"}
            </Modal.Title>
          </Modal.Header>
          <ModalBody>
            {modalOrders.length > 0 ? (
              <>
                <TableWrapper>
                  <StyledTable>
                    <thead>
                      <tr>
                        <th>Número Económico</th>
                        <th>Orden</th>
                        <th>Fecha Ingreso</th>
                        <th>Estado</th>
                        <th>Acciones</th>
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
                          <td>
                            <StatusDiv
                              variant={
                                modalType === "in-process"
                                  ? "inProcess"
                                  : modalType === "pending-approval"
                                  ? "pending"
                                  : "completed"
                              }
                            >
                              {order.status}
                            </StatusDiv>
                          </td>
                          <td className="actions">
                            <ActionsContainer>
                              <CustomButton
                                onClick={() =>
                                  modalType === "pending-approval"
                                    ? handleViewPendingApprovalOrder(order)
                                    : modalType === "completed"
                                    ? handleViewFinalizedOrder(order)
                                    : handleEditOrder(order)
                                }
                                title={
                                  modalType === "in-process"
                                    ? "Actualizar"
                                    : "Ver"
                                }
                              >
                                <FontAwesomeIcon
                                  icon={
                                    modalType === "in-process" ? faEdit : faEye
                                  }
                                />
                              </CustomButton>
                            </ActionsContainer>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </StyledTable>
                </TableWrapper>
                {modalTotalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    {renderPagination(
                      modalCurrentPage,
                      modalTotalPages,
                      handleModalPageChange
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>
                No hay órdenes{" "}
                {modalType === "in-process"
                  ? "en proceso"
                  : modalType === "pending-approval"
                  ? "pendientes por aprobación"
                  : "finalizadas"}
                .
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
          <ModalBody variant="updateOrderModal">
            {selectedOrder && (
              <TechnicianCreateOrder
                order={selectedOrder}
                onClose={async (updatedOrder) => {
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
                    const countsData = await getOrderCounts({
                      technician_id: user.id,
                    });
                    setInProcessOrdersCount(countsData.inProcess || 0);
                    setPendingOrdersCount(countsData.pending || 0);
                    setCompletedOrdersCount(countsData.completed || 0);
                  }
                  closeModal("edit", "main", "in-process");
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

        <StyledModal
          show={showViewPendingApprovalModal}
          onHide={() =>
            closeModal("pending-approval", "main", "pending-approval")
          }
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
              onClick={() =>
                closeModal("pending-approval", "main", "pending-approval")
              }
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
