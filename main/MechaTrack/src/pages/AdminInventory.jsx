import { useState, useEffect } from "react";
import {
  Container,
  Form,
  Pagination,
  Modal,
  ListGroup,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import PartForm from "../components/PartForm";
import PartDetailsModal from "../components/PartDetailsModal";
import {
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  StyledModal,
  ModalBody,
  StyledTable,
  ActionsContainer,
  TableWrapper,
} from "../styles/GlobalStyles";
import { API_URL } from "../services/apiConfig";
import { getVehicleModels } from "../services/vehicleService";
import {
  getParts,
  createPart,
  updatePart,
  deletePart,
} from "../services/partService";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPencil,
  faTrashCan,
  faFilePdf,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DOMPurify from "dompurify";
import ExcelJS from "exceljs";

library.add(faEye, faPencil, faTrashCan, faFilePdf, faFileExcel);

const adminMenu = [
  { label: "Inicio", path: "../admin" },
  { label: "Órdenes de Servicio", path: "../admin/orders" },
  { label: "Inventario", path: "../admin/inventory" },
  { label: "Vehículos", path: "../admin/vehicles" },
  { label: "Gestión de Usuarios", path: "../admin/users" },
  { label: "Notificaciones", path: "../admin/notifications" },
  { label: "Informes", path: "../admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminInventory = () => {
  const { user, token } = useAuth();
  const [codeFilter, setCodeFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [parts, setParts] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partsData, models] = await Promise.all([
          getParts(modelFilter, pagination.page, pagination.limit),
          getVehicleModels(),
        ]);
        setParts(partsData.parts);
        setPagination({
          ...pagination,
          total: partsData.total,
          totalPages: partsData.totalPages,
        });
        setVehicleModels(models);
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error("[AdminInventory] Error al cargar datos:", error);
      }
    };
    if (token) fetchData();
  }, [token, pagination.page, modelFilter]);

  const filteredParts = parts.filter(
    (part) =>
      (!codeFilter ||
        part.id.toString().toLowerCase().includes(codeFilter.toLowerCase())) &&
      (!nameFilter ||
        part.name.toLowerCase().includes(nameFilter.toLowerCase())) &&
      (!modelFilter ||
        (part.compatible_models &&
          part.compatible_models.includes(modelFilter)))
  );

  const handleCreatePart = async (partData) => {
    try {
      const newPart = await createPart(partData);
      setParts([...parts, newPart]);
      setShowCreateModal(false);
      toast.success("Repuesto creado");
    } catch (error) {
      toast.error(error.message || "Error al crear repuesto");
      throw error;
    }
  };

  const handleEditPart = async (partData) => {
    setIsSubmitting(true);
    try {
      const updatedPart = await updatePart(selectedPart.id, partData);
      setParts(parts.map((p) => (p.id === updatedPart.id ? updatedPart : p)));
      setShowEditModal(false);
      setSelectedPart(null);
      toast.success("Repuesto actualizado");
    } catch (error) {
      toast.error(error.message || "Error al actualizar repuesto");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePart = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este repuesto?")) {
      try {
        await deletePart(id);
        setParts(parts.filter((p) => p.id !== id));
        toast.success("Repuesto eliminado");
      } catch (error) {
        toast.error(error.message || "Error al eliminar repuesto");
      }
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const partsData = await getParts(modelFilter, 1, 1000);
      const partsToExport = partsData.parts.filter(
        (part) =>
          (!codeFilter ||
            part.id
              .toString()
              .toLowerCase()
              .includes(codeFilter.toLowerCase())) &&
          (!nameFilter ||
            part.name.toLowerCase().includes(nameFilter.toLowerCase()))
      );

      if (partsToExport.length === 0) {
        toast.warn("No hay repuestos para exportar");
        return;
      }

      const doc = new jsPDF();
      const sanitize = (str) =>
        DOMPurify.sanitize(str || "", { RETURN_TRUSTED_TYPE: false });

      doc.setFontSize(16);
      doc.text("Reporte de Inventario", 20, 20);
      doc.setFontSize(12);

      partsToExport.forEach((part, index) => {
        if (index > 0) doc.addPage();
        doc.text(`Repuesto #${sanitize(part.id)}`, 20, 30);

        const partData = [
          ["Código", sanitize(part.id.toString())],
          ["Nombre", sanitize(part.name || "-")],
          ["Cantidad", sanitize(part.quantity.toString() || "0")],
          ["Precio", sanitize(`$${part.price || "0"}`)],
          ["Imagen", "Ver en el sistema"],
        ];
        autoTable(doc, {
          startY: 40,
          head: [["Campo", "Valor"]],
          body: partData,
          theme: "striped",
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
        });
      });

      doc.save("repuestos_filtrados.pdf");
      toast.success("Reporte de repuestos descargado correctamente");
    } catch (error) {
      console.error("[AdminInventory] Error al exportar PDF:", error);
      toast.error("Error al exportar el PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const partsData = await getParts(modelFilter, 1, 1000);
      const partsToExport = partsData.parts.filter(
        (part) =>
          (!codeFilter ||
            part.id
              .toString()
              .toLowerCase()
              .includes(codeFilter.toLowerCase())) &&
          (!nameFilter ||
            part.name.toLowerCase().includes(nameFilter.toLowerCase()))
      );

      if (partsToExport.length === 0) {
        toast.warn("No hay repuestos para exportar");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Repuestos");

      worksheet.columns = [
        { header: "Código", key: "id", width: 15 },
        { header: "Nombre", key: "name", width: 30 },
        { header: "Cantidad", key: "quantity", width: 10 },
        { header: "Precio", key: "price", width: 15 },
      ];

      partsToExport.forEach((part) => {
        worksheet.addRow({
          id: part.id || "-",
          name: part.name || "-",
          quantity: part.quantity || 0,
          price: `$${part.price || "0"}`,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "repuestos_filtrados.xlsx";
      link.click();
      toast.success("Archivo Excel descargado correctamente");
    } catch (error) {
      console.error("[AdminInventory] Error al exportar Excel:", error);
      toast.error("Error al exportar el Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const userData = {
    userId: user?.id,
    userName: `${user?.first_name} ${user?.last_name}`,
    activeOrdersCount: 0,
    notificationsCount: 0,
  };

  return (
    <>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <div className="content" style={{ marginLeft: "270px", padding: "20px" }}>
        <DashboardHeader title="Inventario" {...userData} />
        <Container className="mt-4 d-flex flex-column align-items-center gap-3">
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Código</FilterLabel>
              <Form.Control
                type="text"
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                placeholder="Filtrar por código"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Nombre</FilterLabel>
              <Form.Control
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filtrar por nombre"
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Modelo Compatible</FilterLabel>
              <FilterSelect
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {vehicleModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Exportar a Excel</Tooltip>}
            >
              <CustomButton
                onClick={handleExportExcel}
                aria-label="Exportar a Excel"
                disabled={isExportingExcel}
                style={{ marginRight: "10px" }}
              >
                {isExportingExcel ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFileExcel} /> Excel
                  </>
                )}
              </CustomButton>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Exportar a PDF</Tooltip>}
            >
              <CustomButton
                onClick={handleExportPDF}
                aria-label="Exportar a PDF"
                disabled={isExportingPDF}
                style={{ marginRight: "10px" }}
              >
                {isExportingPDF ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFilePdf} /> PDF
                  </>
                )}
              </CustomButton>
            </OverlayTrigger>
            <CustomButton onClick={() => setShowCreateModal(true)}>
              Agregar Repuesto
            </CustomButton>
          </FiltersContainer>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.length > 0 ? (
                  filteredParts.map((part) => (
                    <tr key={part.id}>
                      <td className="text-center">
                        {part.image ? (
                          <img
                            src={`${API_URL}${part.image}`}
                            alt={part.name}
                            style={{ maxWidth: "50px", maxHeight: "50px" }}
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                            }}
                          />
                        ) : (
                          "Sin imagen"
                        )}
                      </td>
                      <td>{part.id}</td>
                      <td>{part.name}</td>
                      <td>{part.quantity}</td>
                      <td>${part.price}</td>
                      <td>
                        <ActionsContainer>
                          <CustomButton
                            onClick={() => {
                              setSelectedPart(part);
                              setShowDetailsModal(true);
                            }}
                            title="Ver Detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </CustomButton>
                          <CustomButton
                            onClick={() => {
                              setSelectedPart(part);
                              setShowEditModal(true);
                            }}
                            title="Actualizar"
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </CustomButton>
                          <CustomButton
                            onClick={() => handleDeletePart(part.id)}
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </CustomButton>
                        </ActionsContainer>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No hay repuestos disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTable>
          </TableWrapper>
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
        </Container>
      </div>

      <StyledModal
        variant="createParts"
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Repuesto</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <PartForm
            onSubmit={handleCreatePart}
            onCancel={() => setShowCreateModal(false)}
          />
        </ModalBody>
      </StyledModal>

      <StyledModal
        variant="createParts"
        show={showEditModal}
        onHide={() => {
          if (!isSubmitting) {
            setShowEditModal(false);
            setSelectedPart(null);
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Repuesto</Modal.Title>
        </Modal.Header>
        <ModalBody>
          {selectedPart && (
            <PartForm
              initialData={selectedPart}
              onSubmit={handleEditPart}
              onCancel={() => {
                if (!isSubmitting) {
                  setShowEditModal(false);
                  setSelectedPart(null);
                }
              }}
            />
          )}
        </ModalBody>
      </StyledModal>

      <PartDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedPart(null);
        }}
        part={selectedPart}
      />
    </>
  );
};

export default AdminInventory;
