import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  LinearProgress,
  Tab,
  Tabs,
  Breadcrumbs,
  Link,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterListIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import ProjectSelectionGrid from "../components/ProjectSelectionGrid";

const ChefTaskManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    priority: "medium",
    status: "pending",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState("projectSelection"); // "projectSelection" or "taskManagement"

  // Fetch projects and employees on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch projects where the chef is the leader
        const projectsResponse = await fetch(
          `http://localhost:5000/api/projects/employee/${user._id}`
        );
        if (!projectsResponse.ok) {
          throw new Error("Erreur lors de la récupération des projets");
        }
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Fetch employees assigned to the chef
        const employeesResponse = await fetch(
          `http://localhost:5000/api/employees/chef/${user._id}`
        );
        if (!employeesResponse.ok) {
          throw new Error("Erreur lors de la récupération des employés");
        }
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Erreur:", error);
        setSnackbar({
          open: true,
          message: error.message,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      fetchInitialData();
    }
  }, [user]);

  // Fetch tasks when a project is selected
  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!selectedProject) return;

      setLoading(true);
      try {
        // Fetch tasks for the selected project
        const tasksResponse = await fetch(
          `http://localhost:5000/api/tasks/project/${selectedProject._id}`
        );
        if (!tasksResponse.ok) {
          throw new Error("Erreur lors de la récupération des tâches du projet");
        }
        const tasksData = await tasksResponse.json();

        // Filter tasks to only include those created by the current chef
        const filteredTasks = tasksData.filter(task =>
          task.assignedBy &&
          (task.assignedBy._id === user._id || task.assignedBy === user._id)
        );

        console.log(`Found ${filteredTasks.length} tasks for project ${selectedProject.projectName}`);
        setTasks(filteredTasks);

        // Switch to task management view
        setView("taskManagement");
      } catch (error) {
        console.error("Erreur:", error);
        setSnackbar({
          open: true,
          message: error.message,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedProject) {
      fetchProjectTasks();
    }
  }, [selectedProject, user._id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open dialog to create a new task
  const handleOpenDialog = () => {
    setEditMode(false);
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      deadline: "",
      priority: "medium",
      status: "pending",
    });
    setOpenDialog(true);
  };

  // Open dialog to edit an existing task
  const handleEditTask = (task) => {
    setEditMode(true);
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo._id || task.assignedTo,
      deadline: task.deadline ? task.deadline.substring(0, 10) : "",
      priority: task.priority,
      status: task.status,
    });
    setSelectedProject(task.project._id || task.project);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm({
      ...taskForm,
      [name]: value,
    });
  };

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  // Go back to project selection
  const handleBackToProjects = () => {
    setView("projectSelection");
    setSelectedProject(null);
    setTasks([]);
    setTabValue(0);
  };

  // Submit form to create or update a task
  const handleSubmit = async () => {
    try {
      if (!taskForm.title || !selectedProject || !taskForm.assignedTo || !taskForm.deadline) {
        setSnackbar({
          open: true,
          message: "Veuillez remplir tous les champs obligatoires",
          severity: "error",
        });
        return;
      }

      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        projectId: selectedProject._id,
        assignedTo: taskForm.assignedTo,
        assignedBy: user._id,
        deadline: taskForm.deadline,
        priority: taskForm.priority,
        status: taskForm.status,
      };

      let response;
      if (editMode) {
        // Update existing task
        response = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });
      } else {
        // Create new task
        response = await fetch("http://localhost:5000/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });
      }

      if (!response.ok) {
        throw new Error(
          `Erreur lors de ${editMode ? "la mise à jour" : "la création"} de la tâche`
        );
      }

      const data = await response.json();

      if (editMode) {
        // Update tasks list
        setTasks(tasks.map((task) => (task._id === selectedTask._id ? data : task)));
      } else {
        // Add new task to list
        setTasks([data, ...tasks]);
      }

      setSnackbar({
        open: true,
        message: `Tâche ${editMode ? "mise à jour" : "créée"} avec succès`,
        severity: "success",
      });

      setOpenDialog(false);
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la tâche");
      }

      // Remove task from list
      setTasks(tasks.filter((task) => task._id !== taskId));

      setSnackbar({
        open: true,
        message: "Tâche supprimée avec succès",
        severity: "success",
      });
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  // View task details
  const handleViewTask = (taskId) => {
    console.log("Viewing task details for task ID:", taskId);

    // Check if we're in the dashboard
    if (window.location.pathname === "/chef-dashboard") {
      console.log("Using dashboard navigation with state");
      // We're in the dashboard, use state to navigate
      navigate("/chef-dashboard", {
        state: {
          activeView: "taskDetail",
          taskId: taskId
        },
        replace: true // Use replace to ensure state is updated
      });
    } else {
      console.log("Using regular navigation to dedicated page");
      // We're not in the dashboard, use regular navigation
      navigate(`/chef-task/${taskId}`);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status chip with appropriate color
  const getStatusChip = (status) => {
    let color = "default";
    let label = "Inconnu";

    switch (status) {
      case "pending":
        color = "warning";
        label = "En attente";
        break;
      case "in-progress":
        color = "info";
        label = "En cours";
        break;
      case "completed":
        color = "success";
        label = "Terminé";
        break;
      case "blocked":
        color = "error";
        label = "Bloqué";
        break;
      case "on-hold":
        color = "default";
        label = "En pause";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Get priority chip with appropriate color
  const getPriorityChip = (priority) => {
    let color = "default";
    let label = "Moyenne";

    switch (priority) {
      case "low":
        color = "success";
        label = "Basse";
        break;
      case "medium":
        color = "warning";
        label = "Moyenne";
        break;
      case "high":
        color = "error";
        label = "Haute";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Filter tasks based on selected tab
  const getFilteredTasks = () => {
    switch (tabValue) {
      case 0: // All tasks
        return tasks;
      case 1: // Pending tasks
        return tasks.filter((task) => task.status === "pending");
      case 2: // In progress tasks
        return tasks.filter((task) => task.status === "in-progress");
      case 3: // Completed tasks
        return tasks.filter((task) => task.status === "completed");
      case 4: // Blocked or on-hold tasks
        return tasks.filter(
          (task) => task.status === "blocked" || task.status === "on-hold"
        );
      default:
        return tasks;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header with breadcrumbs */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              color="inherit"
              onClick={handleBackToProjects}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Projets
            </Link>
            {selectedProject && view === "taskManagement" && (
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                {selectedProject.projectName}
              </Typography>
            )}
          </Breadcrumbs>

          <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 1 }}>
            {view === "projectSelection" ? (
              <>
                <AssignmentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Sélectionner un projet
              </>
            ) : (
              <>
                <AssignmentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Gestion des tâches: {selectedProject?.projectName}
              </>
            )}
          </Typography>
        </Box>

        {view === "taskManagement" && (
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToProjects}
              sx={{ mr: 2 }}
            >
              Retour aux projets
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Nouvelle tâche
            </Button>
          </Box>
        )}
      </Box>

      {/* Project Selection View */}
      {view === "projectSelection" && (
        <Fade in={view === "projectSelection"} timeout={500}>
          <Box>
            <ProjectSelectionGrid
              projects={projects}
              onSelectProject={handleProjectSelect}
            />
          </Box>
        </Fade>
      )}

      {/* Task Management View */}
      {view === "taskManagement" && selectedProject && (
        <Fade in={view === "taskManagement"} timeout={500}>
          <Box>
            <Paper sx={{ width: "100%", mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab
                  icon={<AssignmentIcon />}
                  label={`Toutes (${tasks.length})`}
                  iconPosition="start"
                />
                <Tab
                  icon={<ScheduleIcon />}
                  label={`En attente (${tasks.filter((task) => task.status === "pending").length})`}
                  iconPosition="start"
                />
                <Tab
                  icon={<AssignmentIcon />}
                  label={`En cours (${
                    tasks.filter((task) => task.status === "in-progress").length
                  })`}
                  iconPosition="start"
                />
                <Tab
                  icon={<CheckCircleIcon />}
                  label={`Terminées (${tasks.filter((task) => task.status === "completed").length})`}
                  iconPosition="start"
                />
                <Tab
                  icon={<ScheduleIcon />}
                  label={`Bloquées/En pause (${
                    tasks.filter(
                      (task) => task.status === "blocked" || task.status === "on-hold"
                    ).length
                  })`}
                  iconPosition="start"
                />
              </Tabs>
            </Paper>

            {getFilteredTasks().length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                  Aucune tâche trouvée dans cette catégorie
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={{ mt: 2 }}
                >
                  Créer une nouvelle tâche
                </Button>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Titre</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigné à</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Échéance</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Priorité</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Progression</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredTasks().map((task) => (
                      <TableRow
                        key={task._id}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transition: 'background-color 0.2s'
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                            {task.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              src={task.assignedTo?.photo}
                              alt={task.assignedTo?.firstName}
                              sx={{ width: 32, height: 32, mr: 1 }}
                            />
                            <Typography variant="body2">
                              {task.assignedTo
                                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                : "Non assigné"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<CalendarIcon />}
                            label={formatDate(task.deadline)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{getPriorityChip(task.priority)}</TableCell>
                        <TableCell>{getStatusChip(task.status)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ width: "100%", mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={task.completionPercentage || 0}
                                sx={{
                                  height: 8,
                                  borderRadius: 5,
                                }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {`${task.completionPercentage || 0}%`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Voir les détails">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleViewTask(task._id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton
                              color="secondary"
                              size="small"
                              onClick={() => handleEditTask(task)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Fade>
      )}

      {/* Dialog for creating/editing tasks */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? "Modifier la tâche" : "Créer une nouvelle tâche"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="title"
                label="Titre de la tâche *"
                fullWidth
                margin="normal"
                value={taskForm.title}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Projet"
                value={selectedProject?.projectName || ""}
                fullWidth
                margin="normal"
                disabled
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                margin="normal"
                value={taskForm.description}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="employee-label">Assigné à *</InputLabel>
                <Select
                  labelId="employee-label"
                  id="assignedTo"
                  name="assignedTo"
                  value={taskForm.assignedTo}
                  onChange={handleFormChange}
                  label="Assigné à *"
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {`${employee.firstName} ${employee.lastName}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="deadline"
                label="Date d'échéance *"
                type="date"
                fullWidth
                margin="normal"
                value={taskForm.deadline}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priorité</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleFormChange}
                  label="Priorité"
                >
                  <MenuItem value="low">Basse</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Statut</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={taskForm.status}
                  onChange={handleFormChange}
                  label="Statut"
                >
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="in-progress">En cours</MenuItem>
                  <MenuItem value="completed">Terminé</MenuItem>
                  <MenuItem value="blocked">Bloqué</MenuItem>
                  <MenuItem value="on-hold">En pause</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default ChefTaskManagement;
