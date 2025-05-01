// src/pages/ChefEmployeeList.js
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
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  Link,
  Container,
  TablePagination,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  PictureAsPdf,
  Home,
  FilterList,
  Search,
  Person,
  Badge,
  Business,
  Email,
  Phone,
  VpnKey,
  Work,
  CreditCard,
  SupervisorAccount,
} from "@mui/icons-material";
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

// Composant principal pour la liste des employés du chef
const ChefEmployeeList = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // États pour le filtrage
  const [filterValue, setFilterValue] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [chefFilter, setChefFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loadingChefs, setLoadingChefs] = useState(false);

  // États pour la modale d'édition
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editedEmployee, setEditedEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cin: "",
  });

  // États pour la modale de confirmation de suppression
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // État pour le Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  // Fonction pour récupérer la liste des chefs
  const fetchChefs = async () => {
    setLoadingChefs(true);
    try {
      const response = await fetch("http://localhost:5000/api/employees/chefs");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des chefs");
      }
      const data = await response.json();
      setChefs(data);
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: "Erreur lors de la récupération des chefs",
        severity: "error"
      });
    } finally {
      setLoadingChefs(false);
    }
  };

  // Filtrer les employés selon les critères
  useEffect(() => {
    let result = employees;

    // Filtre par texte (nom, prénom, email, téléphone, CIN)
    if (filterValue) {
      const searchTerm = filterValue.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.firstName?.toLowerCase().includes(searchTerm) ||
          emp.lastName?.toLowerCase().includes(searchTerm) ||
          emp.email?.toLowerCase().includes(searchTerm) ||
          emp.phone?.includes(searchTerm) ||
          emp.cin?.includes(searchTerm)
      );
    }

    setFilteredEmployees(result);
    setPage(0); // Retour à la première page après filtrage
  }, [filterValue, employees]);

  // Gérer les changements de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gérer les changements du nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonction pour exporter la liste des employés en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Ajouter un en-tête pour le document
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("HRMS - Liste des employés", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const date = new Date().toLocaleDateString();
    doc.text(`Généré le: ${date}`, 105, 22, { align: "center" });

    doc.line(14, 25, 196, 25); // Ligne de séparation

    // Préparer les colonnes
    const tableColumn = [
      "N°",
      "Prénom",
      "Nom",
      "CIN",
      "Département",
      "Email",
      "Rôle",
      "Téléphone",
    ];

    // Préparer les données (utiliser les employés filtrés)
    const tableRows = filteredEmployees.map((emp, index) => [
      index + 1,
      emp.firstName || "-",
      emp.lastName || "-",
      emp.cin || "-",
      emp.department || "-",
      emp.email || "-",
      emp.role || "-",
      emp.phone || "-",
    ]);

    // Générer la table dans le PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [44, 62, 80],
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });

    // Ajouter un pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} sur ${pageCount}`, 105, doc.internal.pageSize.height - 10, {
        align: "center",
      });
    }

    // Sauvegarder le PDF
    doc.save("employees-list.pdf");

    // Notification de succès
    setSnackbar({
      open: true,
      message: "Le fichier PDF a été généré avec succès!",
      severity: "success",
    });
  };

  // Ouvrir la modale d'édition et initialiser les valeurs des champs
  const handleEditModalOpen = (employee) => {
    setSelectedEmployee(employee);
    setEditedEmployee({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      cin: employee.cin || "",
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la modification");
      }

      const data = await response.json();

      // Mettre à jour la liste des employés
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp._id === selectedEmployee._id ? data : emp
        )
      );

      setSnackbar({
        open: true,
        message: "Employé modifié avec succès.",
        severity: "success"
      });

      handleEditModalClose();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message || "Erreur lors de la modification de l'employé."}`,
        severity: "error"
      });
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }

      // Mettre à jour la liste des employés
      setEmployees((prevEmployees) =>
        prevEmployees.filter((emp) => emp._id !== employeeToDelete._id)
      );

      setSnackbar({
        open: true,
        message: "L'employé a été supprimé avec succès!",
        severity: "success",
      });

      handleDeleteModalClose();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message || "Erreur lors de la suppression de l'employé."}`,
        severity: "error",
      });
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

  // Utiliser les employés filtrés pour l'affichage paginé
  const displayedEmployees = filteredEmployees
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="small" />
            Accueil
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 0.5 }} fontSize="small" />
            Gestion des employés
          </Typography>
        </Breadcrumbs>

        {/* Titre de la page et statistiques */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Gestion des Employés
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Card sx={{ minWidth: 120, bgcolor: 'primary.light' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="overline" sx={{ color: 'primary.contrastText' }}>
                  Total
                </Typography>
                <Typography variant="h5" sx={{ color: 'primary.contrastText' }}>
                  {employees.length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Filtres et boutons d'action */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={10}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleExportPDF}
              startIcon={<PictureAsPdf />}
              sx={{ height: '100%' }}
            >
              Exporter PDF
            </Button>
          </Grid>
        </Grid>

        {/* Tableau des employés */}
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
                  setDepartmentFilter('all');
                  setRoleFilter('all');
                  setChefFilter('all');
                }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                <Table stickyHeader aria-label="employee table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" width={50}>N°</TableCell>
                      <TableCell align="center" width={80}>Photo</TableCell>
                      <TableCell>Prénom</TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>CIN</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell align="center" width={80}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedEmployees.map((emp, index) => (
                      <TableRow
                        key={emp._id}
                        hover
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: 'rgba(0, 0, 0, 0.03)',
                          },
                        }}
                      >
                        <TableCell align="center">
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell align="center">
                          {emp.photo ? (
                            <Avatar
                              src={`/${emp.photo.split(/(\\|\/)/g).pop()}`}
                              alt={`${emp.firstName} ${emp.lastName}`}
                              sx={{ width: 50, height: 50, mx: 'auto' }}
                            />
                          ) : (
                            <Avatar sx={{ width: 50, height: 50, mx: 'auto', bgcolor: 'primary.main' }}>
                              {emp.firstName?.[0] || ''}{emp.lastName?.[0] || ''}
                            </Avatar>
                          )}
                        </TableCell>
                        <TableCell>{emp.firstName || "-"}</TableCell>
                        <TableCell>{emp.lastName || "-"}</TableCell>
                        <TableCell>
                          {emp.cin ? (
                            <Chip
                              label={emp.cin}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace' }}
                            />
                          ) : "-"}
                        </TableCell>
                        <TableCell>{emp.email || "-"}</TableCell>
                        <TableCell>{emp.phone || "-"}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Modifier">
                            <IconButton
                              color="primary"
                              onClick={() => handleEditModalOpen(emp)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
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
                count={filteredEmployees.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              />
            </>
          )}
        </Paper>
      </Box>

      {/* Modale d'édition */}
      <Dialog
        open={editOpen}
        onClose={handleEditModalClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            Modifier l'employé
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                fullWidth
                value={editedEmployee.firstName}
                onChange={(e) => setEditedEmployee({...editedEmployee, firstName: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                fullWidth
                value={editedEmployee.lastName}
                onChange={(e) => setEditedEmployee({...editedEmployee, lastName: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                value={editedEmployee.email}
                onChange={(e) => setEditedEmployee({...editedEmployee, email: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Téléphone"
                fullWidth
                value={editedEmployee.phone}
                onChange={(e) => setEditedEmployee({...editedEmployee, phone: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CIN"
                fullWidth
                value={editedEmployee.cin}
                onChange={(e) => setEditedEmployee({...editedEmployee, cin: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCard fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleEditModalClose} variant="outlined">
            Annuler
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default ChefEmployeeList;