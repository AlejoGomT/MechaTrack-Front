import axiosInstance from "./apiConfig";

export const getNotifications = async (userId) => {
  try {
    const response = await axiosInstance.get("/api/notifications", {
      params: { to_user_id: userId },
    });
    return response.data;
  } catch (error) {
    console.error("Error en getNotifications:", error.response?.data || error);
    throw (
      error.response?.data || { message: "Error al obtener notificaciones" }
    );
  }
};

export const getConversations = async (userId) => {
  try {
    const response = await axiosInstance.get(
      "/api/notifications/conversations",
      {
        params: { user_id: userId },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error en getConversations:", error.response?.data || error);
    throw (
      error.response?.data || { message: "Error al obtener conversaciones" }
    );
  }
};

export const getMessagesByOrderId = async (orderId, userId) => {
  try {
    const response = await axiosInstance.get(`/api/notifications`, {
      params: { order_id: orderId, user_id: userId },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error en getMessagesByOrderId:",
      error.response?.data || error
    );
    throw error.response?.data || { message: "Error al obtener mensajes" };
  }
};

export const createNotification = async (notificationData, files = []) => {
  try {
    const formData = new FormData();
    Object.entries(notificationData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    files.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await axiosInstance.post("/api/notifications", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Respuesta de createNotification:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error en createNotification:",
      error.response?.data || error
    );
    throw error.response?.data || { message: "Error al crear notificación" };
  }
};
