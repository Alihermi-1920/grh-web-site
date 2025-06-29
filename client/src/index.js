// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import App from './App';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import ChefDashboard from './pages/chef-dashboard';
import EmployeeDashboard from './pages/employee-dashboard';
import FinalLeaveRequest from './pages/FinalLeaveRequest';
import PrivateRoute from './components/PrivateRoute'; // Private route pour protéger l'accès
import theme from './theme'; // Import our custom theme with Inter font
import GlobalStyles from './components/GlobalStyles'; // Import our global styles
import './utils/axiosConfig'; // Import Axios configuration with interceptors
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<App />} />
            {/* Routes protégées avec vérification de maintenance */}
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
            
            <Route
              path="/final-leave"
              element={
                <PrivateRoute>
                  <FinalLeaveRequest />
                </PrivateRoute>
              }
            />
            
          </Routes>
        </Router>
      </AuthProvider>
    </LocalizationProvider>
  </ThemeProvider>
);
