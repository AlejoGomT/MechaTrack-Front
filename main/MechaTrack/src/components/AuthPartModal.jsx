import { useState, useEffect } from "react";
import { Button, Modal, Table, Form, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import { updatePartAdmin } from "../services/partService";
import {
  TableWrapper,
  StyledTableModal,
  StyledModal,
  ModalBody,
  ActionButton,
  ActionsContainer,
} from "../styles/GlobalStyles";

const AuthPartModal = ({
  showAuthPartModal,
  setShowAuthPartModal,
  partsList,
  orderId,
  userId,
}) => {
  const [localPartsList, setLocalPartsList] = useState(partsList);
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalPartsList(partsList);
  }, [partsList]);

  const handleApprovePart = async (part) => {
    try {
      setIsLoading(true);
      const updatedPart = await updatePartAdmin(
        orderId,
        part.part_id,
        {
          quantity: part.quantity,
          status: "Aprobado",
        },
        userId
      );
      setLocalPartsList((prev) =>
        prev.map((p) =>
          p.part_id === part.part_id
            ? { ...p, status: "Aprobado", authorized_by: userId }
            : p
        )
      );
      toast.success(`Repuesto ${part.name} aprobado`);
    } catch (err) {
      console.error("Error al aprobar repuesto:", err);
      toast.error(err.message || "Error al aprobar repuesto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectPart = async (part) => {
    const note = rejectionNotes[part.part_id]?.trim();
    if (!note) {
      toast.error("Se requiere un motivo para rechazar el repuesto");
      return;
    }
    try {
      setIsLoading(true);
      const updatedPart = await updatePartAdmin(
        orderId,
        part.part_id,
        {
          quantity: part.quantity,
          status: "Rechazado",
          note,
        },
        userId
      );
      setLocalPartsList((prev) =>
        prev.map((p) =>
          p.part_id === part.part_id
            ? { ...p, status: "Rechazado", note, authorized_by: userId }
            : p
        )
      );
      setRejectionNotes((prev) => ({ ...prev, [part.part_id]: "" }));
      toast.success(`Repuesto ${part.name} rechazado`);
    } catch (err) {
      console.error("Error al rechazar repuesto:", err);
      toast.error(err.message || "Error al rechazar repuesto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteChange = (partId, value) => {
    setRejectionNotes((prev) => ({
      ...prev,
      [partId]: value,
    }));
  };

  return (
    <StyledModal
      show={showAuthPartModal}
      onHide={() => setShowAuthPartModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Autorizar Repuestos - Orden #{orderId || "Nueva"}
        </Modal.Title>
      </Modal.Header>
      <ModalBody>
        {isLoading ? (
          <p>Cargando repuestos...</p>
        ) : (
          <TableWrapper>
            <StyledTableModal striped bordered hover>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Motivo de Rechazo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(localPartsList) && localPartsList.length > 0 ? (
                  localPartsList.map((part) => (
                    <tr key={part.part_id}>
                      <td>{part.name || "Desconocido"}</td>
                      <td>{part.part_id}</td>
                      <td>{part.quantity}</td>
                      <td>{part.status}</td>
                      <td>
                        {part.status === "Solicitado" ? (
                          <InputGroup>
                            <Form.Control
                              type="text"
                              value={rejectionNotes[part.part_id] || ""}
                              onChange={(e) =>
                                handleNoteChange(part.part_id, e.target.value)
                              }
                              placeholder="Motivo de rechazo"
                              disabled={isLoading}
                            />
                          </InputGroup>
                        ) : (
                          part.note || "N/A"
                        )}
                      </td>
                      <td>
                        <ActionsContainer>
                          {part.status === "Solicitado" && (
                            <>
                              <ActionButton
                                variant="success"
                                size="sm"
                                onClick={() => handleApprovePart(part)}
                                disabled={isLoading}
                              >
                                Aprobar
                              </ActionButton>
                              <ActionButton
                                variant="danger"
                                size="sm"
                                onClick={() => handleRejectPart(part)}
                                disabled={isLoading}
                              >
                                Rechazar
                              </ActionButton>
                            </>
                          )}
                        </ActionsContainer>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No hay repuestos solicitados.
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTableModal>
          </TableWrapper>
        )}
      </ModalBody>
      <Modal.Footer>
        <ActionButton
          variant="secondary"
          onClick={() => setShowAuthPartModal(false)}
          disabled={isLoading}
        >
          Cerrar
        </ActionButton>
      </Modal.Footer>
    </StyledModal>
  );
};

export default AuthPartModal;
