// src/pages/ChefEmployeeList.js
// Fichier simplifié pour afficher la liste des employés d'un chef
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
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
  Alert,
  Avatar,
  Grid,
  InputAdornment,
  Container,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Search,
  Email,
  Phone,
  Badge,
  CreditCard,
  Delete as DeleteIcon,
} from "@mui/icons-material";
// Import pour l'export PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Documentation: Material-UI - https://mui.com/material-ui/getting-started/overview/
// Documentation: React Hooks - https://reactjs.org/docs/hooks-intro.html

// Composant principal pour la liste des employés du chef

// Composant principal pour la liste des employés du chef
const ChefEmployeeList = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État pour la recherche simple
  const [filterValue, setFilterValue] = useState("");

  // États pour la suppression
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // États pour le Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fonctions pour la gestion de la suppression
  const handleDeleteModalOpen = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteOpen(true);
  };

  const handleDeleteModalClose = () => {
    setDeleteOpen(false);
    setEmployeeToDelete(null);
  };

  const handleDeleteConfirm = () => {
    // Cette fonction est conservée mais n'est pas implémentée dans cette version simplifiée
    setDeleteOpen(false);
    setEmployeeToDelete(null);
  };

  // Récupération de la liste des employés depuis l'API
  useEffect(() => {
    if (!user || !user._id) return;

    // Fetch only employees assigned to this chef
    fetch(`http://localhost:5000/api/employees/chef/${user._id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors de la récupération des employés");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Employees for chef:", data);
        setEmployees(data);
        setFilteredEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);

        // Fallback: fetch all employees and filter by chef
        fetch("http://localhost:5000/api/employees")
          .then((res) => {
            if (!res.ok) {
              throw new Error("Erreur lors de la récupération des employés");
            }
            return res.json();
          })
          .then((allEmployees) => {
            console.log("All employees:", allEmployees);
            console.log("Current chef ID:", user._id);

            // Filter employees to only include those assigned to this chef
            const myEmployees = allEmployees.filter(emp =>
              emp.role === "employee" &&
              (emp.chefId === user._id ||
               (emp.chefId && typeof emp.chefId === 'object' && emp.chefId._id === user._id))
            );

            console.log("Filtered employees for chef:", myEmployees);
            setEmployees(myEmployees);
            setFilteredEmployees(myEmployees);
            setLoading(false);
          })
          .catch((error) => {
            setError(error.message);
            setLoading(false);
          });
      });
  }, [user]);

  // Fonction pour filtrer les employés selon le texte de recherche
  const filterEmployees = (searchText) => {
    if (!searchText) {
      return employees;
    }
    
    const searchTerm = searchText.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.firstName?.toLowerCase().includes(searchTerm) ||
        emp.lastName?.toLowerCase().includes(searchTerm) ||
        emp.email?.toLowerCase().includes(searchTerm) ||
        emp.phone?.includes(searchTerm) ||
        emp.cin?.includes(searchTerm)
    );
  };

  // Mettre à jour les employés filtrés quand la recherche change
  useEffect(() => {
    setFilteredEmployees(filterEmployees(filterValue));
  }, [filterValue, employees]);

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
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </Box>
    );
  }

  // Tous les employés filtrés sont affichés (pas de pagination)
  const displayedEmployees = filteredEmployees;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Contenu principal */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Mes Employés
          </Typography>
          
        </Box>

        {/* Barre de recherche simplifiée */}
        <Paper sx={{ mb: 3, p: 2 }}>
          {/* Commentaire: Utilisation de TextField de Material UI pour la recherche */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher par nom, email, téléphone ou CIN..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ mb: 1 }}
          />
          
          {/* Affichage du nombre total d'employés */}
          <Typography variant="body2">
            Nombre total d'employés: {employees.length}
          </Typography>
        </Paper>

        {/* Tableau des employés simplifié */}
        <Paper sx={{ overflow: 'hidden' }}>
          {filteredEmployees.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Aucun employé trouvé avec les critères sélectionnés.
              </Typography>
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                onClick={() => {
                  setFilterValue('');
                }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          ) : (
            <>
              {/* Commentaire: TableContainer pour rendre le tableau responsive */}
              <TableContainer>
                {/* Commentaire: Table de Material UI pour afficher les données */}
                <Table aria-label="employee table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" width={50}>N°</TableCell>
                      <TableCell align="center" width={80}>Photo</TableCell>
                      <TableCell>Prénom</TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>CIN</TableCell>
                      <TableCell>Genre</TableCell>
                      <TableCell>Date de naissance</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Téléphone</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedEmployees.map((emp, index) => (
                      <TableRow key={emp._id}>
                        <TableCell align="center">
                          {index + 1}
                        </TableCell>
                        <TableCell align="center">
                          {emp.photo ? (
                            <Avatar
                              src={`/${emp.photo.split(/(\\|\/)/g).pop()}`}
                              alt={`${emp.firstName} ${emp.lastName}`}
                              sx={{ width: 45, height: 45, mx: 'auto' }}
                            />
                          ) : (
                            <Avatar sx={{ width: 45, height: 45, mx: 'auto', bgcolor: 'primary.main' }}>
                              {emp.firstName?.[0] || ''}{emp.lastName?.[0] || ''}
                            </Avatar>
                          )}
                        </TableCell>
                        <TableCell>{emp.firstName || "-"}</TableCell>
                        <TableCell>{emp.lastName || "-"}</TableCell>
                        <TableCell>{emp.cin || "-"}</TableCell>
                        <TableCell>{emp.gender || "-"}</TableCell>
                        <TableCell>{emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('fr-FR') : "-"}</TableCell>
                        <TableCell>{emp.email || "-"}</TableCell>
                        <TableCell>{emp.phone || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              
            </>
          )}
        </Paper>

        {/* Modale de confirmation de suppression */}
        <Dialog
          open={deleteOpen}
          onClose={handleDeleteModalClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Confirmer la suppression
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cette action est irréversible.
            </Alert>
            <Typography variant="body1">
              Êtes-vous sûr de vouloir supprimer l'employé :
              <Box component="span" fontWeight="bold" sx={{ mx: 1 }}>
                {employeeToDelete?.firstName} {employeeToDelete?.lastName}
              </Box>?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleDeleteModalClose} variant="outlined">
              Annuler
            </Button>
            <Button onClick={handleDeleteConfirm} variant="contained" color="error" startIcon={<DeleteIcon />}>
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default ChefEmployeeList;