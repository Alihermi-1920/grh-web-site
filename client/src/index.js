// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import MaintenanceCheck from './components/MaintenanceCheck';
import App from './App';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChefDashboard from './pages/chef-dashboard';
import EmployeeDashboard from './pages/employee-dashboard';
import ProjectList from './pages/ProjectList';
import AddProject from './pages/AddProject';
import SimpleLeaveRequest from './pages/SimpleLeaveRequest';
import FinalLeaveRequest from './pages/FinalLeaveRequest';
import EmployeeProjects from './pages/EmployeeProjects';
import EmployeeProjectDetail from './pages/EmployeeProjectDetail';
import TestFileUpload from './pages/TestFileUpload';
import ChefTaskManagement from './pages/ChefTaskManagement';
import ChefTaskDetail from './pages/ChefTaskDetail';
import EmployeeTaskPage from './pages/EmployeeTaskPage';
import PrivateRoute from './components/PrivateRoute'; // Private route pour protéger l'accès
import theme from './theme'; // Import our custom theme with Inter font
import GlobalStyles from './components/GlobalStyles'; // Import our global styles
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
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<App />} />
            {/* Routes protégées avec vérification de maintenance */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <Dashboard />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/chef-dashboard"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <ChefDashboard />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/employee-dashboard"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <EmployeeDashboard />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <ProjectList />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/addproject"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <AddProject />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/simple-leave"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <SimpleLeaveRequest />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/final-leave"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <FinalLeaveRequest />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/employee-projects"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <EmployeeProjects />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/employee-project/:projectId"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <EmployeeProjectDetail />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/test-upload"
              element={
                <MaintenanceCheck>
                  <TestFileUpload />
                </MaintenanceCheck>
              }
            />
            <Route
              path="/chef-tasks"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <ChefTaskManagement />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/mes-taches"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <EmployeeTaskPage />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
            <Route
              path="/chef-task/:taskId"
              element={
                <PrivateRoute>
                  <MaintenanceCheck>
                    <ChefTaskDetail />
                  </MaintenanceCheck>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </LocalizationProvider>
  </ThemeProvider>
);
