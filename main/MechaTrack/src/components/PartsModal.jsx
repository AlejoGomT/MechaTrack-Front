import { useState, useEffect } from "react";
import { Button, Modal, Table, InputGroup, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  requestPart,
  updatePartQuantity,
  requestPartReturn,
} from "../services/orderService";
import {
  TableWrapper,
  StyledTableModal,
  StyledModal,
  ModalBody,
} from "../styles/GlobalStyles";
import CustomButton from "../components/CustomButton";

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
}) => {
  const handleRequestPart = async (part) => {
    try {
      if (part.quantity < 1) {
        toast.error("No hay suficiente inventario para este repuesto");
        return;
      }
      const newPart = {
        part_id: part.id,
        name: part.name, // Incluido para la UI
        quantity: 1,
        status: "Solicitado",
        requested_by: userId,
        authorized_by: null,
      };
      if (orderId) {
        await requestPart(orderId, newPart);
        toast.success(`Repuesto ${part.name} solicitado`);
      } else {
        toast.success(`Repuesto ${part.name} añadido a la orden`);
      }
      setPartsList((prev) => {
        const newList = Array.isArray(prev) ? [...prev, newPart] : [newPart];
        console.log("partsList actualizado en PartsModal:", newList);
        return newList;
      });
      setShowPartsModal(false);
    } catch (err) {
      console.error("Error en handleRequestPart:", err);
      toast.error(err.message || "Error al solicitar repuesto");
    }
  };

  const handleUpdatePartQuantity = async (partIndex, newQuantity) => {
    try {
      const part = partsList[partIndex];
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
        updatedPartsList = partsList.filter((_, i) => i !== partIndex);
      } else {
        if (orderId) {
          await updatePartQuantity(orderId, part.part_id, newQuantity);
        }
        updatedPartsList = partsList.map((p, i) =>
          i === partIndex ? { ...p, quantity: newQuantity } : p
        );
      }
      setPartsList(updatedPartsList);
      toast.success(`Cantidad actualizada para ${part.name}`);
    } catch (err) {
      console.error("Error en handleUpdatePartQuantity:", err);
      toast.error(err.message || "Error al actualizar cantidad");
    }
  };

  const handleRequestPartReturn = async (partIndex) => {
    try {
      const part = partsList[partIndex];
      if (part.status !== "Aprobado") {
        toast.error("Solo se pueden devolver repuestos aprobados");
        return;
      }
      if (!orderId) {
        toast.error("No se puede devolver un repuesto sin una orden existente");
        return;
      }
      await requestPartReturn(orderId, part.part_id, part.quantity);
      setPartsList((prev) =>
        prev.map((p, i) =>
          i === partIndex ? { ...p, status: "Solicitado" } : p
        )
      );
      toast.success(`Solicitud de devolución enviada para ${part.name}`);
    } catch (err) {
      console.error("Error en handleRequestPartReturn:", err);
      toast.error(err.message || "Error al solicitar devolución");
    }
  };

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
          <TableWrapper>
            <StyledTableModal striped bordered hover>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Modelo Compatible</th>
                  <th>Inventario</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {availableParts.map((part) => (
                  <tr key={part.id}>
                    <td>{part.id}</td>
                    <td>{part.name}</td>
                    <td>{part.compatible_models.join(", ")}</td>
                    <td>{part.quantity}</td>
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
          <Button variant="secondary" onClick={() => setShowPartsModal(false)}>
            Cerrar
          </Button>
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
                {Array.isArray(partsList) && partsList.length > 0 ? (
                  partsList.map((part, index) => (
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
                        {part.status === "Solicitado" && !isReadOnly && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUpdatePartQuantity(index, 0)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        )}
                        {part.status === "Aprobado" && !isReadOnly && (
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleRequestPartReturn(index)}
                          >
                            Solicitar Devolución
                          </Button>
                        )}
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
            <CustomButton
              onClick={() => {
                setShowPartsManagementModal(false);
                setShowPartsModal(true);
              }}
            >
              Solicitar Nuevo Repuesto
            </CustomButton>
          )}
        </ModalBody>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPartsManagementModal(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </StyledModal>
    </>
  );
};

export default PartsModal;
