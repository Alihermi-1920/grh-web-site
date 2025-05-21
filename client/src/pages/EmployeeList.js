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
  Cake,
  Wc,
  CalendarMonth,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



// Composant principal pour la liste des employés
const EmployeeListPage = () => {
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
    department: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    cin: "",
    birthDate: "",
    gender: "",
    hireDate: "",
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
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/employees`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors de la récupération des employés");
        }
        return res.json();
      })
      .then((data) => {
        // Sort employees to show newest first (assuming they have createdAt or _id with timestamp)
        const sortedData = [...data].sort((a, b) => {
          // If createdAt exists, use it for sorting
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          // Otherwise use _id which contains a timestamp in MongoDB
          return b._id.localeCompare(a._id);
        });

        setEmployees(sortedData);
        setFilteredEmployees(sortedData);

        // Extraire les départements et les rôles uniques pour les filtres
        const uniqueDepartments = [...new Set(data.map(emp => emp.department))].filter(Boolean);
        const uniqueRoles = [...new Set(data.map(emp => emp.role))].filter(Boolean);

        setDepartments(uniqueDepartments);
        setRoles(uniqueRoles);
        setLoading(false);

        // Récupérer les chefs
        fetchChefs();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Fonction pour récupérer la liste des chefs
  const fetchChefs = async () => {
    setLoadingChefs(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/employees/chefs`);
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

    // Filtre par département
    if (departmentFilter !== "all") {
      result = result.filter((emp) => emp.department === departmentFilter);
    }

    // Filtre par rôle
    if (roleFilter !== "all") {
      result = result.filter((emp) => emp.role === roleFilter);
    }

    // Filtre par chef
    if (chefFilter !== "all") {
      result = result.filter((emp) => {
        // Check if chefId exists and is an object with _id property
        if (emp.chefId && typeof emp.chefId === 'object' && emp.chefId._id) {
          return emp.chefId._id === chefFilter;
        }

        // If chefId is a string (just the ID), compare directly
        if (emp.chefId && typeof emp.chefId === 'string') {
          return emp.chefId === chefFilter;
        }

        return false;
      });
    }

    setFilteredEmployees(result);
    setPage(0); // Retour à la première page après filtrage
  }, [filterValue, departmentFilter, roleFilter, chefFilter, employees]);

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
    // Créer un nouveau document PDF en orientation paysage pour mieux accommoder toutes les colonnes
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Définir les couleurs professionnelles
    const primaryColor = [52, 73, 94]; // #34495e
    const secondaryColor = [41, 128, 185]; // #2980b9
    const lightGrayColor = [245, 245, 245]; // #f5f5f5
    const darkGrayColor = [100, 100, 100]; // #646464
    const blackColor = [0, 0, 0]; // #000000

    // Ajouter le logo et l'en-tête
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Ajouter un rectangle de couleur en haut de la page
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Ajouter le titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("HRMS - Liste des Employés", pageWidth / 2, 12, { align: "center" });

    // Ajouter les informations du document
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...darkGrayColor);

    // Ajouter la date et les informations de filtrage
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(`Date d'exportation: ${date}`, 15, 35);

    // Ajouter les informations de filtrage
    let filterInfo = "Filtres appliqués: ";
    if (departmentFilter !== "all") {
      filterInfo += `Département: ${departmentFilter}, `;
    }
    if (roleFilter !== "all") {
      filterInfo += `Rôle: ${roleFilter}, `;
    }
    if (chefFilter !== "all") {
      const selectedChef = chefs.find(chef => chef._id === chefFilter);
      if (selectedChef) {
        filterInfo += `Chef: ${selectedChef.firstName} ${selectedChef.lastName}, `;
      }
    }
    if (filterValue) {
      filterInfo += `Recherche: "${filterValue}", `;
    }

    // Si aucun filtre n'est appliqué
    if (filterInfo === "Filtres appliqués: ") {
      filterInfo += "Aucun";
    } else {
      // Supprimer la virgule finale
      filterInfo = filterInfo.slice(0, -2);
    }

    doc.text(filterInfo, 15, 42);

    // Ajouter le nombre total d'employés
    doc.setFont('helvetica', 'bold');
    doc.text(`Nombre total d'employés: ${filteredEmployees.length}`, pageWidth - 15, 35, { align: "right" });

    // Ajouter la date d'impression
    doc.setFont('helvetica', 'normal');
    doc.text(`Imprimé le: ${date}`, pageWidth - 15, 42, { align: "right" });

    // Préparer les colonnes avec des largeurs optimisées
    const tableColumn = [
      { header: "N°", dataKey: "num", width: 10 },
      { header: "Prénom", dataKey: "firstName", width: 25 },
      { header: "Nom", dataKey: "lastName", width: 25 },
      { header: "CIN", dataKey: "cin", width: 20 },
      { header: "Département", dataKey: "department", width: 30 },
      { header: "Rôle", dataKey: "role", width: 25 },
      { header: "Email", dataKey: "email", width: 45 },
      { header: "Téléphone", dataKey: "phone", width: 25 },
      { header: "Date d'embauche", dataKey: "hireDate", width: 25 },
      { header: "Chef", dataKey: "chef", width: 30 }
    ];

    // Préparer les données sous forme d'objets pour une meilleure lisibilité
    const tableData = filteredEmployees.map((emp, index) => {
      let chefName = "-";
      if (emp.chefId && typeof emp.chefId === 'object' && emp.chefId.firstName) {
        chefName = `${emp.chefId.firstName} ${emp.chefId.lastName}`;
      }

      return {
        num: index + 1,
        firstName: emp.firstName || "-",
        lastName: emp.lastName || "-",
        cin: emp.cin || "-",
        department: emp.department || "-",
        role: emp.role || "-",
        email: emp.email || "-",
        phone: emp.phone || "-",
        hireDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-FR') : "-",
        chef: chefName
      };
    });

    // Générer la table dans le PDF avec un design professionnel
    autoTable(doc, {
      columns: tableColumn,
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [...primaryColor, 0.3],
        lineWidth: 0.1,
        font: 'helvetica',
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: 'center',
        cellPadding: 5
      },
      bodyStyles: {
        textColor: blackColor
      },
      alternateRowStyles: {
        fillColor: lightGrayColor
      },
      columnStyles: {
        num: { halign: 'center' },
        cin: { halign: 'center' },
        phone: { halign: 'center' },
        hireDate: { halign: 'center' }
      },
      didDrawPage: function(data) {
        // Ajouter un pied de page sur chaque page
        const pageNumber = doc.internal.getNumberOfPages();
        const totalPages = doc.internal.getNumberOfPages();

        // Ajouter une ligne de séparation
        doc.setDrawColor(...darkGrayColor);
        doc.setLineWidth(0.5);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        // Ajouter le numéro de page
        doc.setFontSize(9);
        doc.setTextColor(...darkGrayColor);
        doc.text(
          `Page ${pageNumber} sur ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );

        // Ajouter le nom de l'entreprise
        doc.setFont('helvetica', 'italic');
        doc.text(
          "Delice Centre Laitier Nord - HRMS",
          15,
          pageHeight - 10
        );

        // Ajouter la date d'impression
        doc.text(
          `Exporté le ${date}`,
          pageWidth - 15,
          pageHeight - 10,
          { align: "right" }
        );

        // Ajouter l'en-tête sur chaque page sauf la première
        if (pageNumber > 1) {
          // Ajouter un rectangle de couleur en haut de la page
          doc.setFillColor(...primaryColor);
          doc.rect(0, 0, pageWidth, 15, 'F');

          // Ajouter le titre
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(255, 255, 255);
          doc.text("HRMS - Liste des Employés (suite)", pageWidth / 2, 10, { align: "center" });
        }
      }
    });

    // Sauvegarder le PDF avec un nom incluant la date
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`liste-employes-${dateStr}.pdf`);

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
      department: employee.department || "",
      email: employee.email || "",
      password: "", // Always set password field to empty
      role: employee.role || "",
      phone: employee.phone || "",
      cin: employee.cin || "",
      birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : "",
      gender: employee.gender || "",
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : "",
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
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${API_URL}/api/employees/${selectedEmployee._id}`,
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
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${API_URL}/api/employees/${employeeToDelete._id}`,
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
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 4,
          gap: 2
        }}>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Gestion des Employés
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gérez tous vos employés en un seul endroit
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: 2,
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'space-between', md: 'flex-end' }
          }}>
            <Card
              elevation={0}
              sx={{
                minWidth: 140,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
                boxShadow: '0 8px 16px rgba(142, 45, 226, 0.2)'
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="overline" sx={{ color: 'white', opacity: 0.8 }}>
                  Total Employés
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {employees.length}
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                minWidth: 140,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)',
                boxShadow: '0 8px 16px rgba(0, 131, 176, 0.2)'
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="overline" sx={{ color: 'white', opacity: 0.8 }}>
                  Départements
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {departments.length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Filtres et boutons d'action */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: theme => theme.palette.mode === 'dark'
              ? 'linear-gradient(to right bottom, rgba(30, 30, 60, 0.7), rgba(20, 20, 40, 0.7))'
              : 'linear-gradient(to right bottom, rgba(240, 249, 255, 0.7), rgba(224, 243, 255, 0.7))',
            backdropFilter: 'blur(10px)',
            border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
                    borderRadius: 2,
                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                <FormControl
                  variant="outlined"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  <InputLabel id="department-filter-label">Département</InputLabel>
                  <Select
                    labelId="department-filter-label"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    label="Département"
                    startAdornment={
                      <InputAdornment position="start">
                        <Business fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Tous les départements</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  variant="outlined"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  <InputLabel id="role-filter-label">Rôle</InputLabel>
                  <Select
                    labelId="role-filter-label"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    label="Rôle"
                    startAdornment={
                      <InputAdornment position="start">
                        <Work fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Tous les rôles</MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                  }
                }}
              >
                <InputLabel id="chef-filter-label">Chef responsable</InputLabel>
                <Select
                  labelId="chef-filter-label"
                  value={chefFilter}
                  onChange={(e) => setChefFilter(e.target.value)}
                  label="Chef responsable"
                  disabled={loadingChefs}
                  startAdornment={
                    loadingChefs ? (
                      <InputAdornment position="start">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ) : (
                      <InputAdornment position="start">
                        <SupervisorAccount fontSize="small" />
                      </InputAdornment>
                    )
                  }
                >
                  <MenuItem value="all">Tous les chefs</MenuItem>
                  {chefs.map((chef) => (
                    <MenuItem key={chef._id} value={chef._id}>
                      {chef.firstName} {chef.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleExportPDF}
                startIcon={<PictureAsPdf />}
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: theme => theme.palette.mode === 'dark' ? '#2c3e50' : '#34495e',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'dark' ? '#34495e' : '#2c3e50',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }
                }}
              >
                Exporter PDF
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tableau des employés - Design professionnel */}
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {filteredEmployees.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Aucun employé trouvé avec les critères sélectionnés.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  maxHeight: 'calc(100vh - 250px)', // Adjusted for better balance
                  '& .MuiTableHead-root': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }
                }}
              >
                <Table
                  stickyHeader
                  aria-label="employee table"
                  sx={{
                    '& .MuiTableCell-body': {
                      padding: '16px 12px',
                      fontSize: '0.95rem'
                    }
                  }}>
                  <TableHead sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    '& .MuiTableCell-root': {
                      backgroundColor: theme => theme.palette.mode === 'dark'
                        ? '#1e2a3a'
                        : '#f5f5f7',
                      fontWeight: 600,
                      color: 'text.primary',
                      borderBottom: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      padding: '16px 12px',
                      fontSize: '0.95rem'
                    }
                  }}>
                    <TableRow>
                      <TableCell
                        align="center"
                        width={50}
                      >
                        N°
                      </TableCell>
                      <TableCell
                        align="center"
                        width={80}
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Photo
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Prénom
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Nom
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        CIN
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Cake fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                          Date de naissance
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Wc fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                          Genre
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Département
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Email
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Rôle
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Chef responsable
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Téléphone
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarMonth fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                          Date d'embauche
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        width={120}
                        sx={{
                          fontWeight: 600,
                          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          color: 'text.primary'
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedEmployees.map((emp, index) => (
                      <TableRow
                        key={emp._id}
                        hover
                        sx={{
                          transition: 'background-color 0.2s',
                          '&:nth-of-type(odd)': {
                            backgroundColor: theme => theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(0, 0, 0, 0.01)',
                          },
                          '&:hover': {
                            backgroundColor: theme => theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.04)',
                          },
                          borderBottom: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
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
                        <TableCell>
                          {emp.cin ? (
                            <Chip
                              label={emp.cin}
                              size="small"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace' }}
                            />
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('fr-FR') : "-"}
                        </TableCell>
                        <TableCell>
                          {emp.gender || "-"}
                        </TableCell>
                        <TableCell>
                          {emp.department || "-"}
                        </TableCell>
                        <TableCell>{emp.email || "-"}</TableCell>

                        <TableCell>
                          {emp.role ? (
                            <Chip
                              label={emp.role}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {emp.chefId ? (
                            <Typography variant="body2">
                              {emp.chefId.firstName} {emp.chefId.lastName}
                            </Typography>
                          ) : (
                            emp.role === "Chef" ? "N/A" : "Non assigné"
                          )}
                        </TableCell>
                        <TableCell>{emp.phone || "-"}</TableCell>
                        <TableCell>
                          {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-FR') : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="Modifier">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditModalOpen(emp)}
                                size="medium"
                                sx={{
                                  mr: 1.5,
                                  p: 1.5
                                }}
                              >
                                <EditIcon fontSize="medium" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteModalOpen(emp)}
                                size="medium"
                                sx={{ p: 1.5 }}
                              >
                                <DeleteIcon fontSize="medium" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderTop: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              }}>
                <Typography variant="body2" color="text.secondary">
                  Total: <strong>{filteredEmployees.length}</strong> employés
                </Typography>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 15, 20]}
                  component="div"
                  count={filteredEmployees.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                  sx={{
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                      margin: 0,
                    },
                    '.MuiTablePagination-toolbar': {
                      paddingLeft: 1,
                      paddingRight: 1,
                    }
                  }}
                />
              </Box>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Département"
                fullWidth
                value={editedEmployee.department}
                onChange={(e) => setEditedEmployee({...editedEmployee, department: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Rôle"
                fullWidth
                value={editedEmployee.role}
                onChange={(e) => setEditedEmployee({...editedEmployee, role: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Work fontSize="small" />
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
            <Grid item xs={12}>
              <TextField
                label="Mot de passe"
                type="password"
                fullWidth
                value={editedEmployee.password}
                onChange={(e) => setEditedEmployee({...editedEmployee, password: e.target.value})}
                helperText="Laissez vide pour conserver le mot de passe actuel"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey fontSize="small" />
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date de naissance"
                type="date"
                fullWidth
                value={editedEmployee.birthDate}
                onChange={(e) => setEditedEmployee({...editedEmployee, birthDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={editedEmployee.gender}
                  onChange={(e) => setEditedEmployee({...editedEmployee, gender: e.target.value})}
                  label="Genre"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Wc fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="Homme">Homme</MenuItem>
                  <MenuItem value="Femme">Femme</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date d'embauche"
                type="date"
                fullWidth
                value={editedEmployee.hireDate}
                onChange={(e) => setEditedEmployee({...editedEmployee, hireDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
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

export default EmployeeListPage;