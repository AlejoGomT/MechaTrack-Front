import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Form } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import {
  MainContainer,
  Content,
  MessageContainer,
  NotificationList,
  NotificationHeader,
  NotificationItem,
  MessageDetailContainer,
  MessageBubble,
  MessageInputWrapper,
  FormInput,
} from "../styles/GlobalStyles";
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
  const [newMessage, setNewMessage] = useState("");

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

  return (
    <MainContainer fluid>
      <Sidebar menuItems={technicianMenu} title="Menú" />
      <Content>
        <DashboardHeader title="Notificaciones" />
        <Container className="mt-4" fluid>
          <MessageContainer>
            <NotificationList>
              <NotificationHeader>Notificaciones</NotificationHeader>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  className={notification.isNew ? "new" : ""}
                  onClick={() => handleSelectNotification(notification)}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: "medium",
                        color: "#1b4552",
                      }}
                    >
                      {notification.orderNumber}
                    </h3>
                    {notification.isNew && (
                      <span
                        style={{
                          backgroundColor: "#d74a49",
                          color: "white",
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "9999px",
                        }}
                      >
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6c757d",
                      marginTop: "0.25rem",
                    }}
                  >
                    {notification.subject}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6c757d",
                      marginTop: "0.5rem",
                    }}
                  >
                    {new Date(notification.lastUpdate).toLocaleString("es-ES")}
                  </p>
                </NotificationItem>
              ))}
            </NotificationList>
            <MessageDetailContainer>
              {selectedNotification ? (
                <>
                  <div
                    style={{ padding: "1.5rem", flex: "1", overflowY: "auto" }}
                  >
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h2
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#1b4552",
                        }}
                      >
                        {selectedNotification.subject}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#6c757d",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span>{selectedNotification.orderNumber}</span>
                        <span style={{ margin: "0 0.5rem" }}>•</span>
                        <span>
                          {new Date(
                            selectedNotification.lastUpdate
                          ).toLocaleString("es-ES")}
                        </span>
                      </div>
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
                              color:
                                msg.sender === "user" ? "#f8f9fa" : "#6c757d",
                              marginTop: "0.25rem",
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "es-ES",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </MessageBubble>
                      ))}
                    </div>
                  </div>
                  <MessageInputWrapper>
                    <Form onSubmit={handleSendMessage}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <FormInput
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe tu mensaje..."
                        />
                        <CustomButton
                          type="submit"
                          disabled={!newMessage.trim()}
                        >
                          Enviar
                        </CustomButton>
                      </div>
                    </Form>
                  </MessageInputWrapper>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#6c757d",
                  }}
                >
                  <p>Selecciona una notificación para ver el detalle</p>
                </div>
              )}
            </MessageDetailContainer>
          </MessageContainer>
        </Container>
      </Content>
    </MainContainer>
  );
};

export default TechnicianNotifications;
