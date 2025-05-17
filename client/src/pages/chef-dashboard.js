// src/pages/chef-dashboard.js
import React, { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  CssBaseline,
  Drawer,
  Box,
  Typography,
  Container,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List as MuiList,
  AppBar,
  Toolbar,
  Stack,
  Divider,
  Tooltip,
  useMediaQuery,
  Fade,
} from "@mui/material";
import {
  PeopleAlt,
  WorkOutline,
  AdminPanelSettings,
  AssessmentOutlined,
  Notifications,
  FormatListBulleted,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  Home,
  EventAvailable,
  CalendarViewMonth,
  Logout,
  Menu,
  LightMode,
  DarkMode,
  BarChart,
  Forum,
  Chat,
  TaskAlt,
  Person,
  Business,
  BeachAccess
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import ChefEmployeeList from "./ChefEmployeeList";
import Evaluation from "./Evaluation";
import EvaluationResults from "./EvaluationResults";
import ChefProjectPage from "./ChefProjectPage";
import ChefAttendance from "./ChefAttendance";
import ChefAttendanceCalendar from "./ChefAttendanceCalendar";

import ChefLeaveManagement from "./ChefLeaveManagement"; // Nouveau composant de gestion des congés
import DashboardHomeChef from "./DashboardHomeChef"; // DashboardHomeChef est dans le même dossier pages
import ChefTaskManagement from "./ChefTaskManagement"; // Composant de gestion des tâches
import ChefTaskDetail from "./ChefTaskDetail"; // Composant de détail des tâches
import { AuthContext } from "../context/AuthContext";
import { createAppTheme } from "../theme";
import WelcomeBanner from "../components/WelcomeBanner"; // Import de la bannière de bienvenue

const ChefDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [activeView, setActiveView] = useState("dashboardHomeChef");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Handle location state for navigation
  useEffect(() => {
    if (location.state?.activeView) {
      console.log("Navigation state received:", location.state);
      setActiveView(location.state.activeView);

      // If we have a taskId, set it
      if (location.state.activeView === "taskDetail" && location.state.taskId) {
        console.log("Setting task ID from navigation:", location.state.taskId);
        setSelectedTaskId(location.state.taskId);
      }
    }
  }, [location.state]);

  // Debug selected task ID changes
  useEffect(() => {
    console.log("Selected task ID updated:", selectedTaskId);
  }, [selectedTaskId]);
  const [newProjectNotifications, setNewProjectNotifications] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [openAttendanceSubmenu, setOpenAttendanceSubmenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("themeMode") === "dark");

  // Create theme based on dark mode state
  const theme = createAppTheme(darkMode ? "dark" : "light");

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const drawerWidth = 280;

  // Fermer le drawer sur mobile
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/notifications/count");
        if (response.ok) {
          const data = await response.json();
          setNewProjectNotifications(data.newProjectCount);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotificationCount();
    const intervalId = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotificationsList(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
    setOpenDialog(true);
  };

  const handleLogout = () => {
    console.log("Déconnexion effectuée.");
    window.location.href = "/login";
  };

  const handleAttendanceClick = () => setOpenAttendanceSubmenu(!openAttendanceSubmenu);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const handleThemeToggle = () => {
    const newMode = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    localStorage.setItem("themeMode", newMode);
  };

  // Function to generate consistent menu item styles
  const getMenuItemStyles = (isSelected) => ({
    py: 1.2,
    borderRadius: 1,
    mb: 0.5,
    backgroundColor: isSelected ? '#685cfe' : 'transparent',
    color: isSelected ? '#ffffff' : (darkMode ? '#aaaaaa' : '#555555'),
    '&:hover': {
      backgroundColor: '#685cfe',
      color: '#ffffff'
    },
    transition: 'all 0.2s ease'
  });

  // Function to generate consistent icon styles
  const getIconStyles = () => ({
    minWidth: 40,
    color: 'inherit',
    transition: 'all 0.2s ease'
  });

  // Function to generate consistent submenu item styles
  const getSubmenuItemStyles = (isSelected) => ({
    pl: 5,
    py: 1,
    borderRadius: 1,
    mb: 0.5,
    backgroundColor: isSelected ? '#685cfe' : 'transparent',
    color: isSelected ? '#ffffff' : (darkMode ? '#aaaaaa' : '#555555'),
    '&:hover': {
      backgroundColor: '#685cfe',
      color: '#ffffff'
    },
    transition: 'all 0.2s ease'
  });

  // Function to generate consistent text styles
  const getTextStyles = (isSelected) => ({
    fontWeight: isSelected ? 600 : 500
  });

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
          background: darkMode ? "#121212" : "#f8f9fa",
          color: darkMode ? "#e0e0e0" : "#333333",
          borderRight: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          overflow: "hidden",
        },
      }}
    >
      {/* Logo & App Name with Profile */}
      <Box sx={{
        pt: 2,
        pb: 1,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <img
          src="/logo.png"
          alt="GRH Logo"
          style={{
            width: 80,
            marginBottom: 8,
          }}
        />
        <Typography variant="subtitle1" component="div" sx={{
          fontWeight: 700,
          letterSpacing: 0.5,
          color: darkMode ? 'white' : '#333',
          mb: 1
        }}>
          HRMS
        </Typography>

        {/* Compact Profile */}
        <Box sx={{
          width: '100%',
          mt: 1,
          py: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 2,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        }}>
          <Avatar
            src={user?.photo ? `/${user.photo.split(/(\\|\/)/g).pop()}` : undefined}
            sx={{
              width: 38,
              height: 38,
              bgcolor: darkMode ? '#1976d2' : '#1976d2',
            }}
          >
            {!user?.photo && (user ? `${user.firstName[0]}${user.lastName[0]}` : "CD")}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight="600" sx={{
              color: darkMode ? 'white' : '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user ? `${user.firstName} ${user.lastName}` : "Chef Dupont"}
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Person fontSize="small" style={{ fontSize: '0.7rem', marginRight: '3px' }} />
                {user?.role || "Chef de service"}
              </Typography>
              {user?.department && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Business fontSize="small" style={{ fontSize: '0.7rem', marginRight: '3px' }} />
                  {user.department}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <List sx={{
        px: 2,
        py: 2,
        height: 'calc(100vh - 220px)',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '0px',
          background: 'transparent'
        }
      }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("dashboardHomeChef")}
            selected={activeView === "dashboardHomeChef"}
            sx={getMenuItemStyles(activeView === "dashboardHomeChef")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "dashboardHomeChef")}>
              <Home />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={getTextStyles(activeView === "dashboardHomeChef")}
            />
          </ListItemButton>
        </ListItem>



        {/* Employés */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("employeeList")}
            selected={activeView === "employeeList"}
            sx={getMenuItemStyles(activeView === "employeeList")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "employeeList")}>
              <PeopleAlt />
            </ListItemIcon>
            <ListItemText
              primary="Mes Employés"
              primaryTypographyProps={getTextStyles(activeView === "employeeList")}
            />
          </ListItemButton>
        </ListItem>

        {/* Évaluation */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("evaluation")}
            selected={activeView === "evaluation"}
            sx={getMenuItemStyles(activeView === "evaluation")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "evaluation")}>
              <AssessmentOutlined />
            </ListItemIcon>
            <ListItemText
              primary="Évaluation"
              primaryTypographyProps={getTextStyles(activeView === "evaluation")}
            />
          </ListItemButton>
        </ListItem>

        {/* Résultats d'évaluations */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("evaluationResults")}
            selected={activeView === "evaluationResults"}
            sx={getMenuItemStyles(activeView === "evaluationResults")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "evaluationResults")}>
              <BarChart />
            </ListItemIcon>
            <ListItemText
              primary="Résultats d'évaluations"
              primaryTypographyProps={getTextStyles(activeView === "evaluationResults")}
            />
          </ListItemButton>
        </ListItem>

        {/* Projets */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("projectList")}
            selected={activeView === "projectList"}
            sx={getMenuItemStyles(activeView === "projectList")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "projectList")}>
              <WorkOutline />
            </ListItemIcon>
            <ListItemText
              primary="Mes Projets"
              primaryTypographyProps={getTextStyles(activeView === "projectList")}
            />
          </ListItemButton>
        </ListItem>

        {/* Gestion des tâches */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("taskManagement")}
            selected={activeView === "taskManagement"}
            sx={getMenuItemStyles(activeView === "taskManagement")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "taskManagement")}>
              <TaskAlt />
            </ListItemIcon>
            <ListItemText
              primary="Gestion des tâches"
              primaryTypographyProps={getTextStyles(activeView === "taskManagement")}
            />
          </ListItemButton>
        </ListItem>



        {/* Présence avec sous-menu */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleAttendanceClick}
            selected={["attendance", "attendanceCalendar"].includes(activeView)}
            sx={getMenuItemStyles(["attendance", "attendanceCalendar"].includes(activeView))}
          >
            <ListItemIcon sx={getIconStyles(["attendance", "attendanceCalendar"].includes(activeView))}>
              <EventAvailable />
            </ListItemIcon>
            <ListItemText
              primary="Présence"
              primaryTypographyProps={getTextStyles(["attendance", "attendanceCalendar"].includes(activeView))}
            />
            {openAttendanceSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openAttendanceSubmenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("attendance")}
                selected={activeView === "attendance"}
                sx={getSubmenuItemStyles(activeView === "attendance")}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'all 0.2s ease' }}>
                  <FormatListBulleted fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste de présences"
                  primaryTypographyProps={{
                    fontWeight: activeView === "attendance" ? 600 : 500,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("attendanceCalendar")}
                selected={activeView === "attendanceCalendar"}
                sx={getSubmenuItemStyles(activeView === "attendanceCalendar")}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'all 0.2s ease' }}>
                  <CalendarViewMonth fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Calendrier de présence"
                  primaryTypographyProps={{
                    fontWeight: activeView === "attendanceCalendar" ? 600 : 500,
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Congés */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("leaveManagement")}
            selected={activeView === "leaveManagement"}
            sx={getMenuItemStyles(activeView === "leaveManagement")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "leaveManagement")}>
              <BeachAccess />
            </ListItemIcon>
            <ListItemText
              primary="Gestion des Congés"
              primaryTypographyProps={getTextStyles(activeView === "leaveManagement")}
            />
          </ListItemButton>
        </ListItem>




      </List>

      {/* Bouton de déconnexion */}
      <Box sx={{ mt: "auto", p: 3 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogout}
          startIcon={<Logout />}
          sx={{
            py: 1.2,
            backgroundColor: 'transparent',
            color: darkMode ? "#aaaaaa" : "#555555",
            "&:hover": {
              backgroundColor: "#685cfe",
              color: "#ffffff"
            },
            transition: 'all 0.2s ease',
            borderRadius: 1
          }}
        >
          Déconnexion
        </Button>
      </Box>
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
            background: theme.palette.background.default,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* AppBar */}
          <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {isMobile && (
                  <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
                    <Menu />
                  </IconButton>
                )}
                <Typography variant="h5" fontWeight="600" color="primary.main">
                  {activeView === "dashboardHomeChef" && "Espace de Travail Delice"}
                  {activeView === "employeeList" && "Mes Employés"}
                  {activeView === "projectList" && "Mes Projets"}
                  {activeView === "evaluation" && "Évaluation"}
                  {activeView === "attendance" && "Liste de Présences"}
                  {activeView === "attendanceCalendar" && "Calendrier de Présence"}
                  {activeView === "leaveManagement" && "Gestion des Congés"}
                  {activeView === "taskManagement" && "Gestion des Tâches"}
                  {activeView === "taskDetail" && "Détail de la Tâche"}
                  {!activeView && "Espace de Travail Delice"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Tooltip title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"} arrow>
                  <IconButton
                    onClick={handleThemeToggle}
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
              </Stack>
            </Toolbar>
          </AppBar>

          {/* Contenu principal */}
          <Container
            maxWidth="xl"
            sx={{ p: { xs: 2, md: 4 }, flexGrow: 1, position: "relative", zIndex: 1 }}
          >
            <Fade in timeout={800}>
              <Box>
                {activeView === "dashboardHomeChef" && <DashboardHomeChef />}
                {activeView === "employeeList" && <ChefEmployeeList />}
                {activeView === "projectList" && <ChefProjectPage />}
                {activeView === "evaluation" && <Evaluation />}
                {activeView === "evaluationResults" && <EvaluationResults />}
                {activeView === "attendance" && <ChefAttendance />}
                {activeView === "attendanceCalendar" && <ChefAttendanceCalendar />}
                {activeView === "leaveManagement" && <ChefLeaveManagement />}

                {activeView === "taskManagement" && <ChefTaskManagement />}
                {activeView === "taskDetail" && selectedTaskId && <ChefTaskDetail taskId={selectedTaskId} />}
                {!activeView && (
                  <Box
                    sx={{
                      p: 4,
                      background: theme.palette.background.paper,
                      borderRadius: 3,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      minHeight: "60vh",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h6" color="textSecondary">
                      Sélectionnez une option dans la barre latérale
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          </Container>

          {/* Élément décoratif arrière-plan */}
          <Box
            sx={{
              position: "fixed",
              top: "-15%",
              right: "-10%",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: darkMode
                ? `linear-gradient(135deg, ${theme.palette.primary.dark}22, ${theme.palette.secondary.dark}22)`
                : `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
              filter: "blur(60px)",
              zIndex: 0,
            }}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ChefDashboard;
