import { Modal, Row, Col } from "react-bootstrap";
import {
  StyledModal,
  ModalBody,
  CustomButton,
  DetailLabel,
  DetailValue,
  ModelTag,
  ImageContainer,
} from "../styles/GlobalStyles";
import { API_URL } from "../services/apiConfig";

const PartDetailsModal = ({ show, onHide, part }) => {
  if (!part) return null;

  return (
    <StyledModal variant="detailsParts" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Repuesto</Modal.Title>
      </Modal.Header>
      <ModalBody>
        <Row>
          <Col md={6}>
            <DetailLabel>Código</DetailLabel>
            <DetailValue>{part.id}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Precio</DetailLabel>
            <DetailValue className="price">${part.price}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Cantidad</DetailLabel>
            <DetailValue>{part.quantity}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Nombre</DetailLabel>
            <DetailValue>{part.name || "Sin nombre"}</DetailValue>
          </Col>
        </Row>

        <div className="mt-4">
          <DetailLabel>Descripción</DetailLabel>
          <DetailValue>{part.description || "Sin descripción"}</DetailValue>
        </div>

        <div className="mt-4">
          <DetailLabel>Modelos Compatibles</DetailLabel>
          <div className="mt-2">
            {part.compatible_models ? (
              part.compatible_models.map((model, index) => (
                <ModelTag key={index}>{model}</ModelTag>
              ))
            ) : (
              <ModelTag>Todos los modelos</ModelTag>
            )}
          </div>
        </div>

        {part.image && (
          <div className="mt-4">
            <DetailLabel>Imagen</DetailLabel>
            <ImageContainer>
              <img
                src={`${API_URL}${part.image}`}
                alt={part.name}
                onError={(e) => {
                  e.target.src = "/placeholder.png";
                }}
              />
            </ImageContainer>
          </div>
        )}
      </ModalBody>
      <Modal.Footer>
        <CustomButton onClick={onHide}>Cerrar</CustomButton>
      </Modal.Footer>
    </StyledModal>
  );
};

export default PartDetailsModal;
