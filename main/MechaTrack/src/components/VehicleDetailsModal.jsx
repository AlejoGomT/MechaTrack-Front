import { Modal, Row, Col } from "react-bootstrap";
import {
  StyledModal,
  ModalBody,
  CustomButton,
  DetailLabel,
  DetailValue,
} from "../styles/GlobalStyles";

const VehicleDetailsModal = ({ show, onHide, vehicle }) => {
  if (!vehicle) return null;

  return (
    <StyledModal variant="detailsVehicle" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Vehículo</Modal.Title>
      </Modal.Header>
      <ModalBody>
        <Row>
          <Col md={6}>
            <DetailLabel>Número Económico</DetailLabel>
            <DetailValue>{vehicle.economic_number}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Sucursal</DetailLabel>
            <DetailValue>{vehicle.branch}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Marca</DetailLabel>
            <DetailValue>{vehicle.brand}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Modelo</DetailLabel>
            <DetailValue>{vehicle.model}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Año</DetailLabel>
            <DetailValue>{vehicle.year}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Kilometraje</DetailLabel>
            <DetailValue>{vehicle.mileage} km</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>VIN</DetailLabel>
            <DetailValue>{vehicle.vin}</DetailValue>
          </Col>
          <Col md={6}>
            <DetailLabel>Placa</DetailLabel>
            <DetailValue>{vehicle.plate}</DetailValue>
          </Col>
        </Row>
      </ModalBody>
      <Modal.Footer>
        <CustomButton onClick={onHide}>Cerrar</CustomButton>
      </Modal.Footer>
    </StyledModal>
  );
};

export default VehicleDetailsModal;
