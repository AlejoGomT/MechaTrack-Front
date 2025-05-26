import { useState, useEffect, useRef, useMemo } from "react";
import { Container, Form, Image, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
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
  ApprovedNotification,
  RejectedNotification,
} from "../styles/GlobalStyles";
import {
  getNotifications,
  getAdminId,
  createNotification,
} from "../services/notificationService";
import axiosInstance from "../services/apiConfig";
import { toast } from "react-toastify";
import { API_URL } from "../services/apiConfig";

const secretaryMenu = [
  { label: "Inicio", path: "/secretary" },
  { label: "Facturación", path: "/secretary/billing" },
  { label: "Historial de Facturaciones", path: "/secretary/history" },
  { label: "Notificaciones", path: "/secretary/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const SecretaryNotifications = () => {
  const { user, token } = useAuth();
  const {
    socket,
    notifications,
    sendMessage,
    sendTyping,
    isConnected,
    typingUsers,
  } = useSocket();
  const [conversation, setConversation] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasFetchedRef = useRef(false); // Evitar ejecuciones repetidas

  // Debounce para fetchData
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Obtener ID del administrador y cargar notificaciones
  const fetchData = debounce(async () => {
    if (!user?.id || !token || hasFetchedRef.current) {
      console.log("[SecretaryNotifications] Condiciones no cumplidas:", {
        userId: user?.id,
        token: !!token,
        hasFetched: hasFetchedRef.current,
      });
      return;
    }

    hasFetchedRef.current = true;
    try {
      console.log("[SecretaryNotifications] Ejecutando fetchData");
      // Obtener ID del administrador
      const adminId = await getAdminId();
      setAdminId(adminId);

      // Obtener notificaciones
      const notificationsData = await getNotifications({
        to_user_id: user.id,
        user_id: user.id,
      });

      // Procesar notificaciones como una única conversación
      const processedMessages = notificationsData
        .filter((n) =>
          [
            "invoice_complete",
            "invoice_updated",
            "invoice_deleted",
            "message",
          ].includes(n.type)
        )
        .map((n) => ({
          ...n,
          created_at: new Date(n.created_at),
        }));

      setAllMessages(processedMessages);
      setFilteredMessages(processedMessages);

      // Simular una conversación con el administrador
      const unreadCount = processedMessages.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      ).length;

      setConversation({
        id: "admin_conversation",
        title: "Conversación con Administrador",
        unread_messages: unreadCount,
        last_message_at: processedMessages.length
          ? processedMessages[processedMessages.length - 1].created_at
          : new Date(),
        total_messages: processedMessages.length,
      });

      // Marcar mensajes como leídos
      const unreadMessages = processedMessages.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      );
      for (const message of unreadMessages) {
        try {
          await axiosInstance.put(`/api/notifications/${message.id}`, {
            status: "Leída",
          });
        } catch (error) {
          console.warn(
            `[SecretaryNotifications] Error al marcar mensaje ${message.id} como leído:`,
            error
          );
        }
      }

      // Unir a la sala secretary
      if (socket && isConnected) {
        socket.emit("join", "secretary");
        console.log("[SecretaryNotifications] Unido a sala secretary");
      }
    } catch (error) {
      console.error("[SecretaryNotifications] Error al cargar datos:", error);
      toast.error("Error al cargar notificaciones");
      hasFetchedRef.current = false; // Permitir reintentos
    }
  }, 500);

  useEffect(() => {
    console.log("[SecretaryNotifications] useEffect ejecutado:", {
      user,
      token,
      socket,
      isConnected,
    });
    fetchData();
  }, [user?.id, token, socket, isConnected]);

  // Polling si no hay conexión Socket.IO
  useEffect(() => {
    if (isConnected) return;
    const fetchNotifications = async () => {
      if (!user?.id) {
        console.warn(
          "[SecretaryNotifications] No hay usuario, omitiendo fetchNotifications"
        );
        return;
      }

      try {
        const notificationsData = await getNotifications({
          to_user_id: user.id,
          user_id: user.id,
        });
        const processedMessages = notificationsData
          .filter((n) =>
            [
              "invoice_complete",
              "invoice_updated",
              "invoice_deleted",
              "message",
            ].includes(n.type)
          )
          .map((n) => ({
            ...n,
            created_at: new Date(n.created_at),
          }));
        setAllMessages(processedMessages);
        setFilteredMessages(processedMessages);
        const unreadCount = processedMessages.filter(
          (m) => m.status === "Pendiente" && m.to_user_id === user.id
        ).length;
        setConversation({
          id: "admin_conversation",
          title: "Conversación con Administrador",
          unread_messages: unreadCount,
          last_message_at: processedMessages.length
            ? processedMessages[processedMessages.length - 1].created_at
            : new Date(),
          total_messages: processedMessages.length,
        });
      } catch (error) {
        console.error(
          "[SecretaryNotifications] Error al cargar notificaciones (polling):",
          error
        );
      }
    };
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isConnected, user]);

  // Manejar notificaciones Socket.IO
  useEffect(() => {
    if (!notifications.length) return;
    const newMessages = notifications.filter(
      (notif) =>
        [
          "invoice_complete",
          "invoice_updated",
          "invoice_deleted",
          "message",
        ].includes(notif.type) &&
        (notif.toUserId === user.id || notif.fromUserId === adminId)
    );
    if (newMessages.length > 0) {
      setAllMessages((prev) => {
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
      setFilteredMessages((prev) => {
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
      setConversation((prev) => ({
        ...prev,
        unread_messages:
          prev.unread_messages +
          newMessages.filter(
            (n) => n.toUserId === user.id && n.status === "Pendiente"
          ).length,
        last_message_at: new Date(
          newMessages[newMessages.length - 1].timestamp
        ),
        total_messages: prev.total_messages + newMessages.length,
      }));
    }
  }, [notifications, user, adminId]);

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    try {
      const notification = await createNotification(
        {
          order_id: null, // No se usa para mensajes directos
          to_user_id: adminId,
          message: newMessage || "Adjunto enviado",
          type: "message",
        },
        files
      );
      await sendMessage(null, newMessage || "Adjunto enviado", adminId);
      const newNotification = {
        id: notification.id,
        order_id: null,
        from_user_id: user.id,
        to_user_id: adminId,
        message: newMessage || "Adjunto enviado",
        type: "message",
        status: "Pendiente",
        details: notification.details || {},
        created_at: new Date(),
        attachments: notification.attachments || [],
      };
      setAllMessages((prev) => [...prev, newNotification]);
      setFilteredMessages((prev) => [...prev, newNotification]);
      setConversation((prev) => ({
        ...prev,
        last_message_at: new Date(),
        total_messages: prev.total_messages + 1,
      }));
      setNewMessage("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("[SecretaryNotifications] Error al enviar mensaje:", error);
      toast.error("Error al enviar mensaje");
    }
  };

  // Manejar adjuntos
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      ["image/jpeg", "image/png", "application/pdf"].includes(file.type)
    );
    setFiles(selectedFiles);
  };

  // Manejar escritura
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const isCurrentlyTyping = e.target.value.trim().length > 0;
    if (isCurrentlyTyping !== isTyping) {
      setIsTyping(isCurrentlyTyping);
      sendTyping("secretary", isCurrentlyTyping);
    }
  };

  // Auto-scroll a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  const chatMessages = useMemo(() => filteredMessages, [filteredMessages]);

  const isAdminTyping = typingUsers[`${adminId}_secretary`];

  return (
    <MainContainer fluid>
      <Sidebar menuItems={secretaryMenu} title="Menú Secretaría" />
      <Content>
        <DashboardHeader
          title="Notificaciones"
          userId={user?.id}
          userName={`${user?.first_name} ${user?.last_name}`}
          notificationsCount={conversation?.unread_messages || 0}
        />
        <Container fluid>
          <MessageContainer>
            <NotificationList>
              <NotificationHeader>Conversaciones</NotificationHeader>
              <NotificationItem
                className={conversation?.unread_messages > 0 ? "new" : ""}
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
                    Conversación con Administrador
                  </h3>
                  {conversation?.unread_messages > 0 && (
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
                    fontSize: "0.75rem",
                    color: "#6c757d",
                    marginTop: "0.5rem",
                  }}
                >
                  Último mensaje:{" "}
                  {conversation?.last_message_at
                    ? new Date(conversation.last_message_at).toLocaleString(
                        "es-ES"
                      )
                    : "Sin mensajes"}
                </p>
              </NotificationItem>
            </NotificationList>
            <MessageDetailContainer>
              <div style={{ padding: "0 24px", flex: "1", overflowY: "auto" }}>
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#fff",
                    zIndex: 10,
                    padding: "1.5rem",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "#1b4552",
                      }}
                    >
                      Conversación con Administrador
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "#6c757d",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span>
                        {chatMessages.length} mensaje
                        {chatMessages.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
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
                    <div
                      key={message.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          message.from_user_id === user.id
                            ? "flex-end"
                            : "flex-start",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {message.type === "invoice_complete" ||
                      message.type === "invoice_updated" ? (
                        <div>
                          <ApprovedNotification>
                            {message.message}
                          </ApprovedNotification>
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
                            {message.created_at.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.from_user_id === user.id && (
                              <span style={{ marginLeft: "0.5rem" }}>
                                {message.status === "Leída"
                                  ? "✓✓ Leído"
                                  : "✓ Enviado"}
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
                      ) : message.type === "invoice_deleted" ? (
                        <div>
                          <RejectedNotification>
                            {message.message}
                          </RejectedNotification>
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
                            {message.created_at.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.from_user_id === user.id && (
                              <span style={{ marginLeft: "0.5rem" }}>
                                {message.status === "Leída"
                                  ? "✓✓ Leído"
                                  : "✓ Enviado"}
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
                      ) : (
                        <div>
                          <MessageBubble
                            sender={
                              message.from_user_id === user.id
                                ? "user"
                                : "other"
                            }
                          >
                            <p>{message.message}</p>
                            {message.attachments?.length > 0 && (
                              <div>
                                {message.attachments.map((attachment) => (
                                  <div key={attachment.id}>
                                    {attachment.file_type?.startsWith(
                                      "image/"
                                    ) ? (
                                      <Image
                                        src={`${API_URL}${attachment.file_path}`}
                                        thumbnail
                                        style={{ maxWidth: "200px" }}
                                      />
                                    ) : (
                                      <a
                                        href={`${API_URL}${attachment.file_path}`}
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
                          </MessageBubble>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color:
                                message.from_user_id === user.id
                                  ? "#c7c7c7"
                                  : "#b6bac0",
                              marginTop: "0.25rem",
                              textAlign:
                                message.from_user_id === user.id
                                  ? "right"
                                  : "left",
                            }}
                          >
                            {message.created_at.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.from_user_id === user.id && (
                              <span style={{ marginLeft: "0.5rem" }}>
                                {message.status === "Leída"
                                  ? "✓✓ Leído"
                                  : "✓ Enviado"}
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
                      )}
                    </div>
                  ))}
                  {isAdminTyping && (
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
                      Administrador está escribiendo
                      <span style={{ animation: "blink 1s infinite" }}>
                        ...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
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
                      />
                      <CustomButton
                        type="submit"
                        disabled={!newMessage.trim() && files.length === 0}
                      >
                        Enviar
                      </CustomButton>
                    </div>
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
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
                        <p style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                          {files.length} archivo{files.length > 1 ? "s" : ""}{" "}
                          seleccionado
                          {files.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </Form>
              </MessageInputWrapper>
            </MessageDetailContainer>
          </MessageContainer>
        </Container>
      </Content>
    </MainContainer>
  );
};

export default SecretaryNotifications;
