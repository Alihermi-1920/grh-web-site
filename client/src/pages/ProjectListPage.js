// src/pages/ProjectListPage.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Tooltip,
  Paper,
  Container,
  Fab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Assignment,
  MoreVert,
  PictureAsPdf,
  Add,
  Search,
  FilterList,
  CheckCircle,
  Schedule,
  Flag,
  Group,
  AssignmentTurnedIn,
  InsertChart,
  AddTask,
  Person,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProjectListPage = () => {
  // Navigation
  const navigate = useNavigate();
  
  // User context (mock - in a real app, this would come from your auth context)
  const [userRole, setUserRole] = useState("admin"); // admin, projectLeader, employee
  const [currentUser, setCurrentUser] = useState({ id: "12345", name: "John Doe" });
  
  // Main state
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showMyProjects, setShowMyProjects] = useState(false);

  // Context menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    priority: "medium",
  });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    projectName: "",
    description: "",
    deadline: "",
    priority: "",
    status: "",
    budget: "",
  });

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Team management dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch projects and employees
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const projectResponse = await fetch("http://localhost:5000/api/projects");
        if (!projectResponse.ok) {
          throw new Error(`Error ${projectResponse.status}: Unable to fetch projects`);
        }
        const projectData = await projectResponse.json();
        setProjects(projectData);
        setFilteredProjects(projectData);
        
        // Fetch employees for task assignment
        const employeeResponse = await fetch("http://localhost:5000/api/employees");
        if (!employeeResponse.ok) {
          throw new Error(`Error ${employeeResponse.status}: Unable to fetch employees`);
        }
        const employeeData = await employeeResponse.json();
        setEmployees(employeeData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterPriority, filterStatus, showMyProjects, tabValue, projects]);

  // Filter projects based on current filters
  const applyFilters = () => {
    let filtered = [...projects];
    
    // Filter by tab
    if (tabValue === 1) {
      filtered = filtered.filter(p => p.status === "in-progress");
    } else if (tabValue === 2) {
      filtered = filtered.filter(p => p.status === "completed");
    } else if (tabValue === 3) {
      filtered = filtered.filter(p => p.status === "on-hold");
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p => 
          p.projectName.toLowerCase().includes(term) || 
          (p.description && p.description.toLowerCase().includes(term))
      );
    }
    
    // Filter by priority
    if (filterPriority) {
      filtered = filtered.filter(p => p.priority === filterPriority);
    }
    
    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Filter by user's projects
    if (showMyProjects) {
      if (userRole === "projectLeader") {
        filtered = filtered.filter(p => p.projectLeader && p.projectLeader._id === currentUser.id);
      } else if (userRole === "employee") {
        filtered = filtered.filter(p => 
          p.team && p.team.some(member => member._id === currentUser.id)
        );
      }
    }
    
    setFilteredProjects(filtered);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status chip based on project status
  const getStatusChip = (status) => {
    let color = "default";
    let label = "Inconnu";
    
    switch (status) {
      case "planning":
        color = "info";
        label = "Planification";
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

  // CONTEXT MENU HANDLERS
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // EDIT PROJECT HANDLERS
  const handleEditModalOpen = () => {
    if (!selectedProject) return;
    
    setEditedProject({
      projectName: selectedProject.projectName || "",
      description: selectedProject.description || "",
      deadline: selectedProject.deadline
        ? new Date(selectedProject.deadline).toISOString().split("T")[0]
        : "",
      priority: selectedProject.priority || "",
      status: selectedProject.status || "",
      budget: selectedProject.budget || "",
    });
    
    setEditOpen(true);
    handleMenuClose();
  };

  const handleEditModalClose = () => {
    setEditOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSave = async () => {
    if (!editedProject.projectName.trim()) {
      setSnackbar({
        open: true,
        message: "Le nom du projet est obligatoire",
        severity: "error",
      });
      return;
    }

    try {
      const updatedProject = { ...selectedProject, ...editedProject };
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Modification impossible`);
      }

      const data = await response.json();
      
      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );
      
      setSnackbar({
        open: true,
        message: "Projet modifié avec succès",
        severity: "success",
      });
      
      handleEditModalClose();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // DELETE PROJECT HANDLERS
  const handleDeleteModalOpen = () => {
    setDeleteOpen(true);
    handleMenuClose();
  };

  const handleDeleteModalClose = () => {
    setDeleteOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        { method: "DELETE" }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Suppression impossible`);
      }
      
      // Update local state
      setProjects((prevProjects) =>
        prevProjects.filter((proj) => proj._id !== selectedProject._id)
      );
      
      setSnackbar({
        open: true,
        message: "Projet supprimé avec succès",
        severity: "success",
      });
      
      handleDeleteModalClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // TEAM MANAGEMENT HANDLERS
  const handleTeamDialogOpen = () => {
    setTeamDialogOpen(true);
    handleMenuClose();
  };

  const handleTeamDialogClose = () => {
    setTeamDialogOpen(false);
  };

  const handleTeamUpdate = async (newTeam) => {
    try {
      const updatedProject = { 
        ...selectedProject, 
        team: newTeam.map(emp => emp._id)
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

  // TASK MANAGEMENT HANDLERS
  const handleTaskDialogOpen = () => {
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      deadline: "",
      priority: "medium",
    });
    setTaskDialogOpen(true);
    handleMenuClose();
  };

  const handleTaskDialogClose = () => {
    setTaskDialogOpen(false);
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) {
      setSnackbar({
        open: true,
        message: "Le titre de la tâche est obligatoire",
        severity: "error",
      });
      return;
    }

    try {
      const newTask = {
        ...taskForm,
        projectId: selectedProject._id,
      };

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Création de tâche impossible`);
      }

      const data = await response.json();
      
      // Update project with new task reference
      const updatedProject = {
        ...selectedProject,
        tasks: [...(selectedProject.tasks || []), data._id],
      };
      
      await fetch(`http://localhost:5000/api/projects/${selectedProject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
      
      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((proj) => 
          proj._id === selectedProject._id 
            ? { ...proj, tasks: [...(proj.tasks || []), data] } 
            : proj
        )
      );
      
      setSnackbar({
        open: true,
        message: "Tâche créée avec succès",
        severity: "success",
      });
      
      handleTaskDialogClose();
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
  };

  // EXPORT TO PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Liste des Projets", 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Table data
    const tableColumn = ["Nom du projet", "Responsable", "Statut", "Priorité", "Échéance", "Progression"];
    const tableRows = filteredProjects.map((project) => [
      project.projectName,
      project.projectLeader ? project.projectLeader.name : "Non assigné",
      project.status || "Non défini",
      project.priority || "Non défini",
      formatDate(project.deadline),
      `${project.progress || 0}%`,
    ]);
    
    // Generate table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Save document
    doc.save("projets.pdf");
    handleMenuClose();
  };

  // NAVIGATION HANDLERS
  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate("/projects/new");
  };

  // SNACKBAR HANDLER
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // RENDER METHODS
  const renderProjectCards = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ margin: 2 }}>
          {error}
        </Alert>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <Box sx={{ textAlign: "center", padding: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Aucun projet trouvé
          </Typography>
          {userRole === "admin" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleCreateProject}
              sx={{ marginTop: 2 }}
            >
              Créer un projet
            </Button>
          )}
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ padding: 2 }}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project._id}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: project.priority === "high" ? "error.main" : "primary.main" }}>
                    <Assignment />
                  </Avatar>
                }
                action={
                  <IconButton
                    aria-label="project-menu"
                    onClick={(e) => handleMenuClick(e, project)}
                  >
                    <MoreVert />
                  </IconButton>
                }
                title={
                  <Tooltip title="Voir les détails du projet">
                    <Typography
                      variant="h6"
                      sx={{
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() => handleProjectClick(project._id)}
                    >
                      {project.projectName}
                    </Typography>
                  </Tooltip>
                }
                subheader={`Créé le ${formatDate(project.createdAt)}`}
              />
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Statut:
                  </Typography>
                  {getStatusChip(project.status)}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Priorité:
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      project.priority === "high"
                        ? "Haute"
                        : project.priority === "medium"
                        ? "Moyenne"
                        : "Basse"
                    }
                    color={
                      project.priority === "high"
                        ? "error"
                        : project.priority === "medium"
                        ? "warning"
                        : "success"
                    }
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Échéance:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(project.deadline)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Responsable:
                  </Typography>
                  <Typography variant="body2">
                    {project.projectLeader ? project.projectLeader.name : "Non assigné"}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progression:
                    </Typography>
                    <Typography variant="body2">{project.progress || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress || 0}
                    color={
                      project.progress >= 75
                        ? "success"
                        : project.progress >= 25
                        ? "warning"
                        : "error"
                    }
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                  <Tooltip title="Membres de l'équipe">
                    <Badge
                      badgeContent={project.team ? project.team.length : 0}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <Group color="action" />
                    </Badge>
                  </Tooltip>
                  
                  <Tooltip title="Tâches">
                    <Badge
                      badgeContent={project.tasks ? project.tasks.length : 0}
                      color="secondary"
                    >
                      <AssignmentTurnedIn color="action" />
                    </Badge>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ padding: 2 }}>
        <Paper sx={{ padding: 2, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h4" component="h1">
              Gestion des Projets
            </Typography>
            
            <Box>
              {userRole === "admin" && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={handleCreateProject}
                  sx={{ mr: 2 }}
                >
                  Nouveau Projet
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPDF}
              >
                Exporter PDF
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Box sx={{ flexGrow: 1, display: "flex" }}>
              <TextField
                label="Rechercher"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 2, width: 250 }}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                }}
              />
              
              <FormControl variant="outlined" size="small" sx={{ mr: 2, width: 150 }}>
                <InputLabel>Priorité</InputLabel>
                <Select
                  label="Priorité"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="high">Haute</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="low">Basse</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" size="small" sx={{ width: 150 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="planning">Planification</MenuItem>
                  <MenuItem value="in-progress">En cours</MenuItem>
                  <MenuItem value="completed">Terminé</MenuItem>
                  <MenuItem value="on-hold">En attente</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showMyProjects}
                  onChange={(e) => setShowMyProjects(e.target.checked)}
                />
              }
              label="Mes projets"
            />
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<InsertChart />}
                iconPosition="start"
                label="Tous les projets"
              />
              <Tab
                icon={<Schedule />}
                iconPosition="start"
                label="En cours"
              />
              <Tab
                icon={<CheckCircle />}
                iconPosition="start"
                label="Terminés"
              />
              <Tab
                icon={<Flag />}
                iconPosition="start"
                label="En attente"
              />
            </Tabs>
          </Box>
        </Paper>

        {renderProjectCards()}
      </Box>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleProjectClick(selectedProject?._id);
          handleMenuClose();
        }}>
          Voir les détails
        </MenuItem>
        
        {(userRole === "admin" || (userRole === "projectLeader" && selectedProject?.projectLeader?._id === currentUser.id)) && (
          <>
            <MenuItem onClick={handleEditModalOpen}>Modifier</MenuItem>
            <MenuItem onClick={handleTeamDialogOpen}>Gérer l'équipe</MenuItem>
            <MenuItem onClick={handleTaskDialogOpen}>Ajouter une tâche</MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteModalOpen} sx={{ color: "error.main" }}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Edit Project Modal */}
      <Dialog open={editOpen} onClose={handleEditModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="projectName"
            label="Nom du projet"
            type="text"
            fullWidth
            variant="outlined"
            value={editedProject.projectName}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Description"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={editedProject.description}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="deadline"
            label="Échéance"
            type="date"
            fullWidth
            variant="outlined"
            value={editedProject.deadline}
            onChange={handleEditChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="budget"
            label="Budget (€)"
            type="number"
            fullWidth
            variant="outlined"
            value={editedProject.budget}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priorité</InputLabel>
            <Select
              name="priority"
              value={editedProject.priority}
              label="Priorité"
              onChange={handleEditChange}
            >
              <MenuItem value="high">Haute</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="low">Basse</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              name="status"
              value={editedProject.status}
              label="Statut"
              onChange={handleEditChange}
            >
              <MenuItem value="planning">Planification</MenuItem>
              <MenuItem value="in-progress">En cours</MenuItem>
              <MenuItem value="completed">Terminé</MenuItem>
              <MenuItem value="on-hold">En attente</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditModalClose}>Annuler</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteModalClose}>
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le projet "{selectedProject?.projectName}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Management Dialog */}
      <Dialog
        open={teamDialogOpen}
        onClose={handleTeamDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Gestion de l'équipe</DialogTitle>
        <DialogContent>
          <List>
            {employees.map((employee) => (
              <ListItem key={employee._id}>
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={employee.name}
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
                          newTeam = [...currentTeam, employee];
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
                    />
                  }
                  label=""
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTeamDialogClose}>Annuler</Button>
          <Button
            onClick={() => handleTeamUpdate(selectedProject?.team || [])}
            variant="contained"
            color="primary"
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={handleTaskDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter une nouvelle tâche</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Titre de la tâche"
            type="text"
            fullWidth
            variant="outlined"
            value={taskForm.title}
            onChange={handleTaskChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Description"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={taskForm.description}
            onChange={handleTaskChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assigner à</InputLabel>
            <Select
              name="assignedTo"
              value={taskForm.assignedTo}
              label="Assigner à"
              onChange={handleTaskChange}
            >
              <MenuItem value="">Non assigné</MenuItem>
              {selectedProject?.team?.map((member) => (
                <MenuItem key={member._id} value={member._id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="deadline"
            label="Échéance"
            type="date"
            fullWidth
            variant="outlined"
            value={taskForm.deadline}
            onChange={handleTaskChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Priorité</InputLabel>
            <Select
              name="priority"
              value={taskForm.priority}
              label="Priorité"
              onChange={handleTaskChange}
            >
              <MenuItem value="high">Haute</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="low">Basse</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTaskDialogClose}>Annuler</Button>
          <Button
            onClick={handleTaskSubmit}
            variant="contained"
            color="primary"
            startIcon={<AddTask />}
          >
            Ajouter la tâche
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
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProjectListPage;