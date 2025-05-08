import {
  Form,
  Row,
  Col,
  Image,
  ListGroup,
  Button,
  Table,
  InputGroup,
} from "react-bootstrap";
import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faTrash,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import {
  colors,
  SectionTitle,
  ActionButton,
  StyledTable,
} from "../styles/GlobalStyles";
import AddPartButton from "./AddPartButton";

const ReadOnlyField = styled(Form.Control)`
  background-color: #f8f9fa;
  border: none;
  padding: 5px;
  font-size: 1rem;
`;

const DisabledField = styled(Form.Control)`
  background-color: #e9ecef;
  opacity: 0.7;
  cursor: not-allowed;
`;

const PartItem = styled(ListGroup.Item)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
`;

const OrderDetails = ({
  order,
  isReadOnly,
  onPartAction,
  onEditPart,
  onDeletePart,
  onAddPart,
  editedParts,
  setEditedParts,
  canEditParts,
  userId,
}) => {
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [newImages, setNewImages] = useState([]);
  const [editingPartIndex, setEditingPartIndex] = useState(null);
  const [editPartData, setEditPartData] = useState({ quantity: 0, price: 0 });
  const isFinalized = order.status === "Finalizado";
  const isInProcess = order.status === "En Proceso";

  // Valores posibles para el campo Tipo (ajusta según tu base de datos)
  const orderTypes = ["Mantenimiento", "Reparación", "Inspección"];

  useEffect(() => {
    console.log("[OrderDetails] order:", order);
    console.log("[OrderDetails] order.mileage:", order.mileage);
    console.log("[OrderDetails] editedParts:", editedParts);
    console.log("[OrderDetails] orderId para AddPartButton:", order.id);
  }, [order, editedParts]);

  const handleRejectionNoteChange = (index, value) => {
    setRejectionNotes({ ...rejectionNotes, [index]: value });
  };

  const handlePartAction = (index, action) => {
    if (action === "reject" && !rejectionNotes[index]) {
      toast.error("La nota de rechazo es obligatoria");
      return;
    }
    console.log("[OrderDetails] Acción en repuesto:", {
      index,
      action,
      note: rejectionNotes[index],
    });
    onPartAction(index, action, rejectionNotes[index] || "");
  };

  const handleEditPartStart = (index) => {
    const part = editedParts[index];
    setEditingPartIndex(index);
    setEditPartData({
      quantity: part.quantity,
      price: part.price || 0,
    });
  };

  const handleEditPartChange = (field, value) => {
    setEditPartData((prev) => ({
      ...prev,
      [field]:
        field === "quantity" ? parseInt(value) || 0 : parseFloat(value) || 0,
    }));
  };

  const handleEditPartSave = (index) => {
    if (editPartData.quantity < 0 || editPartData.price < 0) {
      toast.error("Cantidad y precio deben ser no negativos");
      return;
    }
    const updatedPart = {
      ...editedParts[index],
      quantity: editPartData.quantity,
      price: editPartData.price,
    };
    const updatedParts = [...editedParts];
    updatedParts[index] = updatedPart;
    setEditedParts(updatedParts);
    setEditingPartIndex(null);
    onEditPart("parts", updatedParts);
    toast.success("Repuesto actualizado");
  };

  const handleEditPartCancel = () => {
    setEditingPartIndex(null);
    setEditPartData({ quantity: 0, price: 0 });
  };

  const handleImageDelete = (index) => {
    const updatedImages = order.images.filter((_, i) => i !== index);
    onEditPart("images", updatedImages);
    toast.success("Imagen eliminada");
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewImages([...newImages, ...files]);
    const filePaths = files.map((file) => URL.createObjectURL(file));
    onEditPart("images", [...order.images, ...filePaths]);
    toast.success("Imágenes añadidas");
  };

  const calculateTotal = () => {
    return editedParts
      .reduce((sum, part) => sum + part.quantity * (part.price || 0), 0)
      .toFixed(2);
  };

  const validateMileage = (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0;
  };

  // Filtrar repuestos por estado
  const requestedParts = editedParts.filter(
    (part) => part.status === "Solicitado"
  );
  const approvedParts = editedParts.filter(
    (part) => part.status === "Aprobado"
  );

  return (
    <>
      <SectionTitle className="mt-3">Datos del Vehículo</SectionTitle>
      <Row className="mb-3">
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Número Económico</Form.Label>
            <ReadOnlyField
              value={order.vehicle_economic_number || "-"}
              readOnly
            />
          </Form.Group>
        </Col>
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Placa</Form.Label>
            <ReadOnlyField value={order.plate || "-"} readOnly />
          </Form.Group>
        </Col>
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Marca</Form.Label>
            <ReadOnlyField value={order.brand || "-"} readOnly />
          </Form.Group>
        </Col>
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Modelo</Form.Label>
            <ReadOnlyField value={order.model || "-"} readOnly />
          </Form.Group>
        </Col>
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Año</Form.Label>
            <ReadOnlyField value={order.year || "-"} readOnly />
          </Form.Group>
        </Col>
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Sucursal</Form.Label>
            <ReadOnlyField value={order.branch || "-"} readOnly />
          </Form.Group>
        </Col>
        <Col md={6} className="mb-2">
          <Form.Group>
            <Form.Label>Kilometraje</Form.Label>
            {isReadOnly || isInProcess ? (
              <ReadOnlyField
                value={
                  order.mileage != null ? order.mileage : "No especificado"
                }
                readOnly
              />
            ) : (
              <Form.Control
                type="number"
                value={order.mileage != null ? order.mileage : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || validateMileage(value)) {
                    onEditPart(
                      "mileage",
                      value === "" ? null : parseInt(value)
                    );
                  } else {
                    toast.error("El kilometraje debe ser un número positivo");
                  }
                }}
                placeholder="Ej: 123456"
                min="0"
              />
            )}
          </Form.Group>
        </Col>
      </Row>

      <SectionTitle>Detalles de la Orden</SectionTitle>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Tipo</Form.Label>
            {isReadOnly || isInProcess ? (
              <ReadOnlyField value={order.type || "-"} readOnly />
            ) : isFinalized ? (
              <Form.Select
                value={order.type || ""}
                onChange={(e) => onEditPart("type", e.target.value)}
              >
                <option value="">Selecciona un tipo</option>
                {orderTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Form.Select>
            ) : (
              <Form.Control
                value={order.type || ""}
                onChange={(e) => onEditPart("type", e.target.value)}
                placeholder="Ej: Mantenimiento"
              />
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Descripción</Form.Label>
            {isReadOnly || isInProcess ? (
              <ReadOnlyField
                as="textarea"
                value={order.description || "-"}
                readOnly
              />
            ) : (
              <Form.Control
                as="textarea"
                value={order.description || ""}
                onChange={(e) => onEditPart("description", e.target.value)}
                placeholder="Descripción del servicio"
              />
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Diagnóstico Inicial</Form.Label>
            {isReadOnly || isInProcess ? (
              <ReadOnlyField
                as="textarea"
                value={order.initial_diagnosis || "-"}
                readOnly
              />
            ) : (
              <Form.Control
                as="textarea"
                value={order.initial_diagnosis || ""}
                onChange={(e) =>
                  onEditPart("initial_diagnosis", e.target.value)
                }
                placeholder="Diagnóstico inicial"
              />
            )}
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Tareas</Form.Label>
            {isReadOnly || isInProcess ? (
              <ReadOnlyField
                as="textarea"
                value={order.tasks || "-"}
                readOnly
              />
            ) : (
              <Form.Control
                as="textarea"
                value={order.tasks || ""}
                onChange={(e) => onEditPart("tasks", e.target.value)}
                placeholder="Tareas realizadas"
              />
            )}
          </Form.Group>
        </Col>
      </Row>

      <SectionTitle>Imágenes</SectionTitle>
      {order.images?.length > 0 || newImages.length > 0 ? (
        <Row className="mb-3">
          {order.images.map((img, index) => (
            <Col md={3} key={index} className="mb-2">
              <div className="position-relative">
                <Image src={img} thumbnail style={{ maxWidth: "100px" }} />
                {isFinalized && (
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
      ) : (
        <p>Sin imágenes disponibles</p>
      )}
      {isFinalized && (
        <Form.Group className="mb-3">
          <Form.Label>Añadir Nuevas Imágenes</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageUpload}
          />
        </Form.Group>
      )}

      <SectionTitle>Repuestos</SectionTitle>

      {/* Sección para repuestos aprobados */}
      <h6>Repuestos Aprobados</h6>
      {isFinalized && approvedParts.length > 0 ? (
        <ListGroup.Item>
          <StyledTable>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Solicitado por</th>
                <th>Autorizado por</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {approvedParts.map((part, index) => (
                <tr key={index}>
                  <td>{part.name}</td>
                  <td>
                    {editingPartIndex === index ? (
                      <InputGroup style={{ maxWidth: "120px" }}>
                        <Form.Control
                          type="number"
                          value={editPartData.quantity}
                          onChange={(e) =>
                            handleEditPartChange("quantity", e.target.value)
                          }
                          min="0"
                        />
                      </InputGroup>
                    ) : (
                      part.quantity
                    )}
                  </td>
                  <td>
                    {editingPartIndex === index ? (
                      <InputGroup style={{ maxWidth: "120px" }}>
                        <Form.Control
                          type="number"
                          value={editPartData.price}
                          onChange={(e) =>
                            handleEditPartChange("price", e.target.value)
                          }
                          min="0"
                          step="0.01"
                        />
                      </InputGroup>
                    ) : (
                      `$${part.price != null ? part.price : 0}`
                    )}
                  </td>
                  <td>{part.requested_by}</td>
                  <td>{part.authorized_by || "-"}</td>
                  <td>Aprobado</td>
                  <td className="d-flex">
                    {editingPartIndex === index ? (
                      <>
                        <ActionButton
                          variant="success"
                          className="me-2"
                          onClick={() => handleEditPartSave(index)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </ActionButton>
                        <ActionButton
                          variant="secondary"
                          onClick={handleEditPartCancel}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </ActionButton>
                      </>
                    ) : (
                      <>
                        <ActionButton
                          variant="primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditPartStart(index)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          onClick={() => onDeletePart(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </ActionButton>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </ListGroup.Item>
      ) : approvedParts.length > 0 ? (
        <ListGroup.Item>
          <StyledTable>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Solicitado por</th>
                <th>Autorizado por</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {approvedParts.map((part, index) => (
                <tr key={index}>
                  <td>{part.name}</td>
                  <td>{part.quantity}</td>
                  <td>${part.price != null ? part.price.toFixed(2) : 0}</td>
                  <td>{part.requested_by}</td>
                  <td>{part.authorized_by || "-"}</td>
                  <td>Aprobado</td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </ListGroup.Item>
      ) : (
        <p>Sin repuestos aprobados</p>
      )}

      {/* Sección para repuestos solicitados (solo si no está finalizado) */}
      {!isFinalized && (
        <>
          <h6>Repuestos Solicitados</h6>
          {requestedParts.length > 0 ? (
            <ListGroup className="mb-3">
              {requestedParts.map((part, index) => (
                <PartItem key={index}>
                  <div>
                    <strong>{part.name}</strong>
                    <br />
                    Cantidad: {part.quantity}
                    <br />
                    Precio Unitario: ${part.price != null ? part.price : 0}
                    <br />
                    Solicitado por: {part.requested_by}
                    <br />
                    <Form.Group className="mt-2">
                      <Form.Label>Nota de Rechazo (obligatoria)</Form.Label>
                      <Form.Control
                        type="text"
                        value={rejectionNotes[index] || ""}
                        onChange={(e) =>
                          handleRejectionNoteChange(index, e.target.value)
                        }
                        placeholder="Motivo del rechazo"
                      />
                    </Form.Group>
                  </div>
                  <div>
                    <ActionButton
                      variant="primary"
                      size="sm"
                      onClick={() => handlePartAction(index, "accept")}
                      className="me-2"
                    >
                      <FontAwesomeIcon icon={faCheck} /> Aceptar
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      size="sm"
                      onClick={() => handlePartAction(index, "reject")}
                      disabled={!rejectionNotes[index]}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Rechazar
                    </ActionButton>
                  </div>
                </PartItem>
              ))}
            </ListGroup>
          ) : (
            <p>Sin repuestos solicitados</p>
          )}
        </>
      )}

      {/* Botón para añadir repuesto */}
      {isFinalized && (
        <AddPartButton
          orderId={order.id}
          userId={userId}
          partsList={editedParts}
          setPartsList={setEditedParts}
          isFinalized={isFinalized}
        />
      )}

      <SectionTitle>Total: ${calculateTotal()}</SectionTitle>
    </>
  );
};

export default OrderDetails;
