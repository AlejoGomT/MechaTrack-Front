import axiosInstance from "./apiConfig";

export const login = async (id, password) => {
  try {
    const response = await axiosInstance.post("/api/auth/login", {
      id,
      password,
    });
    console.log("[authService] Login exitoso:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[authService] Error en login:",
      error.response?.data || error
    );
    throw error.response?.data || { message: "Error al iniciar sesión" };
  }
};
