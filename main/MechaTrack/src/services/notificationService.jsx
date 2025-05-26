import axiosInstance from "./apiConfig";

export const getNotifications = async (userIdOrParams) => {
  try {
    let params = {};
    if (typeof userIdOrParams === "string") {
      params = { to_user_id: userIdOrParams };
    } else if (userIdOrParams && typeof userIdOrParams === "object") {
      params = userIdOrParams;
    } else {
      console.error(
        "[notificationService] Parámetro inválido en getNotifications:",
        userIdOrParams
      );
      throw new Error("Parámetro inválido para obtener notificaciones");
    }

    console.log(
      "[notificationService] Obteniendo notificaciones con params:",
      params
    );

    const response = await axiosInstance.get("/api/notifications", { params });
    console.log(
      "[notificationService] Notificaciones obtenidas:",
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(
      "[notificationService] Error al obtener notificaciones:",
      error
    );
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
    console.error(
      "[notificationService] Error al obtener conversaciones:",
      error.response?.data || error
    );
    throw (
      error.response?.data || { message: "Error al obtener conversaciones" }
    );
  }
};

export const getMessagesByOrderId = async (orderId, userId) => {
  try {
    const response = await axiosInstance.get(
      `/api/notifications/order/${orderId}`,
      {
        params: { user_id: userId },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "[notificationService] Error al obtener mensajes:",
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
    console.log(
      "[notificationService] Respuesta de createNotification:",
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(
      "[notificationService] Error en createNotification:",
      error.response?.data || error
    );
    throw error.response?.data || { message: "Error al crear notificación" };
  }
};

export const getAdminId = async () => {
  try {
    const response = await axiosInstance.get("/api/admin/admin-id");
    console.log(
      "[notificationService] Respuesta de getAdminId:",
      response.data
    );
    if (!response.data || !response.data.id) {
      throw new Error("No se encontró un administrador");
    }
    return response.data.id;
  } catch (error) {
    console.error(
      "[notificationService] Error al obtener ID del administrador:",
      error
    );
    throw (
      error.response?.data || {
        message: "Error al obtener ID del administrador",
      }
    );
  }
};
