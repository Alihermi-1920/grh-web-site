import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from "@mui/material";
import {
  AddBusiness,
  ExpandLess,
  ExpandMore,
  PersonAdd,
  PeopleAlt,
  AdminPanelSettings,
  WorkOutline,
  Quiz,
  Home,
  EventAvailable,
  CalendarViewMonth,
  Logout,
  Groups,
  BarChart,
  Build,
  Person,
  BeachAccess,
  FormatListBulleted
} from "@mui/icons-material";
import { motion } from "framer-motion";

// This is a completely separate component to prevent re-renders
const AdminSidebar = ({
  activeView,
  setActiveView,
  openEmployeeSubmenu,
  setOpenEmployeeSubmenu,
  openProjectSubmenu,
  setOpenProjectSubmenu,
  darkMode,
  handleLogout,
  drawerWidth
}) => {
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

  const handleEmployeeClick = () => setOpenEmployeeSubmenu(!openEmployeeSubmenu);
  const handleProjectClick = () => setOpenProjectSubmenu(!openProjectSubmenu);

  return (
    <Drawer
      variant="permanent"
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
          transition: "all 0.3s ease"
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
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          sx={{
            width: '100%',
            mt: 1,
            py: 1.5,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: 2,
            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: darkMode ? '#1976d2' : '#1976d2',
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 20, color: "white" }} />
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight="600" sx={{
              color: darkMode ? 'white' : '#333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Admin Dupont
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
            >
              <Person fontSize="small" style={{ fontSize: '0.7rem', marginRight: '3px' }} />
              Super Administrateur
            </Typography>
          </Box>
        </Box>
      </Box>

      <List
        sx={{
          px: 2,
          py: 2,
          height: 'calc(100vh - 220px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '0px',
            background: 'transparent'
          }
        }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Dashboard */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => setActiveView("dashboardHome")}
            selected={activeView === "dashboardHome"}
            sx={getMenuItemStyles(activeView === "dashboardHome")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <Home />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={getTextStyles(activeView === "dashboardHome")}
            />
          </ListItemButton>
        </ListItem>

        {/* Employés */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleEmployeeClick}
            selected={['addEmployee', 'employeeList'].includes(activeView)}
            sx={getMenuItemStyles(['addEmployee', 'employeeList'].includes(activeView))}
          >
            <ListItemIcon sx={getIconStyles()}>
              <PeopleAlt />
            </ListItemIcon>
            <ListItemText
              primary="Employés"
              primaryTypographyProps={getTextStyles(['addEmployee', 'employeeList'].includes(activeView))}
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
                sx={getSubmenuItemStyles(activeView === "addEmployee")}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'all 0.2s ease' }}>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Ajouter employé"
                  primaryTypographyProps={{
                    ...getTextStyles(activeView === "addEmployee"),
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("employeeList")}
                selected={activeView === "employeeList"}
                sx={getSubmenuItemStyles(activeView === "employeeList")}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'all 0.2s ease' }}>
                  <Groups fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste employés"
                  primaryTypographyProps={{
                    ...getTextStyles(activeView === "employeeList"),
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
            sx={getMenuItemStyles(activeView === "attendance")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <EventAvailable />
            </ListItemIcon>
            <ListItemText
              primary="Présences"
              primaryTypographyProps={getTextStyles(activeView === "attendance")}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ mt: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("attendanceCalendar")}
            selected={activeView === "attendanceCalendar"}
            sx={getMenuItemStyles(activeView === "attendanceCalendar")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <CalendarViewMonth />
            </ListItemIcon>
            <ListItemText
              primary="Calendrier"
              primaryTypographyProps={getTextStyles(activeView === "attendanceCalendar")}
            />
          </ListItemButton>
        </ListItem>

        {/* Gestion des départements */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("addDepartment")}
            selected={activeView === "addDepartment"}
            sx={getMenuItemStyles(activeView === "addDepartment")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <AddBusiness />
            </ListItemIcon>
            <ListItemText
              primary="Départements"
              primaryTypographyProps={getTextStyles(activeView === "addDepartment")}
            />
          </ListItemButton>
        </ListItem>

        {/* Projets */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleProjectClick}
            selected={['projectPage', 'projectList'].includes(activeView)}
            sx={getMenuItemStyles(['projectPage', 'projectList'].includes(activeView))}
          >
            <ListItemIcon sx={getIconStyles()}>
              <WorkOutline />
            </ListItemIcon>
            <ListItemText
              primary="Projets"
              primaryTypographyProps={getTextStyles(['projectPage', 'projectList'].includes(activeView))}
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
                sx={getSubmenuItemStyles(activeView === "projectPage")}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'all 0.2s ease' }}>
                  <WorkOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Nouveau projet"
                  primaryTypographyProps={{
                    ...getTextStyles(activeView === "projectPage"),
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setActiveView("projectList")}
                selected={activeView === "projectList"}
                sx={getSubmenuItemStyles(activeView === "projectList")}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'all 0.2s ease' }}>
                  <FormatListBulleted fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Liste des projets"
                  primaryTypographyProps={{
                    ...getTextStyles(activeView === "projectList"),
                    fontSize: 14
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Évaluations */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("evaluationManager")}
            selected={activeView === "evaluationManager"}
            sx={getMenuItemStyles(activeView === "evaluationManager")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <Quiz />
            </ListItemIcon>
            <ListItemText
              primary="Évaluations"
              primaryTypographyProps={getTextStyles(activeView === "evaluationManager")}
            />
          </ListItemButton>
        </ListItem>

        {/* Résultats d'évaluations */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("evaluationResults")}
            selected={activeView === "evaluationResults"}
            sx={getMenuItemStyles(activeView === "evaluationResults")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <BarChart />
            </ListItemIcon>
            <ListItemText
              primary="Résultats d'évaluations"
              primaryTypographyProps={getTextStyles(activeView === "evaluationResults")}
            />
          </ListItemButton>
        </ListItem>

        {/* Approbation des congés */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("leaveApproval")}
            selected={activeView === "leaveApproval"}
            sx={getMenuItemStyles(activeView === "leaveApproval")}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <BeachAccess />
            </ListItemIcon>
            <ListItemText
              primary="Congés"
              primaryTypographyProps={getTextStyles(activeView === "leaveApproval")}
            />
          </ListItemButton>
        </ListItem>

        {/* Mode Maintenance */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setActiveView("maintenanceSettings")}
            selected={activeView === "maintenanceSettings"}
            sx={getMenuItemStyles(activeView === "maintenanceSettings")}
          >
            <ListItemIcon sx={getIconStyles()}>
              <Build />
            </ListItemIcon>
            <ListItemText
              primary="Mode Maintenance"
              primaryTypographyProps={getTextStyles(activeView === "maintenanceSettings")}
            />
          </ListItemButton>
        </ListItem>

        {/* Déconnexion */}
        <Box sx={{ mt: 'auto', pt: 4 }}>
          <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', my: 2 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.2,
                borderRadius: 1,
                mb: 0.5,
                backgroundColor: 'transparent',
                color: darkMode ? "#aaaaaa" : "#555555",
                "&:hover": {
                  backgroundColor: "#685cfe",
                  color: "#ffffff"
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit', transition: 'all 0.2s ease' }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </ListItem>
        </Box>
      </List>
    </Drawer>
  );
};

export default React.memo(AdminSidebar);
