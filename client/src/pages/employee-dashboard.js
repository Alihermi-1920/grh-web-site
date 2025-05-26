// src/pages/EmployeeDashboard.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Tooltip,
  useMediaQuery,
  Fade,
} from "@mui/material";
import {
  PeopleAlt,
  AdminPanelSettings,
  BeachAccess,
  WorkOutline,
  LightMode,
  DarkMode,
  Logout,
  Menu as MenuIcon,
  Home,
  Forum,
  Chat,
  TaskAlt,
  Psychology,
  Person,
  Business,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import EmployeeLeaveRequest from "./EmployeeLeaveRequest"; // Ancien composant de demande de congé
import FinalLeaveRequest from "./FinalLeaveRequest"; // Nouveau composant de demande de congé amélioré
import DashboardHomeEmployee from "./DashboardHomeEmployee"; // Nouveau tableau de bord employé
import AmeliorationAI from "./AmeliorationAI"; // Nouveau composant d'amélioration de performance AI
import EmployeeProfile from "./EmployeeProfile"; // Nouveau composant de profil employé
import { AuthContext } from "../context/AuthContext";
import { createAppTheme } from "../theme";
import WelcomeBanner from "../components/WelcomeBanner"; // Import de la bannière de bienvenue

const EmployeeDashboard = ({ initialView }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { projectId } = useParams();

  // Set initial view based on props, URL params, or location state
  const getInitialView = () => {
    if (initialView) return initialView;
    if (location.state?.activeView) return location.state.activeView;
    return "dashboard";
  };

  const [activeView, setActiveView] = useState(getInitialView());

  // Update active view when location state changes
  useEffect(() => {
    if (location.state?.activeView) {
      setActiveView(location.state.activeView);
    }
  }, [location.state]);
  // Solde de congés initial (exemple : 15 jours)
  const [leaveBalance, setLeaveBalance] = useState(15);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("themeMode") === "dark");
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Create theme based on dark mode state
  const theme = createAppTheme(darkMode ? "dark" : "light");

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const drawerWidth = 280;

  // Fermer le drawer sur mobile
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Toggle dark mode
  const handleThemeToggle = () => {
    const newMode = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    localStorage.setItem("themeMode", newMode);
  };

  const handleLogout = () => {
    console.log("Déconnexion effectuée.");
    window.location.href = "/login";
  };

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const handleLeaveSubmit = (days, requestData) => {
    setLeaveBalance(leaveBalance - days);
    console.log("Demande enregistrée :", requestData);
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
            {!user?.photo && (user ? `${user.firstName[0]}${user.lastName[0]}` : "ED")}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight="600" sx={{
              color: darkMode ? 'white' : '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user ? `${user.firstName} ${user.lastName}` : "Employé Durand"}
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
                {user?.role || "Employé"}
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
            onClick={() => setActiveView("dashboard")}
            selected={activeView === "dashboard"}
            sx={getMenuItemStyles(activeView === "dashboard")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "dashboard")}>
              <Home />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={getTextStyles(activeView === "dashboard")}
            />
          </ListItemButton>
        </ListItem>



        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("profile")}
            selected={activeView === "profile"}
            sx={getMenuItemStyles(activeView === "profile")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "profile")}>
              <PeopleAlt />
            </ListItemIcon>
            <ListItemText
              primary="Mon Profil"
              primaryTypographyProps={getTextStyles(activeView === "profile")}
            />
          </ListItemButton>
        </ListItem>




        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("leaves")}
            selected={activeView === "leaves"}
            sx={getMenuItemStyles(activeView === "leaves")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "leaves")}>
              <BeachAccess />
            </ListItemIcon>
            <ListItemText
              primary="Mes Congés"
              primaryTypographyProps={getTextStyles(activeView === "leaves")}
            />
          </ListItemButton>
        </ListItem>








        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("performanceAI")}
            selected={activeView === "performanceAI"}
            sx={getMenuItemStyles(activeView === "performanceAI")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "performanceAI")}>
              <Psychology />
            </ListItemIcon>
            <ListItemText
              primary="Amélioration AI"
              primaryTypographyProps={getTextStyles(activeView === "performanceAI")}
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
                    <MenuIcon />
                  </IconButton>
                )}
                <Typography variant="h5" fontWeight="600" color="primary.main">
                  {activeView === "dashboard" && "Espace de Travail Delice"}
                  {activeView === "profile" && "Mon Profil"}
                  {activeView === "leaves" && "Mes Congés"}
                  {activeView === "performanceAI" && "Amélioration de Performance AI"}
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
                {activeView === "profile" && <EmployeeProfile />}
                {activeView === "leaves" && <FinalLeaveRequest />}

                {activeView === "performanceAI" && <AmeliorationAI />}
                {(activeView === "dashboard" || !activeView) && (
                  <DashboardHomeEmployee setActiveView={setActiveView} />
                )}
              </Box>
            </Fade>
          </Container>


        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default EmployeeDashboard;