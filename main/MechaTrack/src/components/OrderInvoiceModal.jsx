import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { getOrderById } from "../services/orderService";
import { toast } from "react-toastify";
import {
  StyledModal,
  ModalBody,
  DetailLabel,
  DetailValue,
  StyledTable,
  TableWrapper,
  FormSectionTitle,
  InfoGrid,
} from "../styles/GlobalStyles";

const OrderInvoiceModal = ({ show, handleClose, orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !show) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
        console.log(
          "[OrderInvoiceModal] Respuesta de getOrderById:",
          orderData
        );
        setOrder(orderData);
      } catch (error) {
        console.error("[OrderInvoiceModal] Error al cargar detalles:", error);
        toast.error("Error al cargar los detalles de la orden");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, show]);

  const calculateSubtotal = () => {
    if (!order?.parts) return 0;
    return order.parts.reduce(
      (sum, part) => sum + (part.price * part.quantity || 0),
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // Si la factura tiene un total definido, usarlo; si no, usar subtotal
    return order?.invoice?.total ?? subtotal;
  };

  return (
    <StyledModal
      show={show}
      onHide={handleClose}
      variant="orderDetails"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Detalles de la Orden #{orderId}</Modal.Title>
      </Modal.Header>
      <ModalBody>
        {loading ? (
          <p>Cargando detalles...</p>
        ) : order ? (
          <div>
            <FormSectionTitle>Información General</FormSectionTitle>
            <InfoGrid>
              <div>
                <DetailLabel>Número de Orden</DetailLabel>
                <DetailValue>{order.id}</DetailValue>
              </div>
              <div>
                <DetailLabel>Número de Pedido</DetailLabel>
                <DetailValue>{order.order_number || "-"}</DetailValue>
              </div>
              <div>
                <DetailLabel>Número de Factura</DetailLabel>
                <DetailValue>
                  {order.invoice?.invoice_number || "-"}
                </DetailValue>
              </div>
              <div>
                <DetailLabel>Número de Albarán</DetailLabel>
                <DetailValue>
                  {order.invoice?.delivery_note_number || "-"}
                </DetailValue>
              </div>
              <div>
                <DetailLabel>Tipo de Servicio</DetailLabel>
                <DetailValue>{order.type || "-"}</DetailValue>
              </div>
              <div>
                <DetailLabel>Número Económico del Vehículo</DetailLabel>
                <DetailValue>
                  {order.vehicle_economic_number || "-"}
                </DetailValue>
              </div>
              <div>
                <DetailLabel>Fecha de Inicio</DetailLabel>
                <DetailValue>
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("es-MX")
                    : "-"}
                </DetailValue>
              </div>
              <div>
                <DetailLabel>Fecha de Finalización</DetailLabel>
                <DetailValue>
                  {order.finalized_at
                    ? new Date(order.finalized_at).toLocaleDateString("es-MX")
                    : "-"}
                </DetailValue>
              </div>
              <div className="full-width">
                <DetailLabel>Descripción del Servicio</DetailLabel>
                <DetailValue>{order.description || "-"}</DetailValue>
              </div>
              <div>
                <DetailLabel>Sucursal</DetailLabel>
                <DetailValue>{order.branch || "-"}</DetailValue>
              </div>
            </InfoGrid>

            <FormSectionTitle>Repuestos y Costos</FormSectionTitle>
            {order.parts && order.parts.length > 0 ? (
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>Repuesto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.parts.map((part) => (
                      <tr key={`${part.part_id}-${part.id}`}>
                        <td>{part.part_name || part.part_id}</td>
                        <td>{part.quantity}</td>
                        <td>${part.price || 0}</td>
                        <td>${(part.price || 0) * part.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
            ) : (
              <p>No hay repuestos asociados a esta orden.</p>
            )}

            <FormSectionTitle>Totales</FormSectionTitle>
            <InfoGrid>
              <div>
                <DetailLabel>Subtotal</DetailLabel>
                <DetailValue className="price">
                  ${calculateSubtotal().toFixed(2)}
                </DetailValue>
              </div>
              <div>
                <DetailLabel>Total</DetailLabel>
                <DetailValue className="price">
                  ${calculateTotal().toFixed(2)}
                </DetailValue>
              </div>
            </InfoGrid>
          </div>
        ) : (
          <p>No se encontraron detalles para esta orden.</p>
        )}
      </ModalBody>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </StyledModal>
  );
};

export default OrderInvoiceModal;
