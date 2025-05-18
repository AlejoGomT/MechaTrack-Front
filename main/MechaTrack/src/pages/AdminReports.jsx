import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import OrderReportModal from "../components/OrderReportModal";
import {
  getBranchReports,
  getOrderReport,
  downloadBranchReportsExcel,
} from "../services/reportService";
import { toast } from "react-toastify";
import {
  StyledTable,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
  TableWrapper,
} from "../styles/GlobalStyles";

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
  const { user } = useAuth();
  const [reportType, setReportType] = useState("branch");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orderId, setOrderId] = useState("");
  const [branches, setBranches] = useState([]);
  const [reports, setReports] = useState([]);
  const [orderReport, setOrderReport] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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

  const fetchOrderReport = async () => {
    try {
      const data = await getOrderReport(orderId);
      setOrderReport(data);
      setShowOrderModal(true);
    } catch (error) {
      toast.error(error.message);
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

  const userData = {
    userId: user?.id,
    userName: user?.name,
    activeOrdersCount: reports.reduce((acc, r) => acc + r.in_process, 0),
    notificationsCount: 0, // Puede integrarse con notificationService.jsx si es necesario
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
                  <option value="branch">Por Sucursal</option>
                  <option value="order">Por Orden</option>
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
                        <td>{report.branch}</td>
                        <td>{report.total_orders}</td>
                        <td>{report.in_process}</td>
                        <td>{report.pending}</td>
                        <td>{report.finalized}</td>
                        <td>{report.pending_billing}</td>
                        <td>{report.invoiced}</td>
                        <td>{report.total_parts_cost}</td>
                        <td>{report.total_invoice_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
            </>
          ) : (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <FilterGroup>
                    <FilterLabel>ID de la Orden</FilterLabel>
                    <FilterInput
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Ingrese ID de la orden"
                    />
                  </FilterGroup>
                </Col>
                <Col md={6} className="d-flex align-items-end">
                  <CustomButton onClick={fetchOrderReport}>
                    Generar Informe
                  </CustomButton>
                </Col>
              </Row>
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
