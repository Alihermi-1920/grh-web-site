import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Update as UpdateIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const EmployeeTaskPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [updateTaskOpen, setUpdateTaskOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadComment, setUploadComment] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [taskForm, setTaskForm] = useState({
    status: "pending",
    comment: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user || !user._id) return;

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/employee/${user._id}`);
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
  }, [user]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      case "review":
        color = "secondary";
        label = "En révision";
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

  // Open task detail dialog
  const handleTaskDetailOpen = (task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  // Close task detail dialog
  const handleTaskDetailClose = () => {
    setTaskDetailOpen(false);
  };

  // Open update task dialog
  const handleUpdateTaskOpen = () => {
    if (!selectedTask) return;

    setTaskForm({
      status: selectedTask.status || "pending",
      comment: "",
    });

    setUpdateTaskOpen(true);
    setTaskDetailOpen(false);
  };

  // Close update task dialog
  const handleUpdateTaskClose = () => {
    setUpdateTaskOpen(false);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm({
      ...taskForm,
      [name]: value,
    });
  };

  // Submit task update
  const handleUpdateTaskSubmit = async () => {
    try {
      // Update task
      const response = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          status: taskForm.status,
          // completionPercentage is now automatically calculated based on status
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la tâche");
      }

      const updatedTask = await response.json();

      // If a comment is provided, add it
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

      // Update local tasks list
      setTasks(tasks.map(task =>
        task._id === selectedTask._id ? updatedTask : task
      ));

      setSnackbar({
        open: true,
        message: "Tâche mise à jour avec succès",
        severity: "success",
      });

      setUpdateTaskOpen(false);
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      });
    }
  };

  // Add comment to task
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

      // Update local tasks list
      setTasks(tasks.map(task =>
        task._id === selectedTask._id ? updatedTask : task
      ));

      setSelectedTask(updatedTask);

      // Reset comment field
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

  // Open file upload dialog
  const handleUploadDialogOpen = () => {
    setSelectedFiles([]);
    setUploadComment("");
    setUploadDialogOpen(true);
    setTaskDetailOpen(false);
  };

  // Close file upload dialog
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setTaskDetailOpen(true);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFiles.length || !selectedTask) return;

    try {
      const formData = new FormData();

      // Add all selected files
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

      console.log("Uploading files to task:", selectedTask._id);
      console.log("FormData contents:", {
        files: selectedFiles.map(f => f.name),
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        comment: uploadComment.trim() || "(none)"
      });

      const response = await fetch(
        `http://localhost:5000/api/tasks/${selectedTask._id}/attachments`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Error ${response.status}: Unable to upload files - ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload response:", data);

      // Update task with new attachments
      if (selectedTask.attachments) {
        selectedTask.attachments = [...selectedTask.attachments, ...data.attachments];
      } else {
        selectedTask.attachments = data.attachments;
      }

      // Update tasks list
      setTasks(tasks.map(task =>
        task._id === selectedTask._id ? selectedTask : task
      ));

      setSnackbar({
        open: true,
        message: `${selectedFiles.length} fichier(s) téléchargé(s) avec succès`,
        severity: "success"
      });

      handleUploadDialogClose();

      // Refresh task data
      const refreshResponse = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}`);
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setSelectedTask(refreshedData);
        setTasks(tasks.map(task =>
          task._id === selectedTask._id ? refreshedData : task
        ));
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

  // Handle download attachment
  const handleDownloadAttachment = (attachment) => {
    window.open(attachment.filePath, "_blank");
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Filter tasks based on selected tab
  const getFilteredTasks = () => {
    switch (tabValue) {
      case 0: // All tasks
        return tasks;
      case 1: // Pending tasks
        return tasks.filter(task => task.status === "pending");
      case 2: // In progress tasks
        return tasks.filter(task => task.status === "in-progress");
      case 3: // Completed tasks
        return tasks.filter(task => task.status === "completed");
      case 4: // Blocked or on-hold tasks
        return tasks.filter(task => task.status === "blocked" || task.status === "on-hold");
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
          Chargement des tâches...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Mes tâches
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
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
            label={`En attente (${tasks.filter(task => task.status === "pending").length})`}
            iconPosition="start"
          />
          <Tab
            icon={<AssignmentIcon />}
            label={`En cours (${tasks.filter(task => task.status === "in-progress").length})`}
            iconPosition="start"
          />
          <Tab
            icon={<CheckCircleIcon />}
            label={`Terminées (${tasks.filter(task => task.status === "completed").length})`}
            iconPosition="start"
          />
          <Tab
            icon={<ScheduleIcon />}
            label={`Bloquées/En pause (${tasks.filter(task => task.status === "blocked" || task.status === "on-hold").length})`}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {getFilteredTasks().length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">Vous n'avez aucune tâche dans cette catégorie.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {getFilteredTasks().map(task => (
            <Grid item xs={12} md={6} lg={4} key={task._id}>
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
                onClick={() => handleTaskDetailOpen(task)}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: task.status === 'completed' ? 'success.main' : 'primary.main' }}>
                      {task.title.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" component="div">
                      {task.title}
                    </Typography>
                  }
                  subheader={`Créé le ${formatDate(task.createdAt)}`}
                  action={getStatusChip(task.status)}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {task.description.length > 100
                      ? task.description.substring(0, 100) + "..."
                      : task.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">
                      <CalendarIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(task.deadline)}
                    </Typography>
                    <Box>
                      {getPriorityChip(task.priority)}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Progression: {task.completionPercentage || 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={task.completionPercentage || 0}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          backgroundColor: task.completionPercentage >= 100 ? 'success.main' : 'primary.main',
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Chip
                      icon={<CommentIcon />}
                      label={`${task.comments ? task.comments.length : 0} Commentaires`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<PersonIcon />}
                      label={task.assignedBy ? `Par: ${task.assignedBy.firstName}` : "Non assigné"}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Task Detail Dialog */}
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
                <Typography variant="h6">
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
                      {selectedTask.description}
                    </Typography>
                  </Paper>

                  <Typography variant="subtitle1" gutterBottom>
                    Commentaires
                  </Typography>
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    <List>
                      {selectedTask.comments.map((comment, index) => (
                        <ListItem key={index} alignItems="flex-start" divider={index < selectedTask.comments.length - 1}>
                          <ListItemAvatar>
                            <Avatar src={comment.author?.photo} alt={comment.author?.firstName}>
                              {comment.author?.firstName?.charAt(0) || "U"}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2">
                                {comment.author
                                  ? `${comment.author.firstName} ${comment.author.lastName}`
                                  : "Utilisateur inconnu"}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Box component="span" sx={{ display: 'block' }}>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {comment.content}
                                  </Typography>
                                </Box>
                                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </Typography>
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucun commentaire pour le moment.
                      </Typography>
                    </Paper>
                  )}

                  <Box sx={{ mt: 2, display: 'flex' }}>
                    <TextField
                      fullWidth
                      placeholder="Ajouter un commentaire..."
                      variant="outlined"
                      size="small"
                      value={taskForm.comment}
                      name="comment"
                      onChange={handleFormChange}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleAddComment}
                      disabled={!taskForm.comment.trim()}
                    >
                      <SendIcon />
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
                          {selectedTask.project ? selectedTask.project.projectName || "Non défini" : "Non défini"}
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
                    startIcon={<UpdateIcon />}
                    onClick={handleUpdateTaskOpen}
                    sx={{ mb: 2 }}
                  >
                    Mettre à jour le statut
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadDialogOpen}
                    sx={{ mb: 2 }}
                  >
                    Soumettre un fichier
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleTaskDetailClose}
                  >
                    Fermer
                  </Button>

                  {/* Attachments section */}
                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <AttachFileIcon sx={{ mr: 0.5, fontSize: 'small', verticalAlign: 'middle' }} />
                        Fichiers attachés
                      </Typography>
                      <List dense>
                        {selectedTask.attachments.map((attachment, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton edge="end" onClick={() => handleDownloadAttachment(attachment)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            }
                          >
                            <ListItemIcon>
                              {attachment.fileType?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
                               attachment.fileType?.includes('word') ? <DescriptionIcon color="primary" /> :
                               attachment.fileType?.includes('sheet') || attachment.fileType?.includes('excel') ? <TableChartIcon color="success" /> :
                               attachment.fileType?.includes('image') ? <ImageIcon color="info" /> : <InsertDriveFileIcon />}
                            </ListItemIcon>
                            <ListItemText
                              primary={attachment.originalName || "Document"}
                              secondary={
                                <Box component="span">
                                  {`Ajouté le ${formatDate(attachment.uploadDate)} ${attachment.uploadedBy ? `par ${attachment.uploadedBy}` : ''}`}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Update Task Dialog */}
      <Dialog
        open={updateTaskOpen}
        onClose={handleUpdateTaskClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mettre à jour le statut de la tâche</DialogTitle>
        <DialogContent dividers>
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
              <MenuItem value="pending">En attente (0%)</MenuItem>
              <MenuItem value="in-progress">En cours (25%)</MenuItem>
              <MenuItem value="review">En révision (75%)</MenuItem>
              <MenuItem value="completed">Terminé (100%)</MenuItem>
              <MenuItem value="blocked">Bloqué</MenuItem>
              <MenuItem value="on-hold">En pause</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Progression automatique
            </Typography>
            <Typography variant="body2">
              La progression de la tâche est maintenant calculée automatiquement en fonction du statut:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>En attente: 0%</li>
              <li>En cours: 25%</li>
              <li>En révision: 75%</li>
              <li>Terminé: 100%</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Pour mettre à jour la progression, il suffit de changer le statut de la tâche.
            </Typography>
          </Box>

          <TextField
            name="comment"
            label="Commentaire (optionnel)"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={taskForm.comment}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateTaskClose}>Annuler</Button>
          <Button onClick={handleUpdateTaskSubmit} variant="contained" color="primary">
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Dialog removed - progress is now automatically calculated */}

      {/* File Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Soumettre un fichier pour cette tâche</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Téléchargez vos fichiers pour cette tâche. Vous pouvez ajouter un commentaire pour décrire votre soumission.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
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
                        {file.type.includes('pdf') ? <PictureAsPdfIcon /> :
                         file.type.includes('word') ? <DescriptionIcon /> :
                         file.type.includes('sheet') || file.type.includes('excel') ? <TableChartIcon /> :
                         file.type.includes('image') ? <ImageIcon /> : <InsertDriveFileIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={
                          <Box component="span">
                            {`${(file.size / 1024).toFixed(1)} KB`}
                          </Box>
                        }
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmployeeTaskPage;
