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
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import EmployeeList from "./EmployeeList";
import Evaluation from "./Evaluation";
import ProjectListPage from "./ProjectListPage";
import Attendance from "./Attendance";
import AttendanceCalendar from "./AttendanceCalendar";
import TaskManager from "./TaskManager";
import LeaveManagement from "./LeaveManagement";
import LeaveHistory from "./LeaveHistory";
import { AuthContext } from "../context/AuthContext";

const theme = createTheme({
  palette: {
    primary: { main: "#1a237e" },
    secondary: { main: "#3949ab" },
  },
});

const ChefDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("");
  const [newProjectNotifications, setNewProjectNotifications] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [openAttendanceSubmenu, setOpenAttendanceSubmenu] = useState(false);

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

  const Sidebar = () => (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          background: "linear-gradient(195deg, #1a237e 0%, #3949ab 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box sx={{ textAlign: "center", pt: 2, pb: 1 }}>
        {user?.photo ? (
          <img
            src={`/${user.photo.split(/(\\|\/)/g).pop()}`}
            alt={`${user.firstName} ${user.lastName}`}
            style={{
              width: "140px",
              height: "140px",
              objectFit: "cover",
              borderRadius: "50%",
              border: "3px solid white",
            }}
          />
        ) : (
          <Avatar
            sx={{
              width: 140,
              height: 140,
              bgcolor: "white",
              border: "3px solid #e0e0e0",
              margin: "0 auto",
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 70, color: "primary.main" }} />
          </Avatar>
        )}
        <Box sx={{ mt: 1 }}>
          <Typography variant="h6" fontWeight="600">
            {user ? `${user.firstName} ${user.lastName}` : "Chef Dupont"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", px: 1.5, py: 0.5, borderRadius: 2 }}
          >
            {user?.role || "Chef de service"}
          </Typography>
          <Typography
            variant="h6"
            fontWeight="600"
            color="primary.main"
            sx={{ mt: 1, backgroundColor: "rgba(255,255,255,0.15)", px: 1.5, py: 0.5, borderRadius: 2 }}
          >
            {user?.department}
          </Typography>
        </Box>
      </Box>
      <List sx={{ flexGrow: 1, px: 2 }}>
        {/* Menu Employés */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("employeeList")} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <People />
            </ListItemIcon>
            <ListItemText primary="Mes Employés" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
        {/* Menu Projets */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("projectList")} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Mes Projets" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
        {/* Menu Evaluation */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("evaluation")} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <RateReview />
            </ListItemIcon>
            <ListItemText primary="Evaluation" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
        {/* Menu Présence avec sous-menu */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleAttendanceClick} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Présence" primaryTypographyProps={{ fontSize: 14 }} />
            {openAttendanceSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openAttendanceSubmenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveView("attendance")} sx={{ pl: 4 }}>
                <ListItemText primary="Liste de présences" primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveView("attendanceCalendar")} sx={{ pl: 4 }}>
                <ListItemText primary="Calendrier de présence" primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
        {/* Menu Demande de Congé */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("leaveManagement")} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Nouvelle demande de congé" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
        {/* Historique des congés */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("leaveHistory")} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <ListAlt />
            </ListItemIcon>
            <ListItemText primary="Historique des congés" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
        {/* Menu Tâches */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("taskManager")} sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <ListAlt />
            </ListItemIcon>
            <ListItemText primary="Tâches" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ p: 2 }}>
        <Button variant="contained" fullWidth color="secondary" onClick={handleLogout}>
          Déconnecter
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
            background: "#f8f9fe",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Typography variant="h4" fontWeight="600" color="#1a237e">
              Tableau de Bord Chef
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton onClick={handleNotificationClick}>
                <Badge badgeContent={newProjectNotifications} color="error">
                  <Notifications fontSize="large" color="action" />
                </Badge>
              </IconButton>
            </Box>
          </Box>
          <Container maxWidth="xl" sx={{ p: 4, flexGrow: 1 }}>
            {activeView === "employeeList" && <EmployeeList />}
            {activeView === "projectList" && <ProjectListPage />}
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
                  background: "white",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  minHeight: "60vh",
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  Sélectionnez une option dans la barre latérale.
                </Typography>
              </Box>
            )}
          </Container>
        </Box>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, backgroundColor: "#f5f5f5" } }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(90deg, #1a237e, #3949ab)",
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
          <Button onClick={() => setOpenDialog(false)} variant="contained" color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default ChefDashboard;
