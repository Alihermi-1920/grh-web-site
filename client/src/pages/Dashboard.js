// src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from "react";
import axios from 'axios'; // Import axios
import AddDepartment from "./AddDepartment";
import AddEmployee from "./AddEmployee";
import Attendance from "./Attendance";
import EmployeeListPage from "./EmployeeList";
import EvaluationManager from "./EvaluationManager";
import EvaluationResults from "./EvaluationResults";
import DashboardHome from "./DashboardHome";
import LeaveApproval from "./LeaveApproval";
import AttendanceCalendar from "./AttendanceCalendar";
import AdminSidebar from "../components/AdminSidebar";
import { AuthContext } from "../context/AuthContext";
// import MonthlyRecruitmentChart from "../components/MonthlyRecruitmentChart";

import {
  LightMode,
  DarkMode
} from "@mui/icons-material";

import {
  Box,
  CssBaseline,
  Button,
  Stack,
  Container,
  ThemeProvider,
  Collapse,
  Divider,
  AppBar,
  Toolbar,
  Badge,
  Tooltip,
  useMediaQuery,
  IconButton,
  Fade,
  Menu as MuiMenu,
  MenuItem,
  Zoom,
  alpha
} from "@mui/material";
import { motion } from "framer-motion";
import { createAppTheme } from "../theme";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("dashboardHome");
  const [openEmployeeSubmenu, setOpenEmployeeSubmenu] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("themeMode") === "dark");
  const { logout } = useContext(AuthContext);

  // Create theme based on dark mode state
  const theme = createAppTheme(darkMode ? "dark" : "light");

  // Chargement des départements
  useEffect(() => {
    axios.get("http://localhost:5000/api/departments")
      .then(res => {
        // Extraire les noms des départements
        const departmentNames = res.data.map(dept => dept.name);
        console.log("Départements chargés:", departmentNames);
        setDepartments(departmentNames);
      })
      .catch(err => console.error("Erreur récupération départements:", err));
  }, []); // Load only once when component mounts

  // Chargement des employés
  useEffect(() => {
    axios.get("http://localhost:5000/api/employees")
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Erreur récupération employés :", err));
  }, []);


  // Comptages simples
  const employeeCount = employees.length;
  const departmentCount = departments.length;

  // Calculer la distribution des employés par département
  const departmentLabels = departments; // Utiliser les noms des départements comme étiquettes
  const departmentDistribution = departments.map(dep =>
    employees.filter(e => e.department && e.department.toLowerCase() === dep.toLowerCase()).length
  );

  // 1. Labels des mois
  const monthLabels = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];

  // 2. Nombre de recrutements par mois
  const recruitmentData = monthLabels.map((_, monthIndex) =>
    employees.filter(e => {
      const d = new Date(e.hireDate);
      return d.getMonth() === monthIndex;
    }).length
  );

  const toggleDarkMode = () => {
    const newMode = !darkMode ? "dark" : "light";
    setDarkMode(!darkMode);
    localStorage.setItem("themeMode", newMode);
  };
  const handleLogout = () => { 
    console.log("Déconnexion"); 
    logout(); // Utilise la fonction logout du AuthContext
    window.location.href = "/login"; 
  };
  const handleEmployeeClick = () => setOpenEmployeeSubmenu(!openEmployeeSubmenu);





  // Animation variants for page transitions
  const pageTransitionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const drawerWidth = 280;

  // We'll use the separate AdminSidebar component instead of defining it here

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          openEmployeeSubmenu={openEmployeeSubmenu}
          setOpenEmployeeSubmenu={setOpenEmployeeSubmenu}
          darkMode={darkMode}
          handleLogout={handleLogout}
          drawerWidth={drawerWidth}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            backgroundColor: theme.palette.background.default,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header AppBar */}
          <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
              backgroundColor: darkMode ? "#1a1a1a" : "#ffffff",
              borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
            }}
          >
            <Toolbar>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title={darkMode ? "Mode clair" : "Mode sombre"}>
                <IconButton onClick={toggleDarkMode} color="inherit">
                  {darkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>

          {/* Main content area */}
          <Box
            component={motion.div}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            sx={{ p: 3, minHeight: "calc(100vh - 64px)" }}
          >
            {/* Render the active view */}
            {activeView === "dashboardHome" && (
              <DashboardHome
                employeeCount={employeeCount}
                departmentCount={departmentCount}
                departmentLabels={departmentLabels}
                departmentDistribution={departmentDistribution}
                monthLabels={monthLabels}
                recruitmentData={recruitmentData}
              />
            )}
            {activeView === "addDepartment" && <AddDepartment />}
            {activeView === "addEmployee" && <AddEmployee departments={departments} />}
            {activeView === "employeeList" && <EmployeeListPage />}
            {activeView === "attendance" && <Attendance />}
            {activeView === "evaluationManager" && <EvaluationManager />}
            {activeView === "evaluationResults" && <EvaluationResults />}
            {activeView === "leaveApproval" && <LeaveApproval />}
            {activeView === "attendanceCalendar" && <AttendanceCalendar />}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;