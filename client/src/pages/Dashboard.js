// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import AddDepartment from "./AddDepartment";
import AddEmployee from "./AddEmployee";
import Attendance from "./Attendance";
import EmployeeListPage from "./EmployeeList";
import ProjectPage from "./Project";
import ProjectListPage from "./ProjectListPage";
import EvaluationManager from "./EvaluationManager";
import DashboardHome from "./DashboardHome";
import LeaveApproval from "./LeaveApproval";
import AttendanceCalendar from "./AttendanceCalendar"; // Import du nouveau composant

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
} from "@mui/material";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1a237e" },
    secondary: { main: "#3949ab" },
  },
});

const Dashboard = () => {
  // activeView contrôle la vue affichée
  const [activeView, setActiveView] = useState("dashboardHome");

  const [openEmployeeSubmenu, setOpenEmployeeSubmenu] = useState(false);
  const [openProjectSubmenu, setOpenProjectSubmenu] = useState(false);
  const [departments, setDepartments] = useState(["RH", "IT", "Finance", "Marketing"]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) =>
        console.error("Erreur lors de la récupération des employés :", err)
      );
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) =>
        console.error("Erreur lors de la récupération des projets :", err)
      );
  }, []);

  const employeeCount = employees.length;
  const projectCount = projects.length;
  const departmentCount = departments.length;

  const handleLogout = () => {
    console.log("Déconnexion effectuée.");
    window.location.href = "/login";
  };

  const handleEmployeeClick = () => setOpenEmployeeSubmenu(!openEmployeeSubmenu);
  const handleProjectClick = () => setOpenProjectSubmenu(!openProjectSubmenu);

  // Sidebar met à jour activeView selon le menu sélectionné
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
        <Typography variant="h6" fontWeight="600">
          Admin Dupont
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
          Super Administrateur
        </Typography>
      </Stack>
      <List sx={{ px: 2, mt: 2 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("dashboardHome")}
            sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {/* Employés */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleEmployeeClick} sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <People />
            </ListItemIcon>
            <ListItemText primary="Employés" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            {openEmployeeSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        {openEmployeeSubmenu && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("addEmployee")}
                sx={{ pl: 4, borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <PersonAdd />
                </ListItemIcon>
                <ListItemText primary="Ajouter un employé" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("employeeList")}
                sx={{ pl: 4, borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <People />
                </ListItemIcon>
                <ListItemText primary="Tous les employés" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {/* Présence */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("attendance")}
            sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <People />
            </ListItemIcon>
            <ListItemText primary="Présence" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {/* Ajouter département */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setActiveView("addDepartment")}
            sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <AddBusiness />
            </ListItemIcon>
            <ListItemText primary="Ajouter département" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {/* Projets */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleProjectClick} sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Projets" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            {openProjectSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        {openProjectSubmenu && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("projectList")}
                sx={{ pl: 4, borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <Assignment />
                </ListItemIcon>
                <ListItemText primary="Liste des projets" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("projectCreate")}
                sx={{ pl: 4, borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <AddBusiness />
                </ListItemIcon>
                <ListItemText primary="Créer un projet" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {/* Gestion QCM */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("evaluationManager")} sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Quiz />
            </ListItemIcon>
            <ListItemText primary="Gestion QCM" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {/* Demandes de congé */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("leaveApproval")} sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Demandes de congé" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {/* Calendrier de Présence */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("attendanceCalendar")} sx={{ borderRadius: 1, mb: 0.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <Assignment />
            </ListItemIcon>
            <ListItemText primary="Calendrier Présence" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
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
          {/* En-tête du Dashboard */}
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
              Tableau de Bord RH
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "#1a237e",
                  width: 40,
                  height: 40,
                  fontSize: 16,
                  border: "2px solid #e0e0e0",
                }}
              >
                AD
              </Avatar>
              {/* Exemple : un bouton pour ajouter un employé qui change activeView */}
              <Button
                variant="contained"
                size="medium"
                onClick={() => setActiveView("addEmployee")}
                sx={{
                  textTransform: "none",
                  px: 3,
                  fontSize: 14,
                  background: "linear-gradient(45deg, #1a237e 0%, #3949ab 90%)",
                  "&:hover": { background: "#1a237e" },
                }}
              >
                + Nouvel Employé
              </Button>
            </Stack>
          </Box>
          {/* Zone de contenu principal */}
          <Container maxWidth="xl" sx={{ p: 4, flexGrow: 1 }}>
            {activeView === "addEmployee" && (
              <AddEmployee
                onCancel={() => setActiveView("dashboardHome")}
                onSuccess={() => setActiveView("dashboardHome")}
                departments={departments}
              />
            )}
            {activeView === "attendance" && <Attendance />}
            {activeView === "addDepartment" && (
              <AddDepartment
                onCancel={() => setActiveView("dashboardHome")}
                onSuccess={(newDepartment) => {
                  setDepartments([...departments, newDepartment]);
                  setActiveView("dashboardHome");
                }}
                existingDepartments={departments.map((d) => d.toLowerCase())}
              />
            )}
            {activeView === "employeeList" && <EmployeeListPage />}
            {activeView === "projectList" && <ProjectListPage />}
            {activeView === "projectCreate" && <ProjectPage />}
            {activeView === "evaluationManager" && <EvaluationManager />}
            {activeView === "leaveApproval" && <LeaveApproval />}
            {activeView === "attendanceCalendar" && <AttendanceCalendar />}
            {activeView === "dashboardHome" && (
              <DashboardHome
                employeeCount={employeeCount}
                projectCount={projectCount}
                departmentCount={departmentCount}
              />
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
