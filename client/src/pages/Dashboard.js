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
  DarkMode
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
} from "@mui/material";
import { createTheme } from "@mui/material/styles";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("dashboardHome");
  const [openEmployeeSubmenu, setOpenEmployeeSubmenu] = useState(false);
  const [openProjectSubmenu, setOpenProjectSubmenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [departments, setDepartments] = useState(["RH", "IT", "Finance", "Marketing"]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [notifications] = useState(3);
  const [darkMode, setDarkMode] = useState(false);

  // Thème dynamique
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: "#6a1b9a",
        light: "#9c4dcc",
        dark: "#38006b"
      },
      secondary: {
        main: "#8e24aa",
        light: "#c158dc",
        dark: "#5c007a"
      },
      background: {
        default: darkMode ? "#121212" : "#f5f7fa",
        paper: darkMode ? "#1e1e1e" : "#ffffff"
      },
      text: {
        primary: darkMode ? "#ffffff" : "#333333",
        secondary: darkMode ? "#b0b0b0" : "#666666"
      }
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: "-0.5px" },
      h6: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 }
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: darkMode
              ? "0 4px 14px 0 rgba(106, 27, 154, 0.3)"
              : "0 4px 14px 0 rgba(106, 27, 154, 0.2)"
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode
              ? "0 5px 22px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 5px 22px 0 rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)"
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "4px 0",
            "&.Mui-selected": {
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(106, 27, 154, 0.1)",
              "&:hover": {
                backgroundColor: darkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(106, 27, 154, 0.15)"
              }
            }
          }
        }
      }
    }
  });

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fermer le drawer sur mobile
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

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
  const departmentDistribution = departments.map(dep =>
    employees.filter(e => e.department === dep).length
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

  const drawerWidth = 280;

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
            ? "linear-gradient(165deg, #4a0072 0%, #6a1b9a 100%)"
            : "linear-gradient(165deg, #6a1b9a 0%, #9c4dcc 100%)",
          color: "white",
          borderRight: "none",
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "4px"
          }
        },
      }}
    >
      {/* Profil */}
      <Stack alignItems="center" spacing={2} sx={{ p: 4, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: "white", border: "4px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <AdminPanelSettings sx={{ fontSize: 40, color: "primary.main" }} />
        </Avatar>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" fontWeight="600">Admin Dupont</Typography>
          <Typography variant="caption" sx={{ backgroundColor: "rgba(255,255,255,0.12)", px: 2, py: 0.5, borderRadius: 4, fontWeight: 500, display: "inline-block", mt: 0.5 }}>
            Super Administrateur
          </Typography>
        </Box>
      </Stack>

      <List sx={{ px: 2, py: 3 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("dashboardHome")} selected={activeView === "dashboardHome"} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: activeView === "dashboardHome" ? 600 : 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Section RH */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', px: 2, py: 1, display: 'block' }}>
            RESSOURCES HUMAINES
          </Typography>
        </Box>

        {/* Employés */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleEmployeeClick} selected={['addEmployee', 'employeeList'].includes(activeView)} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><People /></ListItemIcon>
            <ListItemText primary="Employés" primaryTypographyProps={{ fontWeight: ['addEmployee', 'employeeList'].includes(activeView) ? 600 : 500 }} />
            {openEmployeeSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openEmployeeSubmenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveView("addEmployee")} selected={activeView === "addEmployee"} sx={{ pl: 5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}><PersonAdd fontSize="small" /></ListItemIcon>
                <ListItemText primary="Ajouter employé" primaryTypographyProps={{ fontWeight: activeView === "addEmployee" ? 600 : 500, fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveView("employeeList")} selected={activeView === "employeeList"} sx={{ pl: 5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}><Groups fontSize="small" /></ListItemIcon>
                <ListItemText primary="Liste employés" primaryTypographyProps={{ fontWeight: activeView === "employeeList" ? 600 : 500, fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Présence & Calendrier */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("attendance")} selected={activeView === "attendance"} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><EventNote /></ListItemIcon>
            <ListItemText primary="Présence" primaryTypographyProps={{ fontWeight: activeView === "attendance" ? 600 : 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("attendanceCalendar")} selected={activeView === "attendanceCalendar"} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><CalendarMonth /></ListItemIcon>
            <ListItemText primary="Calendrier" primaryTypographyProps={{ fontWeight: activeView === "attendanceCalendar" ? 600 : 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Congés */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("leaveApproval")} selected={activeView === "leaveApproval"} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><Badge badgeContent={notifications} color="error"><Assignment /></Badge></ListItemIcon>
            <ListItemText primary="Demandes de congé" primaryTypographyProps={{ fontWeight: activeView === "leaveApproval" ? 600 : 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Départements */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("addDepartment")} selected={activeView === "addDepartment"} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><Business /></ListItemIcon>
            <ListItemText primary="Départements" primaryTypographyProps={{ fontWeight: activeView === "addDepartment" ? 600 : 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Section Projets */}
        <Box sx={{ my: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', px: 2, py: 1, display: 'block' }}>
            GESTION DE PROJETS
          </Typography>
        </Box>
        <ListItem disablePadding>
          <ListItemButton onClick={handleProjectClick} selected={['projectList', 'projectCreate'].includes(activeView)} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><Assignment /></ListItemIcon>
            <ListItemText primary="Projets" primaryTypographyProps={{ fontWeight: ['projectList', 'projectCreate'].includes(activeView) ? 600 : 500 }} />
            {openProjectSubmenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openProjectSubmenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveView("projectList")} selected={activeView === "projectList"} sx={{ pl: 5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}><Assignment fontSize="small" /></ListItemIcon>
                <ListItemText primary="Liste des projets" primaryTypographyProps={{ fontWeight: activeView === "projectList" ? 600 : 500, fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setActiveView("projectCreate")} selected={activeView === "projectCreate"} sx={{ pl: 5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}><AddBusiness fontSize="small" /></ListItemIcon>
                <ListItemText primary="Créer un projet" primaryTypographyProps={{ fontWeight: activeView === "projectCreate" ? 600 : 500, fontSize: 14 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* QCM */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setActiveView("evaluationManager")} selected={activeView === "evaluationManager"} sx={{ py: 1.2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}><Quiz /></ListItemIcon>
            <ListItemText primary="Gestion QCM" primaryTypographyProps={{ fontWeight: activeView === "evaluationManager" ? 600 : 500 }} />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Boutons bas de sidebar */}
      <Box sx={{ mt: 'auto', p: 3 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={darkMode ? <LightMode /> : <DarkMode />}
          sx={{ mb: 2, py: 1.2, backgroundColor: 'rgba(255,255,255,0.18)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' } }}
          onClick={handleThemeToggle}
        >
          {darkMode ? "Mode Clair" : "Mode Sombre"}
        </Button>
        <Button
          variant="contained"
          fullWidth
          color="secondary"
          onClick={handleLogout}
          startIcon={<ExitToApp />}
          sx={{ py: 1.2, backgroundColor: 'rgba(255,255,255,0.12)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
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
            overflow: "hidden"
          }}
        >
          {/* AppBar */}
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid rgba(0,0,0,0.05)", backgroundColor: theme.palette.background.paper }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isMobile && (
                  <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
                    <Menu />
                  </IconButton>
                )}
                <Typography variant="h5" fontWeight="600" color="primary.main">
                  {activeView === "dashboardHome" && "Tableau de Bord"}
                  {activeView === "addEmployee" && "Ajouter un Employé"}
                  {activeView === "employeeList" && "Liste des Employés"}
                  {activeView === "attendance" && "Gestion des Présences"}
                  {activeView === "attendanceCalendar" && "Calendrier des Présences"}
                  {activeView === "addDepartment" && "Gérer les Départements"}
                  {activeView === "projectList" && "Liste des Projets"}
                  {activeView === "projectCreate" && "Créer un Projet"}
                  {activeView === "evaluationManager" && "Gestion des QCM"}
                  {activeView === "leaveApproval" && "Demandes de Congés"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={3} alignItems="center">
                {!isMobile && (
                  <Tooltip title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"} arrow>
                    <IconButton onClick={handleThemeToggle} sx={{ bgcolor: 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}>
                      {darkMode ? <LightMode /> : <DarkMode />}
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={`${notifications} notifications`} arrow>
                  <IconButton size="large" sx={{ bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } }}>
                    <Badge badgeContent={notifications} color="error">
                      <NotificationsNone />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Admin Dupont" arrow>
                  <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 40, height: 40, fontSize: 16, border: `2px solid ${darkMode ? '#333333' : '#e0e0e0'}`, cursor: 'pointer' }}>
                    AD
                  </Avatar>
                </Tooltip>
                <Tooltip title="Ajouter un employé" arrow>
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={() => setActiveView("addEmployee")}
                    startIcon={<PersonAdd />}
                    sx={{
                      px: 3,
                      py: 1,
                      backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 90%)`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 18px 0 rgba(106, 27, 154, 0.25)'
                      }
                    }}
                  >
                    Nouvel Employé
                  </Button>
                </Tooltip>
              </Stack>
            </Toolbar>
          </AppBar>

          {/* Contenu principal */}
          <Container maxWidth="xl" sx={{ p: { xs: 2, md: 4 }, flexGrow: 1, position: 'relative', zIndex: 1 }}>
            <Fade in timeout={800}>
              <Box>
                {activeView === "dashboardHome" && (
                  <DashboardHome
                    employeeCount={employeeCount}
                    projectCount={projectCount}
                    departmentCount={departmentCount}
                    departmentLabels={departments}
                    departmentData={departmentDistribution}
                    recruitmentLabels={monthLabels}
                    recruitmentData={recruitmentData}
                  />
                )}
                {activeView === "addEmployee" && (
                  <AddEmployee
                    onCancel={() => setActiveView("dashboardHome")}
                    onSuccess={() => setActiveView("dashboardHome")}
                    departments={departments}
                  />
                )}
                {activeView === "attendance" && <Attendance />}
                {activeView === "attendanceCalendar" && <AttendanceCalendar />}
                {activeView === "leaveApproval" && <LeaveApproval />}
                {activeView === "addDepartment" && (
                  <AddDepartment
                    onCancel={() => setActiveView("dashboardHome")}
                    onSuccess={(newDepartment) => {
                      setDepartments([...departments, newDepartment]);
                      setActiveView("dashboardHome");
                    }}
                    existingDepartments={departments.map(d => d.toLowerCase())}
                  />
                )}
                {activeView === "employeeList" && <EmployeeListPage />}
                {activeView === "projectList" && <ProjectListPage />}
                {activeView === "projectCreate" && <ProjectPage />}
                {activeView === "evaluationManager" && <EvaluationManager />}
              </Box>
            </Fade>
          </Container>

          {/* Décoratif arrière‑plan */}
          <Box
            sx={{
              position: 'fixed',
              top: '-15%',
              right: '-10%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: darkMode
                ? `linear-gradient(135deg, ${theme.palette.primary.dark}22, ${theme.palette.secondary.dark}22)`
                : `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
              filter: 'blur(60px)',
              zIndex: 0
            }}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
