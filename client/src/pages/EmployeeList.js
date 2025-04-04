// src/pages/EmployeeList.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
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
  TextField,
  Button,
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
// Import jsPDF et le plugin autotable en tant que fonction
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Composant pour masquer / afficher le mot de passe
const MaskedPassword = ({ password }) => {
  const [visible, setVisible] = useState(false);
  const toggleVisibility = () => setVisible((prev) => !prev);

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography variant="body2" sx={{ mr: 0.5 }}>
        {visible ? password : "••••••••"}
      </Typography>
      <IconButton onClick={toggleVisibility} size="small">
        {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </Box>
  );
};

const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la modale d'édition
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editedEmployee, setEditedEmployee] = useState({
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    password: "",
    role: "",
    phone: "",
  });

  // États pour la modale de confirmation de suppression
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // État pour le Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  // Récupération de la liste des employés depuis l'API
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors de la récupération des employés");
        }
        return res.json();
      })
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Fonction pour exporter la liste des employés en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des employés", 14, 20);
    // Préparer les colonnes
    const tableColumn = [
      "N°",
      "Prénom",
      "Nom",
      "Département",
      "Email",
      "Rôle",
      "Téléphone",
    ];
    // Préparer les données
    const tableRows = employees.map((emp, index) => [
      index + 1,
      emp.firstName,
      emp.lastName,
      emp.department,
      emp.email,
      emp.role,
      emp.phone,
    ]);

    // Générer la table dans le PDF via autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    // Sauvegarder le PDF
    doc.save("employees.pdf");
  };

  // Ouvrir la modale d'édition et initialiser les valeurs des champs
  const handleEditModalOpen = (employee) => {
    setSelectedEmployee(employee);
    setEditedEmployee({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      department: employee.department || "",
      email: employee.email || "",
      password: employee.plainPassword || "",
      role: employee.role || "",
      phone: employee.phone || "",
    });
    setEditOpen(true);
  };

  // Fermer la modale d'édition
  const handleEditModalClose = () => {
    setEditOpen(false);
    setSelectedEmployee(null);
  };

  // Sauvegarder la modification de l'employé via l'API
  const handleEditSave = async () => {
    const updatedEmployee = { ...selectedEmployee, ...editedEmployee };

    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${selectedEmployee._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEmployee),
        }
      );
      if (!response.ok) throw new Error("Erreur lors de la modification");
      const data = await response.json();
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp._id === selectedEmployee._id ? data : emp
        )
      );
      setSnackbar({ open: true, message: "Employé modifié avec succès." });
      handleEditModalClose();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Erreur lors de la modification de l'employé." });
    }
  };

  // Ouvrir la modale de confirmation de suppression
  const handleDeleteModalOpen = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteOpen(true);
  };

  // Fermer la modale de suppression
  const handleDeleteModalClose = () => {
    setDeleteOpen(false);
    setEmployeeToDelete(null);
  };

  // Confirmer la suppression de l'employé via l'API
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${employeeToDelete._id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      setEmployees((prevEmployees) =>
        prevEmployees.filter((emp) => emp._id !== employeeToDelete._id)
      );
      setSnackbar({
        open: true,
        message: "L'employé a été supprimé avec succès !",
      });
      handleDeleteModalClose();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Erreur lors de la suppression de l'employé.",
      });
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "200px" }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement...</Typography>
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Liste des employés
      </Typography>

      {/* Bouton pour exporter en PDF */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleExportPDF}
        sx={{ mb: 2 }}
      >
        Exporter en PDF
      </Button>

      <TableContainer component={Paper}>
        <Table aria-label="employee table">
          <TableHead>
            <TableRow>
              <TableCell>N°</TableCell>
              <TableCell>Photo</TableCell>
              <TableCell>Prénom</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Département</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mot de passe</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp, index) => (
              <TableRow key={emp._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {emp.photo ? (
                    <img
                      src={`/${emp.photo.split(/(\\|\/)/g).pop()}`}
                      alt={`${emp.firstName} ${emp.lastName}`}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{emp.firstName}</TableCell>
                <TableCell>{emp.lastName}</TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>{emp.email || "-"}</TableCell>
                <TableCell>
                  <MaskedPassword password={emp.plainPassword || ""} />
                </TableCell>
                <TableCell>{emp.role || "-"}</TableCell>
                <TableCell>{emp.phone || "-"}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditModalOpen(emp)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteModalOpen(emp)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modale d'édition */}
      <Dialog open={editOpen} onClose={handleEditModalClose}>
        <DialogTitle>Modifier l'employé</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Prénom"
            fullWidth
            value={editedEmployee.firstName}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                firstName: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Nom"
            fullWidth
            value={editedEmployee.lastName}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                lastName: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Département"
            fullWidth
            value={editedEmployee.department}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                department: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={editedEmployee.email}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                email: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Mot de passe"
            type="password"
            fullWidth
            value={editedEmployee.password}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                password: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Rôle"
            fullWidth
            value={editedEmployee.role}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                role: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Téléphone"
            fullWidth
            value={editedEmployee.phone}
            onChange={(e) =>
              setEditedEmployee({
                ...editedEmployee,
                phone: e.target.value,
              })
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

      {/* Modale de confirmation de suppression */}
      <Dialog open={deleteOpen} onClose={handleDeleteModalClose}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous vraiment supprimer cet employé ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default EmployeeListPage;
