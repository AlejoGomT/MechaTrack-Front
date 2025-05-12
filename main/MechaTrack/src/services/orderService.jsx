import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Crear una instancia de Axios
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token a todas las solicitudes
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta (por ejemplo, 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado o no válido
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const login = async (id, password) => {
  const response = await axiosInstance.post("/api/auth/login", {
    id,
    password,
  });
  return response.data;
};

export const getOrders = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/api/orders", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("[orderService] Error en getOrders:", error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/orders/${id}`);
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
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append("images", file);
          }
        });
      } else if (key === "parts" && Array.isArray(value)) {
        formData.append("parts", JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    const response = await axiosInstance.post("/api/orders", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
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
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append("images", file);
          }
        });
      } else if (key === "existingImages" && Array.isArray(value)) {
        formData.append("existingImages", JSON.stringify(value));
      } else if (key === "parts" && Array.isArray(value)) {
        formData.append("parts", JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    for (let [key, value] of formData.entries()) {
      console.log(`FormData updateOrder: ${key} =`, value);
    }

    const response = await axiosInstance.put(
      `/api/orders/${orderId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Respuesta de updateOrder:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en updateOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar la orden" };
  }
};

export const deleteOrderImage = async (orderId, imageIndex) => {
  try {
    const response = await axiosInstance.delete(
      `/api/orders/${orderId}/images/${imageIndex}`
    );
    console.log("Respuesta de deleteOrderImage:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en deleteOrderImage:", error.response?.data || error);
    throw error.response?.data || { message: "Error al eliminar imagen" };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await axiosInstance.put(`/api/orders/${orderId}/status`, {
      status,
    });
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
    const response = await axiosInstance.put(
      `/api/orders/${orderId}/numbers`,
      numbers
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
    if (!part.price || part.price <= 0) {
      throw new Error("El precio del repuesto debe ser mayor que 0");
    }
    const response = await axiosInstance.post(`/api/orders/${orderId}/parts`, {
      part_id: part.part_id,
      name: part.name,
      quantity: part.quantity,
      price: parseFloat(part.price),
      requested_by: part.requested_by,
      status: part.status || "Solicitado",
    });
    console.log("Respuesta de requestPart:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en requestPart:", error.response?.data || error);
    throw error.response?.data || { message: "Error al solicitar repuesto" };
  }
};

export const updatePartAdmin = async (
  orderId,
  partId,
  partData,
  authorizedBy
) => {
  try {
    const response = await axiosInstance.put(
      `/api/orders/${orderId}/parts/${partId}`,
      {
        quantity: partData.quantity,
        status: partData.status,
        price: partData.price || null,
        note: partData.note || "",
        authorized_by: partData.status === "Aprobado" ? authorizedBy : null,
      }
    );
    console.log("Respuesta de updatePart:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en updatePart:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar repuesto" };
  }
};

export const updatePartQuantity = async (orderId, partId, quantity) => {
  try {
    const response = await axiosInstance.put(
      `/api/orders/${orderId}/parts/${partId}`,
      {
        quantity,
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
    const response = await axiosInstance.post(
      `/api/orders/${orderId}/parts/${partId}/return`,
      {
        quantity,
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
    const response = await axiosInstance.get("/api/vehicles", {
      params: filters,
    });
    return response.data;
  } catch (err) {
    console.error("Error en getVehicles:", err.response?.data);
    throw err.response?.data || { message: "Error al obtener vehículos" };
  }
};

export const createVehicle = async (vehicleData) => {
  try {
    const response = await axiosInstance.post("/api/vehicles", vehicleData);
    return response.data;
  } catch (err) {
    console.error("Error en createVehicle:", err.response?.data || err);
    throw err.response?.data || { message: "Error al crear vehículo" };
  }
};

export const updateVehicle = async (economicNumber, vehicleData) => {
  try {
    const response = await axiosInstance.put(
      `/api/vehicles/${economicNumber}`,
      vehicleData
    );
    return response.data;
  } catch (err) {
    console.error("Error en updateVehicle:", err.response?.data || err);
    throw err.response?.data || { message: "Error al actualizar vehículo" };
  }
};

export const deleteVehicle = async (economicNumber) => {
  try {
    const response = await axiosInstance.delete(
      `/api/vehicles/${economicNumber}`
    );
    return response.data;
  } catch (err) {
    console.error("Error en deleteVehicle:", err.response?.data || err);
    throw err.response?.data || { message: "Error al eliminar vehículo" };
  }
};

export const getBranches = async () => {
  try {
    const response = await axiosInstance.get("/api/vehicles/branches");
    return response.data;
  } catch (err) {
    console.error("Error en getBranches:", err.response?.data || err);
    throw err.response?.data || { message: "Error al obtener sucursales" };
  }
};

export const getVehicleBrands = async () => {
  try {
    const response = await axiosInstance.get("/api/vehicles/brands");
    return response.data;
  } catch (err) {
    console.error("Error en getVehicleBrands:", err.response?.data || err);
    throw (
      err.response?.data || { message: "Error al obtener marcas de vehículos" }
    );
  }
};

export const getParts = async (model, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get("/api/parts", {
      params: { model, page, limit },
    });
    return response.data;
  } catch (err) {
    console.error("Error en getParts:", err.response?.data || err);
    throw err.response?.data || { message: "Error al obtener repuestos" };
  }
};

export const createPart = async (partData) => {
  try {
    const formData = new FormData();
    Object.entries(partData).forEach(([key, value]) => {
      if (key === "image" && value instanceof File) {
        formData.append("image", value);
      } else if (key === "compatible_models" && Array.isArray(value)) {
        formData.append("compatible_models", JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    const response = await axiosInstance.post("/api/parts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error en createPart:", error.response?.data || error);
    throw error.response?.data || { message: "Error al crear repuesto" };
  }
};

export const updatePart = async (partId, partData) => {
  try {
    const formData = new FormData();
    Object.entries(partData).forEach(([key, value]) => {
      if (key === "image" && value instanceof File) {
        formData.append("image", value);
      } else if (key === "compatible_models" && Array.isArray(value)) {
        formData.append("compatible_models", JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    const response = await axiosInstance.put(`/api/parts/${partId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error en updatePart:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar repuesto" };
  }
};

export const deletePart = async (partId) => {
  try {
    const response = await axiosInstance.delete(`/api/parts/${partId}`);
    return response.data;
  } catch (error) {
    console.error("Error en deletePart:", error.response?.data || error);
    throw error.response?.data || { message: "Error al eliminar repuesto" };
  }
};

export const getVehicleModels = async () => {
  try {
    const response = await axiosInstance.get("/api/vehicles/models");
    return response.data;
  } catch (err) {
    console.error("Error en getVehicleModels:", err.response?.data || err);
    throw (
      err.response?.data || { message: "Error al obtener modelos de vehículos" }
    );
  }
};

export const getNotifications = async (userId) => {
  try {
    const response = await axiosInstance.get("/api/notifications", {
      params: { to_user_id: userId },
    });
    return response.data;
  } catch (err) {
    console.error("Error en getNotifications:", err.response?.data || err);
    throw err.response?.data || { message: "Error al obtener notificaciones" };
  }
};

export const finalizeOrder = async (orderId, data) => {
  try {
    const response = await axiosInstance.put(
      `/api/orders/${orderId}/finalize`,
      data
    );
    console.log("Respuesta de finalizeOrder:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en finalizeOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al finalizar orden" };
  }
};
