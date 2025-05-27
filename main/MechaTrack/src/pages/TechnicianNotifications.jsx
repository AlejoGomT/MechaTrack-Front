import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Container, Form, Image, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../services/apiConfig";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import CustomButton from "../components/CustomButton";
import PartsModal from "../components/PartsModal";
import {
  MainContainer,
  Content,
  MessageContainer,
  NotificationList,
  NotificationItem,
  NotificationHeader,
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
  getNotifications,
  getMessagesByOrderId,
  createNotification,
  getAdminId,
} from "../services/notificationService";

const technicianMenu = [
  { label: "Inicio", path: "/technician" },
  { label: "Crear Orden de Servicio", path: "/technician/create-order" },
  { label: "Historial de Órdenes", path: "/technician/history" },
  { label: "Notificaciones", path: "/technician/notifications" },
  { label: "Cerrar Sesión", path: "/" },
];

const TechnicianNotifications = () => {
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
  const [allMessages, setAllMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [showPartsManagementModal, setShowPartsManagementModal] =
    useState(false);
  const [partsList, setPartsList] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedRejections, setExpandedRejections] = useState({});
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Cargar conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        let adminId = null;
        try {
          adminId = await getAdminId();
        } catch (error) {
          console.warn(
            "[TechnicianNotifications] No se encontró admin:",
            error
          );
        }

        let directMessages = [];
        if (adminId) {
          try {
            directMessages = await getNotifications({
              user_id: user.id,
              to_user_id: adminId,
              type: "direct_message",
              order_id: null,
            });
          } catch (error) {
            console.warn(
              "[TechnicianNotifications] No se encontraron mensajes directos con admin:",
              error
            );
          }
        }

        let orderConversations = [];
        try {
          orderConversations = await getConversations(user.id);
        } catch (error) {
          console.error(
            "[TechnicianNotifications] Error al obtener conversaciones de órdenes:",
            error
          );
        }

        // Procesar conversaciones de órdenes
        const processedOrderConversations = orderConversations
          .filter((conv) =>
            ["En Proceso", "Pendiente"].includes(conv.order_status)
          )
          .map((conv) => ({
            ...conv,
            type: "order",
            recipients: "Admin",
            senders: `${user.first_name} ${user.last_name}`,
          }));

        // Conversación directa con admin
        const directConversation = adminId
          ? {
              order_id: `DIRECT_${adminId}`,
              conversation_id: `DIRECT_${adminId}`,
              vehicle_economic_number: null,
              order_status: null,
              last_message_at:
                directMessages.length > 0
                  ? directMessages[directMessages.length - 1].created_at
                  : null,
              total_messages: directMessages.length,
              unread_messages: directMessages.filter(
                (m) => m.status === "Pendiente" && m.to_user_id === user.id
              ).length,
              senders: `${user.first_name} ${user.last_name}`,
              recipients: "Admin",
              type: "direct",
              to_user_id: adminId,
            }
          : null;

        const allConversations = [
          ...(directConversation ? [directConversation] : []),
          ...processedOrderConversations,
        ];

        setConversations(allConversations);

        // Unirse a salas Socket.IO
        if (socket && isConnected) {
          allConversations.forEach((conv) => {
            socket.emit("joinOrder", conv.order_id);
            console.log(
              "[TechnicianNotifications] Joined room:",
              conv.order_id
            );
          });
        }

        // Seleccionar conversación desde URL
        const params = new URLSearchParams(location.search);
        const orderId = params.get("orderId");
        if (orderId) {
          const conversation = allConversations.find(
            (c) => c.order_id === orderId
          );
          if (conversation) {
            handleSelectConversation(conversation);
          }
        }
      } catch (error) {
        console.error(
          "[TechnicianNotifications] Error al cargar conversaciones:",
          error
        );
        toast.error("Error al cargar conversaciones");
      }
    };
    if (token) fetchConversations();
  }, [token, user.id, location.search, socket, isConnected]);

  // Polling si Socket.IO está desconectado
  useEffect(() => {
    if (isConnected) return;
    const fetchConversations = async () => {
      try {
        let adminId = null;
        try {
          adminId = await getAdminId();
        } catch (error) {
          console.warn(
            "[TechnicianNotifications] No se encontró admin:",
            error
          );
        }

        let directMessages = [];
        if (adminId) {
          directMessages = await getNotifications({
            user_id: user.id,
            to_user_id: adminId,
            type: "direct_message",
            order_id: null,
          });
        }
        const orderConversations = await getConversations(user.id);
        const processedOrderConversations = orderConversations
          .filter((conv) =>
            ["En Proceso", "Pendiente"].includes(conv.order_status)
          )
          .map((conv) => ({
            ...conv,
            type: "order",
            recipients: "Admin",
            senders: `${user.first_name} ${user.last_name}`,
          }));
        const directConversation = adminId
          ? {
              order_id: `DIRECT_${adminId}`,
              conversation_id: `DIRECT_${adminId}`,
              vehicle_economic_number: null,
              order_status: null,
              last_message_at:
                directMessages.length > 0
                  ? directMessages[directMessages.length - 1].created_at
                  : null,
              total_messages: directMessages.length,
              unread_messages: directMessages.filter(
                (m) => m.status === "Pendiente" && m.to_user_id === user.id
              ).length,
              senders: `${user.first_name} ${user.last_name}`,
              recipients: "Admin",
              type: "direct",
              to_user_id: adminId,
            }
          : null;
        const allConversations = [
          ...(directConversation ? [directConversation] : []),
          ...processedOrderConversations,
        ];
        setConversations(allConversations);
      } catch (error) {
        console.error(
          "[TechnicianNotifications] Error al cargar conversaciones (polling):",
          error
        );
      }
    };
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [isConnected, user.id]);

  // Seleccionar conversación
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setAllMessages([]);
    setFilteredMessages([]);
    try {
      let messagesData = [];
      if (conversation.type === "direct") {
        messagesData = await getNotifications({
          user_id: user.id,
          to_user_id: conversation.to_user_id,
          type: "direct_message",
          order_id: null,
        });
      } else if (conversation.type === "order") {
        messagesData = await getMessagesByOrderId(
          conversation.order_id,
          user.id
        );
      }
      console.log(
        "[TechnicianNotifications] Mensajes cargados para",
        conversation.order_id,
        ":",
        messagesData
      );
      // Filtrar mensajes no permitidos
      messagesData = messagesData.filter(
        (m) => !["client_update", "invoice_complete"].includes(m.type)
      );
      setAllMessages(messagesData);
      const filtered = messagesData.filter(
        (m) => !["part_request", "order_creation"].includes(m.type)
      );
      setFilteredMessages(filtered);

      let orderStatus = "Activo";
      if (conversation.type === "order") {
        const order = await getOrderById(conversation.order_id);
        orderStatus = order?.status || "En Proceso";
        setPartsList(order?.parts || []);
        setAvailableParts([]); // Nota: getParts no está implementado
      }
      setOrderStatus(orderStatus);

      // Marcar mensajes como leídos
      const unreadMessages = filtered.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      );
      for (const message of unreadMessages) {
        try {
          await axiosInstance.put(`/api/notifications/${message.id}`, {
            status: "Leída",
          });
        } catch (error) {
          console.warn(
            "[TechnicianNotifications] Error al marcar mensaje como leído:",
            message.id,
            error
          );
        }
      }
      setFilteredMessages((prev) =>
        prev.map((m) =>
          unreadMessages.some((um) => um.id === m.id)
            ? { ...m, status: "Leído" }
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
      if (socket && isConnected) {
        socket.emit("joinOrder", conversation.order_id);
        console.log(
          "[TechnicianNotifications] Joined room:",
          conversation.order_id
        );
      }
    } catch (error) {
      console.error(
        "[TechnicianNotifications] Error en handleSelectConversation:",
        error
      );
      toast.error("Error al cargar mensajes");
      setSelectedConversation(null);
    }
  };

  // Actualizar mensajes en tiempo real
  useEffect(() => {
    if (!selectedConversation || !notifications.length) return;
    const newMessages = notifications.filter((notif) => {
      if (selectedConversation.type === "direct") {
        return (
          notif.type === "direct_message" &&
          notif.orderId === null &&
          ((notif.toUserId === selectedConversation.to_user_id &&
            notif.fromUserId === user.id) ||
            (notif.fromUserId === selectedConversation.to_user_id &&
              notif.toUserId === user.id))
        );
      } else if (selectedConversation.type === "order") {
        return (
          notif.orderId === selectedConversation.order_id &&
          !["client_update", "invoice_complete"].includes(notif.type)
        );
      }
      return false;
    });

    if (newMessages.length > 0) {
      setAllMessages((prev) => {
        const updatedAllMessages = [...prev];
        newMessages.forEach((notif) => {
          if (!prev.some((m) => m.id === notif.id)) {
            updatedAllMessages.push({
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
        return updatedAllMessages.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      });

      setFilteredMessages((prev) => {
        const updatedFilteredMessages = [...prev];
        newMessages
          .filter(
            (notif) => !["part_request", "order_creation"].includes(notif.type)
          )
          .forEach((notif) => {
            if (!prev.some((m) => m.id === notif.id)) {
              updatedFilteredMessages.push({
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
        return updatedFilteredMessages.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      });

      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.order_id === selectedConversation.order_id) {
              return {
                ...c,
                last_message_at: new Date(
                  newMessages[newMessages.length - 1].timestamp
                ),
                total_messages:
                  c.total_messages +
                  newMessages.filter(
                    (n) => !["part_request", "order_creation"].includes(n.type)
                  ).length,
                unread_messages:
                  c.unread_messages +
                  newMessages.filter(
                    (n) =>
                      n.toUserId === user.id &&
                      n.status === "Pendiente" &&
                      !["part_request", "order_creation"].includes(n.type)
                  ).length,
              };
            }
            return c;
          })
          .sort(
            (a, b) =>
              new Date(b.last_message_at || 0) -
              new Date(a.last_message_at || 0)
          )
      );

      // Actualizar conversaciones para nuevas órdenes
      const newOrders = notifications.filter(
        (notif) => notif.type === "order_creation"
      );
      if (newOrders.length > 0) {
        const fetchConversations = async () => {
          try {
            const data = await getConversations(user.id);
            setConversations(
              data
                .filter((conv) =>
                  ["En Proceso", "Pendiente"].includes(conv.order_status)
                )
                .map((conv) => ({
                  ...conv,
                  type: "order",
                  recipients: "Admin",
                  senders: `${user.first_name} ${user.last_name}`,
                }))
            );
          } catch (error) {
            console.error(
              "[TechnicianNotifications] Error al actualizar conversaciones:",
              error
            );
          }
        };
        fetchConversations();
      }
    }
  }, [notifications, selectedConversation, user.id]);

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    try {
      const toUserId =
        selectedConversation.to_user_id ||
        allMessages.find((m) => m.from_user_id !== user.id)?.from_user_id;
      if (!toUserId) {
        console.error(
          "[TechnicianNotifications] No se encontró to_user_id:",
          selectedConversation
        );
        toast.error("Error: No se pudo determinar el destinatario");
        return;
      }

      const isDirectMessage = selectedConversation.type === "direct";
      const notificationData = {
        order_id: isDirectMessage ? null : selectedConversation.order_id,
        to_user_id: toUserId,
        message: newMessage || "Adjunto enviado",
        type: isDirectMessage ? "direct_message" : "message",
        from_user_id: user.id,
      };

      console.log(
        "[TechnicianNotifications] Enviando notificación:",
        JSON.stringify(notificationData, null, 2),
        "Archivos:",
        files
      );

      const notification = await createNotification(notificationData, files);
      const newNotification = {
        id: notification.id,
        order_id: notificationData.order_id,
        from_user_id: user.id,
        to_user_id: toUserId,
        message: notificationData.message,
        type: notificationData.type,
        status: "Pendiente",
        details: notification.details || {},
        created_at: new Date(),
        attachments: notification.attachments || [],
      };

      setAllMessages((prev) => [...prev, newNotification]);
      if (!["part_request", "order_creation"].includes(newNotification.type)) {
        setFilteredMessages((prev) => [...prev, newNotification]);
      }

      setConversations((prev) =>
        prev
          .map((c) =>
            c.order_id === selectedConversation.order_id
              ? {
                  ...c,
                  last_message_at: new Date(),
                  total_messages: c.total_messages + 1,
                }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_at || 0) -
              new Date(a.last_message_at || 0)
          )
      );

      setNewMessage("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(
        "[TechnicianNotifications] Error al enviar mensaje:",
        error
      );
      toast.error(`Error al enviar mensaje: ${error.message}`);
    }
  };

  // Manejar archivos
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
    if (isCurrentlyTyping !== isTyping && selectedConversation) {
      setIsTyping(isCurrentlyTyping);
      sendTyping(selectedConversation.order_id, isCurrentlyTyping);
    }
  };

  // Alternar motivo de rechazo
  const toggleRejectionReason = (messageId) => {
    setExpandedRejections((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  // Filtrar mensajes para el chat
  const chatMessages = useMemo(() => filteredMessages, [filteredMessages]);

  // Indicador de escritura
  const isAdminTyping = selectedConversation
    ? typingUsers[
        `${allMessages.find((m) => m.from_user_id !== user.id)?.from_user_id}_${
          selectedConversation.order_id
        }`
      ]
    : false;

  const isChatDisabled =
    selectedConversation?.type === "order" &&
    ["Facturado", "Finalizado"].includes(orderStatus);

  return (
    <MainContainer fluid>
      <Sidebar menuItems={technicianMenu} title="Menú Técnico" />
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
              {conversations
                .filter(
                  (conversation) =>
                    conversation.type !== "order" ||
                    ["En Proceso", "Pendiente"].includes(
                      conversation.order_status
                    )
                )
                .map((conversation) => (
                  <NotificationItem
                    key={conversation.order_id}
                    className={conversation.unread_messages > 0 ? "new" : ""}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: "medium",
                          color: "#1b4552",
                        }}
                      >
                        {conversation.type === "direct"
                          ? "Admin (Directo)"
                          : `Orden #${conversation.order_id} (${
                              conversation.vehicle_economic_number ||
                              "Sin número"
                            })`}
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
                    style={{
                      padding: "0 24px",
                      flex: "1",
                      overflowY: "auto",
                    }}
                  >
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
                          {selectedConversation.type === "direct"
                            ? "Admin (Directo)"
                            : `Orden #${selectedConversation.order_id} (${
                                selectedConversation.vehicle_economic_number ||
                                "Sin número"
                              })`}
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            color: "#6c757d",
                            fontSize: "0.875rem",
                          }}
                        >
                          <span>Estado: {orderStatus || "Activo"}</span>
                          <span style={{ margin: "0 0.5rem" }}>•</span>
                          <span>
                            {chatMessages.length} mensaje
                            {chatMessages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {allMessages.some((m) => m.type === "part_request") &&
                        selectedConversation.type === "order" && (
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
                          {message.type === "part_approval" ? (
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
                          ) : (
                            <div
                              className="d-flex flex-column"
                              style={{ width: "100%" }}
                            >
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
                          Admin está escribiendo
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
