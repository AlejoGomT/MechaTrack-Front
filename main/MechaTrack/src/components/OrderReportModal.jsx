import { Modal, Button } from "react-bootstrap";
import {
  colors,
  DetailLabel,
  DetailValue,
  StyledTable,
  CustomButton,
  StatusDiv,
} from "../styles/GlobalStyles";
import { downloadOrderReportPdf } from "../services/reportService";
import { toast } from "react-toastify";

const OrderReportModal = ({ show, onHide, report }) => {
  const handleDownloadPdf = async () => {
    try {
      await downloadOrderReportPdf(report.id);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        style={{ backgroundColor: colors.backgroundLight, color: "white" }}
      >
        <Modal.Title>
          Informe de Orden #{report?.order_number || report?.id}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5 style={{ color: colors.backgroundDark }}>Detalles de la Orden</h5>
        <div className="d-flex justify-content-between ms-5 me-5">
          <div>
            <DetailLabel>ID:</DetailLabel>
            <DetailValue>{report?.id}</DetailValue>
          </div>
          <div>
            <DetailLabel>Número de Pedido</DetailLabel>
            <DetailValue>{report?.order_number || "N/A"}</DetailValue>
          </div>
          <div>
            <DetailLabel>Estado</DetailLabel>
            <StatusDiv
              className="ps-2 pe-2"
              variant={
                report?.status === "En Proceso"
                  ? "inProcess"
                  : report?.status === "Pendiente"
                  ? "pending"
                  : report?.status === "Finalizado" &&
                    report?.status === "Facturado"
                  ? "completed"
                  : ""
              }
            >
              {report?.status}
            </StatusDiv>
          </div>
          <div className="d-flex flex-column">
            <DetailLabel>Creado</DetailLabel>
            <DetailValue>
              {report?.created_at
                ? new Date(report.created_at).toLocaleDateString()
                : "N/A"}
            </DetailValue>
            <DetailLabel>Finalizado</DetailLabel>
            <DetailValue>
              {report?.finalized_at
                ? new Date(report.finalized_at).toLocaleDateString()
                : "N/A"}
            </DetailValue>
          </div>
        </div>
        <DetailLabel className="d-flex">
          Tipo: <DetailValue className="ms-3">{report?.type}</DetailValue>
        </DetailLabel>

        <DetailLabel>Descripción</DetailLabel>
        <DetailValue>{report?.description}</DetailValue>
        <DetailLabel>Diagnóstico Inicial</DetailLabel>
        <DetailValue>{report?.initial_diagnosis || "N/A"}</DetailValue>
        <DetailLabel>Tareas</DetailLabel>
        <DetailValue>{report?.tasks || "N/A"}</DetailValue>

        <div className="text-center">
          <h5 style={{ color: colors.backgroundDark, marginTop: "20px" }}>
            Vehículo
          </h5>
          <div
            className="d-grid"
            style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}
          >
            <div>
              <DetailLabel>Número Económico</DetailLabel>
              <DetailValue>{report?.economic_number}</DetailValue>
            </div>
            <div>
              <DetailLabel>Marca</DetailLabel>
              <DetailValue>{report?.brand}</DetailValue>
            </div>
            <div>
              <DetailLabel>Modelo</DetailLabel>
              <DetailValue>{report?.model}</DetailValue>
            </div>
            <div>
              <DetailLabel>Año</DetailLabel>
              <DetailValue>{report?.year}</DetailValue>
            </div>
            <div>
              <DetailLabel>Sucursal</DetailLabel>
              <DetailValue>{report?.branch}</DetailValue>
            </div>
            <div>
              <DetailLabel>Placa</DetailLabel>
              <DetailValue>{report?.plate}</DetailValue>
            </div>
            <div>
              <DetailLabel>VIN</DetailLabel>
              <DetailValue>{report?.vin}</DetailValue>
            </div>
            <div>
              <DetailLabel>Kilometraje</DetailLabel>
              <DetailValue>{report?.mileage}</DetailValue>
            </div>
          </div>
        </div>

        <h5 style={{ color: colors.backgroundDark, gridColumn: "span 2" }}>
          Facturación
        </h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <div>
            <DetailLabel>Número de Factura</DetailLabel>
            <DetailValue>{report?.invoice_number || "N/A"}</DetailValue>
          </div>
          <div>
            <DetailLabel>Número de Albarán</DetailLabel>
            <DetailValue>{report?.delivery_note_number || "N/A"}</DetailValue>
          </div>
          <div>
            <DetailLabel>Total</DetailLabel>
            <DetailValue className="price">
              {report?.total ? report.total.toFixed(2) : "N/A"}
            </DetailValue>
          </div>
          <div>
            <DetailLabel>Emitido por</DetailLabel>
            <DetailValue>
              {report?.issued_by_first_name
                ? `${report.issued_by_first_name} ${report.issued_by_last_name}`
                : "N/A"}
            </DetailValue>
          </div>
          <div>
            <DetailLabel>Fecha de Emisión</DetailLabel>
            <DetailValue>
              {report?.issued_at
                ? new Date(report.issued_at).toLocaleDateString()
                : "N/A"}
            </DetailValue>
          </div>
        </div>

        <h5 style={{ color: colors.backgroundDark, marginTop: "20px" }}>
          Repuestos
        </h5>
        {report?.parts && report.parts.length > 0 && report.parts[0].part_id ? (
          <StyledTable>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Solicitado por</th>
                <th>Autorizado por</th>
              </tr>
            </thead>
            <tbody>
              {report.parts.map((part, index) => (
                <tr key={index}>
                  <td>{part.name}</td>
                  <td>{part.quantity}</td>
                  <td>{part.price ? part.price.toFixed(2) : "N/A"}</td>
                  <td>{part.status}</td>
                  <td>{part.requested_by || "N/A"}</td>
                  <td>{part.authorized_by || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        ) : (
          <p>No hay repuestos registrados.</p>
        )}

        <h5 style={{ color: colors.backgroundDark, marginTop: "20px" }}>
          Notificaciones
        </h5>
        {report?.notifications &&
        report.notifications.length > 0 &&
        report.notifications[0].message ? (
          <StyledTable>
            <thead>
              <tr>
                <th>Mensaje</th>
                <th>Fecha</th>
                <th>De</th>
                <th>Para</th>
              </tr>
            </thead>
            <tbody>
              {report.notifications.map((notification, index) => (
                <tr key={index}>
                  <td className="text-wrap">{notification.message}</td>
                  <td>
                    {new Date(notification.created_at).toLocaleDateString()}
                  </td>
                  <td>{notification.from_user}</td>
                  <td>{notification.to_user}</td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        ) : (
          <p>No hay notificaciones registradas.</p>
        )}

        <h5 style={{ color: colors.backgroundDark, marginTop: "20px" }}>
          Historial
        </h5>
        {report?.history &&
        report.history.length > 0 &&
        report.history[0].description ? (
          <StyledTable>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {report.history.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.description}</td>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        ) : (
          <p>No hay historial registrado.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <CustomButton onClick={handleDownloadPdf}>Descargar PDF</CustomButton>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderReportModal;
