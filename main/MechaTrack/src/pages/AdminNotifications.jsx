import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Container, Form, Image, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../services/apiConfig"; // Importar axiosInstance
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import AuthPartModal from "../components/AuthPartModal";
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
  ApprovedNotification,
  RejectedNotification,
  ToggleButton,
  RejectionReason,
} from "../styles/GlobalStyles";
import { getOrderById } from "../services/orderService";
import {
  getConversations,
  getMessagesByOrderId,
} from "../services/notificationService";
import { toast } from "react-toastify";

const adminMenu = [
  { label: "Inicio", path: "/admin" },
  { label: "Órdenes de Servicio", path: "/admin/orders" },
  { label: "Inventario", path: "/admin/inventory" },
  { label: "Vehículos", path: "/admin/vehicles" },
  { label: "Gestión de Usuarios", path: "/admin/users" },
  { label: "Notificaciones", path: "/admin/notifications" },
  { label: "Informes", path: "/admin/reports" },
  { label: "Cerrar Sesión", path: "/" },
];

const AdminNotifications = () => {
  const { user, token } = useAuth();
  const {
    socket,
    notifications,
    sendMessage,
    sendTyping,
    isConnected,
    typingUsers,
  } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [showAuthPartModal, setShowAuthPartModal] = useState(false);
  const [partsList, setPartsList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedRejections, setExpandedRejections] = useState({});
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Unir a salas de órdenes al cargar conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(user.id);
        console.log("[AdminNotifications] Conversaciones recibidas:", data);
        setConversations(data);
        // Unir a salas de órdenes
        if (socket && isConnected) {
          data.forEach((conv) => {
            socket.emit("joinOrder", conv.order_id);
            console.log(
              "[AdminNotifications] Joined room: order_",
              conv.order_id
            );
          });
        }
        const params = new URLSearchParams(location.search);
        const orderId = params.get("orderId");
        if (orderId) {
          const conversation = data.find((c) => c.order_id === orderId);
          if (conversation) {
            handleSelectConversation(conversation);
          }
        }
      } catch (error) {
        console.error(
          "[AdminNotifications] Error al cargar conversaciones:",
          error
        );
        toast.error("Error al cargar conversaciones");
      }
    };
    if (token) fetchConversations();
  }, [token, user.id, location.search, socket, isConnected]);

  // Polling si no hay conexión Socket.IO
  useEffect(() => {
    if (isConnected) return;
    const fetchConversations = async () => {
      try {
        const data = await getConversations(user.id);
        setConversations(data);
      } catch (error) {
        console.error(
          "[AdminNotifications] Error al cargar conversaciones (polling):",
          error
        );
      }
    };
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [isConnected, user.id]);

  const handleSelectConversation = async (conversation) => {
    console.log(
      "[AdminNotifications] Seleccionando conversación:",
      conversation
    );
    setSelectedConversation(conversation);
    setMessages([]);
    try {
      const messagesData = await getMessagesByOrderId(
        conversation.order_id,
        user.id
      );
      console.log("[AdminNotifications] Mensajes recibidos:", messagesData);
      setMessages(messagesData);
      const order = await getOrderById(conversation.order_id);
      console.log("[AdminNotifications] Orden recibida:", order);
      setOrderStatus(order?.status || "Desconocido");
      setPartsList(order?.parts || []);
      const unreadMessages = messagesData.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      );
      console.log("[AdminNotifications] Mensajes no leídos:", unreadMessages);
      for (const message of unreadMessages) {
        try {
          await axiosInstance.put(`/api/notifications/${message.id}`, {
            status: "Leída",
          });
          console.log(
            "[AdminNotifications] Mensaje marcado como leído:",
            message.id
          );
        } catch (error) {
          console.error(
            "[AdminNotifications] Error al marcar mensaje como leído:",
            message.id,
            error.response?.status || error.message
          );
        }
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
      // Unir a la sala de la orden seleccionada
      if (socket && isConnected) {
        socket.emit("joinOrder", conversation.order_id);
        console.log(
          "[AdminNotifications] Joined room: order_",
          conversation.order_id
        );
      }
    } catch (error) {
      console.error(
        "[AdminNotifications] Error en handleSelectConversation:",
        error
      );
      toast.error("Error al cargar mensajes");
    }
  };

  // Manejar notificaciones Socket.IO
  useEffect(() => {
    if (!selectedConversation || !notifications.length) return;
    console.log("[AdminNotifications] Nuevas notificaciones:", notifications);
    const newMessages = notifications.filter(
      (notif) => notif.orderId === selectedConversation.order_id
    );
    if (newMessages.length > 0) {
      setMessages((prev) => {
        const updatedMessages = [...prev];
        newMessages.forEach((notif) => {
          if (!prev.some((m) => m.id === notif.id)) {
            updatedMessages.push({
              id: notif.id,
              order_id: notif.orderId,
              from_user_id: notif.fromUserId,
              to_user_id: notif.toUserId,
              message: notif.message,
              type: notif.type,
              status: notif.status,
              details: notif.details,
              created_at: new Date(notif.timestamp),
              attachments: notif.attachments || [],
            });
          }
        });
        return updatedMessages.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      });
      setConversations((prev) =>
        prev
          .map((c) =>
            c.order_id === selectedConversation.order_id
              ? {
                  ...c,
                  last_message_at: new Date(
                    newMessages[newMessages.length - 1].timestamp
                  ),
                  total_messages: c.total_messages + newMessages.length,
                  unread_messages:
                    c.unread_messages +
                    newMessages.filter(
                      (n) => n.toUserId === user.id && n.status === "Pendiente"
                    ).length,
                }
              : c
          )
          .sort(
            (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
          )
      );
    }
  }, [notifications, selectedConversation, user.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    try {
      const toUserId =
        messages.find((m) => m.from_user_id !== user.id)?.from_user_id ||
        "technician";
      const notification = await sendMessage(
        toUserId,
        selectedConversation.order_id,
        newMessage,
        files
      );
      setMessages((prev) => [...prev, notification]);
      setConversations((prev) =>
        prev.map((c) =>
          c.order_id === selectedConversation.order_id
            ? {
                ...c,
                last_message_at: notification.created_at,
                total_messages: c.total_messages + 1,
              }
            : c
        )
      );
      setNewMessage("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("[AdminNotifications] Error al enviar mensaje:", error);
      toast.error("Error al enviar mensaje");
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      ["image/jpeg", "image/png", "application/pdf"].includes(file.type)
    );
    setFiles(selectedFiles);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const isCurrentlyTyping = e.target.value.trim().length > 0;
    if (isCurrentlyTyping !== isTyping && selectedConversation) {
      setIsTyping(isCurrentlyTyping);
      sendTyping(selectedConversation.order_id, isCurrentlyTyping);
    }
  };

  const toggleRejectionReason = (messageId) => {
    setExpandedRejections((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMessages = useMemo(() => messages, [messages]);

  const isTechnicianTyping = selectedConversation
    ? typingUsers[
        `${messages.find((m) => m.from_user_id !== user.id)?.from_user_id}_${
          selectedConversation.order_id
        }`
      ]
    : false;

  const isChatDisabled = ["Facturado", "Finalizado"].includes(orderStatus);

  return (
    <MainContainer fluid>
      <Sidebar menuItems={adminMenu} title="Menú Administrador" />
      <Content>
        <DashboardHeader
          title="Notificaciones"
          userId={user?.id}
          userName={`${user?.first_name} ${user?.last_name}`}
          activeOrdersCount={0}
          notificationsCount={conversations.reduce(
            (acc, c) => acc + c.unread_messages,
            0
          )}
        />
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
                      {conversation.vehicle_economic_number || "Sin número"})
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
                    {conversation.recipients || "Desconocido"} ↔{" "}
                    {conversation.senders || "Desconocido"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6c757d",
                      marginTop: "0.5rem",
                    }}
                  >
                    Último mensaje:{" "}
                    {conversation.last_message_at
                      ? new Date(conversation.last_message_at).toLocaleString(
                          "es-ES"
                        )
                      : "Sin mensajes"}
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
                          {selectedConversation.vehicle_economic_number ||
                            "Sin número"}
                          )
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            color: "#6c757d",
                            fontSize: "0.875rem",
                          }}
                        >
                          <span>Estado: {orderStatus || "Desconocido"}</span>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>
                            {chatMessages.length} mensaje
                            {chatMessages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {messages.some((m) => m.type === "part_request") && (
                        <PartRequestBanner role="alert">
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#1b4552",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Solicitud de repuestos para la orden #
                            {selectedConversation.order_id}
                          </span>
                          <Button
                            variant="primary"
                            onClick={() => setShowAuthPartModal(true)}
                            aria-label="Autorizar repuestos solicitados"
                          >
                            Autorizar repuestos
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
                        <div key={message.id}>
                          {message.type === "part_approval" ? (
                            <ApprovedNotification>
                              {message.message}
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#28a745",
                                  marginTop: "0.25rem",
                                  textAlign:
                                    message.from_user_id === user.id
                                      ? "right"
                                      : "left",
                                }}
                              >
                                {message.created_at
                                  ? new Date(
                                      message.created_at
                                    ).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Hora desconocida"}
                                {message.from_user_id === user.id && (
                                  <span style={{ marginLeft: "0.5rem" }}>
                                    {message.status === "Leída"
                                      ? "✔️ Leído"
                                      : "✔️ Enviado"}
                                  </span>
                                )}
                                {message.status === "Pendiente" &&
                                  message.to_user_id === user.id && (
                                    <span style={{ marginLeft: "0.5rem" }}>
                                      (No leído)
                                    </span>
                                  )}
                              </p>
                            </ApprovedNotification>
                          ) : message.type === "part_rejection" ? (
                            <div>
                              <RejectedNotification>
                                {message.message}
                                {message.details && message.details.reason && (
                                  <ToggleButton
                                    onClick={() =>
                                      toggleRejectionReason(message.id)
                                    }
                                  >
                                    {expandedRejections[message.id] ? "▲" : "▼"}
                                  </ToggleButton>
                                )}
                              </RejectedNotification>
                              {message.details && message.details.reason && (
                                <RejectionReason
                                  className={
                                    expandedRejections[message.id]
                                      ? "active"
                                      : ""
                                  }
                                >
                                  Motivo de rechazo: {message.details.reason}
                                </RejectionReason>
                              )}
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#dc3545",
                                  marginTop: "0.25rem",
                                  textAlign:
                                    message.from_user_id === user.id
                                      ? "right"
                                      : "left",
                                }}
                              >
                                {message.created_at
                                  ? new Date(
                                      message.created_at
                                    ).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Hora desconocida"}
                                {message.from_user_id === user.id && (
                                  <span style={{ marginLeft: "0.5rem" }}>
                                    {message.status === "Leída"
                                      ? "✔️ Leído"
                                      : "✔️ Enviado"}
                                  </span>
                                )}
                                {message.status === "Pendiente" &&
                                  message.to_user_id === user.id && (
                                    <span style={{ marginLeft: "0.5rem" }}>
                                      (No leído)
                                    </span>
                                  )}
                              </p>
                            </div>
                          ) : message.type === "part_request" ? (
                            <PartRequestBanner role="alert">
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color: "#1b4552",
                                }}
                              >
                                {message.message}
                              </span>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#1b4552",
                                  marginTop: "0.25rem",
                                  textAlign:
                                    message.from_user_id === user.id
                                      ? "right"
                                      : "left",
                                }}
                              >
                                {message.created_at
                                  ? new Date(
                                      message.created_at
                                    ).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Hora desconocida"}
                                {message.from_user_id === user.id && (
                                  <span style={{ marginLeft: "0.5rem" }}>
                                    {message.status === "Leída"
                                      ? "✔️ Leído"
                                      : "✔️ Enviado"}
                                  </span>
                                )}
                                {message.status === "Pendiente" &&
                                  message.to_user_id === user.id && (
                                    <span style={{ marginLeft: "0.5rem" }}>
                                      (No leído)
                                    </span>
                                  )}
                              </p>
                            </PartRequestBanner>
                          ) : (
                            <MessageBubble
                              sender={
                                message.from_user_id === user.id
                                  ? "user"
                                  : "other"
                              }
                            >
                              <p>{message.message}</p>
                              {message.attachments?.length > 0 && (
                                <div style={{ marginTop: "0.5rem" }}>
                                  {message.attachments.map((attachment) => (
                                    <div key={attachment.id}>
                                      {attachment.file_type?.startsWith(
                                        "image/"
                                      ) ? (
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
                                          Descargar{" "}
                                          {attachment.file_type || "archivo"}
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
                                      ? "#e0e0e0"
                                      : "#d1d5db",
                                  marginTop: "0.25rem",
                                  textAlign:
                                    message.from_user_id === user.id
                                      ? "right"
                                      : "left",
                                }}
                              >
                                {message.created_at
                                  ? new Date(
                                      message.created_at
                                    ).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Hora desconocida"}
                                {message.from_user_id === user.id && (
                                  <span style={{ marginLeft: "0.5rem" }}>
                                    {message.status === "Leída"
                                      ? "✔️ Leído"
                                      : "✔️ Enviado"}
                                  </span>
                                )}
                                {message.status === "Pendiente" &&
                                  message.to_user_id === user.id && (
                                    <span style={{ marginLeft: "0.5rem" }}>
                                      (No leído)
                                    </span>
                                  )}
                              </p>
                            </MessageBubble>
                          )}
                        </div>
                      ))}
                      {isTechnicianTyping && (
                        <div
                          style={{
                            padding: "0.5rem",
                            color: "#1b4552",
                            fontStyle: "italic",
                            fontSize: "0.875rem",
                            alignSelf: "flex-start",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          Técnico está escribiendo
                          <span style={{ animation: "blink 1s infinite" }}>
                            ...
                          </span>
                        </div>
                      )}
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
                              onChange={handleTyping}
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
                      {orderStatus || "desconocida"}.
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
        {selectedConversation && (
          <AuthPartModal
            showAuthPartModal={showAuthPartModal}
            setShowAuthPartModal={setShowAuthPartModal}
            partsList={partsList}
            orderId={selectedConversation.order_id}
            userId={user.id}
          />
        )}
      </Content>
    </MainContainer>
  );
};

export default AdminNotifications;
