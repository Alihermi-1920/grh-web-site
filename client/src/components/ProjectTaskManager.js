import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const ProjectTaskManager = ({ projectId, projectTeam, refreshProject }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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

  // Fetch tasks for this project
  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des tâches");
        }
        const data = await response.json();
        setTasks(data);
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

    fetchTasks();
  }, [projectId]);

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

  // Submit form to create or update a task
  const handleSubmit = async () => {
    try {
      if (!taskForm.title || !taskForm.assignedTo || !taskForm.deadline) {
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
        projectId: projectId,
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
      
      // Refresh the project data to update task counts
      if (refreshProject) {
        refreshProject();
      }
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
      
      // Refresh the project data to update task counts
      if (refreshProject) {
        refreshProject();
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
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

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
        <CircularProgress size={24} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement des tâches...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" component="h2">
          <AssignmentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Tâches du projet
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          size="small"
        >
          Nouvelle tâche
        </Button>
      </Box>

      {tasks.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">Aucune tâche pour ce projet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Titre</TableCell>
                <TableCell>Assigné à</TableCell>
                <TableCell>Échéance</TableCell>
                <TableCell>Priorité</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Progression</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Non assigné"}
                  </TableCell>
                  <TableCell>{formatDate(task.deadline)}</TableCell>
                  <TableCell>{getPriorityChip(task.priority)}</TableCell>
                  <TableCell>{getStatusChip(task.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box sx={{ width: "100%", mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={task.completionPercentage || 0}
                          sx={{ height: 8, borderRadius: 5 }}
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
                    <Tooltip title="Modifier">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleEditTask(task)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteTask(task._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog for creating/editing tasks */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? "Modifier la tâche" : "Créer une nouvelle tâche"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Titre de la tâche *"
                fullWidth
                margin="normal"
                value={taskForm.title}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
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
                  {projectTeam && projectTeam.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {`${member.firstName} ${member.lastName}`}
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
    </Box>
  );
};

export default ProjectTaskManager;
