import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io("http://localhost:5000", {
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[SocketContext] Conectado al servidor Socket.IO");
      setIsConnected(true);
    });

    newSocket.on("welcome", (msg) => {
      console.log("[SocketContext] Mensaje de bienvenida:", msg);
    });

    newSocket.on("notification", (notification) => {
      console.log("[SocketContext] Notificación recibida:", notification);
      if (
        notification.toUserId === user.id ||
        (notification.type === "order_creation" && user.role === "admin") ||
        (notification.type === "invoice_complete" && user.role === "secretary")
      ) {
        setNotifications((prev) => {
          if (!prev.some((n) => n.id === notification.id)) {
            return [...prev, notification];
          }
          return prev;
        });
        toast.info(`Nueva notificación: ${notification.message}`);
      }
    });

    newSocket.on("typing", ({ userId, orderId, isTyping }) => {
      console.log("[SocketContext] Evento typing:", {
        userId,
        orderId,
        isTyping,
      });
      setTypingUsers((prev) => ({
        ...prev,
        [`${userId}_${orderId}`]: isTyping,
      }));
    });

    newSocket.on("disconnect", () => {
      console.log("[SocketContext] Desconectado del servidor Socket.IO");
      setIsConnected(false);
      toast.warn("Conexión perdida, intentando reconectar...");
    });

    newSocket.on("error", (err) => {
      console.error("[SocketContext] Error en Socket.IO:", err);
      toast.error("Error de conexión con el servidor");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      console.log("[SocketContext] Socket desconectado");
      setIsConnected(false);
    };
  }, [token, user]);

  // Unir a salas de órdenes
  useEffect(() => {
    if (!socket || !user || !isConnected) return;

    const joinOrderRooms = async () => {
      try {
        const response = await fetch("/api/notifications/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Error al obtener conversaciones");
        const conversations = await response.json();
        conversations.forEach((conv) => {
          socket.emit("joinOrder", conv.order_id);
          console.log("[SocketContext] Joined room: order_", conv.order_id);
        });
      } catch (error) {
        console.error(
          "[SocketContext] Error al unirse a salas de órdenes:",
          error
        );
      }
    };

    joinOrderRooms();

    // Re-unir en reconexión
    socket.on("connect", joinOrderRooms);

    return () => {
      socket.off("connect", joinOrderRooms);
    };
  }, [socket, user, token, isConnected]);

  const sendMessage = (
    toUserId,
    orderId,
    message,
    files = [],
    type = "message"
  ) => {
    if (!socket || !isConnected) {
      console.error("[SocketContext] Socket no está conectado");
      throw new Error("No se puede enviar el mensaje: conexión perdida");
    }
    socket.emit("message", {
      toUserId,
      orderId,
      message,
      type,
    });
    const notificationData = {
      order_id: orderId,
      to_user_id: toUserId,
      message: message || "Adjunto enviado",
      type,
      status: "Pendiente",
    };
    return require("../services/notificationService").createNotification(
      notificationData,
      null
    );
  };

  const sendTyping = (orderId, isTyping) => {
    if (socket && isConnected) {
      socket.emit("typing", { userId: user.id, orderId, isTyping });
      console.log("[SocketContext] Enviado evento typing:", {
        orderId,
        isTyping,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        sendMessage,
        sendTyping,
        typingUsers,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
