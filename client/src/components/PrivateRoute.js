// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  // Simple direct check for authentication in localStorage
  const storedEmployee = localStorage.getItem("employee");

  // Si aucun utilisateur n'est trouvé dans localStorage, redirige vers /login
  if (!storedEmployee) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est authentifié, afficher les enfants
  return children;
};

export default PrivateRoute;
