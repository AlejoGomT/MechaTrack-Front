import { useState, useCallback, memo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Form,
  Row,
  Col,
  Button,
  Modal,
  Table,
  Alert,
} from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import {
  createOrder,
  getVehicles,
  getParts,
  updateOrder,
  getOrders,
} from "../services/orderService";
import {
  MainContainer,
  Content,
  StyledModal,
  ModalBody,
  TableWrapper,
  StyledTableModal,
  FormContainer,
  FormSectionTitle,
  FormActions,
  HistoryButtonWrapper,
} from "../styles/GlobalStyles";
import styled from "@emotion/styled";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faCircle } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const ScrollableFormWrapper = styled.div`
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px;
`;

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
    const [formData, setFormData] = useState({
      branch: initialData?.branch || "",
      economicNumber: initialData?.vehicle_economic_number || "",
      kilometraje: initialData?.kilometraje || "",
      vin: initialData?.vin || "",
      serviceType: initialData?.type || "Reparación",
      serviceDescription: initialData?.description || "",
      diagnosis: initialData?.initial_diagnosis || "",
      tasks: initialData?.tasks || "",
      partsList: initialData?.parts?.length > 0 ? initialData.parts : [],
      images: initialData?.images || [],
    });
    const [vehicleData, setVehicleData] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [parts, setParts] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [showHistoryDetailsModal, setShowHistoryDetailsModal] =
      useState(false);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
    const [history, setHistory] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const branches = [...new Set(vehicles.map((v) => v.branch))];

    useEffect(() => {
      console.log("initialData:", initialData);
      const fetchVehicles = async () => {
        try {
          const data = await getVehicles();
          console.log("Vehículos cargados:", data);
          setVehicles(data);
          if (initialData?.vehicle_economic_number && initialData?.branch) {
            const vehicle = data.find(
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
                partsList:
                  initialData?.parts?.length > 0
                    ? initialData.parts
                    : prev.partsList,
                images: initialData?.images || prev.images,
                // Asegurar que los datos del vehículo se mantengan
                plate: vehicle.plate || prev.plate || "",
                brand: vehicle.brand || prev.brand || "",
                model: vehicle.model || prev.model || "",
                year: vehicle.year || prev.year || "",
              }));
            } else {
              // Si no se encuentra el vehículo, mantener los datos de initialData
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
                partsList:
                  initialData?.parts?.length > 0
                    ? initialData.parts
                    : prev.partsList,
                images: initialData?.images || prev.images,
              }));
            }
          }
        } catch (err) {
          console.error("Error al cargar vehículos:", err);
          toast.error(err.message || "Error al cargar vehículos");
        }
      };
      fetchVehicles();
    }, [initialData]);

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
          if (vehicle.economic_number) {
            try {
              const historyData = await getOrders({
                vehicle_economic_number: vehicle.economic_number,
              });
              setHistory(
                historyData.filter((order) => order.id !== initialData?.id)
              );
            } catch (err) {
              console.error("Error al cargar historial:", err);
              setHistory([]);
            }
          }
          try {
            const partsData = await getParts(vehicle.model);
            setParts(partsData);
          } catch (err) {
            toast.error("Error al cargar repuestos");
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

    const handleRequestPart = (part) => {
      setFormData((prev) => ({
        ...prev,
        partsList: [
          ...prev.partsList,
          {
            part_id: part.id,
            name: part.name,
            quantity: 1,
            status: "Solicitado",
            requested_by: "U002",
            authorized_by: null,
          },
        ],
      }));
      setShowPartsModal(false);
    };

    const handleImageUpload = (e) => {
      const files = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...files],
      }));
    };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError("");
      console.log("Formulario enviado:", formData);

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
        await onSubmit(formData);
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

    return (
      <FormContainer fluid>
        {error && <Alert variant="danger">{error}</Alert>}
        <FormSectionTitle>Datos del Vehículo</FormSectionTitle>
        <ScrollableFormWrapper>
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
            <Form.Group className="mb-3">
              <Form.Label>Repuestos Necesarios</Form.Label>
              {formData.partsList.length > 0 ? (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Cantidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.partsList.map((part, index) => (
                      <tr key={index}>
                        <td>{part.name || "Desconocido"}</td>
                        <td>{part.part_id}</td>
                        <td>{part.quantity}</td>
                        <td>{part.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No hay repuestos solicitados.</p>
              )}
              {!isReadOnly && (
                <CustomButton onClick={() => setShowPartsModal(true)}>
                  Solicitar Repuesto
                </CustomButton>
              )}
            </Form.Group>

            <FormSectionTitle>Fotos de Evidencia</FormSectionTitle>
            <Form.Group className="mb-3">
              <Form.Label>Subir Fotos</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleImageUpload}
                disabled={isReadOnly}
                accept="image/*"
              />
              <Form.Text className="text-muted">
                Puedes subir varias fotos relacionadas con la orden de servicio.
              </Form.Text>
              {formData.images.length > 0 && (
                <ul>
                  {formData.images.map((image, index) => (
                    <li key={index}>
                      {image.name || image}
                      {typeof image !== "string" && (
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Vista previa"
                          style={{ maxWidth: "100px", marginLeft: "10px" }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
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
        </ScrollableFormWrapper>

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
              <TableWrapper>
                <StyledTableModal striped bordered hover>
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
                </StyledTableModal>
              </TableWrapper>
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

        <StyledModal
          show={showPartsModal}
          onHide={() => setShowPartsModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Seleccionar Repuestos</Modal.Title>
          </Modal.Header>
          <ModalBody>
            <TableWrapper>
              <StyledTableModal striped bordered hover>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Modelo Compatible</th>
                    <th>Foto</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part.id}>
                      <td>{part.id}</td>
                      <td>{part.name}</td>
                      <td>{part.compatible_models.join(", ")}</td>
                      <td>{part.image}</td>
                      <td>
                        {part.quantity > 0 ? "Disponible" : "No Disponible"}
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRequestPart(part)}
                          disabled={part.quantity === 0}
                        >
                          Solicitar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTableModal>
            </TableWrapper>
          </ModalBody>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowPartsModal(false)}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>
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
  const hideButtons = isModal; // Ocultar botones en modales, mostrar en crear orden

  const handleSaveOrder = useCallback(
    async (formData) => {
      try {
        console.log("Guardando orden con datos:", formData);
        let newOrder;
        if (order?.id) {
          newOrder = await updateOrder(order.id, {
            initial_diagnosis: formData.diagnosis,
            tasks: formData.tasks,
            images: formData.images || [],
            kilometraje: formData.kilometraje
              ? parseInt(formData.kilometraje, 10)
              : undefined,
            branch: formData.branch,
            vehicle_economic_number: formData.economicNumber,
          });
          // Combinar los datos existentes con los actualizados para preservar vehicle_economic_number y otros
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
          };
          toast.success(`Orden #${newOrder.id} actualizada satisfactoriamente`);
        } else {
          newOrder = await createOrder({
            type: formData.serviceType,
            description: formData.serviceDescription,
            initial_diagnosis: formData.diagnosis,
            tasks: formData.tasks,
            images: formData.images || [],
            technician_id: user.id,
            vehicle_economic_number: formData.economicNumber,
            kilometraje: parseInt(formData.kilometraje, 10),
            branch: formData.branch,
            plate: formData.plate,
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
          });
          toast.success(`Orden #${newOrder.id} creada satisfactoriamente`);
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
          err.response?.data?.message || "Error al guardar la orden";
        toast.error(message);
        throw err;
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
