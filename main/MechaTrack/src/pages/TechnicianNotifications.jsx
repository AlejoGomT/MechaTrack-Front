import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Modal, Button, Pagination, Form } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import {
  MainContainer,
  Content,
  TableWrapper,
  StyledTable,
  ActionsContainer,
  StyledModal,
  ModalBody,
  FormInput,
  NotificationList,
  NotificationItem,
  MessageBubble,
  MessageInputWrapper,
} from "../styles/GlobalStyles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import messages from "../data/messages"; // Temporal, reemplazar con servicio real

const technicianMenu = [
  { label: "Inicio", path: "../technician" },
  { label: "Crear Orden de Servicio", path: "../technician/create-order" },
  { label: "Historial de Órdenes", path: "../technician/history" },
  { label: "Notificaciones", path: "../technician/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const TechnicianNotifications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(messages);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(notifications.length / pageSize);

  useEffect(() => {
    // Simulación de carga de notificaciones
    // TODO: Reemplazar con servicio real (ej. getNotifications)
    setNotifications(messages);

    // Si hay un orderId en los parámetros de la URL, seleccionar la notificación correspondiente
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    if (orderId) {
      const notification = notifications.find(
        (n) => n.orderNumber === `Orden #${orderId}`
      );
      if (notification) {
        handleSelectNotification(notification);
      }
    }
  }, [location.search]);

  const handleSelectNotification = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
    // Marcar como leído
    setNotifications((prev) =>
      prev.map((msg) =>
        msg.id === notification.id ? { ...msg, isNew: false } : msg
      )
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      text: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) =>
      prev.map((msg) =>
        msg.id === selectedNotification.id
          ? {
              ...msg,
              content: [...msg.content, newMsg],
              lastUpdate: new Date().toISOString(),
            }
          : msg
      )
    );

    setSelectedNotification((prev) => ({
      ...prev,
      content: [...prev.content, newMsg],
      lastUpdate: new Date().toISOString(),
    }));

    setNewMessage("");
    // TODO: Enviar al backend
    // fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ notificationId: selectedNotification.id, text: newMessage }) });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = (current, total, onPageChange) => {
    const items = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, current - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(total, startPage + maxPagesToShow - 1);

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => current > 1 && onPageChange(current - 1)}
        disabled={current === 1}
      />
    );

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === current}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => current < total && onPageChange(current + 1)}
        disabled={current === total}
      />
    );

    return <Pagination>{items}</Pagination>;
  };

  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <MainContainer fluid>
      <Sidebar menuItems={technicianMenu} title="Menú" />
      <Content>
        <DashboardHeader title="Notificaciones" />
        <Container fluid>
          <h3>Todas las Notificaciones</h3>
          {notifications.length > 0 ? (
            <>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Asunto</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNotifications.map((notification) => (
                      <tr key={notification.id}>
                        <td>{notification.orderNumber}</td>
                        <td>{notification.subject}</td>
                        <td>
                          {new Date(notification.lastUpdate).toLocaleString(
                            "es-ES"
                          )}
                        </td>
                        <td>
                          {notification.isNew ? (
                            <span style={{ color: "#d74a49" }}>Nuevo</span>
                          ) : (
                            "Leído"
                          )}
                        </td>
                        <td className="actions">
                          <ActionsContainer>
                            <CustomButton
                              onClick={() =>
                                handleSelectNotification(notification)
                              }
                              title="Ver Detalles"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </CustomButton>
                          </ActionsContainer>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  {renderPagination(currentPage, totalPages, handlePageChange)}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>No hay notificaciones disponibles.</p>
            </div>
          )}
        </Container>

        <StyledModal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedNotification?.subject || "Detalles de la Notificación"}
            </Modal.Title>
          </Modal.Header>
          <ModalBody style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {selectedNotification ? (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.25rem", color: "#1b4552" }}>
                    {selectedNotification.orderNumber}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                    Última actualización:{" "}
                    {new Date(selectedNotification.lastUpdate).toLocaleString(
                      "es-ES"
                    )}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {selectedNotification.content.map((msg, index) => (
                    <MessageBubble
                      key={index}
                      sender={msg.sender}
                      style={{
                        alignSelf:
                          msg.sender === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <p>{msg.text}</p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: msg.sender === "user" ? "#f8f9fa" : "#6c757d",
                          marginTop: "0.25rem",
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </MessageBubble>
                  ))}
                </div>
              </>
            ) : (
              <p>Selecciona una notificación para ver los detalles.</p>
            )}
          </ModalBody>
          <Modal.Footer>
            <MessageInputWrapper>
              <Form onSubmit={handleSendMessage}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <FormInput
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                  />
                  <CustomButton type="submit" disabled={!newMessage.trim()}>
                    Enviar
                  </CustomButton>
                </div>
              </Form>
            </MessageInputWrapper>
            <Button
              variant="secondary"
              onClick={() => setShowDetailsModal(false)}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </StyledModal>
      </Content>
    </MainContainer>
  );
};

export default TechnicianNotifications;
