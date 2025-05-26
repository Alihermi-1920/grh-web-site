import React from "react";
import {
  Drawer,
  Box,
  Typography,
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
  Quiz,
  Home,
  EventAvailable,
  CalendarViewMonth,
  Logout,
  Groups,
  BarChart,
  BeachAccess
} from "@mui/icons-material";
import { motion } from "framer-motion";

// This is a completely separate component to prevent re-renders
const AdminSidebar = ({
  activeView,
  setActiveView,
  openEmployeeSubmenu,
  setOpenEmployeeSubmenu,
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

        {/* Clean Modern Admin Dashboard Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          sx={{
            width: '100%',
            mt: 2,
            mb: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AdminPanelSettings
            sx={{
              fontSize: 22,
              color: darkMode ? '#90caf9' : '#546e7a',
              opacity: 0.9
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight="600"
            sx={{
              color: darkMode ? '#e0e0e0' : '#424242',
              letterSpacing: '0.3px',
              fontSize: '1rem'
            }}
          >
            AdminDashboard
          </Typography>
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
