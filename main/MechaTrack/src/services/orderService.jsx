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
  try {
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    //console.log("Respuesta de getOrderById:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error en getOrderById:", err.response?.data || err);
    throw err.response?.data || { message: "Error al obtener la orden" };
  }
};

export const createOrder = async (orderData) => {
  try {
    const formData = new FormData();
    Object.entries(orderData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file, index) => {
          if (file instanceof File) {
            formData.append(`images`, file);
          }
        });
      } else if (key === "parts" && Array.isArray(value)) {
        formData.append("parts", JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    // Log para depurar FormData
    /*for (let [key, value] of formData.entries()) {
      console.log(`FormData createOrder: ${key} =`, value);
    }*/

    const response = await axios.post(`${API_URL}/orders`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });
    console.log("Respuesta de createOrder:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en createOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al crear la orden" };
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    const formData = new FormData();
    Object.entries(orderData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item instanceof File) {
            formData.append(`images`, item);
          } else if (typeof item === "string") {
            formData.append(`existingImages[${index}]`, item);
          }
        });
      } else if (key === "parts" && Array.isArray(value)) {
        formData.append("parts", JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    // Log para depurar FormData
    for (let [key, value] of formData.entries()) {
      console.log(`FormData updateOrder: ${key} =`, value);
    }

    const response = await axios.put(`${API_URL}/orders/${orderId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });
    //console.log("Respuesta de updateOrder:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en updateOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar la orden" };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axios.put(
      `${API_URL}/orders/${orderId}/status`,
      { status },
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );
    console.log("Respuesta de updateOrderStatus:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en updateOrderStatus:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al actualizar estado de la orden",
      }
    );
  }
};

export const updateOrderNumbers = async (orderId, numbers) => {
  try {
    const response = await axios.put(
      `${API_URL}/orders/${orderId}/numbers`,
      numbers,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );
    console.log("Respuesta de updateOrderNumbers:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error en updateOrderNumbers:",
      error.response?.data || error
    );
    throw (
      error.response?.data || {
        message: "Error al actualizar números de orden/factura",
      }
    );
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
    //console.log("Respuesta de getParts:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error en getParts:", err.response?.data || err);
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
    console.error("Error en getNotifications:", err.response?.data || err);
    throw err.response?.data || { message: "Error al obtener notificaciones" };
  }
};
