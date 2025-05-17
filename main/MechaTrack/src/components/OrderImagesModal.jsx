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
import {
  API_URL,
  deleteOrderImage,
  updateOrder,
} from "../services/orderService";

const OrderImagesModal = ({
  show,
  onHide,
  orderId,
  images,
  setImages,
  isReadOnly,
  isFinalized,
}) => {
  const [localImages, setLocalImages] = useState(images || []);

  useEffect(() => {
    setLocalImages(images || []);
  }, [images]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + localImages.length > 10) {
      toast.error("No se pueden cargar más de 10 imágenes");
      return;
    }

    try {
      let updatedImages = [...localImages];
      if (orderId) {
        // Para órdenes existentes, subir imágenes inmediatamente
        const updatedOrder = await updateOrder(orderId, {
          images: files, // Archivos File
          existingImages: localImages.filter((img) => !img.startsWith("blob:")), // Solo rutas relativas
        });
        updatedImages = Array.isArray(updatedOrder.images)
          ? updatedOrder.images.map((img) =>
              img.startsWith("/uploads/") ? img : `/uploads/${img}`
            )
          : [];
        toast.success(`${files.length} imagen(es) subida(s) correctamente`);
      } else {
        // Para órdenes nuevas, añadir URLs blob temporales
        const blobUrls = files.map((file) => URL.createObjectURL(file));
        updatedImages = [...localImages, ...blobUrls];
        toast.success(
          `${files.length} imagen(es) seleccionada(s) para subir al guardar`
        );
      }

      setLocalImages(updatedImages);
      setImages(updatedImages);
    } catch (error) {
      console.error("Error al subir imágenes:", error);
      toast.error(error.message || "Error al subir imágenes");
    }
  };

  const handleImageDelete = async (index) => {
    try {
      const imageToDelete = localImages[index];
      if (imageToDelete.startsWith("blob:")) {
        // Imagen no subida, eliminar localmente
        const updatedImages = localImages.filter((_, i) => i !== index);
        setLocalImages(updatedImages);
        setImages(updatedImages);
        URL.revokeObjectURL(imageToDelete); // Liberar memoria
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
      console.error("Error al eliminar imagen:", error);
      toast.error(error.message || "Error al eliminar imagen");
    }
  };

  return (
    <StyledModal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Gestión de Imágenes - Orden #{orderId || "Nueva"}
        </Modal.Title>
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
