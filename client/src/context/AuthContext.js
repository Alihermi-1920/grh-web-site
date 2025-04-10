// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Récupération de l'utilisateur depuis le localStorage
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      setUser(JSON.parse(storedEmployee));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
