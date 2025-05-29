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
import * as Papa from "papaparse"; // Importación corregida
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
} from "../styles/GlobalStyles";
import { colors } from "../styles/GlobalStyles";
import {
  getOrders,
  getOrderById,
  getOrderCounts,
} from "../services/orderService";
import { API_URL } from "../services/apiConfig";

// Configuración de Socket.IO
const socket = io(API_URL);

// Menú de navegación del cliente
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
    orderId: "", // Nuevo filtro para Número de Orden (id)
    orderNumber: "", // Filtro para Número de Pedido
    economicNumber: "",
    status: "",
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
  const itemsPerPage = 10;

  // Cargar órdenes y estadísticas
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Mapear estado para el backend
      let statusFilter;
      if (filters.status === "En Proceso") {
        statusFilter = ["En Proceso", "Pendiente", "Finalizado"];
      } else if (filters.status === "Pendiente de Facturación") {
        statusFilter = ["Pendiente de Facturación"];
      } else if (filters.status === "Finalizado") {
        statusFilter = ["Facturado"];
      }

      // Cargar órdenes
      const { orders, totalPages } = await getOrders({
        orderId: filters.orderId || undefined, // Filtrar por id
        orderNumber: filters.orderNumber || undefined,
        economicNumber: filters.economicNumber || undefined,
        status: statusFilter || undefined,
        branch: filters.branch || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setOrders(orders || []);
      setTotalPages(totalPages || 1);

      // Cargar estadísticas
      const counts = await getOrderCounts();
      setStats({
        inProcess: counts.inProcess + counts.pending + counts.finalized, // Agrupar
        pending: counts.pendingBilling,
        completed: counts.billed,
      });
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();

    // Escuchar notificaciones de Socket.IO
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
        loadData(); // Refrescar datos
      }
    });

    return () => socket.off("notification");
  }, [loadData]);

  // Búsqueda con debounce
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

  // Manejar ordenamiento
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Ordenar órdenes
  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return orders;
    return [...orders].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, sortConfig]);

  // Exportar a CSV
  const handleExportCSV = () => {
    try {
      const csvData = orders.map((order) => ({
        "Número de Orden": order.id,
        "Número de Pedido": order.order_number || "N/A",
        "Número Económico": order.vehicle_economic_number,
        Estado: getStatusDisplay(order.status, filters.status),
        "Fecha de Ingreso": order.created_at,
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
      console.error("Error al exportar CSV:", error);
      // Fallback manual
      const csvData = orders.map(
        (order) =>
          `"${order.id}","${order.order_number || "N/A"}","${
            order.vehicle_economic_number
          }","${getStatusDisplay(order.status, filters.status)}","${
            order.created_at
          }","${order.vehicle?.branch || "N/A"}"`
      );
      const csv = [
        "Número de Orden,Número de Pedido,Número Económico,Estado,Fecha de Ingreso,Sucursal",
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

  // Mostrar modal con detalles
  const handleShowModal = async (order) => {
    setLoading(true);
    try {
      const detailedOrder = await getOrderById(order.id);
      setSelectedOrder(detailedOrder);
      setShowModal(true);
    } catch (error) {
      console.error("Error cargando detalles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  // Mapeo de estados según filtro
  const getStatusDisplay = (status, filterStatus) => {
    if (
      filterStatus === "En Proceso" &&
      ["En Proceso", "Pendiente", "Finalizado"].includes(status)
    ) {
      return "En Proceso";
    }
    if (
      filterStatus === "Pendiente de Facturación" &&
      status === "Pendiente de Facturación"
    ) {
      return "Pendiente de Facturación";
    }
    if (filterStatus === "Finalizado" && status === "Facturado") {
      return "Orden Finalizada";
    }
    // Sin filtro específico
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

  const getStatusVariant = (status, filterStatus) => {
    const displayStatus = getStatusDisplay(status, filterStatus);
    if (displayStatus === "Orden Finalizada") return "completed";
    if (displayStatus === "En Proceso") return "inProcess";
    if (displayStatus === "Pendiente de Facturación") return "pending";
    return "";
  };

  // Datos para el gráfico
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
      <div className="content" style={{ marginLeft: "250px", padding: "20px" }}>
        <DashboardHeader
          title="Consulta de Estado del Vehículo"
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
                width={600}
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
                type="text"
                name="orderNumber"
                value={filters.orderNumber}
                onChange={handleFilterChange}
                placeholder="Ingrese número de orden"
                aria-label="Filtrar por número de orden"
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
                name="status"
                value={filters.status}
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
                            filters.status
                          )}
                        >
                          {getStatusDisplay(order.status, filters.status)}
                        </StatusDiv>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
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
            variant="detailsVehicle"
          >
            <Modal.Header closeButton>
              <Modal.Title>Detalles del Vehículo</Modal.Title>
            </Modal.Header>
            <ModalBody>
              {selectedOrder && (
                <>
                  <h6>Información del Vehículo</h6>
                  <p>
                    <strong>Número Económico:</strong>{" "}
                    {selectedOrder.vehicle_economic_number}
                  </p>
                  <p>
                    <strong>Marca:</strong>{" "}
                    {selectedOrder.vehicle?.brand || "N/A"}
                  </p>
                  <p>
                    <strong>Modelo:</strong>{" "}
                    {selectedOrder.vehicle?.model || "N/A"}
                  </p>
                  <p>
                    <strong>Año:</strong> {selectedOrder.vehicle?.year || "N/A"}
                  </p>
                  <p>
                    <strong>Sucursal:</strong>{" "}
                    {selectedOrder.vehicle?.branch || "N/A"}
                  </p>
                  <p>
                    <strong>Placa:</strong>{" "}
                    {selectedOrder.vehicle?.plate || "N/A"}
                  </p>
                  <p>
                    <strong>Kilometraje:</strong>{" "}
                    {selectedOrder.vehicle?.mileage || "N/A"}
                  </p>
                  <h6>Detalles de la Orden</h6>
                  <p>
                    <strong>Número de Orden:</strong> {selectedOrder.id}
                  </p>
                  <p>
                    <strong>Número de Pedido:</strong>{" "}
                    {selectedOrder.order_number || "N/A"}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    {getStatusDisplay(selectedOrder.status, filters.status)}
                  </p>
                  <p>
                    <strong>Fecha de Ingreso:</strong>{" "}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Descripción:</strong>{" "}
                    {selectedOrder.description || "Sin descripción"}
                  </p>
                  <p>
                    <strong>Diagnóstico Inicial:</strong>{" "}
                    {selectedOrder.initial_diagnosis || "N/A"}
                  </p>
                  <p>
                    <strong>Tareas:</strong> {selectedOrder.tasks || "N/A"}
                  </p>
                  {selectedOrder.status === "Facturado" &&
                    selectedOrder.invoice && (
                      <>
                        <h6>Información de Factura</h6>
                        <p>
                          <strong>Número de Factura:</strong>{" "}
                          {selectedOrder.invoice.invoice_number}
                        </p>
                        <p>
                          <strong>Número de Albarán:</strong>{" "}
                          {selectedOrder.invoice.delivery_note_number || "N/A"}
                        </p>
                        <p>
                          <strong>Total:</strong> ${selectedOrder.invoice.total}
                        </p>
                      </>
                    )}
                  {selectedOrder.images && selectedOrder.images.length > 0 && (
                    <>
                      <h6>Imágenes</h6>
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
                  <h6>Historial de Órdenes</h6>
                  {selectedOrder.history && selectedOrder.history.length > 0 ? (
                    <ul>
                      {selectedOrder.history.map((item, index) => (
                        <li key={index}>
                          {item.description} -{" "}
                          {new Date(item.date).toLocaleString()} ({item.status})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay historial disponible.</p>
                  )}
                  {selectedOrder.parts && selectedOrder.parts.length > 0 && (
                    <>
                      <h6>Repuestos</h6>
                      <ul>
                        {selectedOrder.parts.map((part, index) => (
                          <li key={index}>
                            {part.name} - Cantidad: {part.quantity} - Estado:{" "}
                            {part.status}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </ModalBody>
          </StyledModal>
        </Container>
      </div>
    </MainContainer>
  );
};

export default ClientQuery;
