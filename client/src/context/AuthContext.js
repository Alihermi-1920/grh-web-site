// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to get user from different localStorage keys
    const storedEmployee = localStorage.getItem("employee");
    const storedUser = localStorage.getItem("user");

    if (storedEmployee) {
      try {
        const parsedEmployee = JSON.parse(storedEmployee);
        console.log("Found employee in localStorage:", parsedEmployee);
        setUser(parsedEmployee);
      } catch (error) {
        console.error("Error parsing employee from localStorage:", error);
      }
    } else if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Found user in localStorage:", parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    } else {
      console.log("No user found in localStorage");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
