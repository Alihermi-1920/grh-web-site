// src/pages/EmployeeProjectDashboard.js
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
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
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Assignment,
  AssignmentTurnedIn,
  CalendarToday,
  CheckCircle,
  ExpandMore,
  Flag,
  InsertComment,
  Person,
  Schedule,
  Send,
  WorkOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const EmployeeProjectDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // État pour stocker les données
  const [myProjects, setMyProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // États pour les modales
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [updateTaskOpen, setUpdateTaskOpen] = useState(false);
  const [taskProgressOpen, setTaskProgressOpen] = useState(false);

  // État pour le formulaire de mise à jour des tâches
  const [taskForm, setTaskForm] = useState({
    status: "",
    completionPercentage: 0,
    comment: "",
  });

  // État pour les messages de succès/erreur
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Charger les projets et les tâches de l'employé au chargement
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user || !user._id) return;

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching data for employee:", user._id);

        // First try to get all projects and filter on the client side as a fallback
        const allProjectsResponse = await fetch(`http://localhost:5000/api/projects`);
        if (!allProjectsResponse.ok) {
          throw new Error("Erreur lors de la récupération des projets");
        }

        const allProjects = await allProjectsResponse.json();
        console.log(`Fetched ${allProjects.length} total projects`);

        // Try the employee-specific endpoint
        try {
          console.log(`Calling employee projects endpoint for ${user._id}`);
          const projectResponse = await fetch(`http://localhost:5000/api/projects/employee/${user._id}`);

          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            console.log(`Received ${projectData.length} projects from employee endpoint`);
            setMyProjects(projectData);
          } else {
            console.warn("Employee project endpoint failed, falling back to client-side filtering");

            // Filter projects on the client side where the employee is in the team
            const filteredProjects = allProjects.filter(project => {
              if (!project.team) return false;

              return project.team.some(member => {
                // Check if the member is an object with _id property
                if (typeof member === 'object' && member._id) {
                  return member._id === user._id;
                }
                // Check if the member is a string ID
                return String(member) === String(user._id);
              });
            });

            console.log(`Filtered ${filteredProjects.length} projects on client side`);
            console.log("Projects found:", filteredProjects.map(p => p.projectName));
            setMyProjects(filteredProjects);
          }
        } catch (endpointError) {
          console.error("Error calling employee projects endpoint:", endpointError);

          // Filter projects on the client side as a fallback
          const filteredProjects = allProjects.filter(project => {
            if (!project.team) return false;

            // Log the team for debugging
            console.log(`Project ${project.projectName} team:`, project.team);

            return project.team.some(member => {
              const memberId = typeof member === 'object' ? member._id : member;
              const result = String(memberId) === String(user._id);
              if (result) console.log(`Match found in project ${project.projectName}`);
              return result;
            });
          });

          console.log(`Filtered ${filteredProjects.length} projects on client side after error`);
          setMyProjects(filteredProjects);
        }

        // Récupérer les tâches de l'employé
        try {
          const taskResponse = await fetch(`http://localhost:5000/api/tasks/employee/${user._id}`);
          if (taskResponse.ok) {
            const taskData = await taskResponse.json();
            console.log(`Received ${taskData.length} tasks for employee`);
            setMyTasks(taskData);
          } else {
            console.warn("Failed to fetch tasks, setting empty array");
            setMyTasks([]);
          }
        } catch (taskError) {
          console.error("Error fetching tasks:", taskError);
          setMyTasks([]);
        }
      } catch (err) {
        console.error("Error in overall fetch:", err);
        setError(err.message);
        setMyProjects([]);
        setMyTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [user]);

  // Gestion du changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Formatage de date
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString();
  };

  // Obtenir une puce de statut avec la couleur appropriée
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
      case "planning":
        color = "default";
        label = "Planification";
        break;
      case "on-hold":
        color = "error";
        label = "En pause";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Obtenir une puce de priorité avec la couleur appropriée
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

  // Ouvrir le détail d'une tâche
  const handleTaskDetailOpen = (task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  // Fermer le détail d'une tâche
  const handleTaskDetailClose = () => {
    setTaskDetailOpen(false);
  };

  // Ouvrir le modal de mise à jour de statut
  const handleUpdateTaskOpen = () => {
    if (!selectedTask) return;

    setTaskForm({
      status: selectedTask.status || "pending",
      completionPercentage: selectedTask.completionPercentage || 0,
      comment: "",
    });

    setUpdateTaskOpen(true);
    setTaskDetailOpen(false);
  };

  // Fermer le modal de mise à jour de statut
  const handleUpdateTaskClose = () => {
    setUpdateTaskOpen(false);
  };

  // Ouvrir le modal de mise à jour de progression
  const handleProgressDialogOpen = () => {
    if (!selectedTask) return;

    setTaskForm({
      ...taskForm,
      completionPercentage: selectedTask.completionPercentage || 0,
    });

    setTaskProgressOpen(true);
    setUpdateTaskOpen(false);
  };

  // Fermer le modal de mise à jour de progression
  const handleProgressDialogClose = () => {
    setTaskProgressOpen(false);
    setUpdateTaskOpen(true);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm({
      ...taskForm,
      [name]: value,
    });
  };

  // Soumettre la mise à jour de statut
  const handleUpdateTaskSubmit = async () => {
    try {
      // Mise à jour de la tâche
      const response = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          status: taskForm.status,
          completionPercentage: parseInt(taskForm.completionPercentage),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la tâche");
      }

      const updatedTask = await response.json();

      // Si un commentaire est fourni, l'ajouter
      if (taskForm.comment.trim()) {
        await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: taskForm.comment,
            authorId: user._id,
          }),
        });
      }

      // Mettre à jour les listes locales
      setMyTasks(myTasks.map(task =>
        task._id === selectedTask._id ? updatedTask : task
      ));

      // Mettre à jour les projets si nécessaire (pour la progression)
      setMyProjects(myProjects.map(project => {
        if (project._id === updatedTask.project._id || project._id === updatedTask.project) {
          // Recalculer la progression du projet (simplifié)
          const projectTasks = myTasks.filter(t =>
            (t.project._id === project._id || t.project === project._id) &&
            t._id !== selectedTask._id
          );

          const allTasks = [...projectTasks, updatedTask];
          const totalPercentage = allTasks.reduce((sum, t) => sum + (t.completionPercentage || 0), 0);
          const averagePercentage = Math.round(totalPercentage / allTasks.length);

          return {
            ...project,
            completionPercentage: averagePercentage,
          };
        }
        return project;
      }));

      setSnackbar({
        open: true,
        message: "Tâche mise à jour avec succès",
        severity: "success",
      });

      setUpdateTaskOpen(false);
      setTaskProgressOpen(false);
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  // Ajouter un commentaire à une tâche
  const handleAddComment = async () => {
    if (!taskForm.comment.trim()) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: taskForm.comment,
          authorId: user._id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du commentaire");
      }

      const updatedTask = await response.json();

      // Mettre à jour la liste de tâches locale
      setMyTasks(myTasks.map(task =>
        task._id === selectedTask._id ? updatedTask : task
      ));

      setSelectedTask(updatedTask);

      // Réinitialiser le champ de commentaire
      setTaskForm({
        ...taskForm,
        comment: "",
      });

      setSnackbar({
        open: true,
        message: "Commentaire ajouté avec succès",
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

  // Fermer le snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Afficher les détails d'un projet
  const handleProjectClick = (projectId) => {
    // Set the active view in the dashboard to projectDetail with the selected project ID
    navigate("/employee-dashboard", {
      state: {
        activeView: "projectDetail",
        projectId: projectId
      }
    });
  };

  // Filtrer les tâches en fonction de l'onglet sélectionné
  const getFilteredTasks = () => {
    switch (tabValue) {
      case 0: // Toutes les tâches
        return myTasks;
      case 1: // Tâches en attente
        return myTasks.filter(task => task.status === "pending");
        case 2: // Tâches en cours
        return myTasks.filter(task => task.status === "in-progress");
      case 3: // Tâches terminées
        return myTasks.filter(task => task.status === "completed");
      case 4: // Tâches bloquées ou en pause
        return myTasks.filter(task => task.status === "blocked" || task.status === "on-hold");
      default:
        return myTasks;
    }
  };

  // Affichage du chargement
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

  // Affichage des erreurs
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
        Mon espace de travail
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          <WorkOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
          Mes projets assignés
        </Typography>

        {myProjects.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">Vous n'avez aucun projet assigné pour le moment.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {myProjects.map((project) => (
              <Grid item xs={12} md={6} lg={4} key={project._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleProjectClick(project._id)}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: project.status === 'completed' ? 'success.main' : 'primary.main' }}>
                        {project.projectName ? project.projectName.charAt(0).toUpperCase() : 'P'}
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" component="div">
                        {project.projectName || "Projet sans nom"}
                      </Typography>
                    }
                    subheader={`Créé le ${formatDate(project.createdAt)}`}
                    action={getStatusChip(project.status)}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description && project.description.length > 100
                        ? project.description.substring(0, 100) + "..."
                        : project.description || "Aucune description disponible"}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">
                        <CalendarToday fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {formatDate(project.startDate)}
                      </Typography>
                      <Typography variant="body2">
                        <Schedule fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {formatDate(project.deadline)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Progression: {project.completionPercentage || 0}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={project.completionPercentage || 0}
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: project.completionPercentage >= 100 ? 'success.main' : 'primary.main',
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Chip
                        icon={<Assignment />}
                        label={`${myTasks.filter(task =>
                          task.project === project._id ||
                          (task.project && task.project._id === project._id)
                        ).length} Tâches`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Flag />}
                        label={`Priorité: ${project.priority ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1) : 'Medium'}`}
                        size="small"
                        variant="outlined"
                        color={
                          project.priority === 'high' ? 'error' :
                          project.priority === 'medium' ? 'warning' : 'success'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Task section removed - now available in the dedicated "Mes Tâches" page */}

      {/* Modal de détail de tâche */}
      <Dialog
        open={taskDetailOpen}
        onClose={handleTaskDetailClose}
        maxWidth="md"
        fullWidth
      >
        {selectedTask && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  {selectedTask.title}
                </Typography>
                {getStatusChip(selectedTask.status)}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" gutterBottom>
                    Description
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body1">
                      {selectedTask.description || "Aucune description fournie."}
                    </Typography>
                  </Paper>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Progression
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={selectedTask.completionPercentage || 0}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                          {selectedTask.completionPercentage || 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>
                    Commentaires ({selectedTask.comments ? selectedTask.comments.length : 0})
                  </Typography>

                  {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun commentaire pour le moment.
                      </Typography>
                    </Paper>
                  ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                      {selectedTask.comments.map((comment, index) => (
                        <React.Fragment key={comment._id || index}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>
                                {comment.author ?
                                  comment.author.firstName.charAt(0) + comment.author.lastName.charAt(0) :
                                  "U"
                                }
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle2">
                                    {comment.author ?
                                      `${comment.author.firstName} ${comment.author.lastName}` :
                                      "Utilisateur inconnu"
                                    }
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(comment.createdAt)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ display: 'inline' }}
                                >
                                  {comment.content}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < selectedTask.comments.length - 1 && (
                            <Divider variant="inset" component="li" />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  )}

                  <Box sx={{ mt: 3, display: 'flex' }}>
                    <TextField
                      fullWidth
                      label="Ajouter un commentaire"
                      multiline
                      rows={2}
                      variant="outlined"
                      name="comment"
                      value={taskForm.comment}
                      onChange={handleFormChange}
                    />
                    <IconButton
                      color="primary"
                      sx={{ ml: 1 }}
                      onClick={handleAddComment}
                      disabled={!taskForm.comment.trim()}
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Informations
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Projet:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedTask.project ? selectedTask.project.name || "Non défini" : "Non défini"}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date de début:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatDate(selectedTask.startDate)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date d'échéance:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatDate(selectedTask.deadline)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Priorité:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        {getPriorityChip(selectedTask.priority)}
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Assigné le:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatDate(selectedTask.createdAt)}
                        </Typography>
                      </Grid>

                      {selectedTask.completedAt && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Terminé le:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              {formatDate(selectedTask.completedAt)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mb: 2 }}
                    startIcon={<WorkOutline />}
                    onClick={handleUpdateTaskOpen}
                  >
                    Mettre à jour le statut
                  </Button>

                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    onClick={handleTaskDetailClose}
                  >
                    Fermer
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Modal de mise à jour de tâche */}
      <Dialog
        open={updateTaskOpen}
        onClose={handleUpdateTaskClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mettre à jour la tâche</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedTask?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedTask?.description}
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="status-select-label">Statut</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              name="status"
              value={taskForm.status}
              label="Statut"
              onChange={handleFormChange}
            >
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="in-progress">En cours</MenuItem>
              <MenuItem value="completed">Terminé</MenuItem>
              <MenuItem value="blocked">Bloqué</MenuItem>
              <MenuItem value="on-hold">En pause</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">
                Progression: {taskForm.completionPercentage}%
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleProgressDialogOpen}
              >
                Modifier
              </Button>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseInt(taskForm.completionPercentage)}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <TextField
            fullWidth
            label="Commentaire (optionnel)"
            multiline
            rows={4}
            name="comment"
            value={taskForm.comment}
            onChange={handleFormChange}
            helperText="Ajoutez un commentaire pour expliquer votre mise à jour"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateTaskClose} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleUpdateTaskSubmit} color="primary" variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de la barre de progression */}
      <Dialog
        open={taskProgressOpen}
        onClose={handleProgressDialogClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Mettre à jour la progression</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Progression actuelle: {taskForm.completionPercentage}%
            </Typography>
            <TextField
              type="range"
              inputProps={{ min: 0, max: 100, step: 5 }}
              value={taskForm.completionPercentage}
              name="completionPercentage"
              onChange={handleFormChange}
              fullWidth
              sx={{ mt: 1 }}
            />
            <TextField
              type="number"
              label="Pourcentage"
              inputProps={{ min: 0, max: 100 }}
              value={taskForm.completionPercentage}
              name="completionPercentage"
              onChange={handleFormChange}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProgressDialogClose} color="primary">
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeeProjectDashboard;