import axios from "axios";
import { API_URL } from "./orderService";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

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
    throw error.response?.data || { message: "Error al obtener usuarios" };
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/api/users", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Error al crear usuario" };
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosInstance.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Error al actualizar usuario" };
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Error al eliminar usuario" };
  }
};
