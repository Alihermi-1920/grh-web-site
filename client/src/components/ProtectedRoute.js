import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import FirstLoginPasswordChange from './FirstLoginPasswordChange';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useContext(AuthContext);

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If this is a first login, show the password change dialog
  // The dialog is now handled in AuthContext, but we still need to check here
  // to prevent access to protected routes if firstLogin is true
  if (user.firstLogin === true) {
    // We'll render a blank page with just the dialog
    // The dialog is already shown by AuthContext
    return <div style={{ display: 'none' }}></div>;
  }

  // If allowedRoles is empty, allow access to any authenticated user
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has the required role
  const userRole = user.role?.trim().toLowerCase();
  if (allowedRoles.includes(userRole)) {
    return children;
  }

  // If user doesn't have the required role, redirect to appropriate dashboard
  if (userRole === 'admin') {
    return <Navigate to="/dashboard" replace />;
  } else if (userRole === 'chef') {
    return <Navigate to="/chef-dashboard" replace />;
  } else {
    return <Navigate to="/employee-dashboard" replace />;
  }
};

export default ProtectedRoute;
