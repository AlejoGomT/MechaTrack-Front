import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import OrderReportModal from "../components/OrderReportModal";
import { API_URL } from "../services/apiConfig";
import {
  getPartsReport,
  getBranches,
  downloadPartsReportPdf,
  downloadPartsReportXml,
} from "../services/reportService";
import { toast } from "react-toastify";
import {
  StyledTable,
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterInput,
  FilterSelect,
  TableWrapper,
} from "../styles/GlobalStyles";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const clientMenu = [
  { label: "Inicio", path: "/client" },
  { label: "Consultas de Económico", path: "/client/query" },
  { label: "Consultas de Vehículo", path: "/client/vehicles" },
  { label: "Consultas de Repuestos", path: "/client/parts" },
  { label: "Notificaciones", path: "/client/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const ClientPartsReport = () => {
  const { user, token } = useAuth();
  const [reportType] = useState("parts"); // Fijo en "parts" para este componente
  const [branchFilter, setBranchFilter] = useState("");
  const [partNameFilter, setPartNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [parts, setParts] = useState([]);
  const [orderReport, setOrderReport] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Cargar sucursales
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches();
        const uniqueBranches = response.map((b) => b.value || b);
        setBranches(uniqueBranches);
      } catch (error) {
        toast.error("Error al cargar sucursales");
      }
    };
    fetchBranches();
  }, []);

  // Validar fechas
  const validateDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      toast.error("Fecha inválida");
      return "";
    }
    if (date > new Date()) {
      toast.error("No se pueden seleccionar fechas futuras");
      return "";
    }
    return dateStr;
  };

  // Cargar datos de repuestos
  useEffect(() => {
    const fetchParts = async () => {
      setIsLoading(true);
      try {
        const filters = {
          branch: branchFilter || "",
          partName: partNameFilter || "",
          startDate: validateDate(startDate),
          endDate: validateDate(endDate),
          token,
        };
        console.log("[ClientPartsReport] Filtros enviados:", filters);
        const response = await getPartsReport(filters);
        console.log(
          "[ClientPartsReport] Respuesta de getPartsReport:",
          response
        );
        setParts(response || []);
      } catch (error) {
        console.error("[ClientPartsReport] Error al cargar repuestos:", error);
        toast.error(error.message || "Error al cargar repuestos");
        setParts([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchParts();
    }
  }, [branchFilter, partNameFilter, startDate, endDate, token]);

  const handleExportPartsPdf = async () => {
    setIsLoading(true);
    try {
      await downloadPartsReportPdf({
        branch: branchFilter || "",
        partName: partNameFilter || "",
        startDate: validateDate(startDate),
        endDate: validateDate(endDate),
        token,
      });
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error("[ClientPartsReport] Error al descargar PDF:", error);
      toast.error(error.message || "Error al descargar PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPartsXml = async () => {
    setIsLoading(true);
    try {
      await downloadPartsReportXml({
        branch: branchFilter || "",
        partName: partNameFilter || "",
        startDate: validateDate(startDate),
        endDate: validateDate(endDate),
        token,
      });
      toast.success("XML descargado correctamente");
    } catch (error) {
      console.error("[ClientPartsReport] Error al descargar XML:", error);
      toast.error(error.message || "Error al descargar XML");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setBranchFilter("");
    setPartNameFilter("");
    setStartDate("");
    setEndDate("");
    setParts([]);
  };

  const chartData = {
    labels: parts.map((p) => `${p.branch} - ${p.part_name}`),
    datasets: [
      {
        label: "Cantidad de Repuestos",
        data: parts.map((p) => p.total_quantity),
        backgroundColor: "#d74a49",
        borderColor: "#1b4552",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Distribución de Repuestos por Sucursal" },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Cantidad" } },
      x: { title: { display: true, text: "Sucursal - Repuesto" } },
    },
  };

  return (
    <>
      <Sidebar menuItems={clientMenu} title="Consulta de Cliente" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader
          title="Reporte de Repuestos"
          userName={user?.name}
          userId={user?.id}
        />
        <Container className="mt-4" fluid>
          <FiltersContainer>
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
            <FilterGroup>
              <FilterLabel>Nombre del Repuesto</FilterLabel>
              <FilterInput
                type="text"
                value={partNameFilter}
                onChange={(e) => setPartNameFilter(e.target.value)}
                placeholder="Buscar repuesto"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Fecha Inicio</FilterLabel>
              <FilterInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Fecha Fin</FilterLabel>
              <FilterInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FilterGroup>
          </FiltersContainer>
          <Row className="mb-3">
            <Col className="d-flex justify-content-end gap-3">
              <CustomButton onClick={handleClearFilters}>
                Limpiar Filtros
              </CustomButton>
              <CustomButton
                onClick={handleExportPartsPdf}
                disabled={isLoading || !parts.length}
              >
                Descargar PDF
              </CustomButton>
              <CustomButton
                onClick={handleExportPartsXml}
                disabled={isLoading || !parts.length}
              >
                Descargar XML
              </CustomButton>
            </Col>
          </Row>
          {isLoading ? (
            <p>Cargando...</p>
          ) : parts.length > 0 ? (
            <>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>Sucursal</th>
                      <th>Repuesto</th>
                      <th>Cantidad</th>
                      <th>Vehículos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part, index) => (
                      <tr key={`${part.branch}-${part.part_id}-${index}`}>
                        <td>{part.branch}</td>
                        <td>{part.part_name}</td>
                        <td>{part.total_quantity}</td>
                        <td>
                          {part.vehicles.length > 0
                            ? part.vehicles.map((v) => (
                                <div key={v.economic_number}>
                                  {`${v.economic_number} (${v.brand} ${v.model})`}
                                </div>
                              ))
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
              <Row className="mt-4">
                <Col>
                  <div style={{ maxWidth: "100%", overflowX: "auto" }}>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </Col>
              </Row>
            </>
          ) : (
            <p>No hay datos disponibles. Aplica filtros y genera el informe.</p>
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

export default ClientPartsReport;
