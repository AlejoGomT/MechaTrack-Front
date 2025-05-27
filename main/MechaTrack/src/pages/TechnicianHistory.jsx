import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  Container,
  Table,
  Button,
  Modal,
  Pagination,
  Spinner,
} from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import TechnicianCreateOrder from "./TechnicianCreateOrder";
import { getOrders } from "../services/orderService";
import {
  MainContainer,
  Content,
  TableWrapper,
  StyledTable,
  ActionsContainer,
  StatusDiv,
  OrderDetailsBody,
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
  NavLink,
  StyledModal,
} from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";

const NotificationIcon = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  color: #6c757d;
  &:hover {
    color: #d74a49;
  }
`;

const NotificationCount = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #d74a49;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 50%;
  line-height: 1;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
  margin-top: 20px;
`;

const StyledFiltersContainer = styled(FiltersContainer)`
  background-color: #f1f3f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const technicianMenu = [
  { label: "Inicio", path: "../technician" },
  { label: "Crear Orden de Servicio", path: "../technician/create-order" },
  { label: "Historial de Órdenes", path: "../technician/history" },
  { label: "Notificaciones", path: "../technician/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const TechnicianHistory = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;
  const allowedStatuses = ["En Proceso", "Pendiente", "Finalizado"];

  // Función para cargar órdenes
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const ordersData = await getOrders({
        technician_id: user.id,
        page: currentPage,
        limit: pageSize,
        economicNumber: economicNumberFilter,
        status: statusFilter || undefined,
        orderNumber: orderNumberFilter,
        serviceType: serviceTypeFilter || undefined,
        statuses: allowedStatuses, // Filtrar solo estados permitidos
      });
      console.log("[TechnicianHistory] Respuesta de getOrders:", ordersData);

      if (!Array.isArray(ordersData.orders)) {
        console.error(
          "[TechnicianHistory] Respuesta inválida de getOrders, se esperaba un arreglo en orders:",
          ordersData
        );
        setOrders([]);
        toast.error("Respuesta inválida al cargar órdenes");
        setTotalPages(1);
        return;
      }

      // Asegurar que cada orden tenga notifications inicializado
      const processedOrders = ordersData.orders
        .filter((order) => allowedStatuses.includes(order.status))
        .map((order) => ({
          ...order,
          notifications: order.notifications || [],
        }));

      setOrders(processedOrders);
      setTotalPages(
        Math.ceil((ordersData.total || ordersData.orders.length) / pageSize)
      );
      console.log(
        "[TechnicianHistory] Órdenes establecidas:",
        processedOrders.length
      );
    } catch (err) {
      console.error("[TechnicianHistory] Error al cargar órdenes:", err);
      toast.error(err.message || "Error al cargar órdenes");
      setOrders([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [
    user.id,
    currentPage,
    economicNumberFilter,
    statusFilter,
    orderNumberFilter,
    serviceTypeFilter,
  ]);

  // Cargar órdenes iniciales
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounce para filtros de texto
  const debouncedSetEconomicNumberFilter = useCallback(
    debounce((value) => {
      setEconomicNumberFilter(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  const debouncedSetOrderNumberFilter = useCallback(
    debounce((value) => {
      setOrderNumberFilter(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Configurar Socket.IO
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) {
      console.log(
        "[TechnicianHistory] Socket no conectado o usuario no disponible:",
        {
          socket: !!socket,
          isConnected,
          userId: user?.id,
        }
      );
      return;
    }

    // Unirse a sala de usuario
    const userRoom = `USER_${user.id}`;
    socket.emit("joinUser", userRoom);
    console.log(`[TechnicianHistory] Unido a sala de usuario: ${userRoom}`);

    // Unirse a salas de órdenes
    orders.forEach((order) => {
      const orderRoom = order.id;
      socket.emit("joinOrder", orderRoom);
      console.log(`[TechnicianHistory] Unido a sala de orden: ${orderRoom}`);
    });

    // Escuchar nuevas órdenes
    socket.on("order_creation", (newOrder) => {
      console.log("[TechnicianHistory] Nueva orden recibida:", newOrder);
      if (
        newOrder.technician_id === user.id &&
        allowedStatuses.includes(newOrder.status)
      ) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;

          const updatedOrders = [
            { ...newOrder, notifications: newOrder.notifications || [] },
            ...prev,
          ].filter((o) => {
            const matchesEconomic = economicNumberFilter
              ? o.vehicle_economic_number
                  ?.toLowerCase()
                  .includes(economicNumberFilter.toLowerCase())
              : true;
            const matchesOrder = orderNumberFilter
              ? o.id.toString().includes(orderNumberFilter)
              : true;
            const matchesStatus = statusFilter
              ? o.status === statusFilter
              : true;
            const matchesService = serviceTypeFilter
              ? o.type === serviceTypeFilter
              : true;
            return (
              matchesEconomic && matchesOrder && matchesStatus && matchesService
            );
          });

          const newTotalItems = prev.length + 1;
          setTotalPages(Math.ceil(newTotalItems / pageSize));
          return updatedOrders.slice(0, pageSize);
        });
        toast.info(`Nueva orden creada: #${newOrder.id}`);
      }
    });

    // Escuchar actualizaciones de órdenes
    socket.on("order_update", (updatedOrder) => {
      console.log(
        "[TechnicianHistory] Actualización de orden recibida:",
        updatedOrder
      );
      setOrders((prev) => {
        let updatedOrders = prev;
        if (allowedStatuses.includes(updatedOrder.status)) {
          updatedOrders = prev.map((order) =>
            order.id === updatedOrder.id
              ? {
                  ...order,
                  status: updatedOrder.status,
                  finalized_at: updatedOrder.finalized_at,
                }
              : order
          );
        } else {
          updatedOrders = prev.filter((order) => order.id !== updatedOrder.id);
        }
        return updatedOrders.filter((o) => {
          return statusFilter ? o.status === statusFilter : true;
        });
      });
      if (
        updatedOrder.technician_id === user.id &&
        allowedStatuses.includes(updatedOrder.status)
      ) {
        toast.info(
          `Orden #${updatedOrder.id} actualizada a: ${updatedOrder.status}`
        );
      }
    });

    // Escuchar nuevas notificaciones
    socket.on("notification", (notification) => {
      console.log(
        "[TechnicianHistory] Nueva notificación recibida:",
        notification
      );
      if (
        notification.toUserId === user.id &&
        (notification.orderId || notification.order_id)
      ) {
        const orderId = notification.orderId || notification.order_id;
        setOrders((prev) => {
          const updatedOrders = prev.map((order) => {
            if (order.id === orderId) {
              const newNotification = {
                id: notification.id,
                order_id: orderId,
                from_user_id: notification.fromUserId,
                to_user_id: notification.toUserId,
                message: notification.message,
                type: notification.type,
                status: notification.status || "Pendiente",
                created_at: notification.timestamp,
              };
              const updatedNotifications = order.notifications.some(
                (n) => n.id === notification.id
              )
                ? order.notifications
                : [...order.notifications, newNotification];
              return { ...order, notifications: updatedNotifications };
            }
            return order;
          });
          return updatedOrders;
        });
        toast.info(`Nueva notificación para orden #${orderId}`);
      }
    });

    return () => {
      socket.off("order_creation");
      socket.off("order_update");
      socket.off("notification");
      socket.emit("leaveUser", userRoom);
      orders.forEach((order) => socket.emit("leaveOrder", order.id));
      console.log(
        "[TechnicianHistory] Listeners removidos y salas abandonadas"
      );
    };
  }, [
    socket,
    isConnected,
    user?.id,
    orders,
    economicNumberFilter,
    orderNumberFilter,
    statusFilter,
    serviceTypeFilter,
  ]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
      <Sidebar menuItems={technicianMenu} title="Menú" />
      <Content>
        <DashboardHeader title="Historial de Órdenes" />
        <Container fluid>
          <h3>Todas las Órdenes</h3>
          <StyledFiltersContainer>
            <FilterGroup>
              <FilterLabel>Número de Orden</FilterLabel>
              <FilterInput
                type="text"
                defaultValue={orderNumberFilter}
                onChange={(e) => debouncedSetOrderNumberFilter(e.target.value)}
                placeholder="Filtrar por N° Orden"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número Económico</FilterLabel>
              <FilterInput
                type="text"
                defaultValue={economicNumberFilter}
                onChange={(e) =>
                  debouncedSetEconomicNumberFilter(e.target.value)
                }
                placeholder="Filtrar por N° Económico"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Tipo de Servicio</FilterLabel>
              <FilterSelect
                value={serviceTypeFilter}
                onChange={(e) => {
                  setServiceTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos</option>
                {[
                  ...new Set(
                    orders.map((order) => order.type).filter((type) => type)
                  ),
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Estado</FilterLabel>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos</option>
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
          </StyledFiltersContainer>
          {isLoading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p>Cargando órdenes...</p>
            </div>
          ) : orders.length > 0 ? (
            <>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>N° Económico</th>
                      <th>Tipo</th>
                      <th>Ingreso/Finalización</th>
                      <th>Estado</th>
                      <th>Novedades</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.vehicle_economic_number || "-"}</td>
                        <td>{order.type || "-"}</td>
                        <td>
                          {formatDate(order.created_at)} /{" "}
                          {formatDate(order.finalized_at)}
                        </td>
                        <td>
                          <StatusDiv
                            variant={
                              order.status === "En Proceso"
                                ? "inProcess"
                                : order.status === "Pendiente"
                                ? "pending"
                                : order.status === "Finalizado"
                                ? "completed"
                                : ""
                            }
                          >
                            {order.status}
                          </StatusDiv>
                        </td>
                        <td className="text-center">
                          <NavLink
                            href={`/technician/notifications?orderId=${order.id}`}
                          >
                            <NotificationIcon>
                              <FontAwesomeIcon icon={faEye} />
                              {order.notifications?.length > 0 && (
                                <NotificationCount>
                                  {order.notifications.length}
                                </NotificationCount>
                              )}
                            </NotificationIcon>
                          </NavLink>
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
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  {renderPagination(currentPage, totalPages, handlePageChange)}
                </div>
              )}
            </>
          ) : (
            <EmptyMessage>
              <p>
                No hay órdenes en el historial con los filtros seleccionados.
              </p>
            </EmptyMessage>
          )}
        </Container>

        <StyledModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
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
              onClick={() => setShowDetailsModal(false)}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>
      </Content>
    </MainContainer>
  );
};

export default TechnicianHistory;
