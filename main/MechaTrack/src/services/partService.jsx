import axiosInstance from "./apiConfig";

export const getParts = async (model, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get("/api/parts", {
      params: { model, page, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error en getParts:", error.response?.data || error);
    throw error.response?.data || { message: "Error al obtener repuestos" };
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

export const requestPart = async (orderId, part) => {
  try {
    const response = await axiosInstance.post(`/api/orders/${orderId}/parts`, {
      part_id: part.part_id,
      name: part.name,
      quantity: part.quantity,
      requested_by: part.requested_by,
      status: part.status || "Solicitado",
      authorized_by: part.authorized_by || null,
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
        price: partData.price ? parseFloat(partData.price) : null,
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

export const approvePartReturn = async (orderId, partId, status) => {
  try {
    const response = await axiosInstance.post(
      `/api/orders/${orderId}/parts/${partId}/approve-return`,
      { status }
    );
    console.log("Respuesta de approvePartReturn:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en approvePartReturn:", error.response?.data || error);
    throw error.response?.data || { message: "Error al procesar devolución" };
  }
};

export const updatePartQuantity = async (orderId, partId, quantity) => {
  try {
    console.log("[partService.jsx] Enviando updatePartQuantity:", {
      orderId,
      partId,
      quantity,
    });
    const response = await axiosInstance.put(
      `/api/orders/${orderId}/parts/${partId}`,
      {
        quantity,
      }
    );
    console.log(
      "[partService.jsx] Respuesta de updatePartQuantity:",
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(
      "[partService.jsx] Error en updatePartQuantity:",
      error.response?.data || error
    );
    throw (
      error.response?.data || {
        message:
          quantity === 0
            ? "Error al eliminar repuesto"
            : "Error al actualizar cantidad de repuesto",
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

export const updatePartInventory = async (partId, quantityChange) => {
  try {
    const response = await axiosInstance.put(`/api/parts/${partId}/inventory`, {
      quantityChange,
    });
    console.log("Respuesta de updatePartInventory:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error en updatePartInventory:",
      error.response?.data || error
    );
    throw error.response?.data || { message: "Error al actualizar inventario" };
  }
};
