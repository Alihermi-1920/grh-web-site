import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  FormControlLabel,
  Switch,
  Alert,
  Paper,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Snackbar,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import {
  Search,
  FilterList,
  Add,
  CheckCircle,
  Cancel,
  AccessTime,
  Flag,
  CalendarToday,
  Person,
  Group,
  Description,
  CloudUpload,
  AttachFile,
  Comment,
  PlayArrow,
  Pause,
  Done,
  Close,
  MoreVert,
  Refresh,
  Assignment,
  Download,
  PictureAsPdf,
  TableChart,
  Image,
  InsertDriveFile,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ChefProjectPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // State for projects
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for selected project and actions
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [acceptRejectOpen, setAcceptRejectOpen] = useState(false);
  const [acceptRejectAction, setAcceptRejectAction] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  // State for team management
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [chefEmployees, setChefEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // State for file upload
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch chef's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/projects/employee/${user._id}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch projects`);
        }
        const data = await response.json();
        setProjects(data);
        setFilteredProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError(error.message);

        // Fallback: fetch all projects and filter
        try {
          const fallbackResponse = await fetch("http://localhost:5000/api/projects");
          if (!fallbackResponse.ok) {
            throw new Error(`Error ${fallbackResponse.status}: Unable to fetch projects`);
          }
          const allProjects = await fallbackResponse.json();
          // Filter projects where this chef is the project leader
          const chefProjects = allProjects.filter(project =>
            project.projectLeader &&
            (project.projectLeader._id === user._id ||
             project.projectLeader._id.toString() === user._id)
          );
          setProjects(chefProjects);
          setFilteredProjects(chefProjects);
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
          setError(fallbackError.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get status chip based on project status
  const getStatusChip = (status) => {
    let color = "default";
    let label = "Inconnu";

    switch (status) {
      case "planning":
        color = "error";
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
      case "rejected":
        color = "default";
        label = "Refusé";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Filter projects based on search term and filters
  const applyFilters = () => {
    let result = [...projects];

    // Apply search filter
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(
        (project) =>
          project.projectName.toLowerCase().includes(lowercasedSearch) ||
          (project.description && project.description.toLowerCase().includes(lowercasedSearch))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((project) => project.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter((project) => project.priority === priorityFilter);
    }

    setFilteredProjects(result);
  };

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, priorityFilter, projects]);

  // Handle project selection for details
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setDetailDialogOpen(true);
  };

  // Handle accept/reject dialog
  const handleAcceptRejectOpen = (project, action) => {
    setSelectedProject(project);
    setAcceptRejectAction(action);
    setStatusComment("");
    setAcceptRejectOpen(true);
  };

  const handleAcceptRejectClose = () => {
    setAcceptRejectOpen(false);
  };

  // Handle team dialog
  const handleTeamDialogOpen = (project) => {
    setSelectedProject(project);
    setTeamDialogOpen(true);
    fetchChefEmployees();
  };

  const handleTeamDialogClose = () => {
    setTeamDialogOpen(false);
  };

  // Fetch employees that belong to the chef
  const fetchChefEmployees = async () => {
    if (!user) return;

    setLoadingEmployees(true);
    try {
      // Try to fetch employees by chef endpoint
      try {
        const response = await fetch(`http://localhost:5000/api/employees/chef/${user._id}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Unable to fetch chef's employees`);
        }
        const data = await response.json();
        setChefEmployees(data);
      } catch (error) {
        console.warn("Error fetching chef's employees, falling back to filtering all employees:", error);

        // Fallback: fetch all employees and filter
        const allResponse = await fetch(`http://localhost:5000/api/employees`);
        if (!allResponse.ok) {
          throw new Error(`Error ${allResponse.status}: Unable to fetch employees`);
        }

        const allEmployees = await allResponse.json();
        // Filter employees that have this chef as chefId
        const filteredEmployees = allEmployees.filter(emp =>
          emp.chefId && emp.chefId.toString() === user._id
        );

        console.log("Filtered chef employees:", filteredEmployees);
        setChefEmployees(filteredEmployees.length > 0 ? filteredEmployees : []);
      }
    } catch (error) {
      console.error("Error fetching chef's employees:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Handle team update
  const handleTeamUpdate = async () => {
    if (!selectedProject) return;

    try {
      const updatedProject = {
        ...selectedProject,
        team: selectedProject.team.map(emp => emp._id)
      };

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Mise à jour de l'équipe impossible`);
      }

      const data = await response.json();

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      setSnackbar({
        open: true,
        message: "Équipe mise à jour avec succès",
        severity: "success",
      });

      handleTeamDialogClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Handle file upload
  const handleFileUploadOpen = (project) => {
    setSelectedProject(project);
    setFileUploadOpen(true);
  };

  const handleFileUploadClose = () => {
    setFileUploadOpen(false);
    setSelectedFiles([]);
  };

  // Handle file upload submission
  const handleFileUploadSubmit = async () => {
    if (!selectedProject || selectedFiles.length === 0) return;

    try {
      const formData = new FormData();

      // Add files to form data
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Add user info
      formData.append('userId', user._id);
      formData.append('userName', `${user.firstName} ${user.lastName}`);

      console.log("Uploading files to project:", selectedProject._id);
      console.log("Files:", selectedFiles.map(f => f.name));

      // Show loading state
      setSnackbar({
        open: true,
        message: "Téléchargement en cours...",
        severity: "info"
      });

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}/documents`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || "Unable to upload files"}`);
      }

      const data = await response.json();
      console.log("Upload success response:", data);

      // Update local state
      const updatedProject = {
        ...selectedProject,
        documents: [...(selectedProject.documents || []), ...data.documents]
      };

      setProjects(prevProjects =>
        prevProjects.map(proj =>
          proj._id === selectedProject._id ? updatedProject : proj
        )
      );

      setSnackbar({
        open: true,
        message: `${selectedFiles.length} fichier(s) téléchargé(s) avec succès`,
        severity: "success"
      });

      handleFileUploadClose();

      // Refresh project data
      fetchProjectDetails(selectedProject._id);

    } catch (error) {
      console.error("Erreur lors du téléchargement des fichiers:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error"
      });
    }
  };

  // Fetch project details including documents and comments
  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Unable to fetch project details`);
      }

      const projectData = await response.json();

      // Update the project in the projects array
      setProjects(prevProjects =>
        prevProjects.map(proj =>
          proj._id === projectId ? projectData : proj
        )
      );

      // If this is the selected project, update it
      if (selectedProject && selectedProject._id === projectId) {
        setSelectedProject(projectData);
      }

    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  // Open status change dialog
  const handleStatusChangeOpen = (project, status) => {
    setSelectedProject(project);
    setNewStatus(status);
    setStatusComment("");
    setStatusChangeOpen(true);
    setDetailDialogOpen(false);
  };

  // Close status change dialog
  const handleStatusChangeClose = () => {
    setStatusChangeOpen(false);
    // Reopen detail dialog if it was open
    if (selectedProject) {
      setDetailDialogOpen(true);
    }
  };

  // Handle status change confirmation
  const handleStatusChangeConfirm = async () => {
    try {
      if (!selectedProject || !newStatus) return;

      const updatedProject = {
        ...selectedProject,
        status: newStatus,
      };

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Mise à jour du statut impossible`);
      }

      const data = await response.json();

      // Add a comment about the status change
      let statusText = "";
      switch(newStatus) {
        case "in-progress": statusText = "En cours"; break;
        case "on-hold": statusText = "En attente"; break;
        case "planning": statusText = "En attente"; break;
        case "completed": statusText = "Terminé"; break;
        case "rejected": statusText = "Refusé"; break;
        default: statusText = "En attente";
      }

      const commentText = statusComment.trim() ||
        `Statut du projet modifié: ${statusText}`;

      const commentData = {
        text: commentText,
        author: user._id, // Use author for backward compatibility
        authorName: `${user.firstName} ${user.lastName}`, // Use authorName for backward compatibility
        userId: user._id, // Also include userId for newer implementations
        userName: `${user.firstName} ${user.lastName}`, // Also include userName for newer implementations
        type: "status_change",
        oldStatus: selectedProject.status,
        newStatus: newStatus
      };

      // Save comment to database
      await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(commentData),
        }
      );

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      setSnackbar({
        open: true,
        message: `Statut du projet mis à jour: ${statusText}`,
        severity: "success",
      });

      handleStatusChangeClose();

      // Refresh project details
      fetchProjectDetails(selectedProject._id);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Handle status change (shortcut function)
  const handleStatusChange = (project, status) => {
    handleStatusChangeOpen(project, status);
  };

  // Fix for handleStatusChangeConfirm not being used
  useEffect(() => {
    // This ensures the function is properly connected to the dialog button
    const statusChangeButton = document.querySelector('[data-status-change-confirm]');
    if (statusChangeButton) {
      statusChangeButton.addEventListener('click', handleStatusChangeConfirm);
      return () => {
        statusChangeButton.removeEventListener('click', handleStatusChangeConfirm);
      };
    }
  }, [statusChangeOpen, selectedProject, newStatus]);

  // Handle accept/reject confirmation
  const handleAcceptRejectConfirm = async () => {
    try {
      // Determine the new status based on the action
      let newStatus;
      if (acceptRejectAction === "accept") {
        newStatus = "in-progress";
      } else if (acceptRejectAction === "reject") {
        newStatus = "rejected"; // Use rejected status for rejected projects
      } else if (acceptRejectAction === "hold") {
        newStatus = "on-hold";
      }

      const updatedProject = {
        ...selectedProject,
        status: newStatus,
      };

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Mise à jour du statut impossible`);
      }

      const data = await response.json();

      // Add comment if provided
      if (statusComment.trim() || true) { // Always add a comment, even if empty
        let commentText = statusComment.trim();
        if (!commentText) {
          if (acceptRejectAction === "accept") {
            commentText = "Projet accepté et démarré";
          } else if (acceptRejectAction === "reject") {
            commentText = "Projet refusé";
          } else if (acceptRejectAction === "hold") {
            commentText = "Projet mis en attente";
          }
        }

        const commentData = {
          text: commentText,
          author: user._id, // Use author for backward compatibility
          authorName: `${user.firstName} ${user.lastName}`, // Use authorName for backward compatibility
          userId: user._id, // Also include userId for newer implementations
          userName: `${user.firstName} ${user.lastName}`, // Also include userName for newer implementations
          type: "status_change",
          oldStatus: selectedProject.status,
          newStatus: newStatus
        };

        console.log("Adding comment:", commentData);

        // Save comment to database
        const commentResponse = await fetch(
          `http://localhost:5000/api/projects/${selectedProject._id}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(commentData),
          }
        );

        if (!commentResponse.ok) {
          console.error("Failed to add comment:", await commentResponse.text());
        }
      }

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );

      let message, severity;
      if (acceptRejectAction === "accept") {
        message = "Projet accepté et démarré avec succès";
        severity = "success";
      } else if (acceptRejectAction === "reject") {
        message = "Projet refusé";
        severity = "error";
      } else if (acceptRejectAction === "hold") {
        message = "Projet mis en attente";
        severity = "warning";
      }

      setSnackbar({
        open: true,
        message,
        severity,
      });

      handleAcceptRejectClose();

      // Refresh project details
      fetchProjectDetails(selectedProject._id);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!selectedProject || !newComment.trim()) return;

    try {
      console.log("Adding comment to project:", selectedProject._id);

      const commentData = {
        text: newComment.trim(),
        author: user._id, // Use author for backward compatibility
        authorName: `${user.firstName} ${user.lastName}`, // Use authorName for backward compatibility
        userId: user._id, // Also include userId for newer implementations
        userName: `${user.firstName} ${user.lastName}`, // Also include userName for newer implementations
        type: "general"
      };

      console.log("Comment data:", commentData);

      // Show loading state
      setSnackbar({
        open: true,
        message: "Ajout du commentaire en cours...",
        severity: "info"
      });

      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(commentData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Comment error response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || "Unable to add comment"}`);
      }

      const data = await response.json();

      // Update local state
      const updatedProject = {
        ...selectedProject,
        comments: [...(selectedProject.comments || []), data.comment]
      };

      setProjects(prevProjects =>
        prevProjects.map(proj =>
          proj._id === selectedProject._id ? updatedProject : proj
        )
      );

      setSnackbar({
        open: true,
        message: "Commentaire ajouté avec succès",
        severity: "success"
      });

      // Reset form and close dialog
      setNewComment("");
      setCommentDialogOpen(false);

      // Reopen detail dialog
      setDetailDialogOpen(true);

      // Refresh project details
      fetchProjectDetails(selectedProject._id);

    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error"
      });
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header with title and search */}
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
        flexDirection: { xs: "column", sm: "row" },
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Mes Projets
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
          <TextField
            placeholder="Rechercher un projet..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
          Filtres
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tous les statuts</MenuItem>
                <MenuItem value="planning">Planification</MenuItem>
                <MenuItem value="in-progress">En cours</MenuItem>
                <MenuItem value="on-hold">En attente</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priorité</InputLabel>
              <Select
                value={priorityFilter}
                label="Priorité"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">Toutes les priorités</MenuItem>
                <MenuItem value="low">Basse</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : filteredProjects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" color="textSecondary">
            Aucun projet trouvé
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Essayez de modifier vos filtres ou contactez l'administrateur
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                  borderLeft: "4px solid",
                  borderColor:
                    project.status === "planning" ? "#9e9e9e" :
                    project.status === "in-progress" ? "#ff9800" :
                    project.status === "on-hold" ? "#f44336" : "#4caf50",
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  {/* Project name and priority */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {project.projectName}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        project.priority === "high" ? "Haute" :
                        project.priority === "medium" ? "Moyenne" : "Basse"
                      }
                      color={
                        project.priority === "high" ? "error" :
                        project.priority === "medium" ? "warning" : "success"
                      }
                    />
                  </Box>

                  {/* Status */}
                  <Box sx={{ mb: 2 }}>
                    {getStatusChip(project.status)}
                  </Box>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      mb: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: "40px"
                    }}
                  >
                    {project.description || "Aucune description"}
                  </Typography>

                  {/* Deadline */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <CalendarToday fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2">
                      Échéance: {formatDate(project.deadline)}
                    </Typography>
                  </Box>

                  {/* Team count */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Group fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2">
                      Équipe: {project.team?.length || 0} membre(s)
                    </Typography>
                  </Box>

                  {/* Action buttons */}
                  <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleProjectSelect(project)}
                      startIcon={<Description />}
                    >
                      Détails
                    </Button>

                    {project.status === "planning" && (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleAcceptRejectOpen(project, "accept")}
                          startIcon={<CheckCircle />}
                        >
                          Accepter
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleAcceptRejectOpen(project, "reject")}
                          startIcon={<Cancel />}
                        >
                          Refuser
                        </Button>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Project Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
              pb: 2
            }}>
              <Typography variant="h6" component="div">
                {selectedProject.projectName}
              </Typography>
              {getStatusChip(selectedProject.status)}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Project Info */}
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Détails du projet
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {selectedProject.description || "Aucune description"}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Date d'échéance
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body1">
                              {formatDate(selectedProject.deadline)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Priorité
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              selectedProject.priority === "high" ? "Haute" :
                              selectedProject.priority === "medium" ? "Moyenne" : "Basse"
                            }
                            color={
                              selectedProject.priority === "high" ? "error" :
                              selectedProject.priority === "medium" ? "warning" : "success"
                            }
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Actions based on status */}
                    {selectedProject.status === "planning" && (
                      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => {
                            setDetailDialogOpen(false);
                            handleAcceptRejectOpen(selectedProject, "accept");
                          }}
                          startIcon={<CheckCircle />}
                        >
                          Accepter et démarrer
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => {
                            setDetailDialogOpen(false);
                            handleAcceptRejectOpen(selectedProject, "reject");
                          }}
                          startIcon={<Cancel />}
                        >
                          Refuser
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => {
                            setDetailDialogOpen(false);
                            handleAcceptRejectOpen(selectedProject, "hold");
                          }}
                          startIcon={<Pause />}
                        >
                          Mettre en attente
                        </Button>
                      </Box>
                    )}

                    {selectedProject.status === "in-progress" && (
                      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => {
                            // Handle status change to completed
                            handleStatusChange(selectedProject, "completed");
                          }}
                          startIcon={<Done />}
                        >
                          Marquer comme terminé
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => {
                            // Handle status change to on-hold
                            handleStatusChange(selectedProject, "on-hold");
                          }}
                          startIcon={<Pause />}
                        >
                          Mettre en attente
                        </Button>
                      </Box>
                    )}

                    {selectedProject.status === "on-hold" && (
                      <Box sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => {
                            // Handle status change to in-progress
                            handleStatusChange(selectedProject, "in-progress");
                          }}
                          startIcon={<PlayArrow />}
                        >
                          Reprendre le projet
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Team Info */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Équipe du projet
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Group />}
                        onClick={() => {
                          setDetailDialogOpen(false);
                          handleTeamDialogOpen(selectedProject);
                        }}
                      >
                        Gérer
                      </Button>
                    </Box>

                    {selectedProject.team && selectedProject.team.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {selectedProject.team.map((member) => (
                          <ListItem key={member._id} sx={{ px: 0, py: 1 }}>
                            <ListItemAvatar>
                              <Avatar src={member.photo ? `/${member.photo.split(/(\\|\/)/g).pop()}` : undefined}>
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
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          Aucun membre dans l'équipe
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={() => {
                            setDetailDialogOpen(false);
                            handleTeamDialogOpen(selectedProject);
                          }}
                        >
                          Ajouter des membres
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* File Upload Section */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Documents du projet
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloudUpload />}
                        onClick={() => {
                          setDetailDialogOpen(false);
                          handleFileUploadOpen(selectedProject);
                        }}
                      >
                        Ajouter
                      </Button>
                    </Box>

                    {selectedProject.documents && selectedProject.documents.length > 0 ? (
                      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {selectedProject.documents.map((doc, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                component="a"
                                href={doc.filePath}
                                target="_blank"
                                download
                              >
                                <Download fontSize="small" />
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
                              secondary={`${new Date(doc.uploadDate).toLocaleDateString()} - ${(doc.fileSize / 1024).toFixed(1)} KB`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                        Aucun document n'a été ajouté à ce projet
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Comments Section */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Commentaires
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Comment />}
                        onClick={() => {
                          setCommentDialogOpen(true);
                          setDetailDialogOpen(false);
                        }}
                      >
                        Ajouter
                      </Button>
                    </Box>

                    {selectedProject.comments && selectedProject.comments.length > 0 ? (
                      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {selectedProject.comments
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((comment, index) => (
                          <ListItem key={index} alignItems="flex-start" sx={{
                            borderLeft: comment.type === 'status_change' ?
                              `4px solid ${
                                comment.newStatus === 'in-progress' ? '#ff9800' :
                                comment.newStatus === 'on-hold' ? '#f44336' :
                                comment.newStatus === 'completed' ? '#4caf50' : '#9e9e9e'
                              }` : 'none',
                            pl: comment.type === 'status_change' ? 2 : 1,
                            mb: 1,
                            backgroundColor: comment.type === 'status_change' ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                          }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle2">
                                    {comment.authorName || "Utilisateur"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                                    {comment.text}
                                  </Typography>
                                  {comment.type === 'status_change' && (
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Statut changé: {' '}
                                        <Chip
                                          size="small"
                                          label={
                                            comment.oldStatus === "planning" ? "Planification" :
                                            comment.oldStatus === "in-progress" ? "En cours" :
                                            comment.oldStatus === "on-hold" ? "En attente" : "Terminé"
                                          }
                                          sx={{ mr: 1 }}
                                        />
                                        {' '} → {' '}
                                        <Chip
                                          size="small"
                                          label={
                                            comment.newStatus === "planning" ? "Planification" :
                                            comment.newStatus === "in-progress" ? "En cours" :
                                            comment.newStatus === "on-hold" ? "En attente" : "Terminé"
                                          }
                                          color={
                                            comment.newStatus === "planning" ? "default" :
                                            comment.newStatus === "in-progress" ? "warning" :
                                            comment.newStatus === "on-hold" ? "error" : "success"
                                          }
                                        />
                                      </Typography>
                                    </Box>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                        Aucun commentaire pour ce projet
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Accept/Reject Dialog */}
      <Dialog
        open={acceptRejectOpen}
        onClose={handleAcceptRejectClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle>
              {acceptRejectAction === "accept" ? "Accepter le projet" :
               acceptRejectAction === "reject" ? "Refuser le projet" :
               "Mettre le projet en attente"}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedProject.projectName}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Échéance: {formatDate(selectedProject.deadline)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Flag fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Priorité: {' '}
                    <Chip
                      size="small"
                      label={
                        selectedProject.priority === "high" ? "Haute" :
                        selectedProject.priority === "medium" ? "Moyenne" : "Basse"
                      }
                      color={
                        selectedProject.priority === "high" ? "error" :
                        selectedProject.priority === "medium" ? "warning" : "success"
                      }
                    />
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" gutterBottom>
                {acceptRejectAction === "accept"
                  ? "En acceptant ce projet, vous allez changer son statut en 'En cours' et pourrez commencer à y assigner des membres de votre équipe."
                  : acceptRejectAction === "reject"
                  ? "En refusant ce projet, vous indiquez qu'il ne peut pas être réalisé. Veuillez expliquer la raison du refus."
                  : "En mettant ce projet en attente, vous indiquez qu'il ne peut pas être démarré pour le moment. Vous pourrez le reprendre ultérieurement."
                }
              </Typography>

              <TextField
                margin="dense"
                label="Commentaire (obligatoire)"
                fullWidth
                multiline
                rows={3}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                variant="outlined"
                placeholder={
                  acceptRejectAction === "accept"
                    ? "Ajoutez un commentaire sur l'acceptation du projet..."
                    : acceptRejectAction === "reject"
                    ? "Expliquez pourquoi le projet est refusé..."
                    : "Expliquez pourquoi le projet est mis en attente..."
                }
                sx={{ mt: 2 }}
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAcceptRejectClose}>Annuler</Button>
              <Button
                onClick={handleAcceptRejectConfirm}
                variant="contained"
                color={
                  acceptRejectAction === "accept" ? "success" :
                  acceptRejectAction === "reject" ? "error" : "warning"
                }
                startIcon={
                  acceptRejectAction === "accept" ? <CheckCircle /> :
                  acceptRejectAction === "reject" ? <Cancel /> : <Pause />
                }
                disabled={!statusComment.trim()}
              >
                {acceptRejectAction === "accept" ? "Accepter et démarrer" :
                 acceptRejectAction === "reject" ? "Refuser" : "Mettre en attente"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Team Management Dialog */}
      <Dialog
        open={teamDialogOpen}
        onClose={handleTeamDialogClose}
        maxWidth="md"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  Gestion de l'équipe: {selectedProject.projectName}
                </Typography>
                {loadingEmployees && <CircularProgress size={24} />}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle1" gutterBottom>
                Sélectionnez les membres de votre équipe à assigner à ce projet
              </Typography>

              {chefEmployees.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Vous n'avez pas encore d'employés assignés à votre équipe.
                </Alert>
              ) : (
                <List>
                  {chefEmployees.map((employee) => (
                    <ListItem
                      key={employee._id}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={employee.photo ? `/${employee.photo.split(/(\\|\/)/g).pop()}` : undefined}>
                          {employee.firstName?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${employee.firstName} ${employee.lastName}`}
                        secondary={employee.position || employee.department || "Employé"}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              selectedProject?.team?.some(
                                (member) => member._id === employee._id
                              ) || false
                            }
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentTeam = selectedProject?.team || [];

                              let newTeam;
                              if (isChecked) {
                                // Make sure we have all the employee data
                                const employeeData = {
                                  _id: employee._id,
                                  firstName: employee.firstName,
                                  lastName: employee.lastName,
                                  photo: employee.photo,
                                  position: employee.position,
                                  department: employee.department,
                                  role: employee.role
                                };
                                newTeam = [...currentTeam, employeeData];
                              } else {
                                newTeam = currentTeam.filter(
                                  (member) => member._id !== employee._id
                                );
                              }

                              setSelectedProject({
                                ...selectedProject,
                                team: newTeam,
                              });
                            }}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleTeamDialogClose}>Annuler</Button>
              <Button
                onClick={handleTeamUpdate}
                variant="contained"
                color="primary"
                startIcon={<Group />}
                disabled={loadingEmployees}
              >
                Enregistrer l'équipe
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog
        open={fileUploadOpen}
        onClose={handleFileUploadClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle>
              Ajouter des documents au projet
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>
                {selectedProject.projectName}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Sélectionner des fichiers
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      setSelectedFiles(Array.from(e.target.files || []));
                    }}
                  />
                </Button>

                {selectedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fichiers sélectionnés:
                    </Typography>
                    <List dense>
                      {selectedFiles.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar>
                              <AttachFile />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Note: Les fichiers téléchargés seront visibles par l'administrateur et tous les membres de l'équipe.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleFileUploadClose}>
                Annuler
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={selectedFiles.length === 0}
                onClick={handleFileUploadSubmit}
              >
                Télécharger
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusChangeOpen}
        onClose={handleStatusChangeClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle>
              {newStatus === "in-progress" ? "Reprendre le projet" :
               newStatus === "on-hold" ? "Mettre le projet en attente" : "Marquer le projet comme terminé"}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedProject.projectName}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Échéance: {formatDate(selectedProject.deadline)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Flag fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Priorité: {' '}
                    <Chip
                      size="small"
                      label={
                        selectedProject.priority === "high" ? "Haute" :
                        selectedProject.priority === "medium" ? "Moyenne" : "Basse"
                      }
                      color={
                        selectedProject.priority === "high" ? "error" :
                        selectedProject.priority === "medium" ? "warning" : "success"
                      }
                    />
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" gutterBottom>
                {newStatus === "in-progress"
                  ? "En reprenant ce projet, vous allez changer son statut en 'En cours'."
                  : newStatus === "on-hold"
                  ? "En mettant ce projet en attente, vous indiquez qu'il ne peut pas être poursuivi pour le moment."
                  : "En marquant ce projet comme terminé, vous indiquez que toutes les tâches ont été accomplies."
                }
              </Typography>

              <TextField
                margin="dense"
                label="Commentaire (optionnel)"
                fullWidth
                multiline
                rows={3}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                variant="outlined"
                placeholder={
                  newStatus === "in-progress"
                    ? "Ajoutez un commentaire sur la reprise du projet..."
                    : newStatus === "on-hold"
                    ? "Expliquez pourquoi le projet est mis en attente..."
                    : "Ajoutez un commentaire sur la finalisation du projet..."
                }
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleStatusChangeClose}>Annuler</Button>
              <Button
                onClick={handleStatusChangeConfirm}
                data-status-change-confirm
                variant="contained"
                color={
                  newStatus === "in-progress" ? "warning" :
                  newStatus === "on-hold" ? "error" : "success"
                }
                startIcon={
                  newStatus === "in-progress" ? <PlayArrow /> :
                  newStatus === "on-hold" ? <Pause /> : <Done />
                }
              >
                {newStatus === "in-progress"
                  ? "Reprendre"
                  : newStatus === "on-hold"
                  ? "Mettre en attente"
                  : "Marquer comme terminé"
                }
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false);
          if (selectedProject) {
            setDetailDialogOpen(true);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle>
              Ajouter un commentaire
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedProject.projectName}
                </Typography>
              </Box>

              <TextField
                autoFocus
                margin="dense"
                label="Votre commentaire"
                fullWidth
                multiline
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                placeholder="Écrivez votre commentaire ici..."
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setCommentDialogOpen(false);
                  if (selectedProject) {
                    setDetailDialogOpen(true);
                  }
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddComment}
                variant="contained"
                color="primary"
                disabled={!newComment.trim()}
              >
                Ajouter le commentaire
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
    </Box>
  );
};

export default ChefProjectPage;