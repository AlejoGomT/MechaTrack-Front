import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Container, Form, Image, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import PartsModal from "../components/PartsModal";
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
  PartRequestBanner,
} from "../styles/GlobalStyles";
import { getOrderById } from "../services/orderService";
import {
  getConversations,
  getMessagesByOrderId,
  createNotification,
} from "../services/notificationService";
import { toast } from "react-toastify";

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
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [showPartsManagementModal, setShowPartsManagementModal] =
    useState(false);
  const [partsList, setPartsList] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Cargar conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(user.id);
        console.log(
          "[TechnicianNotifications] Conversaciones recibidas:",
          data
        );
        setConversations(data);
        const params = new URLSearchParams(location.search);
        const orderId = params.get("orderId");
        if (orderId) {
          const conversation = data.find((c) => c.order_id === orderId);
          if (conversation) {
            handleSelectConversation(conversation);
          }
        }
      } catch (error) {
        console.error("Error al cargar conversaciones:", error);
        toast.error("Error al cargar conversaciones");
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [location.search, user.id]);

  // Cargar mensajes al seleccionar una conversación
  const handleSelectConversation = async (conversation) => {
    console.log(
      "[TechnicianNotifications] Seleccionando conversación:",
      conversation
    );
    setSelectedConversation(conversation);
    setMessages([]);
    try {
      const messagesData = await getMessagesByOrderId(
        conversation.order_id,
        user.id
      );
      console.log(
        "[TechnicianNotifications] Mensajes recibidos para order_id",
        conversation.order_id,
        ":",
        messagesData.map((m) => ({
          id: m.id,
          message: m.message,
          type: m.type,
          from_user_id: m.from_user_id,
          to_user_id: m.to_user_id,
          created_at: m.created_at,
        }))
      );
      // Log adicional para verificar tipos de mensajes
      console.log(
        "[TechnicianNotifications] Tipos de mensajes:",
        messagesData.map((m) => m.type)
      );
      setMessages(messagesData);
      const order = await getOrderById(conversation.order_id);
      setOrderStatus(order.status);
      setPartsList(order.parts || []);
      setAvailableParts([]); // Nota: getParts no está en orderService.jsx
      // Log para verificar partRequestNotifications
      const partRequests = messagesData.filter(
        (m) => m.type === "part_request"
      );
      console.log(
        "[TechnicianNotifications] Notificaciones de part_request:",
        partRequests
      );
      // Marcar mensajes como leídos
      const unreadMessages = messagesData.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      );
      for (const message of unreadMessages) {
        await fetch(`/api/notifications/${message.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Leída" }),
        });
      }
      setMessages((prev) =>
        prev.map((m) =>
          unreadMessages.some((um) => um.id === m.id)
            ? { ...m, status: "Leída" }
            : m
        )
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.order_id === conversation.order_id
            ? { ...c, unread_messages: 0 }
            : c
        )
      );
      navigate(`?orderId=${conversation.order_id}`, { replace: true });
    } catch (error) {
      console.error("Error al cargar mensajes o marcar como leídos:", error);
      toast.error("Error al cargar mensajes");
    }
  };

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    try {
      const notificationData = {
        order_id: selectedConversation.order_id,
        to_user_id:
          messages.find((m) => m.from_user_id !== user.id)?.from_user_id ||
          "admin",
        message: newMessage || "Adjunto enviado",
        type: "message",
        status: "Pendiente",
      };
      const newNotification = await createNotification(notificationData, files);
      setMessages((prev) => [...prev, newNotification]);
      setConversations((prev) =>
        prev.map((c) =>
          c.order_id === selectedConversation.order_id
            ? {
                ...c,
                last_message_at: newNotification.created_at,
                total_messages: c.total_messages + 1,
              }
            : c
        )
      );
      setNewMessage("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("Error al enviar mensaje");
    }
  };

  // Manejar archivos
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      ["image/jpeg", "image/png", "application/pdf"].includes(file.type)
    );
    setFiles(selectedFiles);
  };

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filtrar notificaciones de part_request
  const partRequestNotifications = useMemo(() => {
    return messages.filter((m) => m.type === "part_request");
  }, [messages]);

  // Filtrar mensajes para el chat (excluir part_request y order_creation)
  const chatMessages = useMemo(() => {
    return messages.filter(
      (m) => m.type !== "part_request" && m.type !== "order_creation"
    );
  }, [messages]);

  const isChatDisabled = ["Facturado", "Finalizado"].includes(orderStatus);

  return (
    <MainContainer fluid>
      <Sidebar menuItems={technicianMenu} title="Menú" />
      <Content>
        <DashboardHeader title="Notificaciones" />
        <Container fluid>
          <MessageContainer>
            <NotificationList>
              <NotificationHeader>Conversaciones</NotificationHeader>
              {conversations.map((conversation) => (
                <NotificationItem
                  key={conversation.order_id}
                  className={conversation.unread_messages > 0 ? "new" : ""}
                  onClick={() => handleSelectConversation(conversation)}
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
                      Orden #{conversation.order_id} (
                      {conversation.vehicle_economic_number})
                    </h3>
                    {conversation.unread_messages > 0 && (
                      <span
                        style={{
                          backgroundColor: "#d74a49",
                          color: "white",
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "9999px",
                        }}
                      >
                        {conversation.unread_messages} Nuevo
                        {conversation.unread_messages > 1 ? "s" : ""}
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
                    {conversation.senders} ↔ {conversation.recipients}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6c757d",
                      marginTop: "0.5rem",
                    }}
                  >
                    Último mensaje:{" "}
                    {new Date(conversation.last_message_at).toLocaleString(
                      "es-ES"
                    )}
                  </p>
                </NotificationItem>
              ))}
            </NotificationList>
            <MessageDetailContainer>
              {selectedConversation ? (
                <>
                  <div
                    style={{ padding: "1.5rem", flex: "1", overflowY: "auto" }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h2
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: "#1b4552",
                          }}
                        >
                          Orden #{selectedConversation.order_id} (
                          {selectedConversation.vehicle_economic_number})
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            color: "#6c757d",
                            fontSize: "0.875rem",
                          }}
                        >
                          <span>Estado: {orderStatus}</span>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>
                            {chatMessages.length} mensaje
                            {chatMessages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {/* Banner de solicitudes de repuestos */}
                      {partRequestNotifications.length > 0 && (
                        <PartRequestBanner role="alert">
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#1b4552",
                              marginBottom: "0.5rem",
                            }}
                          >
                            solicitud de repuestos para la orden #
                            {selectedConversation.order_id}
                          </span>
                          <Button
                            variant="primary"
                            onClick={() => setShowPartsManagementModal(true)}
                            aria-label="Ver repuestos solicitados"
                          >
                            Ver repuestos
                          </Button>
                        </PartRequestBanner>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                      aria-live="polite"
                    >
                      {chatMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          sender={
                            message.from_user_id === user.id ? "user" : "other"
                          }
                        >
                          <p>{message.message}</p>
                          {message.details && (
                            <pre
                              style={{
                                fontSize: "0.75rem",
                                background: "#f8f9fa",
                                padding: "0.5rem",
                                borderRadius: "0.25rem",
                              }}
                            >
                              {JSON.stringify(message.details, null, 2)}
                            </pre>
                          )}
                          {message.attachments?.length > 0 && (
                            <div style={{ marginTop: "0.5rem" }}>
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id}>
                                  {attachment.file_type.startsWith("image/") ? (
                                    <Image
                                      src={attachment.file_path}
                                      thumbnail
                                      style={{ maxWidth: "200px" }}
                                    />
                                  ) : (
                                    <a
                                      href={attachment.file_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Descargar {attachment.file_type}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color:
                                message.from_user_id === user.id
                                  ? "#f8f9fa"
                                  : "#6c757d",
                              marginTop: "0.25rem",
                            }}
                          >
                            {new Date(message.created_at).toLocaleTimeString(
                              "es-ES",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                            {message.status === "Pendiente" &&
                              message.to_user_id === user.id &&
                              " (No leído)"}
                          </p>
                        </MessageBubble>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  {!isChatDisabled ? (
                    <MessageInputWrapper>
                      <Form onSubmit={handleSendMessage}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <FormInput
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Escribe tu mensaje..."
                              disabled={isChatDisabled}
                            />
                            <CustomButton
                              type="submit"
                              disabled={
                                (!newMessage.trim() && files.length === 0) ||
                                isChatDisabled
                              }
                            >
                              Enviar
                            </CustomButton>
                          </div>
                          <div>
                            <Button
                              variant="secondary"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isChatDisabled}
                            >
                              Adjuntar archivo
                            </Button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/jpeg,image/png,application/pdf"
                              multiple
                              style={{ display: "none" }}
                            />
                            {files.length > 0 && (
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6c757d",
                                }}
                              >
                                {files.length} archivo
                                {files.length > 1 ? "s" : ""} seleccionado
                                {files.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </Form>
                    </MessageInputWrapper>
                  ) : (
                    <div
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: "#6c757d",
                      }}
                    >
                      La mensajería está deshabilitada porque la orden está{" "}
                      {orderStatus}.
                    </div>
                  )}
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
                  <p>Selecciona una conversación para ver los mensajes</p>
                </div>
              )}
            </MessageDetailContainer>
          </MessageContainer>
        </Container>
        {/* Modal para gestionar repuestos */}
        {selectedConversation && (
          <PartsModal
            showPartsModal={false}
            setShowPartsModal={() => {}}
            showPartsManagementModal={showPartsManagementModal}
            setShowPartsManagementModal={setShowPartsManagementModal}
            partsList={partsList}
            setPartsList={setPartsList}
            availableParts={availableParts}
            orderId={selectedConversation.order_id}
            isReadOnly={isChatDisabled}
            userId={user.id}
            isFinalized={isChatDisabled}
          />
        )}
      </Content>
    </MainContainer>
  );
};

export default TechnicianNotifications;
