import { useState, useEffect } from "react";
import { Modal, Row, Col, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  StyledModal,
  ModalBody,
  ActionButton,
  ImageContainer,
} from "../styles/GlobalStyles";
import { API_URL, deleteOrderImage } from "../services/orderService";

const OrderImagesModal = ({
  show,
  onHide,
  orderId,
  images,
  setImages,
  isReadOnly,
  isFinalized,
}) => {
  const [newImages, setNewImages] = useState([]);
  const [localImages, setLocalImages] = useState(images || []);

  useEffect(() => {
    setLocalImages(images || []);
  }, [images]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + localImages.length + newImages.length > 10) {
      toast.error("No se pueden cargar más de 10 imágenes");
      return;
    }
    setNewImages([...newImages, ...files]);
    const filePaths = files.map((file) => URL.createObjectURL(file));
    setLocalImages([...localImages, ...filePaths]);
    setImages([...images, ...filePaths]);
    toast.success("Imágenes añadidas");
  };

  const handleImageDelete = async (index) => {
    try {
      if (localImages[index].startsWith("blob:")) {
        // Imagen nueva (aún no guardada)
        const updatedImages = localImages.filter((_, i) => i !== index);
        const updatedNewImages = newImages.filter(
          (_, i) =>
            !localImages[index].includes(URL.createObjectURL(newImages[i]))
        );
        setNewImages(updatedNewImages);
        setLocalImages(updatedImages);
        setImages(updatedImages);
        toast.success("Imagen eliminada");
      } else {
        // Imagen existente en el servidor
        await deleteOrderImage(orderId, index);
        const updatedImages = localImages.filter((_, i) => i !== index);
        setLocalImages(updatedImages);
        setImages(updatedImages);
        toast.success("Imagen eliminada del servidor");
      }
    } catch (error) {
      toast.error(error.message || "Error al eliminar imagen");
    }
  };

  return (
    <StyledModal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Gestión de Imágenes - Orden #{orderId}</Modal.Title>
      </Modal.Header>
      <ModalBody>
        {localImages.length > 0 ? (
          <Row>
            {localImages.map((img, index) => (
              <Col md={3} key={index} className="mb-2">
                <div className="position-relative">
                  <ImageContainer>
                    <img
                      src={img.startsWith("blob:") ? img : `${API_URL}${img}`}
                      alt={`Imagen ${index + 1}`}
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
        ) : (
          <p>Sin imágenes disponibles</p>
        )}
        {isFinalized && !isReadOnly && (
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
      </ModalBody>
      <Modal.Footer>
        <ActionButton variant="secondary" onClick={onHide}>
          Cerrar
        </ActionButton>
      </Modal.Footer>
    </StyledModal>
  );
};

export default OrderImagesModal;
