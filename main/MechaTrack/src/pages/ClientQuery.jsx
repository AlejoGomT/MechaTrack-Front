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
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faDownload } from "@fortawesome/free-solid-svg-icons";
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
import io from "socket.io-client";
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
  ImageContainer,
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
} from "../styles/GlobalStyles";
import { colors } from "../styles/GlobalStyles";
import {
  getOrders,
  getOrderById,
  getOrderCounts,
} from "../services/orderService";
import { API_URL } from "../services/apiConfig";

const socket = io(API_URL);

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas Vehículo", path: "/client/query" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientQuery = () => {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    orderId: "",
    orderNumber: "",
    economicNumber: "",
    displayStatus: "",
    branch: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [stats, setStats] = useState({
    inProcess: 0,
    pending: 0,
    completed: 0,
  });
  const [notifications, setNotifications] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { orders, totalPages } = await getOrders({
        orderId: filters.orderId || undefined,
        orderNumber: filters.orderNumber || undefined,
        economicNumber: filters.economicNumber || undefined,
        displayStatus: filters.displayStatus || undefined,
        branch: filters.branch || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      console.log("[ClientQuery] Órdenes recibidas:", orders);
      setOrders(orders || []);
      setTotalPages(totalPages || 1);

      const counts = await getOrderCounts();
      setStats({
        inProcess: counts.inProcess || 0,
        pending: counts.pending || 0,
        completed: counts.completed || 0,
      });
    } catch (error) {
      console.error("[ClientQuery] Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();

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
        loadData();
      }
    });

    return () => socket.off("notification");
  }, [loadData]);

  const debouncedFilterChange = useMemo(
    () =>
      debounce((name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
      }, 500),
    []
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (["orderId", "orderNumber", "economicNumber"].includes(name)) {
      debouncedFilterChange(name, value);
    } else {
      setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return orders;
    return [...orders].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      return aValue < bValue
        ? sortConfig.direction === "asc"
          ? -1
          : 1
        : aValue > bValue
        ? sortConfig.direction === "asc"
          ? 1
          : -1
        : 0;
    });
  }, [orders, sortConfig]);

  const handleExportCSV = () => {
    try {
      const csvData = orders.map((order) => ({
        "Número de Orden": order.id,
        "Número de Pedido": order.order_number || "N/A",
        "Número Económico": order.vehicle_economic_number,
        Estado: getStatusDisplay(order.status, filters.displayStatus),
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
          `"${order.id}","${order.order_number || "N/A"}","${
            order.vehicle_economic_number
          }","${getStatusDisplay(order.status, filters.displayStatus)}","${
            order.created_at
          }","${order.finalized_at || "N/A"}","${
            order.vehicle?.branch || "N/A"
          }"`
      );
      const csv = [
        "Número de Orden,Número de Pedido,Número Económico,Estado,Fecha de Ingreso,Fecha de Finalización,Sucursal",
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
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  const getStatusDisplay = (status, displayStatus) => {
    if (
      displayStatus === "En Proceso" &&
      ["En Proceso", "Pendiente", "Finalizado"].includes(status)
    ) {
      return "En Proceso";
    }
    if (
      displayStatus === "Pendiente de Facturación" &&
      status === "Pendiente de Facturación"
    ) {
      return "Pendiente de Facturación";
    }
    if (displayStatus === "Finalizado" && status === "Facturado") {
      return "Orden Finalizada";
    }
    if (["En Proceso", "Pendiente", "Finalizado"].includes(status)) {
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

  const getStatusVariant = (status, displayStatus) => {
    const computedStatus = getStatusDisplay(status, displayStatus);
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

  return (
    <MainContainer fluid>
      <Sidebar menuItems={clientMenu} title="Consulta de Cliente" />
      <div className="content" style={{ marginLeft: "200px", padding: "20px" }}>
        <DashboardHeader
          title="Consulta de Estado de Facturación"
          subtitle="Verifica el estado y el historial de tus órdenes de servicio"
        />
        {notifications.length > 0 && (
          <NotificationMessage variant="info">
            {notifications[0].message} (
            {new Date(notifications[0].timestamp).toLocaleString()})
          </NotificationMessage>
        )}
        <Container className="mt-4 d-flex flex-column align-items-center gap-3">
          <ActionsContainer>
            <StatsContainer className="mt-3">
              <Row className="justify-content-between">
                <StatCard>
                  <Card.Body>
                    <Card.Title>Total Órdenes</Card.Title>
                    <Card.Text>
                      {stats.inProcess + stats.pending + stats.completed}
                    </Card.Text>
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
            <div style={{ margin: "20px 0", textAlign: "center" }}>
              <h6>Distribución de Órdenes</h6>
              <BarChart
                width={400}
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
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Número de Orden</FilterLabel>
              <FilterInput
                type="number"
                name="orderId"
                value={filters.orderId}
                onChange={handleFilterChange}
                placeholder="Ingrese número de orden (ID)"
                aria-label="Filtrar por número de orden"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número de Pedido</FilterLabel>
              <FilterInput
                type="text"
                name="orderNumber"
                value={filters.orderNumber}
                onChange={handleFilterChange}
                placeholder="Ingrese número de pedido"
                aria-label="Filtrar por número de pedido"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Número Económico</FilterLabel>
              <FilterInput
                type="text"
                name="economicNumber"
                value={filters.economicNumber}
                onChange={handleFilterChange}
                placeholder="Ingrese número económico"
                aria-label="Filtrar por número económico"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Estado</FilterLabel>
              <FilterSelect
                name="displayStatus"
                value={filters.displayStatus}
                onChange={handleFilterChange}
                aria-label="Filtrar por estado"
              >
                <option value="">Todos</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente de Facturación">
                  Pendiente de Facturación
                </option>
                <option value="Finalizado">Orden Finalizada</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Sucursal</FilterLabel>
              <FilterSelect
                name="branch"
                value={filters.branch}
                onChange={handleFilterChange}
                aria-label="Filtrar por sucursal"
              >
                <option value="">Todas</option>
                <option value="SALTILLO">SALTILLO</option>
                <option value="TORREON">TORREON</option>
                <option value="GUADALUPE">GUADALUPE</option>
                <option value="MONTERREY">MONTERREY</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Fecha Desde</FilterLabel>
              <FilterInput
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                aria-label="Filtrar por fecha desde"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Fecha Hasta</FilterLabel>
              <FilterInput
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                aria-label="Filtrar por fecha hasta"
              />
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
          </FiltersContainer>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" style={{ color: colors.primary }} />
            </div>
          ) : sortedOrders.length > 0 ? (
            <>
              <StyledTable>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("id")}
                      role="button"
                      tabIndex={0}
                      aria-label="Ordenar por número de orden"
                    >
                      Número de Orden <FontAwesomeIcon icon={faSort} />
                    </th>
                    <th
                      onClick={() => handleSort("order_number")}
                      role="button"
                      tabIndex={0}
                      aria-label="Ordenar por número de pedido"
                    >
                      Número de Pedido <FontAwesomeIcon icon={faSort} />
                    </th>
                    <th
                      onClick={() => handleSort("vehicle_economic_number")}
                      role="button"
                      tabIndex={0}
                      aria-label="Ordenar por número económico"
                    >
                      Número Económico <FontAwesomeIcon icon={faSort} />
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      role="button"
                      tabIndex={0}
                      aria-label="Ordenar por estado"
                    >
                      Estado <FontAwesomeIcon icon={faSort} />
                    </th>
                    <th
                      onClick={() => handleSort("created_at")}
                      role="button"
                      tabIndex={0}
                      aria-label="Ordenar por fecha de ingreso"
                    >
                      Fecha de Ingreso <FontAwesomeIcon icon={faSort} />
                    </th>
                    <th
                      onClick={() => handleSort("finalized_at")}
                      role="button"
                      tabIndex={0}
                      aria-label="Ordenar por fecha de finalización"
                    >
                      Fecha de Finalización <FontAwesomeIcon icon={faSort} />
                    </th>
                    <th>Sucursal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.order_number || "N/A"}</td>
                      <td>{order.vehicle_economic_number}</td>
                      <td>
                        <StatusDiv
                          variant={getStatusVariant(
                            order.status,
                            filters.displayStatus
                          )}
                        >
                          {getStatusDisplay(
                            order.status,
                            filters.displayStatus
                          )}
                        </StatusDiv>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        {order.finalized_at
                          ? new Date(order.finalized_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{order.vehicle?.branch || "N/A"}</td>
                      <td>
                        <CustomButton
                          onClick={() => handleShowModal(order)}
                          aria-label={`Ver detalles de la orden ${order.id}`}
                        >
                          Ver Detalles
                        </CustomButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
              <div className="d-flex justify-content-between mt-3 w-100">
                <Button
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
                <span
                  aria-label={`Página actual ${filters.page} de ${totalPages}`}
                >
                  Página {filters.page} de {totalPages}
                </span>
                <Button
                  disabled={filters.page === totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  aria-label="Página siguiente"
                >
                  Siguiente
                </Button>
              </div>
            </>
          ) : (
            <ImageContainer>
              <p>No se encontraron resultados.</p>
            </ImageContainer>
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
                      <DetailLabel>Número de Pedido</DetailLabel>
                      <DetailValue>
                        {selectedOrder.order_number || "N/A"}
                      </DetailValue>
                    </div>
                    <div>
                      <DetailLabel>Estado</DetailLabel>
                      <DetailValue>
                        {getStatusDisplay(
                          selectedOrder.status,
                          filters.displayStatus
                        )}
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
                              ${selectedOrder.invoice.total?.toFixed(2)}
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
                                  src={`${
                                    API_URL || "http://localhost:5000"
                                  }${img}`}
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
      </div>
    </MainContainer>
  );
};

export default ClientQuery;
