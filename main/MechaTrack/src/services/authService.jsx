import axiosInstance from "./apiConfig";

export const login = async (id, password) => {
  try {
    const response = await axiosInstance.post("/api/auth/login", {
      id,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error en login:", error.response?.data || error);
    throw error.response?.data || { message: "Error al iniciar sesión" };
  }
};
