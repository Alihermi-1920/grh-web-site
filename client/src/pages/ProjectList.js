// src/pages/ProjectList.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  DateRange as DateRangeIcon,
  Flag as FlagIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Home as HomeIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ProjectList = () => {
  const navigate = useNavigate();
  
  // États pour les projets
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState("");
  
  // État pour la suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // État pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Récupérer les projets au chargement du composant
  useEffect(() => {
    fetchProjects();
  }, []);
  
  // Filtrer les projets lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = projects.filter(project => 
        project.projectName.toLowerCase().includes(term) ||
        (project.description && project.description.toLowerCase().includes(term)) ||
        (project.projectLeader && 
          ((project.projectLeader.firstName && project.projectLeader.firstName.toLowerCase().includes(term)) ||
           (project.projectLeader.lastName && project.projectLeader.lastName.toLowerCase().includes(term))))
      );
      setFilteredProjects(filtered);
    }
    setPage(0); // Revenir à la première page après filtrage
  }, [searchTerm, projects]);

  // Fonction pour récupérer les projets
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/projects");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des projets");
      }
      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un projet
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectToDelete._id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }
      
      // Mettre à jour la liste des projets
      setProjects(prevProjects => 
        prevProjects.filter(project => project._id !== projectToDelete._id)
      );
      
      setSnackbar({
        open: true,
        message: "Projet supprimé avec succès",
        severity: "success"
      });
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message || "Erreur lors de la suppression du projet",
        severity: "error"
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  // Fonctions pour la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonction pour ouvrir la boîte de dialogue de suppression
  const openDeleteDialog = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // Fonction pour fermer la boîte de dialogue de suppression
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  // Fonction pour fermer la notification
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Fonction pour obtenir la couleur de la priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  // Fonction pour obtenir le libellé de la priorité en français
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Haute";
      case "medium":
        return "Moyenne";
      case "low":
        return "Basse";
      default:
        return "Non définie";
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case "planning":
        return "info";
      case "in-progress":
        return "warning";
      case "completed":
        return "success";
      case "on-hold":
        return "error";
      default:
        return "default";
    }
  };

  // Fonction pour obtenir le libellé du statut en français
  const getStatusLabel = (status) => {
    switch (status) {
      case "planning":
        return "Planification";
      case "in-progress":
        return "En cours";
      case "completed":
        return "Terminé";
      case "on-hold":
        return "En pause";
      default:
        return "Non défini";
    }
  };

  // Afficher un écran de chargement
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "300px" }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
          Chargement des projets...
        </Typography>
      </Box>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchProjects}>
          Réessayer
        </Button>
      </Box>
    );
  }

  // Calculer les projets à afficher selon la pagination
  const displayedProjects = filteredProjects
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link 
            underline="hover" 
            color="inherit" 
            href="/" 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Accueil
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 0.5 }} fontSize="small" />
            Gestion des Projets
          </Typography>
        </Breadcrumbs>

        {/* En-tête avec titre et bouton d'ajout */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Gestion des Projets
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/addproject")}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
            }}
          >
            Nouveau Projet
          </Button>
        </Box>

        {/* Barre de recherche */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <TextField
            placeholder="Rechercher un projet..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 1.5 }
            }}
            sx={{ flex: 1, minWidth: '200px' }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Paper>

        {/* Liste des projets */}
        {filteredProjects.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun projet trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ? "Essayez de modifier vos critères de recherche." : "Commencez par créer un nouveau projet."}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/addproject")}
              >
                Créer un projet
              </Button>
            )}
          </Paper>
        ) : (
          <Paper 
            elevation={3} 
            sx={{
              overflow: 'hidden',
              borderRadius: 2,
              '& .MuiTableCell-head': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 'bold',
              },
            }}
          >
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width="5%">N°</TableCell>
                    <TableCell width="25%">Projet</TableCell>
                    <TableCell width="15%">Chef de projet</TableCell>
                    <TableCell width="10%">Date limite</TableCell>
                    <TableCell width="10%">Priorité</TableCell>
                    <TableCell width="10%">Statut</TableCell>
                    <TableCell width="15%">Progression</TableCell>
                    <TableCell width="10%" align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedProjects.map((project, index) => (
                    <TableRow 
                      key={project._id}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        },
                      }}
                    >
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main', 
                              width: 40, 
                              height: 40,
                              mr: 1.5
                            }}
                          >
                            {project.projectName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {project.projectName}
                            </Typography>
                            {project.description && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  maxWidth: 300,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {project.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {project.projectLeader ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={project.projectLeader.photo ? `/${project.projectLeader.photo.split(/(\\|\/)/g).pop()}` : undefined}
                              sx={{ width: 30, height: 30, mr: 1 }}
                            >
                              {project.projectLeader.firstName?.charAt(0) || ''}
                              {project.projectLeader.lastName?.charAt(0) || ''}
                            </Avatar>
                            <Typography variant="body2">
                              {project.projectLeader.firstName} {project.projectLeader.lastName}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non assigné
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.deadline ? (
                          <Chip
                            icon={<DateRangeIcon />}
                            label={format(new Date(project.deadline), 'dd MMM yyyy', { locale: fr })}
                            size="small"
                            color={new Date(project.deadline) < new Date() ? "error" : "default"}
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non définie
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<FlagIcon />}
                          label={getPriorityLabel(project.priority)}
                          size="small"
                          color={getPriorityColor(project.priority)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(project.status)}
                          size="small"
                          color={getStatusColor(project.status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={project.completionPercentage || 0} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 5,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 5,
                                }
                              }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {project.completionPercentage || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/editproject/${project._id}`)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => openDeleteDialog(project)}
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
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProjects.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </Paper>
        )}
      </Box>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Confirmer la suppression
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, mt: 1 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action est irréversible.
          </Alert>
          <Typography variant="body1">
            Êtes-vous sûr de vouloir supprimer le projet :
            <Box component="span" fontWeight="bold" sx={{ mx: 1 }}>
              {projectToDelete?.projectName}
            </Box>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Toutes les tâches associées à ce projet seront également supprimées.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDeleteDialog} variant="outlined">
            Annuler
          </Button>
          <Button onClick={handleDeleteProject} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

export default ProjectList;
