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
  People,
  Assignment,
  AdminPanelSettings,
  RateReview,
  Notifications,
  ListAlt,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  EventNote,
  CalendarMonth,
  ExitToApp,
  Menu,
  LightMode,
  DarkMode,
  Assessment,
  Forum,
  Chat,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import ChefEmployeeList from "./ChefEmployeeList";
import Evaluation from "./Evaluation";
import EvaluationResults from "./EvaluationResults";
import ChefProjectPage from "./ChefProjectPage";
import ChefAttendance from "./ChefAttendance";
import ChefAttendanceCalendar from "./ChefAttendanceCalendar";
import ChefMessaging from "./ChefMessaging";
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

      {/* Profil */}
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
          {!user?.photo && (user ? `${user.firstName[0]}${user.lastName[0]}` : "CD")}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="600" sx={{
            color: darkMode ? 'white' : '#333',
          }}>
            {user ? `${user.firstName} ${user.lastName}` : "Chef Dupont"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              fontWeight: 500,
            }}
          >
            {user?.role || "Chef de service"}
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
            onClick={() => setActiveView("dashboardHomeChef")}
            selected={activeView === "dashboardHomeChef"}
            sx={getMenuItemStyles(activeView === "dashboardHomeChef")}
          >
            <ListItemIcon sx={getIconStyles(activeView === "dashboardHomeChef")}>
              <DashboardIcon />
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
              <People />
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
              <RateReview />
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
              <Assessment />
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
              <Assignment />
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
              <AssignmentTurnedIn />
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
              <EventNote />
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
                sx={{
                  pl: 5,
                  py: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateX(5px)'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    borderLeft: '3px solid #1976d2',
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: "inherit",
                  transition: 'transform 0.2s ease-in-out',
                  transform: activeView === "attendance" ? 'scale(1.2)' : 'scale(1)'
                }}>
                  <ListAlt fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste de présences"
                  primaryTypographyProps={{
                    fontWeight: activeView === "attendance" ? 600 : 500,
                    fontSize: 14,
                    transition: 'all 0.2s ease-in-out',
                    letterSpacing: 0.3
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("attendanceCalendar")}
                selected={activeView === "attendanceCalendar"}
                sx={{
                  pl: 5,
                  py: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateX(5px)'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    borderLeft: '3px solid #1976d2',
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: "inherit",
                  transition: 'transform 0.2s ease-in-out',
                  transform: activeView === "attendanceCalendar" ? 'scale(1.2)' : 'scale(1)'
                }}>
                  <CalendarMonth fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Calendrier de présence"
                  primaryTypographyProps={{
                    fontWeight: activeView === "attendanceCalendar" ? 600 : 500,
                    fontSize: 14,
                    transition: 'all 0.2s ease-in-out',
                    letterSpacing: 0.3
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
              <EventNote />
            </ListItemIcon>
            <ListItemText
              primary="Gestion des Congés"
              primaryTypographyProps={getTextStyles(activeView === "leaveManagement")}
            />
          </ListItemButton>
        </ListItem>



        {/* Messagerie */}
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
                    <Menu />
                  </IconButton>
                )}
                <Typography variant="h5" fontWeight="600" color="primary.main">
                  {activeView === "dashboardHomeChef" && "Tableau de Bord Chef"}
                  {activeView === "employeeList" && "Mes Employés"}
                  {activeView === "projectList" && "Mes Projets"}
                  {activeView === "evaluation" && "Évaluation"}
                  {activeView === "attendance" && "Liste de Présences"}
                  {activeView === "attendanceCalendar" && "Calendrier de Présence"}
                  {activeView === "leaveManagement" && "Gestion des Congés"}
                  {activeView === "messaging" && "Messagerie"}
                  {activeView === "taskManagement" && "Gestion des Tâches"}
                  {activeView === "taskDetail" && "Détail de la Tâche"}
                  {!activeView && "Tableau de Bord Chef"}
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
                <Tooltip title={`${newProjectNotifications} notifications`} arrow>
                  <IconButton
                    onClick={handleNotificationClick}
                    size="large"
                    sx={{
                      bgcolor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                      "&:hover": {
                        bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    <Badge badgeContent={newProjectNotifications} color="error">
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title={user ? `${user.firstName} ${user.lastName}` : "Chef Dupont"} arrow>
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
                    {user ? `${user.firstName[0]}${user.lastName[0]}` : "CD"}
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
                {activeView === "dashboardHomeChef" && <DashboardHomeChef />}
                {activeView === "employeeList" && <ChefEmployeeList />}
                {activeView === "projectList" && <ChefProjectPage />}
                {activeView === "evaluation" && <Evaluation />}
                {activeView === "evaluationResults" && <EvaluationResults />}
                {activeView === "attendance" && <ChefAttendance />}
                {activeView === "attendanceCalendar" && <ChefAttendanceCalendar />}
                {activeView === "leaveManagement" && <ChefLeaveManagement />}
                {activeView === "messaging" && <ChefMessaging />}
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

      {/* Dialogue des notifications */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: "white",
            m: 0,
            p: 2,
          }}
        >
          Historique des notifications
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {notificationsList.length ? (
            <MuiList>
              {notificationsList.map((notif) => (
                <ListItem key={notif._id} divider>
                  <ListItemText
                    primary={notif.message}
                    secondary={new Date(notif.createdAt).toLocaleString()}
                  />
                </ListItem>
              ))}
            </MuiList>
          ) : (
            <Typography align="center">Aucune notification à afficher.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="contained"
            sx={{
              backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 90%)`,
              px: 3,
              py: 1,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 18px 0 rgba(26, 35, 126, 0.25)",
              },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default ChefDashboard;
