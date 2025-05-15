import { useState, useEffect, useCallback } from "react";
import { Button, Modal, Table, InputGroup, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  getOrderById,
  requestPart,
  updatePartQuantity,
  requestPartReturn,
} from "../services/orderService";
import {
  TableWrapper,
  StyledTableModal,
  StyledModal,
  ModalBody,
  ActionButton,
  ActionsContainer,
} from "../styles/GlobalStyles";

const PartsModal = ({
  showPartsModal,
  setShowPartsModal,
  showPartsManagementModal,
  setShowPartsManagementModal,
  partsList,
  setPartsList,
  availableParts,
  orderId,
  isReadOnly,
  userId,
  isFinalized,
}) => {
  const [localPartsList, setLocalPartsList] = useState(partsList);
  const [selectedPartQuantities, setSelectedPartQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalPartsList(partsList);
  }, [partsList, userId]);

  const fetchOrderParts = useCallback(async () => {
    if (!orderId || (!showPartsModal && !showPartsManagementModal)) {
      return;
    }
    setIsLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      const orderParts = Array.isArray(orderData.parts)
        ? orderData.parts.map((part) => ({
            ...part,
            requested_by: part.requested_by_id || userId,
            authorized_by: part.authorized_by_id || null,
          }))
        : [];

      const isDifferent =
        JSON.stringify(orderParts) !== JSON.stringify(localPartsList);
      if (isDifferent) {
        setLocalPartsList(orderParts);
        setPartsList(orderParts);
      }
    } catch (err) {
      toast.error("Error al cargar repuestos de la orden");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, showPartsModal, showPartsManagementModal, setPartsList, userId]);

  useEffect(() => {
    fetchOrderParts();
  }, [fetchOrderParts]);

  const handleQuantityChange = (partId, value) => {
    setSelectedPartQuantities((prev) => ({
      ...prev,
      [partId]: parseInt(value, 10) || 1,
    }));
  };

  const handleRequestPart = async (part) => {
    try {
      if (!userId || String(userId).length > 10) {
        throw new Error(
          `ID de usuario inválido o excede el límite de 10 caracteres: ${userId}`
        );
      }

      const quantity = selectedPartQuantities[part.id] || 1;
      if (quantity < 1) {
        toast.error("La cantidad debe ser al menos 1");
        return;
      }
      if (quantity > part.quantity) {
        toast.error(
          `No hay suficiente inventario para ${part.name} (${part.quantity} disponible)`
        );
        return;
      }

      let updatedList;
      const existingPartIndex = localPartsList.findIndex(
        (p) => p.part_id === part.id
      );
      if (existingPartIndex !== -1) {
        updatedList = localPartsList.map((p, i) =>
          i === existingPartIndex
            ? { ...p, quantity: p.quantity + quantity }
            : p
        );
        if (orderId) {
          await updatePartQuantity(
            orderId,
            part.id,
            updatedList[existingPartIndex].quantity
          );
        }
      } else {
        const newPart = {
          part_id: part.id,
          name: part.name,
          quantity,
          status: isFinalized ? "Aprobado" : "Solicitado",
          requested_by: String(userId),
          authorized_by: isFinalized ? String(userId) : null,
        };
        updatedList = [...localPartsList, newPart];
        if (orderId) {
          await requestPart(orderId, newPart);
        }
      }

      setLocalPartsList(updatedList);
      setPartsList(updatedList);

      toast.success(
        `Repuesto ${part.name} ${isFinalized ? "añadido" : "solicitado"}`
      );

      setShowPartsModal(false);
      setSelectedPartQuantities((prev) => ({ ...prev, [part.id]: 1 }));
    } catch (err) {
      console.error("Error en handleRequestPart:", err);
      toast.error(err.message || "Error al solicitar repuesto");
    }
  };

  const handleUpdatePartQuantity = async (partIndex, newQuantity) => {
    try {
      const part = localPartsList[partIndex];
      if (part.status !== "Solicitado") {
        toast.error("Solo se pueden editar repuestos en estado Solicitado");
        return;
      }
      const availablePart = availableParts.find((p) => p.id === part.part_id);
      if (!availablePart || newQuantity > availablePart.quantity) {
        toast.error("Cantidad excede el inventario disponible");
        return;
      }
      if (newQuantity < 0) {
        toast.error("La cantidad no puede ser negativa");
        return;
      }
      let updatedPartsList;
      if (newQuantity === 0) {
        if (orderId) {
          await updatePartQuantity(orderId, part.part_id, 0);
        }
        updatedPartsList = localPartsList.filter((_, i) => i !== partIndex);
      } else {
        if (orderId) {
          await updatePartQuantity(orderId, part.part_id, newQuantity);
        }
        updatedPartsList = localPartsList.map((p, i) =>
          i === partIndex ? { ...p, quantity: newQuantity } : p
        );
      }
      setLocalPartsList(updatedPartsList);
      setPartsList(updatedPartsList);
      console.log(
        "partsList después de actualizar cantidad:",
        updatedPartsList
      );
      toast.success(`Cantidad actualizada para ${part.name}`);
    } catch (err) {
      console.error("Error en handleUpdatePartQuantity:", err);
      toast.error(err.message || "Error al actualizar cantidad");
    }
  };

  const handleRequestPartReturn = async (partIndex) => {
    try {
      const part = localPartsList[partIndex];
      if (part.status !== "Aprobado") {
        toast.error("Solo se pueden devolver repuestos aprobados");
        return;
      }
      if (!orderId) {
        toast.error("No se puede devolver un repuesto sin una orden existente");
        return;
      }
      await requestPartReturn(orderId, part.part_id, part.quantity);
      const updatedPartsList = localPartsList.map((p, i) =>
        i === partIndex ? { ...p, status: "Devolución Solicitada" } : p
      );
      setLocalPartsList(updatedPartsList);
      setPartsList(updatedPartsList);
      console.log(
        "partsList después de solicitar devolución:",
        updatedPartsList
      );
      toast.success(`Solicitud de devolución enviada para ${part.name}`);
    } catch (err) {
      console.error("Error en handleRequestPartReturn:", err);
      toast.error(err.message || "Error al solicitar devolución");
    }
  };

  const filteredAvailableParts = availableParts.filter(
    (part) => !localPartsList.some((lp) => lp.part_id === part.id)
  );

  return (
    <>
      <StyledModal
        show={showPartsModal}
        onHide={() => setShowPartsModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Seleccionar Repuestos</Modal.Title>
        </Modal.Header>
        <ModalBody>
          {isLoading ? (
            <p>Cargando repuestos...</p>
          ) : filteredAvailableParts.length === 0 ? (
            <p>No hay repuestos disponibles para este vehículo.</p>
          ) : (
            <TableWrapper>
              <StyledTableModal striped bordered hover>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Modelo Compatible</th>
                    <th>Inventario</th>
                    <th>Cantidad</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvailableParts.map((part) => (
                    <tr key={part.id}>
                      <td>{part.id}</td>
                      <td>{part.name}</td>
                      <td>{part.compatible_models?.join(", ") || "N/A"}</td>
                      <td>{part.quantity}</td>
                      <td>
                        <InputGroup style={{ maxWidth: "120px" }}>
                          <Form.Control
                            type="number"
                            min="1"
                            max={part.quantity}
                            value={selectedPartQuantities[part.id] || 1}
                            onChange={(e) =>
                              handleQuantityChange(part.id, e.target.value)
                            }
                            disabled={part.quantity === 0}
                          />
                        </InputGroup>
                      </td>
                      <td>
                        <ActionsContainer>
                          <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleRequestPart(part)}
                            disabled={part.quantity === 0}
                          >
                            {isFinalized ? "Añadir" : "Solicitar"}
                          </ActionButton>
                        </ActionsContainer>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTableModal>
            </TableWrapper>
          )}
        </ModalBody>
        <Modal.Footer>
          <ActionButton
            variant="secondary"
            onClick={() => setShowPartsModal(false)}
          >
            Cerrar
          </ActionButton>
        </Modal.Footer>
      </StyledModal>

      <StyledModal
        show={showPartsManagementModal}
        onHide={() => setShowPartsManagementModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Gestión de Repuestos - Orden #{orderId || "Nueva"}
          </Modal.Title>
        </Modal.Header>
        <ModalBody>
          {isLoading ? (
            <p>Cargando repuestos...</p>
          ) : (
            <>
              <TableWrapper>
                <StyledTableModal striped bordered hover>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Cantidad</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(localPartsList) &&
                    localPartsList.length > 0 ? (
                      localPartsList.map((part, index) => (
                        <tr key={index}>
                          <td>{part.name || "Desconocido"}</td>
                          <td>{part.part_id}</td>
                          <td>
                            {part.status === "Solicitado" && !isReadOnly ? (
                              <InputGroup style={{ maxWidth: "120px" }}>
                                <Form.Control
                                  type="number"
                                  value={part.quantity}
                                  onChange={(e) =>
                                    handleUpdatePartQuantity(
                                      index,
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  min="0"
                                />
                              </InputGroup>
                            ) : (
                              part.quantity
                            )}
                          </td>
                          <td>{part.status}</td>
                          <td>
                            <ActionsContainer>
                              {part.status === "Solicitado" && !isReadOnly && (
                                <ActionButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdatePartQuantity(index, 0)
                                  }
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </ActionButton>
                              )}
                              {part.status === "Aprobado" && !isReadOnly && (
                                <ActionButton
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleRequestPartReturn(index)}
                                >
                                  Solicitar Devolución
                                </ActionButton>
                              )}
                            </ActionsContainer>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          No hay repuestos solicitados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </StyledTableModal>
              </TableWrapper>
              {!isReadOnly && (
                <ActionButton
                  variant="primary"
                  onClick={() => {
                    setShowPartsManagementModal(false);
                    setShowPartsModal(true);
                  }}
                >
                  Solicitar Nuevo Repuesto
                </ActionButton>
              )}
            </>
          )}
        </ModalBody>
        <Modal.Footer>
          <ActionButton
            variant="secondary"
            onClick={() => setShowPartsManagementModal(false)}
          >
            Cerrar
          </ActionButton>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default PartsModal;
