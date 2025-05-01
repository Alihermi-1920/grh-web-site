// src/pages/EmployeeDashboard.js
import React, { useState, useContext, useEffect } from "react";
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
  People,
  AdminPanelSettings,
  EventNote,
  WorkOutline,
  LightMode,
  DarkMode,
  ExitToApp,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Forum,
  Chat,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import EmployeeTaskChat from "./EmployeeTaskChat"; // Composant pour la communication des tâches
import EmployeeMessaging from "./EmployeeMessaging"; // Composant pour la messagerie
import EmployeeProjectDashboard from "./EmployeeProjectDashboard"; // Import du tableau de bord des projets
import EmployeeLeaveRequest from "./EmployeeLeaveRequest"; // Ancien composant de demande de congé
import FinalLeaveRequest from "./FinalLeaveRequest"; // Nouveau composant de demande de congé amélioré
import { AuthContext } from "../context/AuthContext";
import { createAppTheme } from "../theme";
import WelcomeBanner from "../components/WelcomeBanner"; // Import de la bannière de bienvenue

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("dashboard");
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
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transform: 'translateX(5px)'
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(25, 118, 210, 0.25)',
      borderLeft: '4px solid #1976d2',
      paddingLeft: '12px'
    }
  });

  // Function to generate consistent icon styles
  const getIconStyles = (isSelected) => ({
    minWidth: 40,
    color: "inherit",
    transition: 'transform 0.2s ease-in-out',
    transform: isSelected ? 'scale(1.2)' : 'scale(1)'
  });

  // Function to generate consistent text styles
  const getTextStyles = (isSelected) => ({
    fontWeight: isSelected ? 600 : 500,
    transition: 'all 0.2s ease-in-out',
    fontSize: '0.95rem',
    letterSpacing: 0.3
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
          background: darkMode
            ? "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))"
            : "#f8f9fa",
          color: darkMode ? "white" : "#333333",
          borderRight: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          overflow: "hidden",
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
          <Typography variant="h6" component="div" sx={{
            fontWeight: 700,
            letterSpacing: 1,
            color: darkMode ? 'white' : '#333',
          }}>
            HRMS
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <Avatar
          src={user?.photo ? `/${user.photo.split(/(\\|\/)/g).pop()}` : undefined}
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
          {!user?.photo && (user ? `${user.firstName[0]}${user.lastName[0]}` : "ED")}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="600" sx={{
            color: darkMode ? 'white' : '#333',
          }}>
            {user ? `${user.firstName} ${user.lastName}` : "Employé Durand"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              fontWeight: 500,
            }}
          >
            {user?.role || "Employé"}
            {user?.department && ` - ${user.department}`}
          </Typography>
        </Box>
      </Box>

      <List sx={{
        px: 2,
        py: 3,
        height: 'calc(100vh - 280px)',
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
              <DashboardIcon />
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
              <People />
            </ListItemIcon>
            <ListItemText
              primary="Mon Profil"
              primaryTypographyProps={getTextStyles(activeView === "profile")}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("projects")}
            selected={activeView === "projects"}
            sx={getMenuItemStyles(activeView === "projects")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "projects")}>
              <WorkOutline />
            </ListItemIcon>
            <ListItemText
              primary="Mes Projets"
              primaryTypographyProps={getTextStyles(activeView === "projects")}
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
              <EventNote />
            </ListItemIcon>
            <ListItemText
              primary="Mes Congés"
              primaryTypographyProps={getTextStyles(activeView === "leaves")}
            />
          </ListItemButton>
        </ListItem>





        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("taskChat")}
            selected={activeView === "taskChat"}
            sx={getMenuItemStyles(activeView === "taskChat")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "taskChat")}>
              <Forum />
            </ListItemIcon>
            <ListItemText
              primary="Mes Tâches"
              primaryTypographyProps={getTextStyles(activeView === "taskChat")}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("messaging")}
            selected={activeView === "messaging"}
            sx={getMenuItemStyles(activeView === "messaging")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "messaging")}>
              <Chat />
            </ListItemIcon>
            <ListItemText
              primary="Messagerie"
              primaryTypographyProps={getTextStyles(activeView === "messaging")}
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
          startIcon={<ExitToApp />}
          sx={{
            py: 1.2,
            backgroundColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            color: darkMode ? "white" : "rgba(0,0,0,0.87)",
            "&:hover": { backgroundColor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)" },
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
                    <MenuIcon />
                  </IconButton>
                )}
                <Typography variant="h5" fontWeight="600" color="primary.main">
                  {activeView === "dashboard" && "Tableau de Bord Employé"}
                  {activeView === "profile" && "Mon Profil"}
                  {activeView === "projects" && "Mes Projets"}
                  {activeView === "leaves" && "Mes Congés"}
                  {activeView === "taskChat" && "Mes Tâches"}
                  {activeView === "messaging" && "Messagerie"}
                  {!activeView && "Tableau de Bord Employé"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                {!isMobile && (
                  <Tooltip title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"} arrow>
                    <IconButton
                      onClick={handleThemeToggle}
                      sx={{
                        bgcolor: "rgba(0,0,0,0.05)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
                      }}
                    >
                      {darkMode ? <LightMode /> : <DarkMode />}
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={user ? `${user.firstName} ${user.lastName}` : "Employé Durand"} arrow>
                  <Avatar
                    src={user?.photo ? `/${user.photo.split(/(\\|\/)/g).pop()}` : undefined}
                    sx={{
                      bgcolor: theme.palette.primary.light,
                      width: 40,
                      height: 40,
                      fontSize: 16,
                      border: `2px solid ${darkMode ? "#333333" : "#e0e0e0"}`,
                      cursor: "pointer",
                    }}
                  >
                    {user ? `${user.firstName[0]}${user.lastName[0]}` : "ED"}
                  </Avatar>
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
                {activeView === "profile" && <Typography variant="h6">Mon Profil (Vue Employé)</Typography>}
                {activeView === "projects" && <EmployeeProjectDashboard />}
                {activeView === "leaves" && <FinalLeaveRequest />}
                {activeView === "taskChat" && <EmployeeTaskChat />}
                {activeView === "messaging" && <EmployeeMessaging />}
                {(activeView === "dashboard" || !activeView) && (
                  <Box>
                    {/* Bannière de bienvenue */}
                    <WelcomeBanner />

                    <Box
                      sx={{
                        p: 4,
                        background: theme.palette.background.paper,
                        borderRadius: 3,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        minHeight: "50vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h6" color="textSecondary">
                        Contenu du tableau de bord
                      </Typography>
                    </Box>
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

export default EmployeeDashboard;