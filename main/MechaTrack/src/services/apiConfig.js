import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log(
      "[apiConfig] Token en solicitud:",
      token ? `Presente (${token.slice(0, 10)}...)` : "Ausente"
    );
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("[apiConfig] No hay token disponible");
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

export default axiosInstance;
