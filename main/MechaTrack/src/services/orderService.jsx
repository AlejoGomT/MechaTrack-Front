import axios from "axios";

const API_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const login = async (id, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { id, password });
  return response.data;
};

export const getOrders = async (filters = {}) => {
  const response = await axios.get(`${API_URL}/orders`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await axios.get(`${API_URL}/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createOrder = async (orderData) => {
  try {
    const formData = new FormData();
    formData.append("type", orderData.type || "");
    formData.append("description", orderData.description || "");
    formData.append("initial_diagnosis", orderData.initial_diagnosis || "");
    formData.append("tasks", orderData.tasks || "");
    formData.append("technician_id", orderData.technician_id || "");
    formData.append(
      "vehicle_economic_number",
      orderData.vehicle_economic_number || ""
    );
    formData.append("kilometraje", orderData.kilometraje || "");
    formData.append("branch", orderData.branch || "");
    formData.append("plate", orderData.plate || "");
    formData.append("brand", orderData.brand || "");
    formData.append("model", orderData.model || "");
    formData.append("year", orderData.year || "");

    // Manejar parts como JSON
    if (orderData.parts && Array.isArray(orderData.parts)) {
      try {
        formData.append("parts", JSON.stringify(orderData.parts));
      } catch (error) {
        console.error("Error al serializar parts:", error);
        throw new Error("Formato inválido para parts");
      }
    }

    // Manejar imágenes
    if (orderData.images && Array.isArray(orderData.images)) {
      orderData.images.forEach((image, index) => {
        if (image instanceof File) {
          formData.append("images", image);
        } else if (typeof image === "string") {
          formData.append(`existingImages[${index}]`, image);
        }
      });
    }

    // Log para depurar FormData
    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key} =`, value);
    }

    const response = await axios.post(`${API_URL}/orders`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error en createOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al crear la orden" };
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    const formData = new FormData();
    formData.append("initial_diagnosis", orderData.initial_diagnosis || "");
    formData.append("tasks", orderData.tasks || "");
    formData.append("kilometraje", orderData.kilometraje || "");
    formData.append("branch", orderData.branch || "");
    formData.append(
      "vehicle_economic_number",
      orderData.vehicle_economic_number || ""
    );

    if (orderData.parts && orderData.parts.length > 0) {
      formData.append("parts", JSON.stringify(orderData.parts));
    }

    if (orderData.images && orderData.images.length > 0) {
      orderData.images.forEach((image, index) => {
        if (image instanceof File) {
          formData.append("images", image);
        } else if (typeof image === "string") {
          formData.append(`existingImages[${index}]`, image);
        }
      });
    }

    const response = await axios.put(`${API_URL}/orders/${orderId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error en updateOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar la orden" };
  }
};

export const requestPart = async (orderId, part) => {
  try {
    const response = await axios.post(
      `${API_URL}/orders/${orderId}/parts`,
      part,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error en requestPart:", error.response?.data || error);
    throw error.response?.data || { message: "Error al solicitar repuesto" };
  }
};

export const updatePartQuantity = async (orderId, partId, quantity) => {
  try {
    const response = await axios.put(
      `${API_URL}/orders/${orderId}/parts/${partId}`,
      { quantity },
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error en updatePartQuantity:",
      error.response?.data || error
    );
    throw (
      error.response?.data || {
        message: "Error al actualizar cantidad de repuesto",
      }
    );
  }
};

export const requestPartReturn = async (orderId, partId, quantity) => {
  try {
    const response = await axios.post(
      `${API_URL}/orders/${orderId}/parts/${partId}/return`,
      { quantity },
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error en requestPartReturn:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al solicitar devolución de repuesto",
      }
    );
  }
};

export const getVehicles = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/vehicles`, {
      headers: getAuthHeaders(),
      params: filters,
    });
    return response.data;
  } catch (err) {
    console.error("Error en getVehicles:", err.response?.data);
    throw err.response?.data || { message: "Error al obtener vehículos" };
  }
};

export const getParts = async (model) => {
  try {
    const response = await axios.get(`${API_URL}/parts`, {
      headers: getAuthHeaders(),
      params: { model },
    });
    return response.data;
  } catch (err) {
    console.error("Error en getParts:", err.response?.data);
    throw err.response?.data || { message: "Error al obtener repuestos" };
  }
};

export const getNotifications = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: getAuthHeaders(),
      params: { to_user_id: userId },
    });
    return response.data;
  } catch (err) {
    console.error("Error en getNotifications:", err.response?.data);
    throw err.response?.data || { message: "Error al obtener notificaciones" };
  }
};
