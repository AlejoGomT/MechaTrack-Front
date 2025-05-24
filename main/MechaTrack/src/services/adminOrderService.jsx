import axiosInstance from "./apiConfig";

export const updateAdminOrder = async (orderId, orderData) => {
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
        formData.append(
          "parts",
          JSON.stringify(
            value.map((part) => ({
              part_id: part.part_id,
              quantity: part.quantity,
              status: part.status || "Aprobado",
              requested_by: part.requested_by,
              authorized_by: part.authorized_by || null,
              price: part.price || null,
            }))
          )
        );
      } else {
        formData.append(key, value);
      }
    });

    for (let [key, value] of formData.entries()) {
      console.log(`FormData updateAdminOrder: ${key} =`, value);
    }

    const response = await axiosInstance.put(
      `/api/admin/orders/${orderId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Respuesta de updateAdminOrder:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en updateAdminOrder:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al actualizar la orden",
        details: error.message,
      }
    );
  }
};

export const addAdminImages = async (orderId, formData) => {
  try {
    const response = await axiosInstance.post(
      `/api/admin/orders/${orderId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("Respuesta de addAdminImages:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en addAdminImages:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al añadir imágenes",
        details: error.message,
      }
    );
  }
};

export const deleteAdminImage = async (orderId, imageIndex) => {
  try {
    const response = await axiosInstance.delete(
      `/api/admin/orders/${orderId}/images/${imageIndex}`
    );
    console.log("Respuesta de deleteAdminImage:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en deleteAdminImage:", error.response?.data || error);
    throw (
      error.response?.data || {
        message: "Error al eliminar imagen",
        details: error.message,
      }
    );
  }
};
