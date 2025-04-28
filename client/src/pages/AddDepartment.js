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
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  InputAdornment,
  Fade,
  Zoom,
  CircularProgress,
  TablePagination,
  useTheme,
  alpha,
  Breadcrumbs,
  Link,
  Stack,
  LinearProgress
} from "@mui/material";
import {
  AddBusiness,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business,
  Search,
  PictureAsPdf,
  Refresh,
  Home,
  FilterList,
  Add,
  Check,
  Close,
  Info,
  Warning,
  Star,
  StarBorder
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";

// Simplified version - no principal departments distinction

const AddDepartment = () => {
  const theme = useTheme();

  // État pour le formulaire d'ajout
  const [departmentName, setDepartmentName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Liste des départements récupérée depuis l'API
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  // État pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // États pour la modale d'édition
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // États pour la modale de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  // Fonction pour récupérer la liste des départements
  const fetchDepartments = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/departments")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des départements");
        return res.json();
      })
      .then((data) => {
        setDepartments(data);
        setFilteredDepartments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
        showSnackbar("Erreur lors de la récupération des départements", "error");
      });
  };

  // Afficher un message de notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Filtrer les départements en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDepartments(departments);
    } else {
      const filtered = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDepartments(filtered);
    }
  }, [searchQuery, departments]);

  // Charger les départements au montage
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Ajout d'un département
  const handleAddDepartment = async (e) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      setError("Le nom du département est requis");
      showSnackbar("Le nom du département est requis", "error");
      return;
    }

    // Vérifier si le département existe déjà (sans tenir compte de la casse)
    if (departments.some((dept) => dept.name.toLowerCase() === departmentName.trim().toLowerCase())) {
      setError("Ce département existe déjà");
      showSnackbar("Ce département existe déjà", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: departmentName.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de l'ajout du département");
        showSnackbar(data.message || "Erreur lors de l'ajout du département", "error");
        setLoading(false);
        return;
      }

      // Réinitialiser le formulaire et rafraîchir la liste
      setDepartmentName("");
      setError("");
      fetchDepartments();
      showSnackbar(`Département "${departmentName.trim()}" ajouté avec succès`, "success");
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur");
      showSnackbar("Erreur de connexion au serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  // Exporter la liste des départements en PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Ajouter un en-tête avec la date
      const today = new Date();
      const dateStr = today.toLocaleDateString('fr-FR');
      const timeStr = today.toLocaleTimeString('fr-FR');

      // Titre
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text("Liste des Départements", 105, 15, { align: "center" });

      // Sous-titre avec date et heure
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${dateStr} à ${timeStr}`, 105, 22, { align: "center" });

      // Statistiques
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text(`Nombre total de départements: ${departments.length}`, 14, 30);

      // Tableau
      const tableColumn = ["N°", "Nom du Département", "ID"];
      const tableRows = departments.map((dept, index) => [
        index + 1,
        dept.name,
        dept._id,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        rowPageBreak: 'auto',
        bodyStyles: { valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 60, fontSize: 8 }
        },
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} sur ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: "center" });
        doc.text("HRMS - Système de Gestion des Ressources Humaines", 105, doc.internal.pageSize.height - 5, { align: "center" });
      }

      doc.save("liste_departements.pdf");
      showSnackbar("PDF généré avec succès", "success");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      showSnackbar("Erreur lors de la génération du PDF", "error");
    }
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      showSnackbar("Le nom du département est requis", "error");
      return;
    }

    // Vérifier si le nom existe déjà (sauf pour le département en cours d'édition)
    if (departments.some(dept =>
      dept._id !== selectedDepartment._id &&
      dept.name.toLowerCase() === selectedDepartment.name.trim().toLowerCase()
    )) {
      setError("Ce nom de département existe déjà");
      showSnackbar("Ce nom de département existe déjà", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/departments/${selectedDepartment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedDepartment.name.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de la mise à jour");
        showSnackbar(data.message || "Erreur lors de la mise à jour", "error");
        setLoading(false);
        return;
      }

      fetchDepartments();
      handleEditModalClose();
      showSnackbar("Département mis à jour avec succès", "success");
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur");
      showSnackbar("Erreur de connexion au serveur", "error");
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/departments/${departmentToDelete._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur lors de la suppression");
        showSnackbar(data.message || "Erreur lors de la suppression", "error");
        setLoading(false);
        return;
      }

      fetchDepartments();
      handleDeleteModalClose();
      showSnackbar(`Département "${departmentToDelete.name}" supprimé avec succès`, "success");
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur");
      showSnackbar("Erreur de connexion au serveur", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculer les départements à afficher en fonction de la pagination
  const paginatedDepartments = filteredDepartments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Fil d'Ariane */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Tableau de bord
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Business sx={{ mr: 0.5 }} fontSize="inherit" />
          Gestion des Départements
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={3}>
        {/* Colonne de gauche - Formulaire d'ajout */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                overflow: 'visible',
                height: '100%',
                position: 'relative'
              }}
            >
              {loading && (
                <LinearProgress
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8
                  }}
                />
              )}

              <CardHeader
                title="Nouveau Département"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <AddBusiness />
                  </Avatar>
                }
                sx={{ pb: 0 }}
              />

              <CardContent>
                <form onSubmit={handleAddDepartment}>
                  <TextField
                    fullWidth
                    label="Nom du département"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    error={!!error}
                    helperText={error}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    placeholder="Ex: Ressources Humaines"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDepartmentName("");
                        setError("");
                      }}
                      startIcon={<Close />}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Add />}
                      disabled={loading}
                    >
                      Ajouter
                    </Button>
                  </Box>
                </form>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="h5" color="primary.main">
                      {departments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Départements
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={handleExportPDF}
                    startIcon={<PictureAsPdf />}
                    disabled={loading || departments.length === 0}
                  >
                    Exporter en PDF
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Colonne de droite - Liste des départements */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 2, overflow: 'visible' }}>
              {loading && (
                <LinearProgress
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8
                  }}
                />
              )}

              <CardHeader
                title="Liste des Départements"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                action={
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Actualiser">
                      <IconButton onClick={fetchDepartments} disabled={loading}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              />

              <Divider />

              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un département..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery("")}>
                          <Close fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                />

                {filteredDepartments.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    {searchQuery ? (
                      <Typography color="text.secondary">
                        Aucun département ne correspond à votre recherche
                      </Typography>
                    ) : (
                      <Typography color="text.secondary">
                        Aucun département enregistré
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell width="10%" align="center">N°</TableCell>
                            <TableCell width="70%">Nom du Département</TableCell>
                            <TableCell width="20%" align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedDepartments.map((dept, index) => (
                            <TableRow
                              key={dept._id}
                              hover
                              sx={{
                                '&:last-child td, &:last-child th': { border: 0 }
                              }}
                            >
                              <TableCell align="center">
                                {page * rowsPerPage + index + 1}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      mr: 1.5,
                                      bgcolor: theme.palette.primary.main,
                                      color: 'white'
                                    }}
                                  >
                                    {dept.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1">
                                      {dept.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ID: {dept._id}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Modifier">
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleEditModalOpen(dept)}
                                    size="small"
                                    sx={{ mr: 1 }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDeleteModalOpen(dept)}
                                    size="small"
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
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredDepartments.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Lignes par page:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                    />
                  </>
                )}
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Modale d'édition */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditModalClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            Modifier le Département
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedDepartment && (
            <>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                ID: {selectedDepartment._id}
              </Typography>
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
                error={!!error}
                helperText={error}
                sx={{ mt: 1 }}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  ),
                }}
              />


            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleEditModalClose}
            startIcon={<Close />}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpdateDepartment}
            variant="contained"
            color="primary"
            startIcon={<Check />}
            disabled={loading}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modale de confirmation de suppression */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteModalClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Confirmer la Suppression
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {departmentToDelete && (
            <Typography>
              Voulez-vous vraiment supprimer le département <strong>{departmentToDelete.name}</strong> ?
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteModalClose}
            startIcon={<Close />}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteDepartment}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default AddDepartment;
