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
  Select,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import { Assignment, MoreVert, PictureAsPdf } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProjectListPage = () => {
  // État principal
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour le menu contextuel
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // États pour la modal d'édition
  const [editOpen, setEditOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    projectName: "",
    description: "",
    deadline: "",
    priority: "",
  });

  // État pour la modal de confirmation de suppression
  const [deleteOpen, setDeleteOpen] = useState(false);

  // État pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info", // 'success', 'error', 'info', 'warning'
  });

  // Récupération des projets depuis l'API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/projects");
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de récupérer les projets`);
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
        console.error("Erreur lors de la récupération des projets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Formatage de la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString();
  };

  // GESTION DU MENU CONTEXTUEL
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // GESTION DE L'ÉDITION
  const handleEditModalOpen = () => {
    if (!selectedProject) return;
    
    setEditedProject({
      projectName: selectedProject.projectName || "",
      description: selectedProject.description || "",
      deadline: selectedProject.deadline
        ? new Date(selectedProject.deadline).toISOString().split("T")[0]
        : "",
      priority: selectedProject.priority || "",
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
      
      // Mise à jour de l'état local
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

  // GESTION DE LA SUPPRESSION
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
      
      // Mise à jour de l'état local
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

  // EXPORTATION EN PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const title = "Liste des Projets";
      
      // Titre du document
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      doc.setLineWidth(0.5);
      doc.line(14, 22, 80, 22);
      
      // Préparation des colonnes
      const tableColumn = [
        "N°",
        "Nom du projet",
        "Description",
        "Date limite",
        "Priorité",
        "Chef de projet",
      ];
      
      // Préparation des données
      const tableRows = projects.map((proj, index) => [
        index + 1,
        proj.projectName,
        proj.description ? (proj.description.length > 30 
          ? proj.description.substring(0, 30) + "..." 
          : proj.description) 
        : "-",
        formatDate(proj.deadline),
        proj.priority 
          ? proj.priority.charAt(0).toUpperCase() + proj.priority.slice(1) 
          : "-",
        proj.projectLeader 
          ? `${proj.projectLeader.firstName} ${proj.projectLeader.lastName}`
          : "-",
      ]);
      
      // Génération du tableau
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 66, 155],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
      });
      
      // Date de génération en bas de page
      const dateStr = new Date().toLocaleDateString();
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Généré le ${dateStr} - Page ${i} / ${pageCount}`,
          doc.internal.pageSize.width - 60,
          doc.internal.pageSize.height - 10
        );
      }
      
      doc.save("liste-projets.pdf");
      
      setSnackbar({
        open: true,
        message: "PDF exporté avec succès",
        severity: "success",
      });
    } catch (error) {
      console.error("Erreur lors de l'exportation PDF:", error);
      setSnackbar({
        open: true,
        message: "Erreur lors de l'exportation PDF",
        severity: "error",
      });
    }
  };

  // Gestion de la fermeture du snackbar
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Affichage du chargement
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        sx={{ minHeight: "300px" }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Chargement des projets...
        </Typography>
      </Box>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  // Rendu principal
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* En-tête avec titre et bouton d'export */}
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 4,
          flexDirection: { xs: "column", sm: "row" },
          gap: 2
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", fontSize: { xs: "1.5rem", md: "2rem" } }}
        >
          Liste des Projets
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleExportPDF}
          startIcon={<PictureAsPdf />}
        >
          Exporter en PDF
        </Button>
      </Box>

      {/* Message si aucun projet n'existe */}
      {projects.length === 0 ? (
        <Box sx={{ textAlign: "center", my: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Aucun projet disponible
          </Typography>
          <Button variant="contained" color="primary" href="/projects/new">
            Créer un nouveau projet
          </Button>
        </Box>
      ) : (
        /* Grille des projets */
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: project.priority === "haute" ? "error.main" : 
                                 project.priority === "moyenne" ? "warning.main" : "success.main",
                        width: 56,
                        height: 56,
                      }}
                    >
                      <Assignment sx={{ fontSize: 32 }} />
                    </Avatar>
                  }
                  action={
                    <IconButton
                      aria-label="options"
                      onClick={(event) => handleMenuClick(event, project)}
                    >
                      <MoreVert />
                    </IconButton>
                  }
                  title={
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {project.projectName}
                    </Typography>
                  }
                  subheader={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Date limite: {formatDate(project.deadline)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: project.priority === "haute" ? "error.main" : 
                                 project.priority === "moyenne" ? "warning.main" : "success.main",
                          fontWeight: "bold"
                        }}
                      >
                        Priorité: {project.priority 
                          ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1) 
                          : "-"}
                      </Typography>
                    </>
                  }
                  sx={{ pb: 0 }}
                />
                <Divider />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {project.description || "Aucune description fournie."}
                  </Typography>
                
                  {/* Chef de projet */}
                  {project.projectLeader && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mr: 1, fontWeight: 500 }}
                      >
                        Chef de projet:
                      </Typography>
                      <Avatar
                        src={
                          project.projectLeader.photo
                            ? `/${project.projectLeader.photo.split(/(\\|\/)/g).pop()}`
                            : undefined
                        }
                        alt={`${project.projectLeader.firstName} ${project.projectLeader.lastName}`}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {project.projectLeader.firstName} {project.projectLeader.lastName}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Équipe */}
                  {project.team && project.team.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 500 }}
                      >
                        Équipe ({project.team.length}):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                        {project.team.map((member) => (
                          <Avatar
                            key={member._id}
                            src={
                              member.photo
                                ? `/${member.photo.split(/(\\|\/)/g).pop()}`
                                : undefined
                            }
                            alt={`${member.firstName} ${member.lastName}`}
                            title={`${member.firstName} ${member.lastName}`}
                            sx={{ width: 32, height: 32, mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu des options (Modifier / Supprimer) */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleEditModalOpen}>Modifier</MenuItem>
        <MenuItem onClick={handleDeleteModalOpen} sx={{ color: "error.main" }}>
          Supprimer
        </MenuItem>
      </Menu>

      {/* Modal d'édition */}
      <Dialog 
        open={editOpen} 
        onClose={handleEditModalClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Modifier le Projet</DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="normal"
            label="Nom du projet"
            name="projectName"
            fullWidth
            value={editedProject.projectName}
            onChange={handleEditChange}
            required
            autoFocus
          />
          <TextField
            margin="normal"
            label="Description"
            name="description"
            fullWidth
            multiline
            rows={3}
            value={editedProject.description}
            onChange={handleEditChange}
          />
          <TextField
            margin="normal"
            label="Date limite"
            name="deadline"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={editedProject.deadline}
            onChange={handleEditChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="priority-label">Priorité</InputLabel>
            <Select
              labelId="priority-label"
              name="priority"
              value={editedProject.priority}
              label="Priorité"
              onChange={handleEditChange}
            >
              <MenuItem value="">-</MenuItem>
              <MenuItem value="basse">Basse</MenuItem>
              <MenuItem value="moyenne">Moyenne</MenuItem>
              <MenuItem value="haute">Haute</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditModalClose}>Annuler</Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained" 
            color="primary"
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog 
        open={deleteOpen} 
        onClose={handleDeleteModalClose}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le projet 
            "{selectedProject?.projectName}" ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Annuler</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectListPage;