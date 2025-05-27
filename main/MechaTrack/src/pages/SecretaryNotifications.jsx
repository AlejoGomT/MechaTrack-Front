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
  const { socket, notifications, sendTyping, isConnected, typingUsers } =
    useSocket();
  const [conversation, setConversation] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasFetchedRef = useRef(false);

  // Debounce para fetchData
  const debounce = (func, wait) => {
    let timeout;
    const debounced = (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
  };

  // Obtener ID del administrador y cargar notificaciones
  const fetchData = debounce(async () => {
    if (!user?.id || !token) {
      console.log("[SecretaryNotifications] Condiciones no cumplidas:", {
        userId: user?.id,
        token: !!token,
      });
      return;
    }
    if (hasFetchedRef.current) {
      console.log("[SecretaryNotifications] fetchData ya ejecutado, omitiendo");
      return;
    }

    hasFetchedRef.current = true;
    try {
      console.log("[FetchData] Obteniendo adminId...");
      const adminId = await getAdminId();
      console.log("[FetchData] adminId obtenido:", adminId);
      setAdminId(adminId);

      console.log(
        "[FetchData] Obteniendo notificaciones para user_id:",
        user.id
      );
      const notificationsData = await getNotifications({
        user_id: user.id,
        to_user_id: adminId,
        type: [
          "direct_message",
          "invoice_complete",
          "invoice_updated",
          "invoice_deleted",
        ],
      });
      console.log("[FetchData] Notificaciones cargadas:", notificationsData);

      const processedMessages = notificationsData
        .filter(
          (n) =>
            [
              "direct_message",
              "invoice_complete",
              "invoice_updated",
              "invoice_deleted",
            ].includes(n.type) &&
            (n.from_user_id === adminId ||
              n.to_user_id === adminId ||
              n.from_user_id === user.id ||
              n.to_user_id === user.id)
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
        id: `DIRECT_MESSAGE_${adminId}`,
        title: "Conversación con Administrador",
        unread_messages: unreadCount,
        last_message_at: processedMessages.length
          ? processedMessages[processedMessages.length - 1].created_at
          : new Date(),
        total_messages: processedMessages.length,
      });

      const unreadMessages = processedMessages.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      );
      for (const message of unreadMessages) {
        try {
          await axiosInstance.put(`/api/notifications/${message.id}`, {
            status: "Leída",
          });
          console.log("[FetchData] Mensaje marcado como leído:", message.id);
        } catch (error) {
          console.warn(
            "[FetchData] Error al marcar mensaje como leído:",
            message.id,
            error
          );
        }
      }

      if (socket && isConnected) {
        socket.emit("joinDirectMessage", `DIRECT_MESSAGE_${adminId}`);
        socket.emit("joinDirectMessage", `DIRECT_MESSAGE_${user.id}`);
        console.log(
          `[FetchData] Unido a salas DIRECT_MESSAGE_${adminId} y DIRECT_MESSAGE_${user.id}`
        );
      } else {
        console.warn("[FetchData] Socket no conectado:", {
          isConnected,
          socket: !!socket,
        });
      }
    } catch (error) {
      console.error("[FetchData] Error al cargar datos:", error);
      toast.error("Error al cargar notificaciones");
      hasFetchedRef.current = false;
    }
  }, 500);

  useEffect(() => {
    console.log("[SecretaryNotifications] useEffect inicial:", {
      userId: user?.id,
      token: !!token,
      isConnected,
    });
    async function loadData() {
      await fetchData();
    }
    loadData();
    return () => {
      fetchData.cancel();
      console.log("[SecretaryNotifications] Cleanup: fetchData cancelado");
    };
  }, [user?.id, token, socket, isConnected]);

  // Polling para actualizar mensajes
  useEffect(() => {
    if (!user?.id || !adminId) {
      console.warn("[Polling] No hay usuario o adminId, omitiendo polling", {
        userId: user?.id,
        adminId,
      });
      return;
    }
    const fetchNotifications = async () => {
      try {
        console.log("[Polling] Ejecutando polling para user_id:", user.id);
        const notificationsData = await getNotifications({
          user_id: user.id,
          to_user_id: adminId,
          type: [
            "direct_message",
            "invoice_complete",
            "invoice_updated",
            "invoice_deleted",
          ],
        });
        console.log("[Polling] Notificaciones cargadas:", notificationsData);
        const processedMessages = notificationsData
          .filter(
            (n) =>
              [
                "direct_message",
                "invoice_complete",
                "invoice_updated",
                "invoice_deleted",
              ].includes(n.type) &&
              (n.from_user_id === adminId ||
                n.to_user_id === adminId ||
                n.from_user_id === user.id ||
                n.to_user_id === user.id)
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
          id: `DIRECT_MESSAGE_${adminId}`,
          title: "Conversación con Administrador",
          unread_messages: unreadCount,
          last_message_at: processedMessages.length
            ? processedMessages[processedMessages.length - 1].created_at
            : new Date(),
          total_messages: processedMessages.length,
        });
        const unreadMessages = processedMessages.filter(
          (m) => m.status === "Pendiente" && m.to_user_id === user.id
        );
        for (const message of unreadMessages) {
          try {
            await axiosInstance.put(`/api/notifications/${message.id}`, {
              status: "Leída",
            });
            console.log("[Polling] Mensaje marcado como leído:", message.id);
          } catch (error) {
            console.warn(
              "[Polling] Error al marcar mensaje como leído:",
              message.id,
              error
            );
          }
        }
      } catch (error) {
        console.error("[Polling] Error al cargar notificaciones:", error);
      }
    };
    const interval = setInterval(fetchNotifications, 5000);
    return () => {
      clearInterval(interval);
      console.log("[SecretaryNotifications] Cleanup: Polling detenido");
    };
  }, [user?.id, adminId]);

  // Manejar notificaciones Socket.IO
  useEffect(() => {
    if (!notifications.length || !adminId) {
      console.log("[Socket] No hay notificaciones o adminId:", {
        notifications: notifications.length,
        adminId,
      });
      return;
    }
    console.log("[Socket] Notificaciones recibidas:", notifications);

    const newMessages = notifications.filter(
      (notif) =>
        [
          "direct_message",
          "invoice_complete",
          "invoice_updated",
          "invoice_deleted",
        ].includes(notif.type) &&
        ((notif.fromUserId === adminId && notif.toUserId === user.id) ||
          (notif.fromUserId === user.id && notif.toUserId === adminId))
    );
    console.log("[Socket] Mensajes filtrados:", newMessages);

    if (newMessages.length > 0) {
      setAllMessages((prev) => {
        const updatedMessages = [...prev];
        newMessages.forEach((notif) => {
          if (!prev.some((m) => m.id === notif.id)) {
            updatedMessages.push({
              id: notif.id,
              order_id: notif.orderId || null,
              from_user_id: notif.fromUserId,
              to_user_id: notif.toUserId,
              message: notif.message,
              type: notif.type,
              status: notif.status || "Pendiente",
              details: notif.details || {},
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
              order_id: notif.orderId || null,
              from_user_id: notif.fromUserId,
              to_user_id: notif.toUserId,
              message: notif.message,
              type: notif.type,
              status: notif.status || "Pendiente",
              details: notif.details || {},
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
  }, [notifications, user]);

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    if (!adminId) {
      toast.error("No se pudo identificar al administrador");
      return;
    }

    try {
      const notification = await createNotification(
        {
          order_id: null,
          to_user_id: adminId,
          message: newMessage || "Adjunto enviado",
          type: "direct_message",
          from_user_id: user.id,
        },
        files
      );
      const newNotification = {
        id: notification.id,
        order_id: null,
        from_user_id: user.id,
        to_user_id: adminId,
        message: newMessage || "Adjunto enviado",
        type: "direct_message",
        status: "Pendiente",
        details: notification.details || {},
        created_at: new Date(notification.created_at),
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
      if (socket && isConnected) {
        socket.emit("notification", {
          ...newNotification,
          toUserId: adminId,
          fromUserId: user.id,
          timestamp: new Date().toISOString(),
          room: `DIRECT_MESSAGE_${adminId}`,
        });
        console.log(
          "[SendMessage] Notificación emitida a sala:",
          `DIRECT_MESSAGE_${adminId}`
        );
      } else {
        console.warn(
          "[SendMessage] Socket no conectado, mensaje enviado solo vía API"
        );
      }
    } catch (error) {
      console.error("[SendMessage] Error al enviar mensaje:", error);
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
    if (isCurrentlyTyping !== isTyping && adminId) {
      setIsTyping(isCurrentlyTyping);
      sendTyping(`DIRECT_MESSAGE_${adminId}`, isCurrentlyTyping);
    }
  };

  // Auto-scroll a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  const chatMessages = useMemo(() => filteredMessages, [filteredMessages]);

  const isAdminTyping =
    adminId && typingUsers[`${adminId}_DIRECT_MESSAGE_${adminId}`];

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
                      {["invoice_complete", "invoice_updated"].includes(
                        message.type
                      ) ? (
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
