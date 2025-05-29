import axiosInstance from "./apiConfig";

export const getOrders = async (filters = {}) => {
  try {
    // Asegurar que los parámetros undefined se omitan
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );
    console.log(
      "[OrderService] Parámetros enviados a /api/orders:",
      cleanFilters
    );
    const response = await axiosInstance.get("/api/orders", {
      params: cleanFilters,
    });
    console.log(
      "[OrderService] Respuesta completa de /api/orders:",
      response.data
    );
    return response.data;
  } catch (error) {
    console.error("[OrderService] Error en getOrders:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error.response?.data || { message: "Error al obtener órdenes" };
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error en getOrderById:", error.response?.data || error);
    throw error.response?.data || { message: "Error al obtener la orden" };
  }
};

export const getOrderCounts = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/api/orders/counts", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error("Error en getOrderCounts:", error.response?.data || error);
    throw error.response?.data || { message: "Error al obtener conteos" };
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
        formData.append(
          "parts",
          JSON.stringify(
            value.map((part) => ({
              part_id: part.part_id,
              quantity: part.quantity,
              status: part.status || "Solicitado",
              requested_by: part.requested_by,
              authorized_by: part.authorized_by || null,
            }))
          )
        );
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
    let hasImages = false;

    Object.entries(orderData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append("images", file);
            hasImages = true;
          }
        });
      } else if (key === "existingImages" && Array.isArray(value)) {
        formData.append("existingImages", JSON.stringify(value));
        hasImages = true;
      } else if (key === "parts" && Array.isArray(value)) {
        formData.append(
          "parts",
          JSON.stringify(
            value.map((part) => ({
              part_id: part.part_id,
              quantity: part.quantity,
              status: part.status || "Solicitado",
              requested_by: part.requested_by,
              authorized_by: part.authorized_by || null,
            }))
          )
        );
      } else {
        formData.append(key, value);
      }
    });

    if (hasImages && !orderData.parts) {
      formData.append("updateImagesOnly", "true");
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
    return response.data;
  } catch (error) {
    console.error("Error en updateOrder:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar la orden" };
  }
};

export const deleteOrderImage = async (orderId, imageIndex) => {
  try {
    console.log("order: ", orderId, " index: ", imageIndex);
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
