import { useState, useEffect, useCallback, useMemo } from "react";
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
  Col,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFileExcel,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DOMPurify from "dompurify";
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
import { getOrders, getOrderById } from "../services/orderService";
import { getBranches } from "../services/reportService"; // Importar getBranches
import { API_URL } from "../services/apiConfig";
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

const CalculationsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const CalculationsTable = styled.table`
  width: 200px;
  border-collapse: collapse;
  font-size: 0.9rem;
  th,
  td {
    border: 1px solid #dee2e6;
    padding: 8px;
    text-align: right;
  }
  th {
    background-color: #f1f3f5;
    font-weight: bold;
  }
`;

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas de Económico", path: "/client/query" },
  { label: "Consultas de Vehículo", path: "/client/vehicles" },
  { label: "Consultas de Repuestos", path: "/client/parts" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientQuery = () => {
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
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
  const allowedStatuses = [
    "En Proceso",
    "Pendiente",
    "Finalizado",
    "Pendiente de Facturación",
    "Facturado",
  ];

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches();
        console.log("[ClientQuery] Respuesta de getBranches:", response);
        const uniqueBranches = response.map((b) => b.value || b);
        setBranches(uniqueBranches);
      } catch (error) {
        console.error("[ClientQuery] Error al cargar sucursales:", error);
        toast.error("Error al cargar sucursales");
      }
    };
    fetchBranches();
  }, []);

  const fetchOrders = useCallback(async () => {
    setFilterLoading(true);
    try {
      console.log("[ClientQuery] Filtros enviados:", {
        economicNumber: economicNumberFilter || undefined,
        branch: branchFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        page: currentPage,
        limit: pageSize,
      });
      const ordersData = await getOrders({
        economicNumber: economicNumberFilter || undefined,
        branch: branchFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        page: currentPage,
        limit: pageSize,
        statuses: allowedStatuses,
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

      const processedOrders = ordersData.orders
        .filter((order) => allowedStatuses.includes(order.status))
        .map((order) => ({
          ...order,
          notifications: order.notifications || [],
        }));

      setOrders(processedOrders);
      setTotalPages(
        Math.ceil((ordersData.total || processedOrders.length) / pageSize)
      );
      console.log(
        "[ClientQuery] Órdenes establecidas:",
        processedOrders.length
      );

      const inProcessCount = processedOrders.reduce((count, order) => {
        return ["En Proceso", "Pendiente", "Finalizado"].includes(order.status)
          ? count + 1
          : count;
      }, 0);
      const pendingCount = processedOrders.reduce((count, order) => {
        return order.status === "Pendiente de Facturación" ? count + 1 : count;
      }, 0);
      const completedCount = processedOrders.reduce((count, order) => {
        return order.status === "Facturado" ? count + 1 : count;
      }, 0);

      setStats({
        total: ordersData.total || processedOrders.length,
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
      setFilterLoading(false);
      setInitialLoading(false);
    }
  }, [
    economicNumberFilter,
    branchFilter,
    startDateFilter,
    endDateFilter,
    currentPage,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log("[ClientQuery] Socket no conectado o no inicializado:", {
        socket: !!socket,
        isConnected,
      });
      return;
    }

    socket.on("notification", (notification) => {
      console.log("[ClientQuery] Nueva notificación recibida:", notification);
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
      socket.off("notification");
      console.log("[ClientQuery] Listeners removidos");
    };
  }, [socket, isConnected, fetchOrders]);

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Órdenes");

      worksheet.columns = [
        { header: "Número de Orden", key: "id", width: 15 },
        { header: "Número Económico", key: "economicNumber", width: 20 },
        { header: "Estado", key: "status", width: 20 },
        { header: "Fecha de Ingreso", key: "createdAt", width: 15 },
        { header: "Fecha de Finalización", key: "finalizedAt", width: 15 },
        { header: "Sucursal", key: "branch", width: 20 },
      ];

      orders.forEach((order) => {
        worksheet.addRow({
          id: order.id,
          economicNumber: order.vehicle_economic_number || "-",
          status: getStatusDisplay(order.status),
          createdAt: formatDate(order.created_at),
          finalizedAt: formatDate(order.finalized_at) || "N/A",
          branch: order.branch || "N/A",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ordenes_vehiculos.xlsx";
      link.click();
      toast.success("Archivo Excel descargado exitosamente");
    } catch (error) {
      console.error("[ClientQuery] Error al exportar Excel:", error);
      toast.error("Error al exportar a Excel");
    }
  };

  const handleExportPDF = async () => {
    setFilterLoading(true);
    try {
      const doc = new jsPDF();
      const sanitize = (str) =>
        DOMPurify.sanitize(str || "", { RETURN_TRUSTED_TYPE: false });

      if (orders.length === 0) {
        toast.warn("No hay órdenes para exportar");
        return;
      }

      // Obtener detalles completos de cada orden
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            const detailedOrder = await getOrderById(order.id);
            return detailedOrder;
          } catch (error) {
            console.error(
              `[ClientQuery] Error cargando orden ${order.id}:`,
              error
            );
            return null;
          }
        })
      );

      // Filtrar órdenes válidas
      const validOrders = detailedOrders.filter((order) => order !== null);

      if (validOrders.length === 0) {
        toast.error("No se pudieron cargar los detalles de las órdenes");
        return;
      }

      validOrders.forEach((order, index) => {
        if (index > 0) doc.addPage();
        doc.setFontSize(16);
        doc.text(sanitize(`Reporte de Orden #${order.id}`), 20, 20);
        doc.setFontSize(12);

        // Información del Vehículo
        doc.text("Información del Vehículo", 20, 30);
        const vehicleData = [
          ["Número Económico", sanitize(order.vehicle_economic_number || "-")],
          ["Marca", sanitize(order.vehicle?.brand || "N/A")],
          ["Modelo", sanitize(order.vehicle?.model || "N/A")],
          ["Año", sanitize(order.vehicle?.year || "N/A")],
          ["Sucursal", sanitize(order.vehicle?.branch || "N/A")],
          ["Placa", sanitize(order.vehicle?.plate || "N/A")],
          ["Kilometraje", sanitize(order.vehicle?.mileage || "N/A")],
        ];
        autoTable(doc, {
          startY: 40,
          head: [["Campo", "Valor"]],
          body: vehicleData,
          theme: "striped",
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
        });

        // Detalles de la Orden
        doc.text("Detalles de la Orden", 20, doc.lastAutoTable.finalY + 10);
        const orderData = [
          ["Número de Orden", order.id],
          ["Estado", getStatusDisplay(order.status)],
          ["Fecha de Ingreso", new Date(order.created_at).toLocaleString()],
          [
            "Fecha de Finalización",
            order.finalized_at
              ? new Date(order.finalized_at).toLocaleString()
              : "N/A",
          ],
          ["Descripción", sanitize(order.description || "Sin descripción")],
          ["Diagnóstico Inicial", sanitize(order.initial_diagnosis || "N/A")],
          ["Tareas", sanitize(order.tasks || "N/A")],
        ];
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Campo", "Valor"]],
          body: orderData,
          theme: "striped",
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
        });

        // Información de Factura
        if (order.status === "Facturado" && order.invoice) {
          doc.text("Información de Factura", 20, doc.lastAutoTable.finalY + 10);
          const invoiceData = [
            ["Número de Factura", order.invoice.invoice_number],
            ["Número de Pedido", order.order_number || "N/A"],
            ["Número de Albarán", order.invoice.delivery_note_number || "N/A"],
            ["Total", `$${order.invoice.total * 1.16}`],
          ];
          autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [["Campo", "Valor"]],
            body: invoiceData,
            theme: "striped",
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
          });
        }

        // Nota sobre Imágenes
        if (order.images && order.images.length > 0) {
          doc.text(
            "Imágenes: No incluidas en el PDF. Consulte el sistema para verlas.",
            20,
            doc.lastAutoTable.finalY + 10
          );
        }

        // Repuestos
        doc.text("Repuestos", 20, doc.lastAutoTable.finalY + 20);
        const approvedParts =
          order.parts?.filter((part) => part.status === "Aprobado") || [];
        if (approvedParts.length > 0) {
          const partsData = approvedParts.map((part) => [
            sanitize(part.name),
            part.quantity,
            part.status,
            `$${part.price}`,
          ]);
          autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 30,
            head: [["Repuesto", "Cantidad", "Estado", "Precio Unitario"]],
            body: partsData,
            theme: "striped",
            styles: { fontSize: 10 },
            columnStyles: {
              0: { cellWidth: 70 },
              1: { cellWidth: 30 },
              2: { cellWidth: 30 },
              3: { cellWidth: 40 },
            },
          });

          // Cálculos
          const { subtotal, total, iva, totalWithIva } = calculatePartsTotals(
            order.parts
          );
          const calculationsData = [
            ["Subtotal", `$${subtotal}`],
            ["IVA (16%)", `$${iva}`],
            ["Total + IVA", `$${totalWithIva}`],
          ];
          autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            startX: 110,
            head: [["Concepto", "Monto"]],
            body: calculationsData,
            theme: "striped",
            styles: { fontSize: 10, halign: "right" },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 } },
          });
        } else {
          doc.text(
            "No hay repuestos aprobados asociados a esta orden.",
            20,
            doc.lastAutoTable.finalY + 30
          );
        }
      });

      doc.save("ordenes_filtradas.pdf");
      toast.success("Informe agrupado descargado exitosamente");
    } catch (error) {
      console.error("[ClientQuery] Error al exportar PDF agrupado:", error);
      toast.error("Error al exportar el informe agrupado");
    } finally {
      setFilterLoading(false);
    }
  };

  const calculatePartsTotals = (parts) => {
    const approvedParts =
      parts?.filter((part) => part.status === "Aprobado") || [];
    const subtotal = approvedParts.reduce(
      (sum, part) => sum + part.price * part.quantity,
      0
    );
    const iva = subtotal * 0.16;
    const totalWithIva = subtotal + iva;
    return { subtotal, iva, totalWithIva };
  };

  const handleDownloadIndividualPDF = () => {
    if (!selectedOrder) return;

    try {
      const doc = new jsPDF();
      const sanitize = (str) =>
        DOMPurify.sanitize(str || "", { RETURN_TRUSTED_TYPE: false });
      doc.setFontSize(16);
      doc.text(sanitize(`Reporte de Orden #${selectedOrder.id}`), 20, 20);
      doc.setFontSize(12);

      // Información del Vehículo
      doc.text("Información del Vehículo", 20, 30);
      const vehicleData = [
        [
          "Número Económico",
          sanitize(selectedOrder.vehicle_economic_number || "-"),
        ],
        ["Marca", sanitize(selectedOrder.vehicle?.brand || "N/A")],
        ["Modelo", sanitize(selectedOrder.vehicle?.model || "N/A")],
        ["Año", sanitize(selectedOrder.vehicle?.year || "N/A")],
        ["Sucursal", sanitize(selectedOrder.vehicle?.branch || "N/A")],
        ["Placa", sanitize(selectedOrder.vehicle?.plate || "N/A")],
        ["Kilometraje", sanitize(selectedOrder.vehicle?.mileage || "N/A")],
      ];
      autoTable(doc, {
        startY: 40,
        head: [["Campo", "Valor"]],
        body: vehicleData,
        theme: "striped",
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
      });

      // Detalles de la Orden
      doc.text("Detalles de la Orden", 20, doc.lastAutoTable.finalY + 10);
      const orderData = [
        ["Número de Orden", selectedOrder.id],
        ["Estado", getStatusDisplay(selectedOrder.status)],
        [
          "Fecha de Ingreso",
          new Date(selectedOrder.created_at).toLocaleString(),
        ],
        [
          "Fecha de Finalización",
          selectedOrder.finalized_at
            ? new Date(selectedOrder.finalized_at).toLocaleString()
            : "N/A",
        ],
        [
          "Descripción",
          sanitize(selectedOrder.description || "Sin descripción"),
        ],
        [
          "Diagnóstico Inicial",
          sanitize(selectedOrder.initial_diagnosis || "N/A"),
        ],
        ["Tareas", sanitize(selectedOrder.tasks || "N/A")],
      ];
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Campo", "Valor"]],
        body: orderData,
        theme: "striped",
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
      });

      // Información de Factura
      if (selectedOrder.status === "Facturado" && selectedOrder.invoice) {
        doc.text("Información de Factura", 20, doc.lastAutoTable.finalY + 10);
        const invoiceData = [
          ["Número de Factura", selectedOrder.invoice.invoice_number],
          ["Order Date", order.order_number || "-"],
          ["Número de Pedido", order.order_number || "N/A"],
          ["Número de Albarán", order.invoice.order_note_number || "N/A"],
          ["Total", `$${order.invoice.total * 1.16}`],
        ];
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Campo", "Valor"]],
          body: invoiceData,
          theme: "striped",
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
        });
      }

      // Nota sobre Imágenes
      if (selectedOrder.images && selectedOrder.images.length > 0) {
        doc.text(
          "Imágenes: No se incluyen en el PDF. Consulte el sistema para verlas.",
          20,
          doc.lastAutoTable.finalY + 10
        );
      }

      // Repuestos
      doc.text("Repuestos", 20, doc.lastAutoTable.finalY + 20);
      const approvedParts =
        selectedOrder.parts?.filter((part) => part.status === "Aprobado") || [];
      if (approvedParts.length > 0) {
        const partsData = approvedParts.map((part) => [
          sanitize(part.name),
          part.quantity,
          part.status,
          `$${part.price}`,
        ]);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 30,
          head: [["Repuesto", "Cantidad", "Estado", "Precio Unitario"]],
          body: partsData,
          theme: "striped",
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
          },
        });

        // Cálculos
        const { subtotal, iva, totalWithIva } = calculatePartsTotals(
          selectedOrder.parts
        );
        const calculationsData = [
          ["Subtotal", `$${subtotal}`],
          ["IVA (16%)", `$${iva}`],
          ["Total + IVA", `$${totalWithIva}`],
        ];
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          startX: 110,
          head: [["Concepto", "Monto"]],
          body: calculationsData,
          theme: "striped",
          styles: { fontSize: 10, halign: "right" },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 } },
        });
      } else {
        doc.text(
          "No hay repuestos aprobados asociados a esta orden.",
          20,
          doc.lastAutoTable.finalY + 30
        );
      }

      doc.save(`orden_${selectedOrder.id}.pdf`);
      toast.success("Informe individual descargado exitosamente");
    } catch (error) {
      console.error("[ClientQuery] Error al descargar PDF individual:", error);
      toast.error("Error al descargar el informe");
    }
  };

  const handleShowModal = async (order) => {
    setFilterLoading(true);
    try {
      const detailedOrder = await getOrderById(order.id);
      setSelectedOrder(detailedOrder);
      setShowModal(true);
    } catch (error) {
      console.error("[ClientQuery] Error cargando detalles:", error);
      toast.error("Error al cargar detalles de la orden");
    } finally {
      setFilterLoading(false);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  const getStatusDisplay = (status) => {
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

  const getStatusVariant = (status) => {
    const computedStatus = getStatusDisplay(status);
    if (computedStatus === "Orden Finalizada") return "completed";
    if (
      computedStatus === "En Proceso" ||
      computedStatus === "Pendiente" ||
      computedStatus === "Finalizado"
    )
      return "inProcess";
    if (computedStatus === "Pendiente de Facturación") return "pending";
    return "";
  };

  const chartData = useMemo(
    () => [
      { name: "En Proceso", value: stats.inProcess, fill: colors.yellow },
      {
        name: "Pendiente de Facturación",
        value: stats.pending,
        fill: colors.blue,
      },
      { name: "Finalizadas", value: stats.completed, fill: colors.green },
    ],
    [stats]
  );

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
          title="Consulta de Economico"
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
              <FilterLabel>Número Económico</FilterLabel>
              <FilterInput
                type="text"
                value={economicNumberFilter}
                onChange={(e) => {
                  setEconomicNumberFilter(e.target.value);
                  setCurrentPage(1);
                }}
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
            <Col>
              <FilterGroup>
                <FilterLabel>Fecha Inicial</FilterLabel>
                <FilterInput
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Fecha inicial"
                />
              </FilterGroup>
              <FilterGroup>
                <FilterLabel>Fecha Final</FilterLabel>
                <FilterInput
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Fecha final"
                />
              </FilterGroup>
            </Col>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Exportar a Excel</Tooltip>}
            >
              <CustomButton
                onClick={handleExportExcel}
                aria-label="Exportar a Excel"
                style={{ marginRight: "10px" }}
              >
                <FontAwesomeIcon icon={faFileExcel} /> Excel
              </CustomButton>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Exportar a PDF</Tooltip>}
            >
              <CustomButton
                onClick={handleExportPDF}
                aria-label="Exportar a PDF"
                disabled={filterLoading}
              >
                {filterLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFilePdf} /> PDF
                  </>
                )}
              </CustomButton>
            </OverlayTrigger>
          </StyledFiltersContainer>
          {initialLoading ? (
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
                        <td>{order.branch || "N/A"}</td>
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
              {filterLoading ? (
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
                            <DetailLabel>Número de Pedido</DetailLabel>
                            <DetailValue>
                              {selectedOrder.order_number || "N/A"}
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
                              ${selectedOrder.invoice.total * 1.16}
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
                  {selectedOrder.parts &&
                  selectedOrder.parts.filter(
                    (part) => part.status === "Aprobado"
                  ).length > 0 ? (
                    <>
                      <TableWrapper>
                        <StyledTable>
                          <thead>
                            <tr>
                              <th>Repuesto</th>
                              <th>Cantidad</th>
                              <th>Estado</th>
                              <th>Precio Unitario</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.parts
                              .filter((part) => part.status === "Aprobado")
                              .map((part, index) => (
                                <tr key={index}>
                                  <td>{part.name}</td>
                                  <td>{part.quantity}</td>
                                  <td>{part.status}</td>
                                  <td>${part.price}</td>
                                </tr>
                              ))}
                          </tbody>
                        </StyledTable>
                      </TableWrapper>
                      <CalculationsContainer>
                        <CalculationsTable>
                          <thead>
                            <tr>
                              <th>Concepto</th>
                              <th>Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const { subtotal, iva, totalWithIva } =
                                calculatePartsTotals(selectedOrder.parts);
                              return [
                                <tr key="subtotal">
                                  <td>Subtotal</td>
                                  <td>${subtotal}</td>
                                </tr>,
                                <tr key="iva">
                                  <td>IVA (16%)</td>
                                  <td>${iva}</td>
                                </tr>,
                                <tr key="totalWithIva">
                                  <td>Total + IVA</td>
                                  <td>${totalWithIva}</td>
                                </tr>,
                              ];
                            })()}
                          </tbody>
                        </CalculationsTable>
                      </CalculationsContainer>
                    </>
                  ) : (
                    <p>No hay repuestos aprobados asociados a esta orden.</p>
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
              <Button variant="primary" onClick={handleDownloadIndividualPDF}>
                Descargar PDF
              </Button>
            </Modal.Footer>
          </StyledModal>
        </Container>
      </Content>
    </MainContainer>
  );
};

export default ClientQuery;
