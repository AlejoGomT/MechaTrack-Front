import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      if (token && !user && isMounted) {
        try {
          console.log(
            "[AuthContext] Enviando solicitud a /auth/verify con token:",
            token
          );
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            console.error(
              "[AuthContext] Error en /auth/verify:",
              response.status,
              await response.text()
            );
            throw new Error(`Error ${response.status}`);
          }
          const data = await response.json();
          console.log("[AuthContext] Respuesta de /auth/verify:", data);
          if (isMounted) setUser(data.user);
        } catch (error) {
          console.error(
            "[AuthContext] Error verificando token:",
            error.message
          );
          if (isMounted) logout();
        }
      }
      if (isMounted) setLoading(false);
    };
    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const loginUser = async (id, password) => {
    try {
      const response = await login(id, password);
      console.log("[AuthContext] Login exitoso, token:", response.token);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      navigate("/admin");
      return true;
    } catch (error) {
      const message =
        error.response?.data?.message || "Usuario o contraseña incorrectos";
      throw new Error(message);
    }
  };

  const logout = () => {
    console.log("[AuthContext] Cerrando sesión");
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login: loginUser, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
