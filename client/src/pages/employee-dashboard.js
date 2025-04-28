// src/pages/EmployeeDashboard.js
import React, { useState, useContext } from "react";
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
} from "@mui/material";
import {
  People,
  Assignment,
  AdminPanelSettings,
  EventNote,
  History,
  WorkOutline,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LeaveManagement from "./LeaveManagement"; // Import depuis LeaveManagement.js
import Attendance from "./Attendance"; // Historique de présence
import EmployeeTaskList from "../components/EmployeeTaskList"; // Composant pour afficher les tâches assignées
import EmployeeProjectDashboard from "./EmployeeProjectDashboard"; // Import du tableau de bord des projets
import { AuthContext } from "../context/AuthContext";

const theme = createTheme({
  palette: {
    primary: { main: "#1a237e" },
    secondary: { main: "#3949ab" },
  },
});

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("");
  // Solde de congés initial (exemple : 15 jours)
  const [leaveBalance, setLeaveBalance] = useState(15);

  const handleLeaveSubmit = (days, requestData) => {
    setLeaveBalance(leaveBalance - days);
    console.log("Demande enregistrée :", requestData);
  };

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
        },
      }}
    >
      <Stack
        alignItems="center"
        spacing={1.5}
        sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        {user?.photo ? (
          <Avatar
            src={`/${user.photo.split(/(\\|\/)/g).pop()}`}
            alt={`${user.firstName} ${user.lastName}`}
            sx={{ width: 72, height: 72 }}
          />
        ) : (
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: "white",
              border: "3px solid #e0e0e0",
              boxShadow: 3,
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 40, color: "primary.main" }} />
          </Avatar>
        )}
        <Typography variant="h6" fontWeight="600">
          {user ? `${user.firstName} ${user.lastName}` : "Employee Durand"}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            backgroundColor: "rgba(255,255,255,0.15)",
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {user?.role || "Employé"}
        </Typography>
      </Stack>
      <List sx={{ px: 2, mt: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("profile")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <People />
            </ListItemIcon>
            <ListItemText primary="Mon Profil" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("projects")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <WorkOutline />
            </ListItemIcon>
            <ListItemText primary="Mes Projets" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("leaves")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <EventNote />
            </ListItemIcon>
            <ListItemText primary="Mes Congés" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("attendance")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <History />
            </ListItemIcon>
            <ListItemText primary="Historique de Présence" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {/* Option pour afficher les tâches assignées */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("tasks")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Mes Tâches" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ p: 2 }}>
        <Button variant="contained" fullWidth color="secondary" onClick={() => (window.location.href = "/login")}>
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
            background: "#f8f9fe",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 3,
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Typography variant="h4" fontWeight="600" color="#1a237e">
              Tableau de Bord Employé
            </Typography>
          </Box>
          <Container maxWidth="xl" sx={{ p: 4, flexGrow: 1 }}>
            {activeView === "profile" && <Typography variant="h6">Mon Profil (Vue Employé)</Typography>}
            {activeView === "projects" && <EmployeeProjectDashboard />}
            {activeView === "leaves" && (
              <LeaveManagement leaveBalance={leaveBalance} onLeaveSubmit={handleLeaveSubmit} />
            )}
            {activeView === "attendance" && <Attendance />}
            {activeView === "tasks" && <EmployeeTaskList />}
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
    </ThemeProvider>
  );
};

export default EmployeeDashboard;