import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Table, Button, Modal } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import TechnicianCreateOrder from "./TechnicianCreateOrder";
import { getOrders } from "../services/orderService";
import {
  MainContainer,
  Content,
  TableWrapper,
  StyledTableModal,
  OrderDetailsModal,
  OrderDetailsBody,
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
} from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faCircle } from "@fortawesome/free-solid-svg-icons";

const HighlightedTd = styled.td`
  background-color: #e9ecef;
`;

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
      default:
        return "#6c757d"; // Gris
    }
  }};
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
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await getOrders({
          technician_id: user.id,
          limit: 1000,
        });
        console.log("[TechnicianHistory] Respuesta de getOrders:", ordersData);

        // Validar que ordersData.orders sea un arreglo
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
      } catch (err) {
        console.error("[TechnicianHistory] Error al cargar órdenes:", err);
        toast.error(err.message || "Error al cargar órdenes");
        setOrders([]);
      }
    };
    fetchOrders();
  }, [user.id]);

  const filteredOrders = orders
    .filter((order) =>
      economicNumberFilter
        ? order.vehicle_economic_number.includes(economicNumberFilter)
        : true
    )
    .filter((order) => (statusFilter ? order.status === statusFilter : true));

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

  return (
    <MainContainer fluid>
      <Sidebar menuItems={technicianMenu} title="Menú" />
      <Content>
        <DashboardHeader title="Historial de Órdenes" />
        <Container fluid>
          <h3>Todas las Órdenes</h3>
          <StyledFiltersContainer>
            <FilterGroup>
              <FilterLabel>Filtrar por N° Económico:</FilterLabel>
              <FilterInput
                type="text"
                value={economicNumberFilter}
                onChange={(e) => setEconomicNumberFilter(e.target.value)}
                placeholder="Buscar por número económico"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Filtrar por Estado:</FilterLabel>
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
          {filteredOrders.length > 0 ? (
            <TableWrapper>
              <StyledTableModal striped bordered hover>
                <thead>
                  <tr>
                    <th>N° Orden</th>
                    <th>N° Económico</th>
                    <th>Descripción</th>
                    <th>Fecha Ingreso/Finalización</th>
                    <th>Estado</th>
                    <th>Novedades</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <HighlightedTd>
                        {order.vehicle_economic_number}
                      </HighlightedTd>
                      <td>{order.description}</td>
                      <td>
                        {formatDate(order.created_at)} /{" "}
                        {order.status === "Finalizado"
                          ? formatDate(
                              order.history?.[order.history.length - 1]?.date
                            )
                          : "-"}
                      </td>
                      <td>
                        <StatusIcon status={order.status}>
                          <FontAwesomeIcon icon={faCircle} />
                        </StatusIcon>
                        {order.status}
                      </td>
                      <td>
                        {order.notifications?.length > 0
                          ? order.notifications.map((n) => n.message).join(", ")
                          : "-"}
                      </td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <FontAwesomeIcon icon={faEye} /> Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTableModal>
            </TableWrapper>
          ) : (
            <EmptyMessage>
              <p>
                No hay órdenes en el historial con los filtros seleccionados.
              </p>
            </EmptyMessage>
          )}
        </Container>

        {/* Modal de detalles */}
        <OrderDetailsModal
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
        </OrderDetailsModal>
      </Content>
    </MainContainer>
  );
};

export default TechnicianHistory;
