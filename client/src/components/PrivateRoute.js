// src/components/PrivateRoute.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Si aucun utilisateur n'est défini, redirige vers /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;
