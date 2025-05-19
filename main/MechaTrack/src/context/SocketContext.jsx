import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io("http://localhost:5000", {
      query: { token },
    });

    newSocket.on("connect", () => {
      console.log("[SocketContext] Conectado al servidor Socket.IO");
    });

    newSocket.on("welcome", (msg) => {
      console.log("[SocketContext] Mensaje de bienvenida:", msg);
    });

    newSocket.on("notification", (notification) => {
      console.log("[SocketContext] Notificación recibida:", notification);
      // Solo agregar si es relevante para el usuario
      if (
        notification.toUserId === user.id ||
        (notification.type === "order_creation" && user.role === "admin") ||
        (notification.type === "invoice_complete" && user.role === "secretary")
      ) {
        setNotifications((prev) => [...prev, notification]);
        toast.info(`Nueva notificación: ${notification.message}`);
      }
    });

    newSocket.on("error", (err) => {
      console.error("[SocketContext] Error en Socket.IO:", err);
      toast.error("Error de conexión con el servidor");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      console.log("[SocketContext] Socket desconectado");
    };
  }, [token, user]);

  const sendMessage = (toUserId, orderId, message, files = []) => {
    if (!socket) {
      console.error("[SocketContext] Socket no está conectado");
      return;
    }
    socket.emit("message", {
      toUserId,
      orderId,
      message,
    });
    // También crear la notificación vía HTTP para almacenarla
    const notificationData = {
      order_id: orderId,
      to_user_id: toUserId,
      message: message || "Adjunto enviado",
      type: "message",
      status: "Pendiente",
    };
    return require("../services/notificationService").createNotification(
      notificationData,
      files
    );
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, sendMessage }}>
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
