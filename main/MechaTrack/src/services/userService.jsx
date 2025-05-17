import axiosInstance from "./apiConfig";

export const getUsers = async ({
  name,
  role,
  page,
  limit,
  excludeAdmin = false,
}) => {
  try {
    const params = { page, limit, excludeAdmin };
    if (name && name.trim()) params.name = name.trim();
    if (role && role.trim()) params.role = role.trim();

    console.log("Parámetros enviados desde userService.jsx:", params);

    const response = await axiosInstance.get("/api/users", { params });
    return response.data;
  } catch (error) {
    console.error("Error en getUsers:", error.response?.data || error);
    throw error.response?.data || { message: "Error al obtener usuarios" };
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/api/users", userData);
    return response.data;
  } catch (error) {
    console.error("Error en createUser:", error.response?.data || error);
    throw error.response?.data || { message: "Error al crear usuario" };
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosInstance.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error en updateUser:", error.response?.data || error);
    throw error.response?.data || { message: "Error al actualizar usuario" };
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error en deleteUser:", error.response?.data || error);
    throw error.response?.data || { message: "Error al eliminar usuario" };
  }
};
