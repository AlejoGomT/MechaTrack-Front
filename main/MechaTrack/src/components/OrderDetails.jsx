import { Form, Row, Col, Image, ListGroup, InputGroup } from "react-bootstrap";
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
  SectionTitle,
  ActionButton,
  StyledTable,
  ImageContainer,
  ActionsContainer,
} from "../styles/GlobalStyles";
import AddPartButton from "./AddPartButton";
import { useSocket } from "../context/SocketContext";
import OrderImagesModal from "./OrderImagesModal";
import { API_URL } from "../services/apiConfig";
import {
  deleteAdminImage,
  addAdminImages,
} from "../services/adminOrderService";
import { processPartReturn } from "../services/partService";
import { getOrderById } from "../services/orderService";
import { getPartById } from "../services/partService";
import { editAdminPart } from "../services/adminOrderService";

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
  setOrder,
  isReadOnly,
  onPartAction,
  onEditPart,
  onDeletePart,
  onAddPart,
  editedParts,
  setEditedParts,
  canEditParts,
  userId,
  isAdmin,
}) => {
  const { setUpdateOrderCallback } = useSocket();
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [newImages, setNewImages] = useState([]);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [editPartData, setEditPartData] = useState({ quantity: 0, price: 0 });
  const isFinalized = order.status === "Finalizado";
  const isInProcess = order.status === "En Proceso";

  const orderTypes = ["Mantenimiento", "Reparación"];

  useEffect(() => {
    console.log("[OrderDetails] order:", {
      ...order,
      vehicleData: {
        vehicle_economic_number: order.vehicle_economic_number,
        plate: order.plate,
        brand: order.brand,
        model: order.model,
        year: order.year,
        branch: order.branch,
        mileage: order.mileage,
      },
    });
    console.log("[OrderDetails] order.mileage:", order.mileage);
    console.log("[OrderDetails] editedParts:", editedParts);
    console.log("[OrderDetails] orderId para AddPartButton:", order.id);

    setUpdateOrderCallback((orderId, updatedOrder) => {
      if (orderId === order.id) {
        console.log("[OrderDetails] Actualizando orden desde Socket.IO:", {
          updatedOrder,
          vehicleData: {
            vehicle_economic_number: updatedOrder.vehicle_economic_number,
            plate: updatedOrder.plate,
            brand: updatedOrder.brand,
            model: updatedOrder.model,
            year: updatedOrder.year,
            branch: updatedOrder.branch,
            mileage: updatedOrder.mileage,
          },
        });
        setOrder(updatedOrder);
        if (updatedOrder.parts) {
          setEditedParts(updatedOrder.parts);
        }
        toast.info("Orden actualizada en tiempo real");
      }
    });

    return () => {
      setUpdateOrderCallback(null);
    };
  }, [order, editedParts, setOrder, setEditedParts, setUpdateOrderCallback]);

  const handleRejectionNoteChange = (partId, value) => {
    setRejectionNotes((prev) => ({ ...prev, [partId]: value }));
  };

  const handlePartAction = async (partId, action, note) => {
    if (action === "reject" && (!note || note.trim().length < 5)) {
      toast.error("El motivo de rechazo debe tener al menos 5 caracteres");
      return;
    }
    console.log("[OrderDetails] Acción en repuesto:", { partId, action, note });

    try {
      if (action === "acceptReturn" || action === "rejectReturn") {
        const status =
          action === "acceptReturn"
            ? "Devolución Aprobada"
            : "Devolución Rechazada";
        await processPartReturn(order.id, partId, status, note || "");
        toast.success(
          status === "Devolución Aprobada"
            ? "Devolución aprobada"
            : "Devolución rechazada"
        );
        const updatedParts = editedParts.map((part) =>
          part.part_id === partId
            ? {
                ...part,
                status,
                note: action === "rejectReturn" ? note || null : null,
              }
            : part
        );
        setEditedParts(updatedParts);
        setRejectionNotes((prev) => ({ ...prev, [partId]: "" }));
      } else {
        onPartAction(partId, action, note);
      }
    } catch (error) {
      console.error("[OrderDetails] Error al procesar acción:", error);
      toast.error(error.message || "Error al procesar la acción");
    }
  };

  const handleEditPartStart = (partId) => {
    const part = editedParts.find((p) => p.part_id === partId);
    if (!part) {
      toast.error("Repuesto no encontrado");
      return;
    }
    setEditingPartId(partId);
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

  const handleEditPartSave = async (partId) => {
    if (editPartData.quantity < 0 || editPartData.price < 0) {
      toast.error("Cantidad y precio deben ser no negativos");
      return;
    }
    try {
      if (isFinalized) {
        await editAdminPart(
          order.id,
          partId,
          {
            quantity: editPartData.quantity,
            price: editPartData.price,
          },
          userId
        );
        const updatedOrder = await getOrderById(order.id);
        setEditedParts(updatedOrder.parts || []);
        setOrder(updatedOrder);
        toast.success("Repuesto actualizado");
      } else {
        const response = await getPartById(partId);
        const { quantity, quantity_reserved } = response;
        const availableQuantity = quantity - quantity_reserved;
        const currentPart = editedParts.find((p) => p.part_id === partId);
        const previousQuantity = currentPart.quantity || 0;
        const quantityChange = editPartData.quantity - previousQuantity;

        if (quantityChange > availableQuantity) {
          toast.error(
            `Inventario insuficiente. Disponible: ${availableQuantity}, Solicitado: ${editPartData.quantity}`
          );
          return;
        }

        onEditPart(partId, {
          quantity: editPartData.quantity,
          price: editPartData.price,
        });
        toast.success("Repuesto actualizado");
      }
      setEditingPartId(null);
    } catch (error) {
      console.error("[OrderDetails] Error al actualizar repuesto:", error);
      toast.error(
        error.message || error.details || "Error al actualizar repuesto"
      );
    }
  };

  const handleEditPartCancel = () => {
    setEditingPartId(null);
    setEditPartData({ quantity: 0, price: 0 });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + (order.images?.length || 0) + newImages.length > 10) {
      toast.error("No se pueden cargar más de 10 imágenes");
      return;
    }
    try {
      if (isAdmin && isFinalized) {
        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));
        formData.append("existingImages", JSON.stringify(order.images || []));
        for (let [key, value] of formData.entries()) {
          console.log(`[OrderDetails] FormData: ${key} =`, value);
        }
        const response = await addAdminImages(order.id, formData);
        console.log("[OrderDetails] Respuesta de addAdminImages:", response);
        if (!response.order?.images) {
          throw new Error(
            "No se recibieron imágenes actualizadas en la respuesta"
          );
        }
        setOrder({
          ...order,
          images: response.order.images,
        });
        setNewImages([]);
        onEditPart("images", response.order.images);
        toast.success("Imágenes añadidas correctamente");
      } else {
        setNewImages([...newImages, ...files]);
        const filePaths = files.map((file) => URL.createObjectURL(file));
        const updatedImages = [...(order.images || []), ...filePaths];
        setOrder({
          ...order,
          images: updatedImages,
        });
        onEditPart("images", updatedImages);
        toast.success("Imágenes añadidas localmente");
      }
    } catch (error) {
      console.error("[OrderDetails] Error al subir imágenes:", error);
      toast.error(error.message || "Error al subir imágenes");
    }
  };

  const handleImageDelete = async (index) => {
    try {
      if (!order.images[index]) {
        toast.error("Índice de imagen inválido");
        return;
      }
      if (order.images[index].startsWith("blob:")) {
        const updatedImages = order.images.filter((_, i) => i !== index);
        const updatedNewImages = newImages.filter(
          (_, i) =>
            !order.images[index].includes(URL.createObjectURL(newImages[i]))
        );
        setNewImages(updatedNewImages);
        setOrder({
          ...order,
          images: updatedImages,
        });
        onEditPart("images", updatedImages);
        toast.success("Imagen eliminada");
      } else {
        await deleteAdminImage(order.id, index);
        const updatedImages = order.images.filter((_, i) => i !== index);
        setOrder({
          ...order,
          images: updatedImages,
        });
        onEditPart("images", updatedImages);
        toast.success("Imagen eliminada del servidor");
      }
    } catch (error) {
      console.error("[OrderDetails] Error al eliminar imagen:", error);
      toast.error(error.message || error.details || "Error al eliminar imagen");
    }
  };

  const handleCloseImagesModal = async () => {
    setShowImagesModal(false);
    try {
      const updatedOrder = await getOrderById(order.id);
      console.log("[OrderDetails] Orden actualizada al cerrar modal:", {
        updatedOrder,
        vehicleData: {
          vehicle_economic_number: updatedOrder.vehicle_economic_number,
          plate: updatedOrder.plate,
          brand: updatedOrder.brand,
          model: updatedOrder.model,
          year: updatedOrder.year,
          branch: updatedOrder.branch,
          mileage: updatedOrder.mileage,
        },
      });
      setOrder(updatedOrder);
      setEditedParts(updatedOrder.parts || []);
      onEditPart("images", updatedOrder.images);
    } catch (error) {
      console.error(
        "[OrderDetails] Error al obtener orden actualizada:",
        error
      );
      toast.error("Error al actualizar imágenes");
    }
  };

  const calculateSubtotal = () => {
    return editedParts
      .filter((part) => part.status === "Aprobado")
      .reduce((sum, part) => sum + part.quantity * (part.price || 0), 0)
      .toFixed(2);
  };

  const IVA_RATE = 0.16;
  const subtotal = parseFloat(calculateSubtotal());
  const iva = (subtotal * IVA_RATE).toFixed(2);
  const totalWithIva = (subtotal + parseFloat(iva)).toFixed(2);

  const validateMileage = (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0;
  };

  const requestedParts = editedParts.filter(
    (part) => part.status === "Solicitado"
  );
  const approvedParts = editedParts.filter(
    (part) => part.status === "Aprobado"
  );
  const requestedPartsReturn = editedParts.filter(
    (part) => part.status === "Devolución Solicitada"
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
        <>
          <Row className="mb-3">
            {order.images.slice(0, 4).map((img, index) => (
              <Col md={3} key={index} className="mb-2">
                <div className="position-relative">
                  <ImageContainer>
                    <Image
                      src={img.startsWith("blob:") ? img : `${API_URL}${img}`}
                      thumbnail
                      style={{ maxWidth: "100px" }}
                      onError={(e) => {
                        e.target.src = "/placeholder.png";
                      }}
                    />
                  </ImageContainer>
                  {isFinalized && !isReadOnly && (
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
            {!isReadOnly && isFinalized ? "Gestionar Imágenes" : "Ver"}
          </ActionButton>
        </>
      ) : (
        <>
          {isFinalized && !isReadOnly && (
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
        </>
      )}

      <OrderImagesModal
        show={showImagesModal}
        onHide={handleCloseImagesModal}
        orderId={order.id}
        images={order.images}
        setImages={(newImages) => {
          setOrder({ ...order, images: newImages });
          onEditPart("images", newImages);
        }}
        isReadOnly={isReadOnly}
        isFinalized={isFinalized}
      />

      <SectionTitle>Repuestos</SectionTitle>

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
              {approvedParts.map((part) => (
                <tr key={`${part.part_id}-${part.id}`}>
                  <td>{part.name}</td>
                  <td>
                    {editingPartId === part.part_id ? (
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
                    {editingPartId === part.part_id ? (
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
                  <td>{part.status}</td>
                  <td className="actions">
                    <ActionsContainer>
                      {editingPartId === part.part_id ? (
                        <>
                          <ActionButton
                            variant="success"
                            className="me-2"
                            onClick={() => handleEditPartSave(part.part_id)}
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
                            onClick={() => handleEditPartStart(part.part_id)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </ActionButton>
                          <ActionButton
                            size="sm"
                            onClick={() => onDeletePart(part.part_id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </ActionButton>
                        </>
                      )}
                    </ActionsContainer>
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
              {approvedParts.map((part) => (
                <tr key={`${part.part_id}-${part.id}`}>
                  <td>{part.name}</td>
                  <td>{part.quantity}</td>
                  <td>${part.price != null ? part.price : 0}</td>
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

      {!isFinalized && (
        <>
          <h6>Repuestos Solicitados</h6>
          {requestedParts.length > 0 ? (
            <ListGroup className="mb-3">
              {requestedParts.map((part) => (
                <PartItem key={`${part.part_id}-${part.id}`}>
                  <div>
                    <strong>{part.name}</strong>
                    <br />
                    Cantidad: {part.quantity}
                    <br />
                    Precio Unitario: ${part.price != null ? part.price : 0}
                    <br />
                    Solicitado por: {part.requested_by}
                    <br />
                    <Form.Group className="mt-2" style={{ maxWidth: "300px" }}>
                      <Form.Label>Nota de Rechazo (obligatoria)</Form.Label>
                      <Form.Control
                        type="text"
                        value={rejectionNotes[part.part_id] || ""}
                        onChange={(e) =>
                          handleRejectionNoteChange(
                            part.part_id,
                            e.target.value
                          )
                        }
                        placeholder="Motivo del rechazo"
                        maxLength={255}
                      />
                    </Form.Group>
                  </div>
                  <div>
                    <ActionButton
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handlePartAction(
                          part.part_id,
                          "accept",
                          rejectionNotes[part.part_id] || ""
                        )
                      }
                      className="me-2"
                      title="Aceptar Repuesto"
                    >
                      <FontAwesomeIcon icon={faCheck} /> Aceptar
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handlePartAction(
                          part.part_id,
                          "reject",
                          rejectionNotes[part.part_id] || ""
                        )
                      }
                      disabled={
                        !rejectionNotes[part.part_id] ||
                        rejectionNotes[part.part_id].trim().length < 5
                      }
                      title="Rechazar Repuesto"
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

          {requestedPartsReturn.length > 0 && (
            <>
              <h6 className="mt-3">Devoluciones Solicitadas</h6>
              <ListGroup className="mb-3">
                {requestedPartsReturn.map((part) => (
                  <PartItem key={`${part.part_id}-${part.id}`}>
                    <div>
                      <strong>{part.name}</strong>
                      <br />
                      Cantidad: {part.quantity}
                      <br />
                      <strong style={{ color: "orange" }}>{part.status}</strong>
                      <br />
                      Precio Unitario: ${part.price != null ? part.price : 0}
                      <br />
                      Solicitado por: {part.requested_by}
                      <br />
                      <Form.Group
                        className="mt-2"
                        style={{ maxWidth: "300px" }}
                      >
                        <Form.Label>Nota de Rechazo (opcional)</Form.Label>
                        <Form.Control
                          type="text"
                          value={rejectionNotes[part.part_id] || ""}
                          onChange={(e) =>
                            handleRejectionNoteChange(
                              part.part_id,
                              e.target.value
                            )
                          }
                          placeholder="Motivo del rechazo (opcional)"
                          maxLength={255}
                        />
                      </Form.Group>
                    </div>
                    <div>
                      <ActionButton
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handlePartAction(part.part_id, "acceptReturn", "")
                        }
                        className="me-2"
                        title="Aceptar Devolución"
                      >
                        <FontAwesomeIcon icon={faCheck} /> Aceptar
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handlePartAction(
                            part.part_id,
                            "rejectReturn",
                            rejectionNotes[part.part_id] || ""
                          )
                        }
                        title="Rechazar Devolución"
                      >
                        <FontAwesomeIcon icon={faTimes} /> Rechazar
                      </ActionButton>
                    </div>
                  </PartItem>
                ))}
              </ListGroup>
            </>
          )}
        </>
      )}

      {isFinalized && (
        <AddPartButton
          orderId={order.id}
          userId={userId}
          partsList={editedParts}
          setPartsList={setEditedParts}
          isFinalized={isFinalized}
        />
      )}

      <SectionTitle>Resumen de Costos</SectionTitle>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Subtotal:</Form.Label>
            <ReadOnlyField value={`$${subtotal}`} readOnly />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>IVA (16%):</Form.Label>
            <ReadOnlyField value={`$${iva}`} readOnly />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Total + IVA:</Form.Label>
            <ReadOnlyField value={`$${totalWithIva}`} readOnly />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default OrderDetails;
