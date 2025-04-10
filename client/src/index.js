// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChefDashboard from './pages/chef-dashboard';
import EmployeeDashboard from './pages/employee-dashboard';
import PrivateRoute from './components/PrivateRoute'; // Private route pour protéger l'accès
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<App />} />
        {/* Routes protégées */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/chef-dashboard"
          element={
            <PrivateRoute>
              <ChefDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <PrivateRoute>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  </AuthProvider>
);
