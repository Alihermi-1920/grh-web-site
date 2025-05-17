// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import AddDepartment from "./AddDepartment";
import AddEmployee from "./AddEmployee";
import Attendance from "./Attendance";
import EmployeeListPage from "./EmployeeList";
import ProjectPage from "./ProjectPage";
import ProjectListPage from "./ProjectListPage";
import EvaluationManager from "./EvaluationManager";
import EvaluationResults from "./EvaluationResults";
import DashboardHome from "./DashboardHome";
import LeaveApproval from "./LeaveApproval";
import AttendanceCalendar from "./AttendanceCalendar";
import MaintenanceSettings from "./MaintenanceSettings";
import AdminSidebar from "../components/AdminSidebar";
// import MonthlyRecruitmentChart from "../components/MonthlyRecruitmentChart";

import {
  AddBusiness,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  PeopleAlt,
  AdminPanelSettings,
  WorkOutline,
  Quiz,
  Home,
  EventAvailable,
  CalendarViewMonth,
  Logout,
  Business,
  Groups,
  LightMode,
  DarkMode,
  BarChart,
  Build,
  Person,
  BeachAccess,
  TaskAlt,
  FormatListBulleted
} from "@mui/icons-material";

import {
  Box,
  Typography,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
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
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import { createAppTheme } from "../theme";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("dashboardHome");
  const [openEmployeeSubmenu, setOpenEmployeeSubmenu] = useState(false);
  const [openProjectSubmenu, setOpenProjectSubmenu] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("themeMode") === "dark");

  // Create theme based on dark mode state
  const theme = createAppTheme(darkMode ? "dark" : "light");

  // Chargement des départements
  useEffect(() => {
    fetch("http://localhost:5000/api/departments")
      .then(res => res.json())
      .then(data => {
        // Extraire les noms des départements
        const departmentNames = data.map(dept => dept.name);
        console.log("Départements chargés:", departmentNames);
        setDepartments(departmentNames);
      })
      .catch(err => console.error("Erreur récupération départements:", err));
  }, []); // Load only once when component mounts

  // Chargement des employés
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error("Erreur récupération employés :", err));
  }, []);

  // Chargement des projets
  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Erreur récupération projets :", err));
  }, []);

  // Comptages simples
  const employeeCount = employees.length;
  const projectCount = projects.length;
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

  const handleThemeToggle = () => {
    const newMode = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    localStorage.setItem("themeMode", newMode);
  };
  const handleLogout = () => { console.log("Déconnexion"); window.location.href = "/login"; };
  const handleEmployeeClick = () => setOpenEmployeeSubmenu(!openEmployeeSubmenu);
  const handleProjectClick = () => setOpenProjectSubmenu(!openProjectSubmenu);





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
          openProjectSubmenu={openProjectSubmenu}
          setOpenProjectSubmenu={setOpenProjectSubmenu}
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
              backdropFilter: "blur(20px)",
              backgroundColor: darkMode
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.9),
              borderBottom: `1px solid ${theme.palette.divider}`,
              zIndex: (theme) => theme.zIndex.drawer - 1,
            }}
          >
            <Toolbar>


              <Box sx={{ flexGrow: 1 }} />

              {/* Right side icons - Only dark mode toggle */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <Tooltip title={darkMode ? "Mode clair" : "Mode sombre"} arrow>
                    <IconButton
                      onClick={handleThemeToggle}
                      color="inherit"
                      sx={{
                        bgcolor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        "&:hover": {
                          bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      {darkMode ? <LightMode /> : <DarkMode />}
                    </IconButton>
                  </Tooltip>
                </Zoom>
              </Stack>
            </Toolbar>
          </AppBar>

          {/* Main Content Area */}
          <Container
            maxWidth="xl"
            sx={{
              py: 4,
              px: { xs: 2, sm: 3, md: 4 },
              minHeight: 'calc(100vh - 64px)',
              transition: 'all 0.3s ease'
            }}
          >
            <Box
              component={motion.div}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              sx={{ height: '100%' }}
            >
              {activeView === "dashboardHome" && (
                <DashboardHome
                  employeeCount={employeeCount}
                  projectCount={projectCount}
                  departmentCount={departmentCount}
                  departmentLabels={departmentLabels}
                  departmentDistribution={departmentDistribution}
                  monthLabels={monthLabels}
                  recruitmentData={recruitmentData}
                  darkMode={darkMode}
                />
              )}
              {activeView === "addDepartment" && <AddDepartment />}
              {activeView === "addEmployee" && <AddEmployee departments={departments} />}
              {activeView === "attendance" && <Attendance employees={employees} />}
              {activeView === "attendanceCalendar" && <AttendanceCalendar employees={employees} />}
              {activeView === "employeeList" && <EmployeeListPage employees={employees} />}
              {activeView === "projectPage" && <ProjectPage departments={departments} employees={employees} />}
              {activeView === "projectList" && <ProjectListPage projects={projects} employees={employees} />}
              {activeView === "evaluationManager" && <EvaluationManager employees={employees} />}
              {activeView === "evaluationResults" && <EvaluationResults />}
              {activeView === "leaveApproval" && <LeaveApproval employees={employees} />}
              {activeView === "maintenanceSettings" && <MaintenanceSettings />}
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;