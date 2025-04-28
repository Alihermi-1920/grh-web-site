// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import AddDepartment from "./AddDepartment";
import AddEmployee from "./AddEmployee";
import Attendance from "./Attendance";
import EmployeeListPage from "./EmployeeList";
import ProjectPage from "./ProjectPage";
import ProjectListPage from "./ProjectListPage";
import EvaluationManager from "./EvaluationManager";
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
  Menu,
  NotificationsNone,
  LightMode,
  DarkMode,
  Search,
  Settings,
  Help
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
  TextField,
  InputAdornment,
  Menu as MuiMenu,
  MenuItem,
  Zoom,
  alpha,
  Paper,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("dashboardHome");
  const [openEmployeeSubmenu, setOpenEmployeeSubmenu] = useState(false);
  const [openProjectSubmenu, setOpenProjectSubmenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [notifications] = useState(3);
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  // Enhanced theme with more sophisticated palette and component styles
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: "#6200ea",
        light: "#9e47ff",
        dark: "#0a00b6",
        contrastText: "#ffffff"
      },
      secondary: {
        main: "#03dac6",
        light: "#66fff8",
        dark: "#00a896",
        contrastText: "#000000"
      },
      error: {
        main: "#CF6679",
        light: "#ff95a2",
        dark: "#9b374d",
      },
      warning: {
        main: "#ffd600",
        light: "#ffff52",
        dark: "#c7a500",
      },
      info: {
        main: "#2196f3",
        light: "#6ec6ff",
        dark: "#0069c0",
      },
      success: {
        main: "#00c853",
        light: "#5efc82",
        dark: "#009624",
      },
      background: {
        default: darkMode ? "#121212" : "#f8f9fa",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
        elevated: darkMode ? "#2d2d2d" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#333333",
        secondary: darkMode ? "#b0b0b0" : "#666666",
        disabled: darkMode ? "#6e6e6e" : "#9e9e9e",
      },
      action: {
        active: darkMode ? "#ffffff" : "#6200ea",
        hover: darkMode ? "rgba(255,255,255,0.1)" : "rgba(98,0,234,0.08)",
        selected: darkMode ? "rgba(255,255,255,0.16)" : "rgba(98,0,234,0.16)",
      },
      divider: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, letterSpacing: "-1.5px" },
      h2: { fontWeight: 700, letterSpacing: "-1px" },
      h3: { fontWeight: 700, letterSpacing: "-0.5px" },
      h4: { fontWeight: 700, letterSpacing: "-0.5px" },
      h5: { fontWeight: 600, letterSpacing: "-0.3px" },
      h6: { fontWeight: 600, letterSpacing: "-0.2px" },
      subtitle1: { fontWeight: 500, letterSpacing: "0px" },
      subtitle2: { fontWeight: 500, letterSpacing: "0px" },
      body1: { fontWeight: 400, letterSpacing: "0px" },
      body2: { fontWeight: 400, letterSpacing: "0px" },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.2px" },
      caption: { fontWeight: 400, letterSpacing: "0.2px" },
      overline: { fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" },
    },
    shape: { borderRadius: 16 },
    shadows: [
      "none",
      darkMode ? "0 2px 4px 0 rgba(0,0,0,0.4)" : "0 2px 4px 0 rgba(0,0,0,0.05)",
      darkMode ? "0 4px 8px 0 rgba(0,0,0,0.4)" : "0 4px 8px 0 rgba(0,0,0,0.1)",
      darkMode ? "0 6px 12px 0 rgba(0,0,0,0.4)" : "0 6px 12px 0 rgba(0,0,0,0.1)",
      darkMode ? "0 8px 16px 0 rgba(0,0,0,0.4)" : "0 8px 16px 0 rgba(0,0,0,0.1)",
      // ... rest of shadows similar to Material UI default with adjustments for dark mode
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: "8px 16px",
            boxShadow: darkMode
              ? "0 4px 14px 0 rgba(98, 0, 234, 0.3)"
              : "0 4px 14px 0 rgba(98, 0, 234, 0.15)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: darkMode
                ? "0 6px 20px 0 rgba(98, 0, 234, 0.4)"
                : "0 6px 20px 0 rgba(98, 0, 234, 0.25)",
            }
          },
          contained: {
            "&.Mui-disabled": {
              backgroundColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
              color: darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            }
          },
          outlined: {
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
            }
          },
          containedPrimary: {
            background: `linear-gradient(45deg, ${darkMode ? "#4a00e0" : "#6200ea"} 0%, ${darkMode ? "#7c1eff" : "#9e47ff"} 100%)`,
            "&:hover": {
              background: `linear-gradient(45deg, ${darkMode ? "#5000f3" : "#7517ff"} 0%, ${darkMode ? "#8a3aff" : "#aa66ff"} 100%)`,
            }
          },
          containedSecondary: {
            background: `linear-gradient(45deg, ${darkMode ? "#00bba9" : "#03dac6"} 0%, ${darkMode ? "#00ecd5" : "#66fff8"} 100%)`,
            color: "#000000",
            "&:hover": {
              background: `linear-gradient(45deg, ${darkMode ? "#00d2be" : "#00f0da"} 0%, ${darkMode ? "#1afff0" : "#80fffa"} 100%)`,
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: darkMode
              ? "0 8px 32px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 8px 32px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: darkMode
                ? "0 12px 48px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)"
                : "0 12px 48px 0 rgba(98,0,234,0.12), 0 0 0 1px rgba(0,0,0,0.02)",
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          elevation1: {
            boxShadow: darkMode
              ? "0 2px 8px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 2px 8px 0 rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.01)",
          },
          elevation2: {
            boxShadow: darkMode
              ? "0 4px 16px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 4px 16px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.01)",
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: "4px 0",
            padding: "10px 16px",
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(98, 0, 234, 0.12)",
              "&:hover": {
                backgroundColor: darkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(98, 0, 234, 0.18)",
              }
            },
            "&:hover": {
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(98, 0, 234, 0.06)",
              transform: "translateX(4px)",
            }
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 44,
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: darkMode
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.05)",
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            transition: "width 0.3s ease-in-out"
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            "&.Mui-focused": {
              boxShadow: darkMode
                ? `0 0 0 2px ${alpha('#6200ea', 0.4)}`
                : `0 0 0 2px ${alpha('#6200ea', 0.2)}`
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: '#6200ea',
              borderWidth: 2,
            }
          },
          notchedOutline: {
            transition: "border-color 0.3s ease",
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            "&:hover": {
              transform: "scale(1.1)",
              boxShadow: darkMode
                ? "0 4px 12px rgba(0,0,0,0.4)"
                : "0 4px 12px rgba(98,0,234,0.3)",
            }
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: darkMode
              ? "0 8px 32px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 8px 32px 0 rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)",
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            padding: "8px 12px",
            backgroundColor: darkMode ? "rgba(255,255,255,0.9)" : "rgba(33,33,33,0.9)",
            color: darkMode ? "rgba(0,0,0,0.87)" : "rgba(255,255,255,0.87)",
            fontSize: 12,
            fontWeight: 500,
            boxShadow: darkMode
              ? "0 4px 16px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(0,0,0,0.1)",
          }
        }
      }
    }
  });

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle menu open/close
  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);
  const handleNotificationsOpen = (event) => setNotificationsAnchor(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchor(null);

  // Fermer le drawer sur mobile
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

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

  const handleThemeToggle = () => setDarkMode(!darkMode);
  const handleLogout = () => { console.log("Déconnexion"); window.location.href = "/login"; };
  const handleEmployeeClick = () => setOpenEmployeeSubmenu(!openEmployeeSubmenu);
  const handleProjectClick = () => setOpenProjectSubmenu(!openProjectSubmenu);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    // Implement search functionality here
  };

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
      variant={isMobile ? "temporary" : "permanent"}
      open={drawerOpen}
      onClose={toggleDrawer}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: darkMode
            ? "linear-gradient(165deg, #2a0066 0%, #4a00b6 100%)"
            : "linear-gradient(165deg, #5900d9 0%, #7726ff 100%)",
          color: "white",
          borderRight: "none",
          overflow: "auto",
          transition: "all 0.3s ease",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "3px",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
          }
        },
      }}
    >
      {/* Logo & App Name */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" component="div" sx={{
          fontWeight: 700,
          letterSpacing: 1,
          background: 'linear-gradient(45deg, #ffffff, #e0e0ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AdminPanelSettings sx={{ fontSize: 28 }} /> HRMS
        </Typography>
      </Box>

      {/* Profil */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Stack
          alignItems="center"
          spacing={2}
          sx={{
            p: 4,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            position: 'relative'
          }}
        >
          {/* Background decorative elements */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            opacity: 0.05,
            backgroundImage: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.8) 0%, transparent 70%)`,
            zIndex: 0
          }} />

          <Avatar
            sx={{
              width: 90,
              height: 90,
              bgcolor: "white",
              border: "4px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              }
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 45, color: "primary.main" }} />
          </Avatar>
          <Box sx={{ textAlign: "center", position: 'relative', zIndex: 1 }}>
            <Typography variant="h6" fontWeight="600" sx={{
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              mb: 0.5,
              letterSpacing: 0.5
            }}>
              Admin Dupont
            </Typography>
            <Typography
              variant="caption"
              sx={{
                backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.4))`,
                px: 2,
                py: 0.7,
                borderRadius: 10,
                fontWeight: 500,
                display: "inline-block",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid rgba(255,255,255,0.15)"
              }}
            >
              Super Administrateur
            </Typography>
          </Box>
        </Stack>
      </Box>

      <List
        sx={{ px: 2, py: 3 }}
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
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
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

        {/* Section RH */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              px: 2,
              py: 1,
              display: 'block',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            RESSOURCES HUMAINES
          </Typography>
        </Box>

        {/* Employés */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleEmployeeClick}
            selected={['addEmployee', 'employeeList'].includes(activeView)}
            sx={{
              py: 1.2,
              position: 'relative',
              overflow: 'hidden',
              "&::after": ['addEmployee', 'employeeList'].includes(activeView) ? {
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
                  position: 'relative',
                  "&::before": activeView === "addEmployee" ? {
                    content: '""',
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'white'
                  } : {}
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
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
                  position: 'relative',
                  "&::before": activeView === "employeeList" ? {
                    content: '""',
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'white'
                  } : {}
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
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
              position: 'relative',
              overflow: 'hidden',
              "&::after": activeView === "attendance" ? {
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
              position: 'relative',
              overflow: 'hidden',
              "&::after": activeView === "attendanceCalendar" ? {
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

        {/* Section Département */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              px: 2,
              py: 1,
              display: 'block',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            DÉPARTEMENTS & PROJETS
          </Typography>
        </Box>

        {/* Gestion des départements */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("addDepartment")}
            selected={activeView === "addDepartment"}
            sx={{
              py: 1.2,
              position: 'relative',
              overflow: 'hidden',
              "&::after": activeView === "addDepartment" ? {
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
              position: 'relative',
              overflow: 'hidden',
              "&::after": ['projectPage', 'projectList'].includes(activeView) ? {
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
                  position: 'relative',
                  "&::before": activeView === "projectPage" ? {
                    content: '""',
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'white'
                  } : {}
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
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
                  position: 'relative',
                  "&::before": activeView === "projectList" ? {
                    content: '""',
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'white'
                  } : {}
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
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

        {/* Section Évaluations */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              px: 2,
              py: 1,
              display: 'block',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            GESTION AVANCÉE
          </Typography>
        </Box>

        {/* Évaluations */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("evaluationManager")}
            selected={activeView === "evaluationManager"}
            sx={{
              py: 1.2,
              position: 'relative',
              overflow: 'hidden',
              "&::after": activeView === "evaluationManager" ? {
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
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 2 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.2,
                color: 'rgba(255,255,255,0.8)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
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
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer}
                edge="start"
                sx={{ mr: 2 }}
              >
                <Menu />
              </IconButton>

              {/* Search field */}
              <Fade in={true} timeout={800}>
                <Paper
                  component="form"
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: { xs: 1, md: 0.4 },
                    mx: { xs: 1, md: 2 },
                    borderRadius: 2,
                    backgroundColor: darkMode
                      ? alpha(theme.palette.background.paper, 0.6)
                      : alpha(theme.palette.grey[100], 0.8),
                    border: `1px solid ${theme.palette.divider}`,
                    px: 2,
                    py: 0.5
                  }}
                >
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', ml: -0.5 }} />
                  </InputAdornment>
                  <TextField
                    fullWidth
                    value={searchValue}
                    onChange={handleSearch}
                    placeholder="Rechercher..."
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                  />
                </Paper>
              </Fade>

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
              {activeView === "leaveApproval" && <LeaveApproval employees={employees} />}
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;