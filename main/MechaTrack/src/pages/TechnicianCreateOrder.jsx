import { useState, useCallback, memo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Form, Row, Col, Button, Modal, Alert, Image } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import PartsModal from "../components/PartsModal";
import OrderImagesModal from "../components/OrderImagesModal";
import { API_URL } from "../services/apiConfig";
import { getVehicles } from "../services/vehicleService";
import { getParts } from "../services/partService";
import {
  createOrder,
  updateOrder,
  getOrders,
  getOrderById,
  deleteOrderImage,
} from "../services/orderService";
import {
  MainContainer,
  Content,
  StyledModal,
  ModalBody,
  FormContainer,
  FormSectionTitle,
  FormActions,
  HistoryButtonWrapper,
  StyledTable,
  ActionsContainer,
  ImageContainer,
  ActionButton,
} from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const HistoryStatusIcon = styled.span`
  margin-right: 5px;
  color: ${({ status }) => {
    switch (status) {
      case "Finalizado":
        return "#28a745";
      case "En Proceso":
        return "#fd7e14";
      case "Pendiente":
        return "#ffc107";
      default:
        return "#6c757d";
    }
  }};
`;

const HistoryEmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
`;

const StatusIndicator = styled.span`
  margin-right: 5px;
  color: ${({ status }) => {
    switch (status) {
      case "Aprobado":
        return "#28a745";
      case "Solicitado":
        return "#ffc107";
      default:
        return "#ff6961";
    }
  }};
`;

const technicianMenu = [
  { label: "Inicio", path: "../technician" },
  { label: "Crear Orden de Servicio", path: "../technician/create-order" },
  { label: "Historial de Órdenes", path: "../technician/history" },
  { label: "Notificaciones", path: "../technician/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const OrderForm = memo(
  ({
    initialData,
    onSubmit,
    onCancel,
    isReadOnly,
    disableFields = [],
    hideButtons = false,
    formRef,
  }) => {
    const { user } = useAuth();

    // Normalizar partsList e images
    const normalizedParts = Array.isArray(initialData?.parts)
      ? initialData.parts.map((part) => ({
          ...part,
          requested_by: part.requested_by_id || String(user.id),
          authorized_by: part.authorized_by_id || null,
        }))
      : [];
    const normalizedImages = Array.isArray(initialData?.images)
      ? initialData.images.map((img) =>
          img.startsWith("/uploads/") ? img : `/uploads/${img}`
        )
      : [];

    const [formData, setFormData] = useState({
      branch: initialData?.branch || "",
      economicNumber: initialData?.vehicle_economic_number || "",
      kilometraje: initialData?.kilometraje || "",
      vin: initialData?.vin || "",
      serviceType: initialData?.type || "Reparación",
      serviceDescription: initialData?.description || "",
      diagnosis: initialData?.initial_diagnosis || "",
      tasks: initialData?.tasks || "",
      partsList: normalizedParts,
      images: normalizedImages,
      imageFiles: [],
      plate: initialData?.plate || "",
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || "",
    });

    const [vehicleData, setVehicleData] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [parts, setParts] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [showPartsManagementModal, setShowPartsManagementModal] =
      useState(false);
    const [showHistoryDetailsModal, setShowHistoryDetailsModal] =
      useState(false);
    const [showImagesModal, setShowImagesModal] = useState(false);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
    const [history, setHistory] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const branches = [...new Set(vehicles.map((v) => v.branch))];

    useEffect(() => {
      const fetchOrderData = async () => {
        if (initialData?.id) {
          try {
            const orderData = await getOrderById(initialData.id);
            const updatedParts = Array.isArray(orderData.parts)
              ? orderData.parts.map((part) => ({
                  ...part,
                  requested_by: part.requested_by_id || String(user.id),
                  authorized_by: part.authorized_by_id || null,
                }))
              : [];
            setFormData((prev) => ({
              ...prev,
              partsList: updatedParts,
              images: Array.isArray(orderData.images)
                ? orderData.images.map((img) =>
                    img.startsWith("/uploads/") ? img : `/uploads/${img}`
                  )
                : [],
            }));
          } catch (err) {
            toast.error("Error al cargar los datos de la orden");
          }
        }
      };
      fetchOrderData();
    }, [initialData?.id, user.id]);

    useEffect(() => {
      const fetchVehicles = async () => {
        try {
          const data = await getVehicles({ limit: 1000 });

          const vehiclesData = Array.isArray(data.vehicles)
            ? data.vehicles
            : [];
          setVehicles(vehiclesData);

          if (initialData?.vehicle_economic_number && initialData?.branch) {
            const vehicle = vehiclesData.find(
              (v) =>
                v.economic_number === initialData.vehicle_economic_number &&
                v.branch === initialData.branch
            );
            if (vehicle) {
              setVehicleData(vehicle);
              setFormData((prev) => ({
                ...prev,
                branch: vehicle.branch || prev.branch,
                economicNumber: vehicle.economic_number || prev.economicNumber,
                kilometraje:
                  vehicle.mileage ||
                  initialData.kilometraje ||
                  prev.kilometraje,
                vin: vehicle.vin || prev.vin,
                serviceType: initialData?.type || prev.serviceType,
                serviceDescription:
                  initialData?.description || prev.serviceDescription,
                diagnosis: initialData?.initial_diagnosis || prev.diagnosis,
                tasks: initialData?.tasks || prev.tasks,
                partsList: Array.isArray(initialData?.parts)
                  ? initialData.parts.map((part) => ({
                      ...part,
                      requested_by: part.requested_by_id || String(user.id),
                      authorized_by: part.authorized_by_id || null,
                    }))
                  : prev.partsList,
                images: Array.isArray(initialData?.images)
                  ? initialData.images.map((img) =>
                      img.startsWith("/uploads/") ? img : `/uploads/${img}`
                    )
                  : prev.images,
                plate: vehicle.plate || prev.plate || "",
                brand: vehicle.brand || prev.brand || "",
                model: vehicle.model || prev.model || "",
                year: vehicle.year || prev.year || "",
              }));
            } else {
              setFormData((prev) => ({
                ...prev,
                branch: initialData.branch || prev.branch,
                economicNumber:
                  initialData.vehicle_economic_number || prev.economicNumber,
                kilometraje: initialData.kilometraje || prev.kilometraje,
                vin: initialData.vin || prev.vin,
                serviceType: initialData?.type || prev.serviceType,
                serviceDescription:
                  initialData?.description || prev.serviceDescription,
                diagnosis: initialData?.initial_diagnosis || prev.diagnosis,
                tasks: initialData?.tasks || prev.tasks,
                partsList: Array.isArray(initialData?.parts)
                  ? initialData.parts.map((part) => ({
                      ...part,
                      requested_by: part.requested_by_id || String(user.id),
                      authorized_by: part.authorized_by_id || null,
                    }))
                  : prev.partsList,
                images: Array.isArray(initialData?.images)
                  ? initialData.images.map((img) =>
                      img.startsWith("/uploads/") ? img : `/uploads/${img}`
                    )
                  : prev.images,
              }));
            }
          }
        } catch (err) {
          toast.error(err.message || "Error al cargar vehículos");
          setVehicles([]);
        }
      };
      fetchVehicles();
    }, [initialData, user.id]);

    useEffect(() => {
      const updateVehicleData = async () => {
        const vehicle = vehicles.find(
          (v) =>
            v.economic_number === formData.economicNumber &&
            v.branch === formData.branch
        );
        if (vehicle) {
          setVehicleData(vehicle);
          setFormData((prev) => ({
            ...prev,
            branch: vehicle.branch || prev.branch,
            economicNumber: vehicle.economic_number || prev.economicNumber,
            kilometraje: vehicle.mileage || prev.kilometraje,
            vin: vehicle.vin || prev.vin,
            plate: vehicle.plate || prev.plate || "",
            brand: vehicle.brand || prev.brand || "",
            model: vehicle.model || prev.model || "",
            year: vehicle.year || prev.year || "",
          }));
          if (vehicle.economic_number && vehicle.branch) {
            try {
              const historyData = await getOrders({
                vehicle_economic_number: vehicle.economic_number,
                branch: vehicle.branch,
                limit: 1000,
              });

              if (!Array.isArray(historyData.orders)) {
                console.error(
                  "[TechnicianCreateOrder] Respuesta inválida de getOrders:",
                  historyData
                );
                setHistory([]);
                toast.error("Respuesta inválida al cargar historial");
                return;
              }

              const filteredHistory = historyData.orders.filter(
                (order) =>
                  order.id !== initialData?.id &&
                  order.vehicle_economic_number === vehicle.economic_number &&
                  order.branch === vehicle.branch
              );
              setHistory(filteredHistory);
            } catch (err) {
              console.error(
                "[TechnicianCreateOrder] Error al cargar historial:",
                err
              );
              toast.error(err.message || "Error al cargar historial");
              setHistory([]);
            }
            try {
              const partsData = await getParts(vehicle.model, 1, 1000);
              const partsArray = Array.isArray(partsData.parts)
                ? partsData.parts
                : [];
              setParts(partsArray);
            } catch (err) {
              toast.error(err.message || "Error al cargar repuestos");
              setParts([]);
            }
          } else {
            setHistory([]);
            setParts([]);
          }
        } else {
          setVehicleData(null);
          setHistory([]);
          setParts([]);
        }
      };
      if (formData.economicNumber && formData.branch && vehicles.length > 0) {
        updateVehicleData();
      }
    }, [formData.economicNumber, formData.branch, vehicles, initialData?.id]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "branch" ? { economicNumber: "" } : {}),
      }));
    };

    const handleImageUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length + formData.images.length > 10) {
        toast.error("No se pueden cargar más de 10 imágenes");
        return;
      }

      try {
        let updatedImages = [...formData.images];
        let updatedImageFiles = [...formData.imageFiles];

        if (initialData?.id) {
          const updatedOrder = await updateOrder(initialData.id, {
            images: files,
            existingImages: formData.images,
          });
          updatedImages = Array.isArray(updatedOrder.images)
            ? updatedOrder.images.map((img) =>
                img.startsWith("/uploads/") ? img : `/uploads/${img}`
              )
            : [];
          updatedImageFiles = [];
          toast.success(`${files.length} imagen(es) subida(s) correctamente`);
        } else {
          const blobUrls = files.map((file) => URL.createObjectURL(file));
          updatedImages = [...formData.images, ...blobUrls];
          updatedImageFiles = [...formData.imageFiles, ...files];
          toast.success(
            `${files.length} imagen(es) seleccionada(s) para subir al guardar`
          );
        }

        setFormData((prev) => ({
          ...prev,
          images: updatedImages,
          imageFiles: updatedImageFiles,
        }));
      } catch (error) {
        console.error("Error al subir imágenes:", error);
        toast.error(error.message || "Error al subir imágenes");
      }
    };

    const handleImageDelete = async (index) => {
      try {
        const imageToDelete = formData.images[index];
        if (imageToDelete.startsWith("blob:")) {
          const updatedImages = formData.images.filter((_, i) => i !== index);
          const updatedImageFiles = formData.imageFiles.filter(
            (_, i) =>
              i !== index - formData.images.length + formData.imageFiles.length
          );
          setFormData((prev) => ({
            ...prev,
            images: updatedImages,
            imageFiles: updatedImageFiles,
          }));
          URL.revokeObjectURL(imageToDelete); // Liberar memoria
          toast.success("Imagen eliminada");
        } else {
          // Imagen existente en el servidor
          await deleteOrderImage(initialData.id, index);
          setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imageFiles: [],
          }));
          toast.success("Imagen eliminada del servidor");
        }
      } catch (error) {
        toast.error(error.message || "Error al eliminar imagen");
      }
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError("");

      const requiredFields = [
        { key: "branch", label: "Sucursal" },
        { key: "economicNumber", label: "N° Económico" },
        { key: "kilometraje", label: "Kilometraje" },
        { key: "serviceType", label: "Tipo de Servicio" },
        { key: "serviceDescription", label: "Descripción del Servicio" },
        { key: "diagnosis", label: "Diagnóstico Inicial" },
        { key: "tasks", label: "Tareas" },
      ];
      for (const field of requiredFields) {
        if (!formData[field.key]) {
          setError(`${field.label} es obligatorio`);
          toast.error(`${field.label} es obligatorio`);
          setIsSubmitting(false);
          return;
        }
      }

      try {
        const orderData = {
          ...formData,
          images: formData.imageFiles,
        };

        const updatedOrder = await onSubmit(orderData);

        setFormData((prev) => ({
          ...prev,
          images: Array.isArray(updatedOrder.images)
            ? updatedOrder.images.map((img) =>
                img.startsWith("/uploads/") ? img : `/uploads/${img}`
              )
            : [],
          imageFiles: [],
        }));
      } catch (err) {
        console.error("Error en handleFormSubmit:", err);
        setError(err.message || "Error al guardar la orden");
        toast.error(err.message || "Error al guardar la orden");
      } finally {
        setIsSubmitting(false);
      }
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const handleViewHistoryDetails = (order) => {
      setSelectedHistoryOrder(order);
      setShowHistoryModal(false);
      setShowHistoryDetailsModal(true);
    };

    const hasHistory = history.length > 0;
    const filteredVehicles = vehicles.filter(
      (v) => v.branch === formData.branch
    );
    const requestedParts = formData.partsList.filter(
      (part) =>
        part.status === "Aprobado" ||
        part.status === "Solicitado" ||
        part.status === "Rechazado" ||
        part.status === "Devolución Solicitada" ||
        part.status === "Devolución Rechazada"
    );

    return (
      <FormContainer fluid>
        {error && <Alert variant="danger">{error}</Alert>}
        <FormSectionTitle>Datos del Vehículo</FormSectionTitle>

        <Form onSubmit={handleFormSubmit} ref={formRef}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Número de Orden</Form.Label>
                <Form.Control
                  type="text"
                  value={initialData?.id || "Auto-generado"}
                  disabled
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sucursal</Form.Label>
                <Form.Select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  disabled={isReadOnly || !!initialData}
                >
                  <option value="">Seleccione una Sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>N° Económico</Form.Label>
                <Form.Select
                  name="economicNumber"
                  value={formData.economicNumber}
                  onChange={handleInputChange}
                  disabled={isReadOnly || !!initialData || !formData.branch}
                >
                  <option value="">Seleccione un N° Económico</option>
                  {filteredVehicles.map((v) => (
                    <option key={v.economic_number} value={v.economic_number}>
                      {v.economic_number}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Placa del Vehículo</Form.Label>
                <Form.Control
                  type="text"
                  value={vehicleData?.plate || formData.plate || ""}
                  disabled
                  placeholder="Autocompletado"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca y Modelo</Form.Label>
                <Form.Control
                  type="text"
                  value={
                    vehicleData
                      ? `${vehicleData.brand} ${vehicleData.model}`
                      : formData.brand && formData.model
                      ? `${formData.brand} ${formData.model}`
                      : ""
                  }
                  disabled
                  placeholder="Autocompletado"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Año del Vehículo</Form.Label>
                <Form.Control
                  type="number"
                  value={vehicleData?.year || formData.year || ""}
                  disabled
                  placeholder="Autocompletado"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Kilometraje</Form.Label>
                <Form.Control
                  type="number"
                  name="kilometraje"
                  value={formData.kilometraje}
                  onChange={handleInputChange}
                  placeholder="Kilometraje Actual"
                  disabled={isReadOnly}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Número de Serie (VIN)</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.vin}
                  disabled
                  placeholder="Autocompletado"
                />
              </Form.Group>
            </Col>
          </Row>
          {hasHistory && (
            <HistoryButtonWrapper md={6}>
              <CustomButton onClick={() => setShowHistoryModal(true)}>
                Ver Historial
              </CustomButton>
            </HistoryButtonWrapper>
          )}

          <FormSectionTitle>Descripción del Servicio</FormSectionTitle>
          <Form.Group className="mb-3">
            <Form.Label>Tipo de Servicio</Form.Label>
            <Form.Select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleInputChange}
              disabled={isReadOnly || disableFields.includes("serviceType")}
            >
              <option>Reparación</option>
              <option>Mantenimiento</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción del Servicio</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleInputChange}
              placeholder="Detalles del servicio solicitado"
              disabled={
                isReadOnly || disableFields.includes("serviceDescription")
              }
            />
          </Form.Group>

          <FormSectionTitle>Diagnóstico y Tareas</FormSectionTitle>
          <Form.Group className="mb-3">
            <Form.Label>Diagnóstico Inicial</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              placeholder="Observaciones del mecánico"
              disabled={isReadOnly}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tareas a Realizar</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="tasks"
              value={formData.tasks}
              onChange={handleInputChange}
              placeholder="Listado de tareas"
              disabled={isReadOnly}
            />
          </Form.Group>

          <FormSectionTitle>Repuestos Necesarios</FormSectionTitle>
          <Form.Group className="mb-3">
            {requestedParts.length > 0 && (
              <>
                <h6>Repuestos Solicitados</h6>
                <StyledTable className="mb-3" striped bordered hover>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Cantidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestedParts.map((part, index) => (
                      <tr key={part.id || index}>
                        <td>{part.part_id || "-"}</td>
                        <td>{part.name || "-"}</td>
                        <td>{part.quantity || 0}</td>
                        <td>
                          <StatusIndicator status={part.status}>
                            <FontAwesomeIcon icon={faCircle} />
                          </StatusIndicator>
                          {part.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </>
            )}
            <ActionsContainer>
              {formData.partsList.length > 0 ? (
                !isReadOnly && (
                  <>
                    <CustomButton
                      onClick={() => setShowPartsManagementModal(true)}
                      disabled={isReadOnly}
                    >
                      Gestionar Repuestos
                    </CustomButton>
                  </>
                )
              ) : (
                <p>No hay repuestos solicitados.</p>
              )}
              {!isReadOnly && (
                <CustomButton
                  onClick={() => setShowPartsModal(true)}
                  style={{ marginLeft: "10px" }}
                >
                  Solicitar Nuevo Repuesto
                </CustomButton>
              )}
            </ActionsContainer>
          </Form.Group>

          <FormSectionTitle>Imágenes</FormSectionTitle>
          <Form.Group className="mb-3 text-center">
            {formData.images.length > 0 ? (
              <>
                <Row className="mb-3">
                  {formData.images.slice(0, 4).map((img, index) => (
                    <Col md={3} key={index} className="mb-2">
                      <div className="position-relative">
                        <ImageContainer>
                          <Image
                            src={
                              img.startsWith("blob:") ? img : `${API_URL}${img}`
                            }
                            thumbnail
                            style={{ maxWidth: "100px" }}
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                            }}
                          />
                        </ImageContainer>
                        {!isReadOnly && (
                          <ActionButton
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0"
                            onClick={() => handleImageDelete(index)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </ActionButton>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
                <ActionButton
                  variant="primary"
                  onClick={() => setShowImagesModal(true)}
                >
                  {!isReadOnly ? "Gestionar Imágenes" : "Ver"}
                </ActionButton>
              </>
            ) : (
              <Form.Group className="mt-3">
                <Form.Label>Añadir Nuevas Imágenes</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                />
              </Form.Group>
            )}
          </Form.Group>

          {!isReadOnly && !hideButtons && (
            <FormActions>
              <CustomButton type="submit" disabled={isSubmitting}>
                {initialData?.id ? "Actualizar" : "Crear Orden"}
              </CustomButton>
              {onCancel && (
                <CustomButton type="button" onClick={onCancel}>
                  Cerrar
                </CustomButton>
              )}
            </FormActions>
          )}
        </Form>

        <StyledModal
          show={showHistoryModal}
          onHide={() => setShowHistoryModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Historial de Órdenes - {formData.economicNumber} (
              {formData.branch})
            </Modal.Title>
          </Modal.Header>
          <ModalBody>
            {hasHistory ? (
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>N° Orden</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.id}</td>
                      <td>{entry.description}</td>
                      <td>{formatDate(entry.created_at)}</td>
                      <td>
                        <HistoryStatusIcon status={entry.status}>
                          <FontAwesomeIcon icon={faCircle} />
                        </HistoryStatusIcon>
                        {entry.status}
                      </td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewHistoryDetails(entry)}
                        >
                          <FontAwesomeIcon icon={faEye} /> Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <HistoryEmptyMessage>
                <p>No hay historial disponible para este vehículo.</p>
              </HistoryEmptyMessage>
            )}
          </ModalBody>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowHistoryModal(false)}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>

        <StyledModal
          show={showHistoryDetailsModal}
          onHide={() => {
            setShowHistoryDetailsModal(false);
            setShowHistoryModal(true);
          }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Detalles de la Orden #{selectedHistoryOrder?.id}
            </Modal.Title>
          </Modal.Header>
          <ModalBody>
            {selectedHistoryOrder && (
              <OrderForm
                initialData={selectedHistoryOrder}
                isReadOnly={true}
                onSubmit={() => {}}
              />
            )}
          </ModalBody>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowHistoryDetailsModal(false);
                setShowHistoryModal(true);
              }}
            >
              Volver
            </Button>
          </Modal.Footer>
        </StyledModal>

        <OrderImagesModal
          show={showImagesModal}
          onHide={() => setShowImagesModal(false)}
          orderId={initialData?.id}
          images={formData.images}
          setImages={(newImages) =>
            setFormData((prev) => ({ ...prev, images: newImages }))
          }
          isReadOnly={isReadOnly}
          isFinalized="En Proceso"
        />

        <PartsModal
          showPartsModal={showPartsModal}
          setShowPartsModal={setShowPartsModal}
          showPartsManagementModal={showPartsManagementModal}
          setShowPartsManagementModal={setShowPartsManagementModal}
          partsList={formData.partsList}
          setPartsList={(newPartsList) => {
            console.log("newPartsList recibido de PartsModal:", newPartsList);
            setFormData((prev) => {
              const updatedPartsList = Array.isArray(newPartsList)
                ? newPartsList.map((part) => ({
                    ...part,
                    requested_by: part.requested_by_id || String(user.id),
                    authorized_by: part.authorized_by_id || null,
                  }))
                : [];
              return {
                ...prev,
                partsList: updatedPartsList,
              };
            });
          }}
          availableParts={parts}
          orderId={initialData?.id}
          isReadOnly={isReadOnly}
          userId={user.id}
        />
      </FormContainer>
    );
  }
);

const TechnicianCreateOrder = ({
  order,
  onClose,
  isReadOnly = false,
  isModal = false,
  disableFields = [],
  formRef,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const updateDisableFields = order?.id
    ? ["branch", "economicNumber", "vin", "serviceType", "serviceDescription"]
    : disableFields;
  const hideButtons = isModal;

  const handleSaveOrder = useCallback(
    async (formData) => {
      try {
        const requiredFields = [
          { key: "economicNumber", label: "N° Económico" },
          { key: "branch", label: "Sucursal" },
          { key: "kilometraje", label: "Kilometraje" },
          { key: "diagnosis", label: "Diagnóstico Inicial" },
          { key: "tasks", label: "Tareas" },
        ];
        for (const field of requiredFields) {
          if (!formData[field.key]) {
            throw new Error(`${field.label} es obligatorio`);
          }
        }

        const normalizedParts = Array.isArray(formData.partsList)
          ? formData.partsList.map((part) => {
              if (
                !part.part_id ||
                String(part.part_id).length > 10 ||
                !part.quantity ||
                part.quantity < 0 ||
                !part.requested_by ||
                String(part.requested_by).length > 10
              ) {
                throw new Error(
                  `Datos de repuesto inválidos: ${JSON.stringify(part)}`
                );
              }
              return {
                part_id: String(part.part_id),
                quantity: parseInt(part.quantity, 10),
                status: part.status || "Solicitado",
                requested_by: part.requested_by_id || String(user.id),
                authorized_by: part.authorized_by_id || null,
              };
            })
          : [];

        let newOrder;
        if (order?.id) {
          newOrder = await updateOrder(order.id, {
            initial_diagnosis: formData.diagnosis,
            tasks: formData.tasks,
            existingImages: formData.images.filter(
              (img) => !img.startsWith("blob:")
            ),
            images: formData.imageFiles,
            parts: normalizedParts,
            kilometraje: formData.kilometraje
              ? parseInt(formData.kilometraje, 10)
              : undefined,
            branch: formData.branch,
            vehicle_economic_number: formData.economicNumber,
          });
          newOrder = {
            ...order,
            ...newOrder,
            vehicle_economic_number:
              formData.economicNumber || order.vehicle_economic_number,
            branch: formData.branch || order.branch,
            kilometraje:
              newOrder.kilometraje || formData.kilometraje || order.kilometraje,
            vin: formData.vin || order.vin || newOrder.vin,
            plate: order.plate || formData.plate,
            brand: order.brand || formData.brand,
            model: order.model || formData.model,
            year: order.year || formData.year,
            parts: normalizedParts,
            images: newOrder.images || formData.images,
          };
          toast.success(
            newOrder.id
              ? `Orden #${newOrder.id} actualizada satisfactoriamente`
              : "Orden actualizada satisfactoriamente"
          );
        } else {
          newOrder = await createOrder({
            type: formData.serviceType,
            description: formData.serviceDescription,
            initial_diagnosis: formData.diagnosis,
            tasks: formData.tasks,
            images: formData.imageFiles,
            parts: normalizedParts,
            technician_id: user.id,
            vehicle_economic_number: formData.economicNumber,
            kilometraje: parseInt(formData.kilometraje, 10),
            branch: formData.branch,
            plate: formData.plate,
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
          });
          toast.success(
            newOrder.id
              ? `Orden #${newOrder.id} creada satisfactoriamente`
              : "Orden creada satisfactoriamente"
          );
        }
        if (onClose) {
          onClose(newOrder);
        } else {
          navigate("/technician");
        }
        return newOrder;
      } catch (err) {
        console.error("Error al guardar la orden:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Error al guardar la orden";
        toast.error(message);
        throw new Error(message);
      }
    },
    [user.id, onClose, navigate, order]
  );

  return (
    <>
      {isModal ? (
        <OrderForm
          initialData={order}
          onSubmit={handleSaveOrder}
          onCancel={onClose}
          isReadOnly={isReadOnly}
          disableFields={updateDisableFields}
          hideButtons={hideButtons}
          formRef={formRef}
        />
      ) : (
        <MainContainer fluid>
          <Sidebar menuItems={technicianMenu} title="Menú" />
          <Content>
            <DashboardHeader
              title={
                order ? "Editar Orden de Servicio" : "Crear Orden de Servicio"
              }
              userId={user.id}
              userName={`${user.first_name} ${user.last_name}`}
            />
            <OrderForm
              initialData={order}
              onSubmit={handleSaveOrder}
              onCancel={onClose}
              isReadOnly={isReadOnly}
              disableFields={updateDisableFields}
              hideButtons={hideButtons}
              formRef={formRef}
            />
          </Content>
        </MainContainer>
      )}
    </>
  );
};

export default TechnicianCreateOrder;
