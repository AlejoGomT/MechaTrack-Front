// src/context/AuthContext.jsx
import { createContext, useState, useContext } from 'react';
import { mockUsers } from '../data/mock'; // Importar mockUsers

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    const foundUser = mockUsers.find(
      (u) => u.name === username && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);