import { useState, useEffect } from "react";
import { Container, Row, Col, Pagination } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import OrderReportModal from "../components/OrderReportModal";
import { API_URL } from "../services/apiConfig";
import {
  getBranchReports,
  getOrderReport,
  downloadBranchReportsExcel,
  getPartsReport,
} from "../services/reportService";
import { getOrders } from "../services/orderService";
import { toast } from "react-toastify";
import {
  StyledTable,
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
  TableWrapper,
  ActionsContainer,
} from "../styles/GlobalStyles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Vehiculos", path: "../admin/vehicles" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminReports = () => {
  const { user, token } = useAuth();
  const [reportType, setReportType] = useState("order");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [economicNumberFilter, setEconomicNumberFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [reports, setReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [parts, setParts] = useState([]);
  const [orderReport, setOrderReport] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalPages: 1,
    total: 0,
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranchReports({});
        const uniqueBranches = [...new Set(response.map((r) => r.branch))];
        setBranches(uniqueBranches);
      } catch (error) {
        toast.error("Error al cargar sucursales");
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (reportType === "order" && token) {
      const fetchOrders = async () => {
        try {
          const response = await getOrders({
            status: statusFilter,
            orderNumber: orderNumberFilter,
            economicNumber: economicNumberFilter,
            startDate,
            endDate,
            page: pagination.page,
            limit: pagination.limit,
          });
          console.log("[AdminReports] Respuesta de getOrders:", response);
          setOrders(response.orders || []);
          setPagination({
            ...pagination,
            total: response.total || 0,
            totalPages: response.totalPages || 1,
          });
        } catch (error) {
          console.error("[AdminReports] Error al cargar órdenes:", error);
          toast.error(error.message || "Error al cargar órdenes");
          setOrders([]);
          setPagination({
            ...pagination,
            total: 0,
            totalPages: 1,
          });
        }
      };
      fetchOrders();
    } else if (reportType === "parts" && token) {
      const fetchParts = async () => {
        try {
          const response = await getPartsReport({
            startDate,
            endDate,
            branch: branchFilter,
            status: statusFilter,
            orderNumber: orderNumberFilter,
            economicNumber: economicNumberFilter,
            token,
          });
          setParts(response || []);
        } catch (error) {
          console.error("[AdminReports] Error al cargar repuestos:", error);
          toast.error(error.message || "Error al cargar repuestos");
          setParts([]);
        }
      };
      fetchParts();
    }
  }, [
    reportType,
    statusFilter,
    orderNumberFilter,
    economicNumberFilter,
    startDate,
    endDate,
    branchFilter,
    pagination.page,
    token,
  ]);

  const fetchBranchReports = async () => {
    try {
      const filters = {
        startDate,
        endDate,
        branch: branchFilter,
        status: statusFilter,
      };
      const data = await getBranchReports(filters);
      setReports(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchOrderReport = async (orderId) => {
    console.log("Fetching order report for orderId:", orderId);
    try {
      if (!orderId) {
        throw new Error("ID de orden no proporcionado");
      }
      const data = await getOrderReport(orderId);
      setOrderReport(data);
      setShowOrderModal(true);
    } catch (error) {
      toast.error(error.message || "Error al generar informe");
      console.error("[AdminReports] Error en fetchOrderReport:", error);
    }
  };

  const handleExportOrdersPdf = async () => {
    if (startDate && !endDate) {
      toast.error("Por favor, seleccione una fecha de fin.");
      return;
    }
    if (!startDate && endDate) {
      toast.error("Por favor, seleccione una fecha de inicio.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("[handleExportOrdersPdf] Enviando solicitud con filtros:", {
        startDate,
        endDate,
        branch: branchFilter,
        status: statusFilter,
        orderNumber: orderNumberFilter,
        economicNumber: economicNumberFilter,
      });

      const response = await axios.get(`${API_URL}/api/reports/orders/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDate || null,
          endDate: endDate || null,
          branch: branchFilter,
          status: statusFilter,
          orderNumber: orderNumberFilter,
          economicNumber: economicNumberFilter,
        },
        responseType: "blob",
      });

      if (!(response.data instanceof Blob)) {
        const text = await response.data.text();
        console.error("[handleExportOrdersPdf] Respuesta no es un blob:", text);
        throw new Error(
          "La respuesta del servidor no es un archivo PDF válido"
        );
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "informe_ordenes.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObject(url);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error("[AdminReports] Error al descargar PDF:", error);
      let errorMessage = "Error al descargar PDF";
      if (error.response) {
        try {
          const errorText = await error.response.data.text();
          const parsedError = JSON.parse(errorText);
          errorMessage = parsedError.message || errorMessage;
        } catch (e) {
          errorMessage = "Error del servidor al generar el PDF";
        }
      } else if (error.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPartsPdf = async () => {
    try {
      const response = await axios.get("/api/reports/parts/pdf", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate,
          endDate,
          branch: branchFilter,
          status: statusFilter,
          orderNumber: orderNumberFilter,
          economicNumber: economicNumberFilter,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "informe_repuestos.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error("[AdminReports] Error al descargar PDF:", error);
      toast.error(error.response?.data?.message || "Error al descargar PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      const filters = {
        startDate,
        endDate,
        branch: branchFilter,
        status: statusFilter,
      };
      await downloadBranchReportsExcel(filters);
      toast.success("Excel descargado correctamente");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const userData = {
    userId: user?.id,
    userName: user?.name,
    activeOrdersCount: reports.reduce((acc, r) => acc + r.in_process, 0),
    notificationsCount: 0,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Generación de Informes" {...userData} />
        <Container className="mt-4" fluid>
          <Row className="mb-3">
            <Col>
              <FilterGroup>
                <FilterLabel>Tipo de Informe</FilterLabel>
                <FilterSelect
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="order">Por Económico</option>
                  <option value="branch">Por Sucursal</option>
                  <option value="parts">Por Repuestos</option>
                </FilterSelect>
              </FilterGroup>
            </Col>
          </Row>
          {reportType === "branch" ? (
            <>
              <Row className="mb-3">
                <Col md={3}>
                  <FilterGroup>
                    <FilterLabel>Fecha Inicio</FilterLabel>
                    <FilterInput
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FilterGroup>
                </Col>
                <Col md={3}>
                  <FilterGroup>
                    <FilterLabel>Fecha Fin</FilterLabel>
                    <FilterInput
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FilterGroup>
                </Col>
                <Col md={3}>
                  <FilterGroup>
                    <FilterLabel>Sucursal</FilterLabel>
                    <FilterSelect
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </FilterSelect>
                  </FilterGroup>
                </Col>
                <Col md={3}>
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
                      <option value="Pendiente de Facturación">
                        Pendiente de Facturación
                      </option>
                      <option value="Facturado">Facturado</option>
                    </FilterSelect>
                  </FilterGroup>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col className="d-flex justify-content-end gap-3">
                  <CustomButton onClick={fetchBranchReports}>
                    Generar Informe
                  </CustomButton>
                  <CustomButton onClick={handleExportExcel}>
                    Descargar Excel
                  </CustomButton>
                </Col>
              </Row>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>Sucursal</th>
                      <th>Órdenes Totales</th>
                      <th>En Proceso</th>
                      <th>Pendiente</th>
                      <th>Finalizado</th>
                      <th>Pendiente de Facturación</th>
                      <th>Facturado</th>
                      <th>Costo Repuestos</th>
                      <th>Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={index}>
                        <td>{report.order_number}</td>
                        <td>{report.total_orders}</td>
                        <td>{report.in_process}</td>
                        <td>{report.pending}</td>
                        <td>{report.finalized}</td>
                        <td>{report.pending_billing}</td>
                        <td>{report.financial}</td>
                        <td>{report.total_parts_cost}</td>
                        <td>{report.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
            </>
          ) : reportType === "order" ? (
            <>
              <FiltersContainer>
                <FilterGroup>
                  <FilterLabel>Fecha Inicio</FilterLabel>
                  <FilterInput
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPagination({ ...pagination, page: 1 });
                    }}
                  />
                </FilterGroup>
                <FilterGroup>
                  <FilterLabel>Fecha Fin</FilterLabel>
                  <FilterInput
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPagination({ ...pagination, page: 1 });
                    }}
                  />
                </FilterGroup>
                <FilterGroup>
                  <FilterLabel>Sucursal</FilterLabel>
                  <FilterSelect
                    value={branchFilter}
                    onChange={(e) => {
                      setBranchFilter(e.target.value);
                      setPagination({ ...pagination, page: 1 });
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
                <FilterGroup>
                  <FilterLabel>Estado</FilterLabel>
                  <FilterSelect
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination({ ...pagination, page: 1 });
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Pendiente de Facturación">
                      Pendiente de Facturación
                    </option>
                    <option value="Facturado">Facturado</option>
                  </FilterSelect>
                </FilterGroup>
                <FilterGroup>
                  <FilterLabel>Número Económico</FilterLabel>
                  <FilterInput
                    type="text"
                    value={economicNumberFilter}
                    onChange={(e) => {
                      setEconomicNumberFilter(e.target.value);
                      setPagination({ ...pagination, page: 1 });
                    }}
                    placeholder="Filtrar por N° Económico"
                  />
                </FilterGroup>
              </FiltersContainer>
              <Row className="mb-3">
                <Col className="d-flex justify-content-end gap-3">
                  <CustomButton
                    onClick={handleExportOrdersPdf}
                    disabled={isLoading}
                  >
                    {isLoading ? "Generando..." : "Descargar PDF"}
                  </CustomButton>
                </Col>
              </Row>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>Número Económico</th>
                      <th>Número de Orden</th>
                      <th>Fecha Inicio/Finalizacion</th>
                      <th>Sucursal</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((order) =>
                        branchFilter ? order.branch === branchFilter : true
                      )
                      .map((order) => (
                        <tr key={order.id}>
                          <td>{order.vehicle_economic_number}</td>
                          <td>{order.id}</td>
                          <td>
                            {formatDate(order.created_at)} -{" "}
                            {formatDate(order.finalized_at)}
                          </td>
                          <td>{order.branch || "-"}</td>
                          <td>{order.status}</td>
                          <td className="actions">
                            <ActionsContainer>
                              <CustomButton
                                onClick={() => fetchOrderReport(order.id)}
                                title="Generar Informe"
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
              <div className="pt-3 d-flex justify-content-center">
                <Pagination>
                  <Pagination.Prev
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  />
                  {[...Array(pagination.totalPages).keys()].map((i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === pagination.page}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  />
                </Pagination>
              </div>
            </>
          ) : (
            <>
              <Row className="mb-3">
                <Col md={3}>
                  <FilterGroup>
                    <FilterLabel>Fecha Inicio</FilterLabel>
                    <FilterInput
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FilterGroup>
                </Col>
                <Col md={3}>
                  <FilterGroup>
                    <FilterLabel>Fecha Fin</FilterLabel>
                    <FilterInput
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FilterGroup>
                </Col>
                <Col md={3}>
                  <FilterGroup>
                    <FilterLabel>Sucursal</FilterLabel>
                    <FilterSelect
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </FilterSelect>
                  </FilterGroup>
                </Col>
                <Col md={3}>
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
                      <option value="Pendiente de Facturación">
                        Pendiente de Facturación
                      </option>
                      <option value="Facturado">Facturado</option>
                    </FilterSelect>
                  </FilterGroup>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col className="d-flex justify-content-end gap-3">
                  <CustomButton onClick={() => fetchPartsReport()}>
                    Generar Informe
                  </CustomButton>
                  <CustomButton onClick={handleExportPartsPdf}>
                    Descargar PDF
                  </CustomButton>
                </Col>
              </Row>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Número de Orden</th>
                      <th>Sucursal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part, index) => (
                      <tr key={index}>
                        <td>{part.name}</td>
                        <td>{part.quantity}</td>
                        <td>${part.price || "N/A"}</td>
                        <td>{part.status}</td>
                        <td>{part.order_id}</td>
                        <td>{part.branch || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
            </>
          )}
          {orderReport && (
            <OrderReportModal
              show={showOrderModal}
              onHide={() => {
                setShowOrderModal(false);
                setOrderReport(null);
              }}
              report={orderReport}
            />
          )}
        </Container>
      </div>
    </>
  );
};

export default AdminReports;
