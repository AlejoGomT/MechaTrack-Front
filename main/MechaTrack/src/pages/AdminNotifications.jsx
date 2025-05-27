import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Container, Form, Image, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../services/apiConfig";
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
  getNotifications,
  getMessagesByOrderId,
  getSecretaryId,
  createNotification,
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
  const [allMessages, setAllMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [showAuthPartModal, setShowAuthPartModal] = useState(false);
  const [partsList, setPartsList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedRejections, setExpandedRejections] = useState({});
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        let secretaryId;
        try {
          secretaryId = await getSecretaryId();
        } catch (error) {
          console.warn(
            "[AdminNotifications] No se encontró secretaria:",
            error
          );
          secretaryId = null;
        }

        let clients = [],
          technicians = [];
        try {
          const usersResponse = await axiosInstance.get("/api/users", {
            params: { role: "client,technician" },
          });
          const users = usersResponse.data.users || [];
          clients = users.filter((u) => u.role === "client");
          technicians = users.filter((u) => u.role === "technician");
        } catch (error) {
          console.error(
            "[AdminNotifications] Error al obtener usuarios:",
            error
          );
        }

        let data = [];
        try {
          data = await getConversations(user.id);
        } catch (error) {
          console.error(
            "[AdminNotifications] Error al obtener conversaciones:",
            error
          );
        }

        // Si no hay conversaciones, cargar órdenes manualmente
        if (data.length === 0) {
          try {
            const ordersResponse = await axiosInstance.get("/api/orders", {
              params: { technician_id: technicians.map((t) => t.id) },
            });
            data = ordersResponse.data
              .filter((order) =>
                ["En Proceso", "Pendiente"].includes(order.status)
              )
              .map((order) => ({
                order_id: order.id,
                conversation_id: order.id,
                vehicle_economic_number: order.vehicle_economic_number,
                order_status: order.status,
                last_message_at: null,
                total_messages: 0,
                unread_messages: 0,
                recipients: technicians.find(
                  (t) => t.id === order.technician_id
                )?.first_name
                  ? `${
                      technicians.find((t) => t.id === order.technician_id)
                        .first_name
                    } ${
                      technicians.find((t) => t.id === order.technician_id)
                        .last_name
                    }`
                  : "Técnico",
                senders: `${user.first_name} ${user.last_name}`,
                technician_id: order.technician_id,
              }));
          } catch (error) {
            console.warn(
              "[AdminNotifications] Error al cargar órdenes:",
              error
            );
          }
        }

        const processedConversations = await Promise.all(
          data
            .filter((conv) =>
              ["En Proceso", "Pendiente"].includes(conv.order_status)
            )
            .map(async (conv) => {
              const recipientList = conv.recipients
                ? [...new Set(conv.recipients.split(", "))]
                : [];
              const senderList = conv.senders
                ? [...new Set(conv.senders.split(", "))]
                : [];
              const technicianName =
                recipientList
                  .concat(senderList)
                  .filter(
                    (name) =>
                      name &&
                      name !== "Admin user" &&
                      name !== "technician user" &&
                      name !== `${user.first_name} ${user.last_name}`
                  )[0] || "Técnico";
              const adminName = `${user.first_name} ${user.last_name}`;
              let technician = null;
              try {
                const order = await getOrderById(conv.order_id);
                if (order && order.technician_id) {
                  technician = technicians.find(
                    (t) => t.id === order.technician_id
                  );
                }
                if (!technician) {
                  const orderMessages = await getMessagesByOrderId(
                    conv.order_id,
                    user.id
                  );
                  technician = technicians.find((t) =>
                    orderMessages.some(
                      (m) => m.from_user_id === t.id || m.to_user_id === t.id
                    )
                  );
                }
              } catch (error) {
                console.warn(
                  "[AdminNotifications] Error al buscar técnico para orden:",
                  conv.order_id,
                  error
                );
              }
              return {
                ...conv,
                recipients: technician
                  ? `${technician.first_name} ${technician.last_name}`
                  : technicianName,
                senders: adminName,
                type: "order",
                technician_id: technician?.id || null,
              };
            })
        );

        const directConversation = secretaryId
          ? {
              order_id: "DIRECT",
              conversation_id: "DIRECT",
              vehicle_economic_number: null,
              order_status: null,
              last_message_at: null,
              total_messages: 0,
              unread_messages: 0,
              senders: `${user.first_name} ${user.last_name}`,
              recipients: "Secretaria",
              type: "direct",
              to_user_id: secretaryId,
            }
          : null;

        const clientConversations = await Promise.all(
          clients.map(async (client) => {
            let clientMessages = [];
            try {
              clientMessages = await getNotifications({
                user_id: user.id,
                to_user_id: client.id,
                type: "direct_message",
              });
            } catch (error) {
              console.warn(
                "[AdminNotifications] No se encontraron mensajes con cliente:",
                client.id,
                error
              );
            }
            return {
              order_id: `CLIENT_${client.id}`,
              conversation_id: `CLIENT_${client.id}`,
              vehicle_economic_number: null,
              order_status: null,
              last_message_at:
                clientMessages.length > 0
                  ? clientMessages[clientMessages.length - 1].created_at
                  : null,
              total_messages: clientMessages.length,
              unread_messages: clientMessages.filter(
                (m) => m.status === "Pendiente" && m.to_user_id === user.id
              ).length,
              senders: `${user.first_name} ${user.last_name}`,
              recipients:
                client.first_name && client.last_name
                  ? `${client.first_name} ${client.last_name}`
                  : "Cliente Sin Nombre",
              type: "client",
              to_user_id: client.id,
            };
          })
        );

        const technicianConversations = [];
        for (const technician of technicians) {
          const technicianOrders = processedConversations.filter(
            (conv) => conv.technician_id === technician.id
          );
          let directMessages = [];
          try {
            directMessages = await getNotifications({
              user_id: user.id,
              to_user_id: technician.id,
              type: "direct_message",
            });
          } catch (error) {
            console.warn(
              "[AdminNotifications] No se encontraron mensajes directos con técnico:",
              technician.id,
              error
            );
          }
          technicianConversations.push({
            order_id: `TECH_${technician.id}`,
            conversation_id: `TECH_${technician.id}`,
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
            recipients: `${technician.first_name} ${technician.last_name}`,
            type: "technician",
            to_user_id: technician.id,
          });
          if (technicianOrders.length > 0) {
            technicianConversations.push({
              order_id: `TECH_${technician.id}_ORDERS`,
              conversation_id: `TECH_${technician.id}_ORDERS`,
              vehicle_economic_number: null,
              order_status: null,
              last_message_at: technicianOrders.reduce(
                (max, conv) =>
                  conv.last_message_at && (!max || conv.last_message_at > max)
                    ? conv.last_message_at
                    : max,
                null
              ),
              total_messages: technicianOrders.reduce(
                (sum, conv) => sum + conv.total_messages,
                0
              ),
              unread_messages: technicianOrders.reduce(
                (sum, conv) => sum + conv.unread_messages,
                0
              ),
              senders: `${user.first_name} ${user.last_name}`,
              recipients: `${technician.first_name} ${technician.last_name}`,
              type: "technician_orders",
              orders: technicianOrders,
              to_user_id: technician.id,
            });
          }
        }

        const allConversations = [
          ...(directConversation ? [directConversation] : []),
          ...clientConversations,
          ...technicianConversations,
        ];

        setConversations(allConversations);
        if (socket && isConnected) {
          allConversations.forEach((conv) => {
            if (
              conv.type === "order" ||
              conv.type === "direct" ||
              conv.type === "client" ||
              conv.type === "technician"
            ) {
              socket.emit("joinOrder", conv.order_id);
              console.log("[AdminNotifications] Joined room:", conv.order_id);
            }
          });
        }
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
          "[AdminNotifications] Error al cargar conversaciones:",
          error
        );
        toast.error("Error al cargar conversaciones");
      }
    };
    if (token) fetchConversations();
  }, [token, user.id, location.search, socket, isConnected]);

  useEffect(() => {
    if (isConnected) return;
    const fetchConversations = async () => {
      try {
        const data = await getConversations(user.id);
        const processedConversations = data
          .filter((conv) =>
            ["En Proceso", "Pendiente"].includes(conv.order_status)
          )
          .map((conv) => {
            const recipients = conv.recipients
              ? [...new Set(conv.recipients.split(", "))]
                  .filter((r) => r !== "Admin user" && r !== "technician user")
                  .join(", ") || "Técnico"
              : "Técnico";
            const senders = conv.senders
              ? [...new Set(conv.senders.split(", "))]
                  .filter((s) => s !== "Admin user" && s !== "technician user")
                  .join(", ") || `${user.first_name} ${user.last_name}`
              : `${user.first_name} ${user.last_name}`;
            return { ...conv, recipients, senders };
          });
        setConversations(processedConversations);
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
    setSelectedConversation(conversation);
    setAllMessages([]);
    setFilteredMessages([]);
    try {
      let messagesData = [];
      if (
        conversation.type === "direct" ||
        conversation.type === "client" ||
        conversation.type === "technician"
      ) {
        messagesData = await getNotifications({
          user_id: user.id,
          to_user_id: conversation.to_user_id,
          type: "direct_message",
          order_id: null,
        });
      } else if (conversation.type === "order") {
        try {
          const response = await axiosInstance.get(
            `/api/notifications/order/${conversation.order_id}`
          );
          messagesData = response.data;
        } catch (error) {
          console.warn(
            "[AdminNotifications] No se encontraron mensajes para la orden:",
            conversation.order_id,
            error
          );
          messagesData = [];
        }
      }
      console.log("[AdminNotifications] Mensajes cargados:", messagesData);
      messagesData = messagesData.filter((m) =>
        conversation.type === "direct" ||
        conversation.type === "client" ||
        conversation.type === "technician"
          ? m.order_id === null && m.type === "direct_message"
          : m.order_id === conversation.order_id
      );
      setAllMessages(messagesData);
      const filtered = messagesData.filter(
        (m) => !["part_request", "order_creation"].includes(m.type)
      );
      setFilteredMessages(filtered);
      let orderStatus = "Activo";
      if (conversation.type === "order") {
        try {
          const order = await getOrderById(conversation.order_id);
          orderStatus = order?.status || "En proceso";
        } catch (error) {
          console.warn(
            "[AdminNotifications] Error al obtener estado de la orden:",
            conversation.order_id,
            error
          );
        }
      }
      setOrderStatus(orderStatus);
      setPartsList(
        conversation.type === "order"
          ? (await getOrderById(conversation.order_id))?.parts || []
          : []
      );
      const unreadMessages = filtered.filter(
        (m) => m.status === "Pendiente" && m.to_user_id === user.id
      );
      for (const message of unreadMessages) {
        try {
          await axiosInstance.put(`/api/notifications/${message.id}`, {
            status: "Leída",
          });
        } catch (error) {
          if (error.response?.status === 404) {
            console.warn(
              "[AdminNotifications] Notificación no encontrada, ID:",
              message.id
            );
          } else {
            console.error(
              "[AdminNotifications] Error al marcar mensaje:",
              message.id,
              error.response?.status || error.message
            );
          }
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
          c.conversation_id === conversation.conversation_id
            ? { ...c, unread_messages: 0 }
            : c
        )
      );
      navigate(`?orderId=${conversation.conversation_id}`, { replace: true });
      if (socket && isConnected) {
        socket.emit("joinOrder", conversation.order_id);
        console.log("[AdminNotifications] Joined room:", conversation.order_id);
      }
    } catch (error) {
      console.error(
        "[AdminNotifications] Error en handleSelectConversation:",
        error
      );
      toast.error("Error al cargar mensajes");
      setSelectedConversation(null);
    }
  };

  useEffect(() => {
    if (!selectedConversation || !notifications.length) return;
    console.log("[AdminNotifications] Nuevas notificaciones:", notifications);
    const newMessages = notifications.filter((notif) => {
      if (
        selectedConversation.type === "direct" ||
        selectedConversation.type === "client" ||
        selectedConversation.type === "technician"
      ) {
        return (
          notif.type === "direct_message" &&
          notif.orderId === null &&
          ((notif.toUserId === selectedConversation.to_user_id &&
            notif.fromUserId === user.id) ||
            (notif.fromUserId === selectedConversation.to_user_id &&
              notif.toUserId === user.id)) &&
          !notif.orderId
        );
      } else if (selectedConversation.type === "order") {
        return (
          notif.orderId === selectedConversation.order_id &&
          notif.type !== "direct_message" &&
          notif.orderId !== null
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
            const isSelectedConversation =
              c.order_id === selectedConversation.order_id ||
              c.orders?.some(
                (o) => o.order_id === selectedConversation.order_id
              );
            if (isSelectedConversation) {
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
    }
  }, [notifications, selectedConversation, user.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    try {
      // Determinar to_user_id
      const toUserId = selectedConversation.to_user_id;
      if (!toUserId) {
        console.error(
          "[AdminNotifications] No se encontró to_user_id para la conversación:",
          selectedConversation
        );
        toast.error("Error: No se pudo determinar el destinatario");
        return;
      }

      // Determinar order_id y type
      const isDirectMessage = ["direct", "client", "technician"].includes(
        selectedConversation.type
      );
      const notificationData = {
        order_id: isDirectMessage ? null : selectedConversation.order_id,
        to_user_id: toUserId,
        message: newMessage || "Adjunto enviado",
        type: isDirectMessage ? "direct_message" : "message",
        from_user_id: user.id,
      };

      console.log(
        "[AdminNotifications] Enviando notificación:",
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
      console.error("[AdminNotifications] Error al enviar mensaje:", error);
      toast.error(`Error al enviar mensaje: ${error.message}`);
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
  }, [filteredMessages]);

  const chatMessages = useMemo(() => filteredMessages, [filteredMessages]);

  const isTechnicianTyping = selectedConversation
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
                    onClick={() =>
                      conversation.type !== "technician_orders" &&
                      handleSelectConversation(conversation)
                    }
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
                        {conversation.type === "direct" && "Secretaria"}
                        {conversation.type === "client" &&
                          `Cliente: ${conversation.recipients || "Sin nombre"}`}
                        {conversation.type === "technician" &&
                          `Técnico: ${
                            conversation.recipients || "Sin nombre"
                          } (Directo)`}
                        {conversation.type === "technician_orders" &&
                          `Técnico: ${
                            conversation.recipients || "Sin nombre"
                          } (Órdenes)`}
                        {conversation.type === "order" &&
                          `Orden #${conversation.order_id} (${
                            conversation.vehicle_economic_number || "Sin número"
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
                    {conversation.type === "technician_orders" && (
                      <div style={{ marginTop: "0.5rem" }}>
                        {conversation.orders
                          .filter((order) =>
                            ["En Proceso", "Pendiente"].includes(
                              order.order_status
                            )
                          )
                          .map((order) => (
                            <p
                              key={order.order_id}
                              style={{
                                fontSize: "0.875rem",
                                color: "#6c757d",
                                marginLeft: "1rem",
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectConversation(order);
                              }}
                            >
                              Orden #{order.order_id} (
                              {order.vehicle_economic_number || "Sin número"})
                            </p>
                          ))}
                      </div>
                    )}
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
                          {selectedConversation.type === "direct" &&
                            "Secretaria"}
                          {selectedConversation.type === "client" &&
                            `Cliente: ${
                              selectedConversation.recipients || "Sin nombre"
                            }`}
                          {selectedConversation.type === "technician" &&
                            `Técnico: ${
                              selectedConversation.recipients || "Sin nombre"
                            } (Directo)`}
                          {selectedConversation.type === "order" &&
                            `Orden #${selectedConversation.order_id} (${
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
