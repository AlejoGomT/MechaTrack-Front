import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Modal,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Card,
  Carousel,
  Row,
  Container,
  Pagination,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
import * as Papa from "papaparse";
import { debounce } from "lodash";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import {
  MainContainer,
  StyledTable,
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
  StyledModal,
  ModalBody,
  StatusDiv,
  StatsContainer,
  StatCard,
  StyledCarousel,
  CarouselItemDiv,
  OverlayText,
  NotificationMessage,
  ActionsContainer,
  FormSectionTitle,
  InfoGrid,
  DetailLabel,
  DetailValue,
  TableWrapper,
  Content,
} from "../styles/GlobalStyles";
import { colors } from "../styles/GlobalStyles";
import {
  getOrders,
  getOrderById,
  getOrderCounts,
} from "../services/orderService";
import { API_URL } from "../services/apiConfig";
import axiosInstance from "../services/apiConfig";
import styled from "@emotion/styled";
import { toast } from "react-toastify";

const StyledFiltersContainer = styled(FiltersContainer)`
  background-color: #f1f3f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
  margin-top: 20px;
`;

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas Vehículo", path: "/client/query" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientQuery = () => {
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    inProcess: 0,
    pending: 0,
    completed: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [branches, setBranches] = useState([]);
  const pageSize = 10;

  // Cargar sucursales desde el backend
  const loadBranches = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/orders/branches");
      setBranches(response.data || []);
      console.log("[ClientQuery] Sucursales cargadas:", response.data);
    } catch (error) {
      console.error("[ClientQuery] Error cargando sucursales:", error);
      toast.error("Error al cargar sucursales");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const ordersData = await getOrders({
        orderId: orderNumberFilter,
        economicNumber: economicNumberFilter || undefined,
        branch: branchFilter || undefined,
        page: currentPage,
        limit: pageSize,
      });
      console.log("[ClientQuery] Respuesta de getOrders:", ordersData);

      if (!Array.isArray(ordersData.orders)) {
        console.error(
          "[ClientQuery] Respuesta inválida de getOrders, se esperaba un arreglo en orders:",
          ordersData
        );
        setOrders([]);
        toast.error("Respuesta inválida al cargar órdenes");
        setTotalPages(1);
        return;
      }

      setOrders(ordersData.orders);
      setTotalPages(
        Math.ceil((ordersData.total || ordersData.orders.length) / pageSize)
      );
      console.log(
        "[ClientQuery] Órdenes establecidas:",
        ordersData.orders.length
      );

      // Calcular contadores manualmente
      const inProcessCount = ordersData.orders.reduce((count, order) => {
        return ["En Proceso", "Pendiente", "Finalizado"].includes(order.status)
          ? count + 1
          : count;
      }, 0);
      const pendingCount = ordersData.orders.reduce((count, order) => {
        return order.status === "Pendiente de Facturación" ? count + 1 : count;
      }, 0);
      const completedCount = ordersData.orders.reduce((count, order) => {
        return order.status === "Facturado" ? count + 1 : count;
      }, 0);

      setStats({
        total: ordersData.total || ordersData.orders.length,
        inProcess: inProcessCount,
        pending: pendingCount,
        completed: completedCount,
      });
    } catch (err) {
      console.error("[ClientQuery] Error al cargar órdenes:", err);
      toast.error(err.message || "Error al cargar órdenes");
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [orderNumberFilter, economicNumberFilter, branchFilter, currentPage]);

  // Cargar datos iniciales
  useEffect(() => {
    loadBranches();
    fetchOrders();
  }, [loadBranches, fetchOrders]);

  // Debounce para filtros de texto
  const debouncedSetOrderNumberFilter = useCallback(
    debounce((value) => {
      setOrderNumberFilter(value);
      setCurrentPage(1);
    }, 100),
    []
  );

  const debouncedSetEconomicNumberFilter = useCallback(
    debounce((value) => {
      setEconomicNumberFilter(value);
      setCurrentPage(1);
    }, 100),
    []
  );

  // Configurar Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) {
      console.warn("[ClientQuery] Socket no conectado o no inicializado");
      return;
    }

    socket.on("notification", (notification) => {
      if (
        ["closure_approval", "closure_rejection", "order_creation"].includes(
          notification.type
        )
      ) {
        setNotifications((prev) => [
          {
            id: notification.id,
            message: notification.message,
            timestamp: new Date(notification.timestamp),
          },
          ...prev.slice(0, 4),
        ]);
        fetchOrders();
        toast.info(notification.message);
      }
    });

    return () => {
      if (socket) {
        socket.off("notification");
      }
    };
  }, [socket, isConnected, fetchOrders]);

  const handleExportCSV = () => {
    try {
      const csvData = orders.map((order) => ({
        "Número de Orden": order.id,
        "Número Económico": order.vehicle_economic_number,
        Estado: getStatusDisplay(order.status),
        "Fecha de Ingreso": order.created_at,
        "Fecha de Finalización": order.finalized_at || "N/A",
        Sucursal: order.vehicle?.branch || "N/A",
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "ordenes_vehiculos.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("[ClientQuery] Error al exportar CSV:", error);
      const csvData = orders.map(
        (order) =>
          `"${order.id}","${order.vehicle_economic_number}","${getStatusDisplay(
            order.status
          )}","${order.created_at}","${order.finalized_at || "N/A"}","${
            order.vehicle?.branch || "N/A"
          }"`
      );
      const csv = [
        "Número de Orden,Número Económico,Estado,Fecha de Ingreso,Fecha de Finalización,Sucursal",
        ...csvData,
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "ordenes_vehiculos_fallback.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShowModal = async (order) => {
    setLoading(true);
    try {
      const detailedOrder = await getOrderById(order.id);
      setSelectedOrder(detailedOrder);
      setShowModal(true);
    } catch (error) {
      console.error("[ClientQuery] Error cargando detalles:", error);
      toast.error("Error al cargar detalles de la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  const getStatusDisplay = (status) => {
    if (["En Proceso", "Pendiente"].includes(status)) {
      return "En Proceso";
    }
    if (status === "Pendiente de Facturación") {
      return "Pendiente de Facturación";
    }
    if (status === "Facturado") {
      return "Orden Finalizada";
    }
    return status;
  };

  const getStatusVariant = (status) => {
    const computedStatus = getStatusDisplay(status);
    if (computedStatus === "Orden Finalizada") return "completed";
    if (computedStatus === "En Proceso") return "inProcess";
    if (computedStatus === "Pendiente de Facturación") return "pending";
    return "";
  };

  const chartData = [
    { name: "En Proceso", value: stats.inProcess, fill: colors.yellow },
    {
      name: "Pendiente de Facturación",
      value: stats.pending,
      fill: colors.blue,
    },
    { name: "Finalizadas", value: stats.completed, fill: colors.green },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
      <Sidebar menuItems={clientMenu} title="Consulta de Cliente" />
      <Content>
        <DashboardHeader
          title="Consulta de Estado de Facturación"
          subtitle="Verifica el estado y el historial de tus órdenes de servicio"
        />
        {!isConnected && (
          <div className="alert alert-warning">
            Conexión en tiempo real perdida. Algunas actualizaciones podrían no
            reflejarse.
          </div>
        )}
        {notifications.length > 0 && (
          <NotificationMessage variant="info">
            {notifications[0].message} (
            {new Date(notifications[0].timestamp).toLocaleString()})
          </NotificationMessage>
        )}
        <Container fluid>
          <ActionsContainer>
            <StatsContainer className="mt-3 w-50 pe-2">
              <Row className="justify-content-between">
                <StatCard>
                  <Card.Body>
                    <Card.Title>Total Órdenes</Card.Title>
                    <Card.Text>{stats.total}</Card.Text>
                  </Card.Body>
                </StatCard>
                <StatCard>
                  <Card.Body>
                    <Card.Title>En Proceso</Card.Title>
                    <Card.Text>{stats.inProcess}</Card.Text>
                  </Card.Body>
                </StatCard>
                <StatCard>
                  <Card.Body>
                    <Card.Title>Pendiente de Facturación</Card.Title>
                    <Card.Text>{stats.pending}</Card.Text>
                  </Card.Body>
                </StatCard>
                <StatCard>
                  <Card.Body>
                    <Card.Title>Finalizadas</Card.Title>
                    <Card.Text>{stats.completed}</Card.Text>
                  </Card.Body>
                </StatCard>
              </Row>
            </StatsContainer>
            <div
              style={{
                margin: "20px 0",
                textAlign: "center",
                maxWidth: "100%",
                overflowX: "auto",
              }}
            >
              <h6>Distribución de Órdenes</h6>
              <BarChart
                width={Math.min(window.innerWidth - 320, 600)}
                height={300}
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" />
              </BarChart>
            </div>
          </ActionsContainer>
          <StyledFiltersContainer>
            <FilterGroup>
              <FilterLabel>Número de Orden</FilterLabel>
              <FilterInput
                type="text"
                value={orderNumberFilter}
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
              <FilterLabel>Sucursal</FilterLabel>
              <FilterSelect
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Exportar resultados a CSV</Tooltip>}
            >
              <CustomButton
                onClick={handleExportCSV}
                aria-label="Exportar a CSV"
              >
                <FontAwesomeIcon icon={faDownload} /> Exportar
              </CustomButton>
            </OverlayTrigger>
          </StyledFiltersContainer>
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" style={{ color: colors.primary }} />
              <p>Cargando órdenes...</p>
            </div>
          ) : orders.length > 0 ? (
            <>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Número Económico</th>
                      <th>Estado</th>
                      <th>Ingreso/Finalización</th>
                      <th>Sucursal</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.vehicle_economic_number || "-"}</td>
                        <td>
                          <StatusDiv variant={getStatusVariant(order.status)}>
                            {getStatusDisplay(order.status)}
                          </StatusDiv>
                        </td>
                        <td>
                          {formatDate(order.created_at)} /{" "}
                          {formatDate(order.finalized_at)}
                        </td>
                        <td>{order.branch}</td>
                        <td className="actions">
                          <ActionsContainer>
                            <CustomButton
                              onClick={() => handleShowModal(order)}
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
                  {renderPagination(currentPage, totalPages, setCurrentPage)}
                </div>
              )}
            </>
          ) : (
            <EmptyMessage>
              <p>No hay órdenes disponibles con los filtros seleccionados.</p>
            </EmptyMessage>
          )}
          <StyledModal
            show={showModal}
            onHide={handleCloseModal}
            variant="orderDetails"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Detalles de la Orden #{selectedOrder?.id}
              </Modal.Title>
            </Modal.Header>
            <ModalBody>
              {loading ? (
                <p>Cargando detalles...</p>
              ) : selectedOrder ? (
                <div>
                  <FormSectionTitle>Información del Vehículo</FormSectionTitle>
                  <InfoGrid>
                    <div>
                      <DetailLabel>Número Económico</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle_economic_number}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Marca</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle?.brand || "N/A"}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Modelo</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle?.model || "N/A"}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Año</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle?.year || "N/A"}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Sucursal</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle?.branch || "N/A"}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Placa</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle?.plate || "N/A"}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Kilometraje</DetailLabel>
                      <DetailValue>
                        {selectedOrder.vehicle?.mileage || "N/A"}
                      </DetailValue>
                    </div>
                  </InfoGrid>

                  <FormSectionTitle>Detalles de la Orden</FormSectionTitle>
                  <InfoGrid>
                    <div>
                      <DetailLabel>Número de Orden</DetailLabel>
                      <DetailValue>{selectedOrder.id}</DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Estado</DetailLabel>
                      <DetailValue>
                        {getStatusDisplay(selectedOrder.status)}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Fecha de Ingreso</DetailLabel>
                      <DetailValue>
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Fecha de Finalización</DetailLabel>
                      <DetailValue>
                        {selectedOrder.finalized_at
                          ? new Date(
                              selectedOrder.finalized_at
                            ).toLocaleString()
                          : "N/A"}
                      </DetailValue>
                    </div>
                    <div className="full-width">
                      <DetailLabel>Descripción</DetailLabel>
                      <DetailValue>
                        {selectedOrder.description || "Sin descripción"}
                      </DetailValue>
                    </div>
                    <div className="full-width">
                      <DetailLabel>Diagnóstico Inicial</DetailLabel>
                      <DetailValue>
                        {selectedOrder.initial_diagnosis || "N/A"}
                      </DetailValue>
                    </div>
                    <div className="full-width">
                      <DetailLabel>Tareas</DetailLabel>
                      <DetailValue>{selectedOrder.tasks || "N/A"}</DetailValue>
                    </div>
                  </InfoGrid>

                  {selectedOrder.status === "Facturado" &&
                    selectedOrder.invoice && (
                      <>
                        <FormSectionTitle>
                          Información de Factura
                        </FormSectionTitle>
                        <InfoGrid>
                          <div>
                            <DetailLabel>Número de Factura</DetailLabel>
                            <DetailValue>
                              {selectedOrder.invoice.invoice_number}
                            </DetailValue>
                          </div>
                          <div>
                            <DetailLabel>Número de Albarán</DetailLabel>
                            <DetailValue>
                              {selectedOrder.invoice.delivery_note_number ||
                                "N/A"}
                            </DetailValue>
                          </div>
                          <div>
                            <DetailLabel>Total</DetailLabel>
                            <DetailValue className="price">
                              ${selectedOrder.invoice.total}
                            </DetailValue>
                          </div>
                        </InfoGrid>
                      </>
                    )}

                  {selectedOrder.images && selectedOrder.images.length > 0 && (
                    <>
                      <FormSectionTitle>Imágenes</FormSectionTitle>
                      <StyledCarousel>
                        {selectedOrder.images.map((img, index) => (
                          <Carousel.Item key={index}>
                            <CarouselItemDiv image={img}>
                              <OverlayText>
                                <img
                                  src={`${API_URL}${img}`}
                                  alt={`Imagen ${index + 1}`}
                                  style={{ maxWidth: "100%" }}
                                />
                              </OverlayText>
                            </CarouselItemDiv>
                          </Carousel.Item>
                        ))}
                      </StyledCarousel>
                    </>
                  )}

                  <FormSectionTitle>Repuestos</FormSectionTitle>
                  {selectedOrder.parts && selectedOrder.parts.length > 0 ? (
                    <TableWrapper>
                      <StyledTable>
                        <thead>
                          <tr>
                            <th>Repuesto</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.parts.map((part, index) => (
                            <tr key={index}>
                              <td>{part.name}</td>
                              <td>{part.quantity}</td>
                              <td>{part.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </StyledTable>
                    </TableWrapper>
                  ) : (
                    <p>No hay repuestos asociados a esta orden.</p>
                  )}

                  <FormSectionTitle>Historial de Órdenes</FormSectionTitle>
                  {selectedOrder.history && selectedOrder.history.length > 0 ? (
                    <TableWrapper>
                      <StyledTable>
                        <thead>
                          <tr>
                            <th>Descripción</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.history.map((item, index) => (
                            <tr key={index}>
                              <td>{item.description}</td>
                              <td>{new Date(item.date).toLocaleString()}</td>
                              <td>{item.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </StyledTable>
                    </TableWrapper>
                  ) : (
                    <p>No hay historial disponible.</p>
                  )}
                </div>
              ) : (
                <p>No se encontraron detalles para esta orden.</p>
              )}
            </ModalBody>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cerrar
              </Button>
            </Modal.Footer>
          </StyledModal>
        </Container>
      </Content>
    </MainContainer>
  );
};

export default ClientQuery;
