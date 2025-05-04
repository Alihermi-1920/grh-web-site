// src/pages/EmployeeProjectDetail.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  LinearProgress,
  Tooltip
} from "@mui/material";
import {
  CalendarToday,
  Person,
  Description,
  AttachFile,
  CloudUpload,
  Download,
  PictureAsPdf,
  Image,
  InsertDriveFile,
  TableChart,
  CheckCircle,
  ArrowBack,
  Flag,
  Assignment,
  AssignmentTurnedIn
} from "@mui/icons-material";
import MuiAlert from "@mui/material/Alert";

const EmployeeProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // State variables
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadComment, setUploadComment] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  // confirmCompleteOpen state removed - only chefs can mark projects as complete
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Get project ID from URL params or location state
  const getProjectId = () => {
    if (projectId) return projectId;
    if (location.state?.projectId) return location.state.projectId;
    return null;
  };

  const currentProjectId = getProjectId();

  // Log the project ID for debugging
  console.log("Project ID:", {
    fromParams: projectId,
    fromState: location.state?.projectId,
    currentProjectId
  });

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!currentProjectId) return;

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/projects/${currentProjectId}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch project details`);
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [currentProjectId]);

  // Fetch tasks for this project
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentProjectId || !user?._id) return;

      setTasksLoading(true);
      try {
        // Fetch tasks for this project that are assigned to the current user
        const response = await fetch(`http://localhost:5000/api/tasks/project/${currentProjectId}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch tasks`);
        }

        const data = await response.json();
        // Filter tasks assigned to the current user
        const userTasks = data.filter(task =>
          task.assignedTo &&
          (task.assignedTo._id === user._id || task.assignedTo === user._id)
        );

        setTasks(userTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        // Don't set the main error state, just log it
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [currentProjectId, user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Get status chip
  const getStatusChip = (status) => {
    let color = "default";
    let label = "Inconnu";

    switch (status) {
      case "planning":
        color = "default";
        label = "En attente";
        break;
      case "in-progress":
        color = "warning";
        label = "En cours";
        break;
      case "completed":
        color = "success";
        label = "Terminé";
        break;
      case "on-hold":
        color = "error";
        label = "En attente";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  // Handle upload dialog open
  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
    setSelectedFiles([]);
    setUploadComment("");
  };

  // Handle upload dialog close
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      setSnackbar({
        open: true,
        message: "Veuillez sélectionner au moins un fichier",
        severity: "warning"
      });
      return;
    }

    try {
      const formData = new FormData();

      // Add files to form data
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Add user info
      formData.append('userId', user._id);
      formData.append('userName', `${user.firstName} ${user.lastName}`);

      // Add comment if provided
      if (uploadComment.trim()) {
        formData.append('comment', uploadComment.trim());
      }

      // Show loading state
      setSnackbar({
        open: true,
        message: "Téléchargement en cours...",
        severity: "info"
      });

      const response = await fetch(
        `http://localhost:5000/api/projects/${currentProjectId}/documents`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Unable to upload files`);
      }

      const data = await response.json();

      // Update project state with new documents
      setProject(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...data.documents]
      }));

      setSnackbar({
        open: true,
        message: `${selectedFiles.length} fichier(s) téléchargé(s) avec succès`,
        severity: "success"
      });

      handleUploadDialogClose();

      // Refresh project data
      const refreshResponse = await fetch(`http://localhost:5000/api/projects/${currentProjectId}`);
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setProject(refreshedData);
      }

    } catch (error) {
      console.error("Error uploading files:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error"
      });
    }
  };

  // handleMarkAsComplete function removed - only chefs can mark projects as complete

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle download document
  const handleDownloadDocument = (document) => {
    window.open(document.filePath, "_blank");
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Chargement des détails du projet...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
      </Container>
    );
  }

  // Not found state
  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Projet non trouvé ou vous n'avez pas accès à ce projet.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Retour
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate("/employee-dashboard", {
          state: {
            activeView: "projects"
          }
        })}
        sx={{ mb: 3 }}
      >
        Retour aux projets
      </Button>

      {/* Project header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.projectName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {getStatusChip(project.status)}
              <Chip
                icon={<Flag />}
                label={`Priorité: ${project.priority === 'high' ? 'Haute' : project.priority === 'medium' ? 'Moyenne' : 'Basse'}`}
                color={project.priority === 'high' ? 'error' : project.priority === 'medium' ? 'warning' : 'success'}
                size="small"
              />
            </Box>
          </Box>

          {project.status !== 'completed' && (
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUpload />}
                onClick={handleUploadDialogOpen}
              >
                Soumettre mon travail
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {project.description || "Aucune description fournie"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Chef de projet
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Avatar
                    src={project.projectLeader?.photo}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  >
                    {project.projectLeader?.firstName?.charAt(0)}
                  </Avatar>
                  <Typography>
                    {project.projectLeader ?
                      `${project.projectLeader.firstName} ${project.projectLeader.lastName}` :
                      "Non assigné"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date d'échéance
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <CalendarToday fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography>
                    {formatDate(project.deadline)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Project documents and tasks */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <AttachFile sx={{ mr: 1, verticalAlign: 'middle' }} />
              Documents du projet
            </Typography>

            {project.documents && project.documents.length > 0 ? (
              <List>
                {project.documents.map((doc, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {doc.fileType?.includes('pdf') ? <PictureAsPdf /> :
                         doc.fileType?.includes('word') ? <Description /> :
                         doc.fileType?.includes('sheet') || doc.fileType?.includes('excel') ? <TableChart /> :
                         doc.fileType?.includes('image') ? <Image /> : <InsertDriveFile />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={doc.originalName}
                      secondary={`Ajouté le ${formatDate(doc.uploadDate)} ${doc.uploadedBy ? 'par ' + doc.uploadedBy : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucun document n'a été ajouté à ce projet.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Tasks assigned to the employee */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <AssignmentTurnedIn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Mes tâches pour ce projet
            </Typography>

            {tasksLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : tasks.length > 0 ? (
              <List>
                {tasks.map((task) => (
                  <ListItem
                    key={task._id}
                    sx={{
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{
                        bgcolor:
                          task.status === 'completed' ? 'success.main' :
                          task.status === 'in-progress' ? 'warning.main' :
                          task.priority === 'high' ? 'error.main' : 'primary.main'
                      }}>
                        <Assignment />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{task.title}</Typography>
                          <Chip
                            size="small"
                            label={
                              task.status === 'pending' ? 'En attente' :
                              task.status === 'in-progress' ? 'En cours' :
                              task.status === 'completed' ? 'Terminé' :
                              task.status === 'blocked' ? 'Bloqué' : 'En pause'
                            }
                            color={
                              task.status === 'pending' ? 'warning' :
                              task.status === 'in-progress' ? 'info' :
                              task.status === 'completed' ? 'success' :
                              task.status === 'blocked' ? 'error' : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {task.description?.length > 100 ?
                              task.description.substring(0, 100) + '...' :
                              task.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Échéance: {formatDate(task.deadline)}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                task.priority === 'high' ? 'Haute' :
                                task.priority === 'medium' ? 'Moyenne' : 'Basse'
                              }
                              color={
                                task.priority === 'high' ? 'error' :
                                task.priority === 'medium' ? 'warning' : 'success'
                              }
                            />
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={task.completionPercentage || 0}
                              sx={{
                                height: 8,
                                borderRadius: 5,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor:
                                    task.completionPercentage >= 100 ? 'success.main' :
                                    task.completionPercentage >= 50 ? 'warning.main' : 'primary.main'
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                              {task.completionPercentage || 0}% terminé
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucune tâche ne vous a été assignée pour ce projet.
              </Alert>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AssignmentTurnedIn />}
                onClick={() => navigate('/employee-dashboard', {
                  state: {
                    activeView: "taskChat"
                  }
                })}
              >
                Voir toutes mes tâches
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Équipe du projet
            </Typography>

            {project.team && project.team.length > 0 ? (
              <List>
                {project.team.map((member) => (
                  <ListItem key={member._id}>
                    <ListItemAvatar>
                      <Avatar src={member.photo}>
                        {member.firstName?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${member.firstName} ${member.lastName}`}
                      secondary={member.position || member.department || "Employé"}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucun membre n'a été assigné à ce projet.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Soumettre mon travail</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Téléchargez vos fichiers de travail pour ce projet. Vous pouvez ajouter un commentaire pour décrire votre soumission.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Sélectionner des fichiers
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileSelect}
              />
            </Button>

            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fichiers sélectionnés:
                </Typography>
                <List dense>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {file.type.includes('pdf') ? <PictureAsPdf /> :
                         file.type.includes('word') ? <Description /> :
                         file.type.includes('sheet') || file.type.includes('excel') ? <TableChart /> :
                         file.type.includes('image') ? <Image /> : <InsertDriveFile />}
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <TextField
              label="Commentaire (optionnel)"
              multiline
              rows={3}
              fullWidth
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
              placeholder="Décrivez votre travail ou ajoutez des notes pour le chef de projet"
              variant="outlined"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Annuler</Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            color="primary"
            disabled={selectedFiles.length === 0}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Complete Dialog removed - only chefs can mark projects as complete */}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default EmployeeProjectDetail;
