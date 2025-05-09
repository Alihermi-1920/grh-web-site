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
// import MonthlyRecruitmentChart from "../components/MonthlyRecruitmentChart";

import {
  AddBusiness,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  People,
  AdminPanelSettings,
  Assignment,
  Quiz,
  Dashboard as DashboardIcon,
  EventNote,
  CalendarMonth,
  ExitToApp,
  Business,
  Groups,
  NotificationsNone,
  LightMode,
  DarkMode,
  Settings,
  Help,
  Assessment
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
  const [notifications] = useState(3);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("themeMode") === "dark");
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  // Create theme based on dark mode state
  const theme = createAppTheme(darkMode ? "dark" : "light");



  // Handle menu open/close
  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);
  const handleNotificationsOpen = (event) => setNotificationsAnchor(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchor(null);



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
  }, [activeView]); // Recharger quand on change de vue pour avoir les derniers départements

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

  // Sample notification items
  const notificationItems = [
    {
      id: 1,
      title: "Nouvelle demande de congé",
      content: "Julie Martin a demandé 5 jours de congé",
      time: "Il y a 30 min"
    },
    {
      id: 2,
      title: "Retard enregistré",
      content: "Thomas Dupont est arrivé avec 45 minutes de retard",
      time: "Il y a 2 heures"
    },
    {
      id: 3,
      title: "Projet mis à jour",
      content: "Le projet 'Refonte CRM' a été mis à jour",
      time: "Hier, 15:42"
    }
  ];

  const Sidebar = () => (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: darkMode ? "#121212" : "#f8f9fa",
          color: darkMode ? "#e0e0e0" : "#333333",
          borderRight: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          overflow: "hidden",
          transition: "all 0.3s ease"
        },
      }}
    >
      {/* Logo & App Name */}
      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <img
            src="/logo.png"
            alt="GRH Logo"
            style={{
              width: 100,
              marginBottom: 10,
            }}
          />
          <Typography variant="h5" component="div" sx={{
            fontWeight: 700,
            letterSpacing: 1,
            color: darkMode ? 'white' : '#333',
          }}>
            HRMS
          </Typography>
        </Box>
      </Box>

      {/* Profile - Simplified for the new design */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        sx={{
          p: 3,
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Avatar
          sx={{
            width: 50,
            height: 50,
            bgcolor: darkMode ? '#1976d2' : '#1976d2',
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
            }
          }}
        >
          <AdminPanelSettings sx={{ fontSize: 28, color: "white" }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="600" sx={{
            color: darkMode ? 'white' : '#333',
          }}>
            Admin Dupont
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              fontWeight: 500,
            }}
          >
            Super Administrateur
          </Typography>
        </Box>
      </Box>

      <List
        sx={{
          px: 2,
          py: 3,
          height: 'calc(100vh - 180px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '0px',
            background: 'transparent'
          }
        }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Dashboard */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => setActiveView("dashboardHome")}
            selected={activeView === "dashboardHome"}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: activeView === "dashboardHome" ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: activeView === "dashboardHome" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: activeView === "dashboardHome" ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: activeView === "dashboardHome" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight: activeView === "dashboardHome" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>



        {/* Employés */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleEmployeeClick}
            selected={['addEmployee', 'employeeList'].includes(activeView)}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: ['addEmployee', 'employeeList'].includes(activeView) ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: ['addEmployee', 'employeeList'].includes(activeView) ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: ['addEmployee', 'employeeList'].includes(activeView) ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: ['addEmployee', 'employeeList'].includes(activeView) ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <People />
            </ListItemIcon>
            <ListItemText
              primary="Employés"
              primaryTypographyProps={{
                fontWeight: ['addEmployee', 'employeeList'].includes(activeView) ? 600 : 500
              }}
            />
            {openEmployeeSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openEmployeeSubmenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("addEmployee")}
                selected={activeView === "addEmployee"}
                sx={{
                  pl: 5,
                  py: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  backgroundColor: activeView === "addEmployee" ?
                    (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                    'transparent',
                  color: activeView === "addEmployee" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                  '&:hover': {
                    backgroundColor: activeView === "addEmployee" ?
                      (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                      (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: activeView === "addEmployee" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
                }}>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Ajouter employé"
                  primaryTypographyProps={{
                    fontWeight: activeView === "addEmployee" ? 600 : 500,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("employeeList")}
                selected={activeView === "employeeList"}
                sx={{
                  pl: 5,
                  py: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  backgroundColor: activeView === "employeeList" ?
                    (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                    'transparent',
                  color: activeView === "employeeList" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                  '&:hover': {
                    backgroundColor: activeView === "employeeList" ?
                      (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                      (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: activeView === "employeeList" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
                }}>
                  <Groups fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste employés"
                  primaryTypographyProps={{
                    fontWeight: activeView === "employeeList" ? 600 : 500,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Présence & Calendrier */}
        <ListItem disablePadding sx={{ mt: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("attendance")}
            selected={activeView === "attendance"}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: activeView === "attendance" ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: activeView === "attendance" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: activeView === "attendance" ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: activeView === "attendance" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <EventNote />
            </ListItemIcon>
            <ListItemText
              primary="Présences"
              primaryTypographyProps={{
                fontWeight: activeView === "attendance" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ mt: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("attendanceCalendar")}
            selected={activeView === "attendanceCalendar"}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: activeView === "attendanceCalendar" ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: activeView === "attendanceCalendar" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: activeView === "attendanceCalendar" ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: activeView === "attendanceCalendar" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <CalendarMonth />
            </ListItemIcon>
            <ListItemText
              primary="Calendrier"
              primaryTypographyProps={{
                fontWeight: activeView === "attendanceCalendar" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>



        {/* Gestion des départements */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("addDepartment")}
            selected={activeView === "addDepartment"}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: activeView === "addDepartment" ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: activeView === "addDepartment" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: activeView === "addDepartment" ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: activeView === "addDepartment" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <AddBusiness />
            </ListItemIcon>
            <ListItemText
              primary="Départements"
              primaryTypographyProps={{
                fontWeight: activeView === "addDepartment" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Projets */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleProjectClick}
            selected={['projectPage', 'projectList'].includes(activeView)}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: ['projectPage', 'projectList'].includes(activeView) ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: ['projectPage', 'projectList'].includes(activeView) ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: ['projectPage', 'projectList'].includes(activeView) ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: ['projectPage', 'projectList'].includes(activeView) ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <Business />
            </ListItemIcon>
            <ListItemText
              primary="Projets"
              primaryTypographyProps={{
                fontWeight: ['projectPage', 'projectList'].includes(activeView) ? 600 : 500
              }}
            />
            {openProjectSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openProjectSubmenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("projectPage")}
                selected={activeView === "projectPage"}
                sx={{
                  pl: 5,
                  py: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  backgroundColor: activeView === "projectPage" ?
                    (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                    'transparent',
                  color: activeView === "projectPage" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                  '&:hover': {
                    backgroundColor: activeView === "projectPage" ?
                      (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                      (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: activeView === "projectPage" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
                }}>
                  <Assignment fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Nouveau projet"
                  primaryTypographyProps={{
                    fontWeight: activeView === "projectPage" ? 600 : 500,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("projectList")}
                selected={activeView === "projectList"}
                sx={{
                  pl: 5,
                  py: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  backgroundColor: activeView === "projectList" ?
                    (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                    'transparent',
                  color: activeView === "projectList" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                  '&:hover': {
                    backgroundColor: activeView === "projectList" ?
                      (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                      (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: activeView === "projectList" ?
                    (darkMode ? 'white' : '#333') :
                    (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
                }}>
                  <Business fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste des projets"
                  primaryTypographyProps={{
                    fontWeight: activeView === "projectList" ? 600 : 500,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>



        {/* Évaluations */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("evaluationManager")}
            selected={activeView === "evaluationManager"}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: activeView === "evaluationManager" ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: activeView === "evaluationManager" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: activeView === "evaluationManager" ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: activeView === "evaluationManager" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <Quiz />
            </ListItemIcon>
            <ListItemText
              primary="Évaluations"
              primaryTypographyProps={{
                fontWeight: activeView === "evaluationManager" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Résultats d'évaluations */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("evaluationResults")}
            selected={activeView === "evaluationResults"}
            sx={{
              py: 1.2,
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: activeView === "evaluationResults" ?
                (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                'transparent',
              color: activeView === "evaluationResults" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              '&:hover': {
                backgroundColor: activeView === "evaluationResults" ?
                  (darkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(200, 200, 200, 0.9)') :
                  (darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)')
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: activeView === "evaluationResults" ?
                (darkMode ? 'white' : '#333') :
                (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')
            }}>
              <Assessment />
            </ListItemIcon>
            <ListItemText
              primary="Résultats d'évaluations"
              primaryTypographyProps={{
                fontWeight: activeView === "evaluationResults" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Approbation des congés */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("leaveApproval")}
            selected={activeView === "leaveApproval"}
            sx={{
              py: 1.2,
              position: 'relative',
              overflow: 'hidden',
              "&::after": activeView === "leaveApproval" ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 4,
                height: '70%',
                borderRadius: '0 4px 4px 0',
                backgroundColor: 'white',
                boxShadow: '0 0 10px rgba(255,255,255,0.7)'
              } : {}
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <EventNote />
            </ListItemIcon>
            <ListItemText
              primary="Congés"
              primaryTypographyProps={{
                fontWeight: activeView === "leaveApproval" ? 600 : 500
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Déconnexion */}
        <Box sx={{ mt: 'auto', pt: 4 }}>
          <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', my: 2 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.2,
                borderRadius: 1,
                mb: 0.5,
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(66, 66, 66, 0.5)' : 'rgba(200, 200, 200, 0.5)',
                  color: darkMode ? 'white' : '#333',
                }
              }}
            >
              <ListItemIcon sx={{
                minWidth: 40,
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
              }}>
                <ExitToApp />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </ListItem>
        </Box>
      </List>
    </Drawer>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
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

              {/* Right side icons */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <Tooltip title={darkMode ? "Mode clair" : "Mode sombre"} arrow>
                    <IconButton onClick={handleThemeToggle} color="inherit">
                      {darkMode ? <LightMode /> : <DarkMode />}
                    </IconButton>
                  </Tooltip>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Tooltip title="Aide" arrow>
                    <IconButton color="inherit">
                      <Help />
                    </IconButton>
                  </Tooltip>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                  <Tooltip title="Paramètres" arrow>
                    <IconButton color="inherit">
                      <Settings />
                    </IconButton>
                  </Tooltip>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                  <Tooltip title="Notifications" arrow>
                    <IconButton
                      color="inherit"
                      onClick={handleNotificationsOpen}
                    >
                      <Badge badgeContent={notifications} color="error">
                        <NotificationsNone />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                </Zoom>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <Zoom in={true} style={{ transitionDelay: '600ms' }}>
                  <Tooltip title="Mon profil" arrow>
                    <IconButton
                      onClick={handleUserMenuOpen}
                      sx={{
                        ml: 1,
                        p: 0.5,
                        border: darkMode
                          ? '2px solid rgba(255,255,255,0.2)'
                          : `2px solid ${theme.palette.primary.main}`,
                        borderRadius: '50%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <Avatar sx={{
                        width: 34,
                        height: 34,
                        bgcolor: theme.palette.primary.main,
                      }}>
                        AD
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                </Zoom>
              </Stack>
            </Toolbar>
          </AppBar>

          {/* User Menu */}
          <MuiMenu
            id="user-menu"
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            TransitionComponent={Fade}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                mt: 1.5,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleUserMenuClose} sx={{ minWidth: 180 }}>
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" />
              </ListItemIcon>
              Mon profil
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Paramètres
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </MuiMenu>

          {/* Notifications Menu */}
          <MuiMenu
            id="notifications-menu"
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            TransitionComponent={Fade}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                mt: 1.5,
                width: 320,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
              <Typography variant="caption" color="text.secondary">
                Vous avez {notifications} nouvelles notifications
              </Typography>
            </Box>
            <Divider />
            {notificationItems.map((item) => (
              <MenuItem
                key={item.id}
                onClick={handleNotificationsClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: '3px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    backgroundColor: darkMode
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, alignSelf: 'flex-end' }}>
                    {item.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <Box sx={{ p: 1.5, textAlign: 'center' }}>
              <Button
                size="small"
                color="primary"
                sx={{ borderRadius: 4, px: 2 }}
              >
                Voir toutes les notifications
              </Button>
            </Box>
          </MuiMenu>

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
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;