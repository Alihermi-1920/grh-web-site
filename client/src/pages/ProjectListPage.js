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
} from "@mui/material";
import { Assignment, MoreVert } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProjectListPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Menu d'options pour chaque carte
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // États pour la modale d'édition
  const [editOpen, setEditOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    projectName: "",
    description: "",
    deadline: "",
    priority: "",
    // Pour simplifier, nous n'implémentons pas l'édition du leader ou de l'équipe dans ce formulaire
  });

  // États pour la modale de suppression
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Snackbar pour les notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // Récupération des projets depuis l'API
  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des projets");
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Gestion du menu d'options
  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Ouvrir la modale d'édition
  const handleEditModalOpen = () => {
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

  // Fermer la modale d'édition
  const handleEditModalClose = () => {
    setEditOpen(false);
    setSelectedProject(null);
  };

  // Sauvegarder les modifications du projet via l'API
  const handleEditSave = async () => {
    const updatedProject = { ...selectedProject, ...editedProject };
    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProject),
        }
      );
      if (!response.ok) throw new Error("Erreur lors de la modification du projet");
      const data = await response.json();
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj._id === selectedProject._id ? data : proj))
      );
      setSnackbar({ open: true, message: "Projet modifié avec succès." });
      handleEditModalClose();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Erreur lors de la modification du projet." });
    }
  };

  // Ouvrir la modale de suppression
  const handleDeleteModalOpen = () => {
    setDeleteOpen(true);
    handleMenuClose();
  };

  // Fermer la modale de suppression
  const handleDeleteModalClose = () => {
    setDeleteOpen(false);
    setSelectedProject(null);
  };

  // Confirmer la suppression du projet via l'API
  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${selectedProject._id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Erreur lors de la suppression du projet");
      setProjects((prevProjects) =>
        prevProjects.filter((proj) => proj._id !== selectedProject._id)
      );
      setSnackbar({ open: true, message: "Projet supprimé avec succès !" });
      handleDeleteModalClose();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Erreur lors de la suppression du projet." });
    }
  };

  // Exporter la liste des projets en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Projets", 14, 20);
    // Préparation des colonnes
    const tableColumn = [
      "N°",
      "Nom",
      "Description",
      "Deadline",
      "Priorité",
    ];
    // Préparation des données
    const tableRows = projects.map((proj, index) => [
      index + 1,
      proj.projectName,
      proj.description,
      proj.deadline ? new Date(proj.deadline).toLocaleDateString() : "-",
      proj.priority ? proj.priority.charAt(0).toUpperCase() + proj.priority.slice(1) : "-",
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save("projects.pdf");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: "200px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", fontSize: "2rem" }}
        >
          Liste des Projets
        </Typography>
        <Button variant="contained" color="primary" onClick={handleExportPDF}>
          Exporter en PDF
        </Button>
      </Box>
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project._id}>
            <Card
              sx={{
                height: "100%",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 64,
                      height: 64,
                    }}
                  >
                    <Assignment sx={{ fontSize: 36 }} />
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
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {project.projectName}
                  </Typography>
                }
                subheader={
                  project.deadline
                    ? `Deadline : ${new Date(project.deadline).toLocaleDateString()}`
                    : "Pas de deadline"
                }
                sx={{ pb: 0 }}
              />
              <Divider />
              <CardContent>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2, fontSize: "1.1rem" }}
                >
                  {project.description || "Aucune description fournie."}
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1, fontSize: "1.1rem" }}>
                  Priorité :{" "}
                  {project.priority
                    ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
                    : "-"}
                </Typography>
                {project.projectLeader && (
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mr: 1, fontWeight: 500, fontSize: "1.1rem" }}
                    >
                      Leader :
                    </Typography>
                    <Avatar
                      src={
                        project.projectLeader.photo
                          ? `/${project.projectLeader.photo.split(/(\\|\/)/g).pop()}`
                          : undefined
                      }
                      alt={`${project.projectLeader.firstName} ${project.projectLeader.lastName}`}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Typography variant="subtitle2" sx={{ ml: 1, fontSize: "1.1rem" }}>
                      {project.projectLeader.firstName} {project.projectLeader.lastName}
                    </Typography>
                  </Box>
                )}
                {project.team && project.team.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mr: 1, fontWeight: "bold", fontSize: "1.1rem" }}
                    >
                      Équipe :
                    </Typography>
                    {project.team.map((member) => (
                      <Avatar
                        key={member._id}
                        src={
                          member.photo
                            ? `/${member.photo.split(/(\\|\/)/g).pop()}`
                            : undefined
                        }
                        alt={`${member.firstName} ${member.lastName}`}
                        sx={{ width: 40, height: 40, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Menu des options (Modifier / Supprimer) */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleEditModalOpen}>Modifier</MenuItem>
        <MenuItem onClick={handleDeleteModalOpen}>Supprimer</MenuItem>
      </Menu>

      {/* Modale d'édition */}
      <Dialog open={editOpen} onClose={handleEditModalClose}>
        <DialogTitle>Modifier le Projet</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nom"
            fullWidth
            value={editedProject.projectName}
            onChange={(e) =>
              setEditedProject({ ...editedProject, projectName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={editedProject.description}
            onChange={(e) =>
              setEditedProject({ ...editedProject, description: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Deadline"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={editedProject.deadline}
            onChange={(e) =>
              setEditedProject({ ...editedProject, deadline: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Priorité"
            fullWidth
            value={editedProject.priority}
            onChange={(e) =>
              setEditedProject({ ...editedProject, priority: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditModalClose}>Annuler</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modale de suppression */}
      <Dialog open={deleteOpen} onClose={handleDeleteModalClose}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous vraiment supprimer ce projet ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ProjectListPage;
