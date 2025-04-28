// src/pages/chef-dashboard.js
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
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EmployeeList from "./EmployeeList";
import Evaluation from "./Evaluation";
import ChefProjectPage from "./ChefProjectPage";
import Attendance from "./Attendance";
import AttendanceCalendar from "./AttendanceCalendar";
import TaskManager from "./TaskManager";
import LeaveManagement from "./LeaveManagement";
import LeaveHistory from "./LeaveHistory";
import DashboardHomeChef from "./DashboardHomeChef"; // DashboardHomeChef est dans le même dossier pages
import { AuthContext } from "../context/AuthContext";

const ChefDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("dashboardHomeChef");
  const [newProjectNotifications, setNewProjectNotifications] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [openAttendanceSubmenu, setOpenAttendanceSubmenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Thème dynamique
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1a237e",
        light: "#534bae",
        dark: "#000051",
      },
      secondary: {
        main: "#3949ab",
        light: "#6f74dd",
        dark: "#00227b",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f7fa",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#333333",
        secondary: darkMode ? "#b0b0b0" : "#666666",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: "-0.5px" },
      h6: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: darkMode
              ? "0 4px 14px 0 rgba(26, 35, 126, 0.3)"
              : "0 4px 14px 0 rgba(26, 35, 126, 0.2)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode
              ? "0 5px 22px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 5px 22px 0 rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "4px 0",
            "&.Mui-selected": {
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(26, 35, 126, 0.1)",
              "&:hover": {
                backgroundColor: darkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(26, 35, 126, 0.15)",
              },
            },
          },
        },
      },
    },
  });

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
  const handleThemeToggle = () => setDarkMode(!darkMode);

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
            ? "linear-gradient(165deg, #000051 0%, #1a237e 100%)"
            : "linear-gradient(165deg, #1a237e 0%, #3949ab 100%)",
          color: "white",
          borderRight: "none",
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "4px",
          },
        },
      }}
    >
      {/* Profil */}
      <Stack
        alignItems="center"
        spacing={2}
        sx={{ p: 4, borderBottom: "1px solid rgba(255,255,255,0.12)" }}
      >
        {user?.photo ? (
          <Avatar
            src={`/${user.photo.split(/(\\|\/)/g).pop()}`}
            alt={`${user.firstName} ${user.lastName}`}
            sx={{
              width: 80,
              height: 80,
              bgcolor: "white",
              border: "4px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "white",
              border: "4px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 40, color: "primary.main" }} />
          </Avatar>
        )}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" fontWeight="600">
            {user ? `${user.firstName} ${user.lastName}` : "Chef Dupont"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              backgroundColor: "rgba(255,255,255,0.12)",
              px: 2,
              py: 0.5,
              borderRadius: 4,
              fontWeight: 500,
              display: "inline-block",
              mt: 0.5,
            }}
          >
            {user?.role || "Chef de service"}
          </Typography>
          {user?.department && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                backgroundColor: "rgba(255,255,255,0.12)",
                px: 2,
                py: 0.5,
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              {user.department}
            </Typography>
          )}
        </Box>
      </Stack>

      <List sx={{ px: 2, py: 3 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("dashboardHomeChef")}
            selected={activeView === "dashboardHomeChef"}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight: activeView === "dashboardHomeChef" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Section Équipe */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              px: 2,
              py: 1,
              display: "block",
            }}
          >
            GESTION D'ÉQUIPE
          </Typography>
        </Box>

        {/* Employés */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("employeeList")}
            selected={activeView === "employeeList"}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <People />
            </ListItemIcon>
            <ListItemText
              primary="Mes Employés"
              primaryTypographyProps={{
                fontWeight: activeView === "employeeList" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Évaluation */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("evaluation")}
            selected={activeView === "evaluation"}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <RateReview />
            </ListItemIcon>
            <ListItemText
              primary="Évaluation"
              primaryTypographyProps={{
                fontWeight: activeView === "evaluation" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Projets */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("projectList")}
            selected={activeView === "projectList"}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText
              primary="Mes Projets"
              primaryTypographyProps={{
                fontWeight: activeView === "projectList" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Section Présence et Congés */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              px: 2,
              py: 1,
              display: "block",
            }}
          >
            PRÉSENCE & CONGÉS
          </Typography>
        </Box>

        {/* Présence avec sous-menu */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleAttendanceClick}
            selected={["attendance", "attendanceCalendar"].includes(activeView)}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <EventNote />
            </ListItemIcon>
            <ListItemText
              primary="Présence"
              primaryTypographyProps={{
                fontWeight: ["attendance", "attendanceCalendar"].includes(activeView)
                  ? 600
                  : 500,
              }}
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
                sx={{ pl: 5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                  <ListAlt fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste de présences"
                  primaryTypographyProps={{
                    fontWeight: activeView === "attendance" ? 600 : 500,
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("attendanceCalendar")}
                selected={activeView === "attendanceCalendar"}
                sx={{ pl: 5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                  <CalendarMonth fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Calendrier de présence"
                  primaryTypographyProps={{
                    fontWeight: activeView === "attendanceCalendar" ? 600 : 500,
                    fontSize: 14,
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
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText
              primary="Nouvelle demande de congé"
              primaryTypographyProps={{
                fontWeight: activeView === "leaveManagement" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("leaveHistory")}
            selected={activeView === "leaveHistory"}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <ListAlt />
            </ListItemIcon>
            <ListItemText
              primary="Historique des congés"
              primaryTypographyProps={{
                fontWeight: activeView === "leaveHistory" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Tâches */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("taskManager")}
            selected={activeView === "taskManager"}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <ListAlt />
            </ListItemIcon>
            <ListItemText
              primary="Gestion des tâches"
              primaryTypographyProps={{
                fontWeight: activeView === "taskManager" ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Boutons bas de sidebar */}
      <Box sx={{ mt: "auto", p: 3 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={darkMode ? <LightMode /> : <DarkMode />}
          sx={{
            mb: 2,
            py: 1.2,
            backgroundColor: "rgba(255,255,255,0.18)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
          }}
          onClick={handleThemeToggle}
        >
          {darkMode ? "Mode Clair" : "Mode Sombre"}
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogout}
          startIcon={<ExitToApp />}
          sx={{
            py: 1.2,
            backgroundColor: "rgba(255,255,255,0.12)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
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
                  {activeView === "leaveManagement" && "Demande de Congé"}
                  {activeView === "leaveHistory" && "Historique des Congés"}
                  {activeView === "taskManager" && "Gestion des Tâches"}
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
                {activeView === "employeeList" && <EmployeeList />}
                {activeView === "projectList" && <ChefProjectPage />}
                {activeView === "evaluation" && <Evaluation />}
                {activeView === "attendance" && <Attendance />}
                {activeView === "attendanceCalendar" && <AttendanceCalendar />}
                {activeView === "leaveManagement" && <LeaveManagement />}
                {activeView === "leaveHistory" && <LeaveHistory />}
                {activeView === "taskManager" && <TaskManager />}
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
