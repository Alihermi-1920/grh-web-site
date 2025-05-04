// src/pages/ChefTaskDetail.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Slider,
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
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const ChefTaskDetail = ({ taskId: propTaskId }) => {
  const params = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Use taskId from props or from URL params
  const taskId = propTaskId || params.taskId;

  console.log("ChefTaskDetail rendered with:", {
    propTaskId,
    urlTaskId: params.taskId,
    finalTaskId: taskId
  });
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadComment, setUploadComment] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const commentInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Fetch task data
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) {
        console.error("No taskId provided to ChefTaskDetail component");
        setError("ID de tâche manquant");
        setLoading(false);
        return;
      }

      console.log("Fetching task data for taskId:", taskId);
      setLoading(true);

      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch task details`);
        }

        const data = await response.json();
        console.log("Task data received:", data);
        setTask(data);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  // Scroll to bottom of comments when new comment is added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [task?.comments]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: comment,
          authorId: user._id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Unable to add comment`);
      }

      const updatedTask = await response.json();
      setTask(updatedTask);
      setComment("");

      // Focus back on the input field
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Open file upload dialog
  const handleUploadDialogOpen = () => {
    setSelectedFiles([]);
    setUploadComment("");
    setUploadDialogOpen(true);
  };

  // Close file upload dialog
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFiles.length || !taskId) return;

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

      console.log("Uploading files to task:", taskId);
      console.log("FormData contents:", {
        files: selectedFiles.map(f => f.name),
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        comment: uploadComment.trim() || "(none)"
      });

      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}/attachments`,
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

      // Update task with new data
      setTask(data.task);

      setSnackbar({
        open: true,
        message: `${selectedFiles.length} fichier(s) téléchargé(s) avec succès`,
        severity: "success"
      });

      handleUploadDialogClose();

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

  // Handle delete attachment
  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Unable to delete attachment`);
      }

      const updatedTask = await response.json();
      setTask(updatedTask);

      setSnackbar({
        open: true,
        message: "Fichier supprimé avec succès",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Chef doesn't need to update task status - this functionality is removed

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
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

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/chef-tasks")}
        >
          Retour à la liste des tâches
        </Button>
      </Container>
    );
  }

  // If task not found
  if (!task) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Tâche non trouvée
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/chef-tasks")}
        >
          Retour à la liste des tâches
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          // Check if we're in the dashboard
          if (window.location.pathname === "/chef-dashboard") {
            // We're in the dashboard, use state to navigate back
            navigate("/chef-dashboard", {
              state: {
                activeView: "taskManagement"
              }
            });
          } else {
            // We're not in the dashboard, use regular navigation
            navigate("/chef-tasks");
          }
        }}
        sx={{ mb: 3 }}
      >
        Retour à la liste des tâches
      </Button>

      {/* Task header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {task.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              {getStatusChip(task.status)}
              {getPriorityChip(task.priority)}
            </Box>
          </Box>
          {/* The update status button is removed for chef view */}
        </Box>

        <Grid container spacing={3}>
          {/* Task details */}
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" gutterBottom>
              Description
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body1">
                {task.description || "Aucune description fournie."}
              </Typography>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      <CalendarIcon sx={{ mr: 1, verticalAlign: "middle", fontSize: "small" }} />
                      Date d'échéance
                    </Typography>
                    <Typography variant="body1">{formatDate(task.deadline)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      <PersonIcon sx={{ mr: 1, verticalAlign: "middle", fontSize: "small" }} />
                      Assigné à
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Avatar
                        src={task.assignedTo?.photo}
                        alt={task.assignedTo?.firstName}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      <Typography variant="body1">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : "Non assigné"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" gutterBottom>
              Progression
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Box sx={{ width: "100%", mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={task.completionPercentage || 0}
                  sx={{
                    height: 10,
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

            {/* Project info */}
            {task.project && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Projet associé
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="body1">
                    {task.project.projectName || "Non défini"}
                  </Typography>
                </Paper>
              </>
            )}

            {/* Attachments section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1">
                  <AttachFileIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
                  Fichiers attachés
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUploadDialogOpen}
                  size="small"
                >
                  Ajouter un fichier
                </Button>
              </Box>

              {(!task.attachments || task.attachments.length === 0) ? (
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun fichier attaché à cette tâche.
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {task.attachments.map((attachment, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <Box>
                            <IconButton edge="end" onClick={() => handleDownloadAttachment(attachment)}>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteAttachment(attachment._id)}>
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </Box>
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
            </Box>
          </Grid>

          {/* Comments section */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <CommentIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
                Commentaires
              </Typography>

              <Box sx={{ height: 400, overflow: "auto", mb: 2 }}>
                {(!task.comments || task.comments.length === 0) ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
                    Aucun commentaire pour le moment.
                  </Typography>
                ) : (
                  <List>
                    {task.comments.map((comment, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start" divider={index < task.comments.length - 1}>
                          <ListItemAvatar>
                            <Avatar src={comment.author?.photo} alt={comment.author?.firstName} />
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
                      </React.Fragment>
                    ))}
                    <div ref={commentsEndRef} />
                  </List>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box component="form" onSubmit={handleCommentSubmit}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ajouter un commentaire..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  inputRef={commentInputRef}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        color="primary"
                        type="submit"
                        disabled={!comment.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* File Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter un fichier à cette tâche</DialogTitle>
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
              placeholder="Décrivez votre travail ou ajoutez des notes pour l'employé"
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

      {/* Update Task Dialog removed for chef view */}

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

export default ChefTaskDetail;
