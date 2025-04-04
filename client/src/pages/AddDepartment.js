// src/pages/AddDepartment.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
} from "@mui/material";
import { AddBusiness, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Liste des départements principaux (en minuscules pour la comparaison)
const principalDepartments = ["rh", "it", "marketing"];

const AddDepartment = () => {
  // État pour le formulaire d'ajout
  const [departmentName, setDepartmentName] = useState("");
  const [error, setError] = useState("");

  // Liste des départements récupérée depuis l'API
  const [departments, setDepartments] = useState([]);

  // États pour la modale d'édition
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // États pour la modale de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  // Fonction pour récupérer la liste des départements
  const fetchDepartments = () => {
    fetch("http://localhost:5000/api/departments")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des départements");
        return res.json();
      })
      .then((data) => setDepartments(data))
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Ajout d'un département
  const handleAddDepartment = async (e) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      setError("Le nom du département est requis");
      return;
    }

    // Vérifier si le département existe déjà (sans tenir compte de la casse)
    if (departments.some((dept) => dept.name.toLowerCase() === departmentName.trim().toLowerCase())) {
      setError("Ce département existe déjà");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: departmentName.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de l'ajout du département");
        return;
      }

      // Réinitialiser le formulaire et rafraîchir la liste
      setDepartmentName("");
      setError("");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur");
    }
  };

  // Exporter la liste des départements en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Départements", 14, 20);
    const tableColumn = ["N°", "Nom du Département", "Principal"];
    const tableRows = departments.map((dept, index) => [
      index + 1,
      dept.name,
      principalDepartments.includes(dept.name.toLowerCase()) ? "Oui" : "Non",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save("departments.pdf");
  };

  // Ouvrir la modale d'édition
  const handleEditModalOpen = (department) => {
    setSelectedDepartment(department);
    setEditModalOpen(true);
  };

  // Fermer la modale d'édition
  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedDepartment(null);
  };

  // Mettre à jour un département
  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !selectedDepartment.name.trim()) {
      setError("Le nom du département est requis");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/departments/${selectedDepartment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedDepartment.name.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de la mise à jour");
        return;
      }

      fetchDepartments();
      handleEditModalClose();
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur");
    }
  };

  // Ouvrir la modale de suppression
  const handleDeleteModalOpen = (department) => {
    setDepartmentToDelete(department);
    setDeleteModalOpen(true);
  };

  // Fermer la modale de suppression
  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  // Supprimer un département
  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/departments/${departmentToDelete._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de la suppression");
        return;
      }

      fetchDepartments();
      handleDeleteModalClose();
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur");
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      {/* Formulaire d'ajout de département */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
            <AddBusiness sx={{ fontSize: 40, verticalAlign: "middle", mr: 1 }} />
            Nouveau Département
          </Typography>
        </Box>
        <form onSubmit={handleAddDepartment}>
          <TextField
            fullWidth
            label="Nom du département"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setDepartmentName("");
                setError("");
              }}
            >
              Annuler
            </Button>
            <Button type="submit" variant="contained">
              Enregistrer
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Bouton pour exporter en PDF */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleExportPDF}>
          Exporter en PDF
        </Button>
      </Box>

      {/* Liste des départements */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Liste des Départements
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {departments && departments.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">N°</TableCell>
                  <TableCell>Nom du Département</TableCell>
                  <TableCell align="center">Principal</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept, index) => (
                  <TableRow key={dept._id}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                      {dept.name}{" "}
                      {principalDepartments.includes(dept.name.toLowerCase()) && (
                        <Chip label="Principal" color="primary" size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {principalDepartments.includes(dept.name.toLowerCase()) ? "Oui" : "Non"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEditModalOpen(dept)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteModalOpen(dept)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>Aucun département enregistré.</Typography>
        )}
      </Paper>

      {/* Modale d'édition */}
      <Dialog open={editModalOpen} onClose={handleEditModalClose}>
        <DialogTitle>Modifier le Département</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom du Département"
            value={selectedDepartment ? selectedDepartment.name : ""}
            onChange={(e) =>
              setSelectedDepartment({
                ...selectedDepartment,
                name: e.target.value,
              })
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditModalClose}>Annuler</Button>
          <Button onClick={handleUpdateDepartment} variant="contained" color="primary">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modale de confirmation de suppression */}
      <Dialog open={deleteModalOpen} onClose={handleDeleteModalClose}>
        <DialogTitle>Confirmer la Suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous vraiment supprimer ce département ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Annuler</Button>
          <Button onClick={handleDeleteDepartment} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddDepartment;
