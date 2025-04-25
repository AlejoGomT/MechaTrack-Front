import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = "http://localhost:5000/api"; // Constante para la URL base

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true); // Nuevo estado para carga inicial

  // Verificar token al cargar la app
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data.user);
        } catch (error) {
          console.error("Token inválido:", error);
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (id, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        id,
        password,
      });
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      return true;
    } catch (error) {
      console.error("Error en login:", error);
      const message =
        error.response?.data?.message || "Usuario o contraseña incorrectos";
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
