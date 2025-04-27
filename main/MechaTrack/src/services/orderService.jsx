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
      console.log(`FormData: ${key} =`, value);
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
  const response = await axios.get(`${API_URL}/parts`, {
    headers: getAuthHeaders(),
    params: { model },
  });
  return response.data;
};

export const getNotifications = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: getAuthHeaders(),
      params: { to_user_id: userId },
    });
    return response.data;
  } catch (err) {
    throw err.response?.data || { message: "Error al obtener notificaciones" };
  }
};
