import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [updateOrderCallback, setUpdateOrderCallback] = useState(null); // Nuevo callback

  useEffect(() => {
    if (!user || !token) {
      console.log(
        "[SocketContext] No hay usuario o token, no se inicializa socket"
      );
      return;
    }

    const newSocket = io("http://localhost:5000", {
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[SocketContext] Conectado al servidor Socket.IO");
      setIsConnected(true);
    });

    newSocket.on("welcome", (msg) => {
      console.log("[SocketContext] Mensaje de bienvenida:", msg);
    });

    newSocket.on("notification", (notification) => {
      console.log("[SocketContext] Notificación recibida:", notification);
      const roles = ["admin", "secretary"];
      if (
        notification.toUserId === user.id ||
        roles.includes(user.role) ||
        notification.type === "order_creation" ||
        notification.type === "invoice_complete" ||
        notification.type === "part_approval" ||
        notification.type === "part_rejection"
      ) {
        setNotifications((prev) => {
          if (!prev.some((n) => n.id === notification.id)) {
            return [...prev, notification];
          }
          return prev;
        });
        toast.info(notification.message);
      }
    });

    newSocket.on("orderUpdated", ({ orderId, updatedOrder }) => {
      console.log("[SocketContext] orderUpdated recibido:", {
        orderId,
        updatedOrder,
      });
      toast.info(`Orden ${orderId} actualizada`);
      if (updateOrderCallback) {
        updateOrderCallback(orderId, updatedOrder); // Llamar al callback
      }
    });

    newSocket.on("messageSent", (notification) => {
      setNotifications((prev) => {
        if (!prev.some((n) => n.id === notification.id)) {
          return [...prev, notification];
        }
        return prev;
      });
      toast.success("Mensaje enviado");
    });

    newSocket.on("typing", ({ userId, orderId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [orderId]: isTyping ? userId : null,
      }));
    });

    newSocket.on("disconnect", () => {
      console.log("[SocketContext] Desconectado del servidor Socket.IO");
      setIsConnected(false);
      toast.warn("Conexión perdida con el servidor");
    });

    newSocket.on("error", (error) => {
      console.error("[SocketContext] Error de Socket.IO:", error);
      toast.error("Error en la conexión en tiempo real");
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, token]);

  useEffect(() => {
    if (!socket || !user || !isConnected) return;

    const joinOrderRooms = async () => {
      try {
        const response = await fetch("/api/notifications/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const conversations = await response.json();
        conversations.forEach((conv) => {
          socket.emit("joinOrder", conv.order_id);
        });
      } catch (error) {
        console.error(
          "[SocketContext] Error al unirse a salas de órdenes:",
          error
        );
        toast.error("Error al unirse a salas de órdenes");
      }
    };

    joinOrderRooms();
    socket.on("connect", joinOrderRooms);

    return () => {
      socket.off("connect");
    };
  }, [socket, user, token, isConnected]);

  const sendMessage = async (orderId, message, toUserId) => {
    if (!socket || !isConnected) {
      toast.error("No conectado al servidor en tiempo real");
      return;
    }
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          toUserId,
          message,
          type: "message",
        }),
      });
      const notification = await response.json();
      socket.emit("message", { orderId, message, toUserId, userId: user.id });
      return notification;
    } catch (error) {
      console.error("[SocketContext] Error al enviar mensaje:", error);
      toast.error("Error al enviar mensaje");
    }
  };

  const sendTyping = (orderId, isTyping) => {
    if (!socket || !isConnected) return;
    socket.emit("typing", { orderId, userId: user.id, isTyping });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        isConnected,
        typingUsers,
        sendMessage,
        sendTyping,
        setUpdateOrderCallback, // Exponer callback para OrderDetails
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
