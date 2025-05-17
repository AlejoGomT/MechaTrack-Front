import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Table, Button, Modal, Pagination } from "react-bootstrap";
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
import { faEye, faBell } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await getOrders({
          technician_id: user.id,
          page: currentPage,
          limit: pageSize,
          economicNumber: economicNumberFilter,
          status: statusFilter || undefined,
          orderNumber: orderNumberFilter,
          serviceType: serviceTypeFilter || undefined,
        });
        console.log("[TechnicianHistory] Respuesta de getOrders:", ordersData);

        if (!Array.isArray(ordersData.orders)) {
          console.error(
            "[TechnicianHistory] Respuesta inválida de getOrders, se esperaba un arreglo en orders:",
            ordersData
          );
          setOrders([]);
          toast.error("Respuesta inválida al cargar órdenes");
          return;
        }

        setOrders(ordersData.orders);
        setTotalPages(
          Math.ceil((ordersData.total || ordersData.orders.length) / pageSize)
        );
      } catch (err) {
        console.error("[TechnicianHistory] Error al cargar órdenes:", err);
        toast.error(err.message || "Error al cargar órdenes");
        setOrders([]);
        setTotalPages(1);
      }
    };
    fetchOrders();
  }, [
    user.id,
    currentPage,
    economicNumberFilter,
    statusFilter,
    orderNumberFilter,
    serviceTypeFilter,
  ]);

  const formatDate = (dateStr) => {
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
                value={orderNumberFilter}
                onChange={(e) => setOrderNumberFilter(e.target.value)}
                placeholder="Filtrar por N° Orden"
              />
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
              <FilterLabel>Tipo de Servicio</FilterLabel>
              <FilterSelect
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {orders
                  .map((order) => order.type)
                  .filter(
                    (type, index, self) => type && self.indexOf(type) === index
                  )
                  .map((type) => (
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
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Finalizado">Finalizado</option>
              </FilterSelect>
            </FilterGroup>
          </StyledFiltersContainer>
          {orders.length > 0 ? (
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
                        <td>{order.vehicle_economic_number}</td>
                        <td>{order.type || "-"}</td>
                        <td>
                          {formatDate(order.created_at)} /{" "}
                          {order.status === "Finalizado"
                            ? formatDate(order.finalized_at)
                            : "-"}
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
                              <FontAwesomeIcon icon={faBell} />
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
