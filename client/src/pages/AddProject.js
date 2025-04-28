// src/pages/AddProject.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Snackbar,
  Grid,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link
} from "@mui/material";
import { 
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  DateRange as DateRangeIcon,
  Flag as FlagIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Home as HomeIcon
} from "@mui/icons-material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';

const AddProject = () => {
  // État du formulaire
  const [formData, setFormData] = useState({
    projectName: "",
    projectLeader: "",
    deadline: null,
    description: "",
    priority: "medium"
  });

  // États pour la gestion des chefs
  const [chefs, setChefs] = useState([]);
  const [loadingChefs, setLoadingChefs] = useState(false);

  // États pour la validation et les notifications
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [loading, setLoading] = useState(false);

  // Récupérer la liste des chefs au chargement du composant
  useEffect(() => {
    fetchChefs();
  }, []);

  // Fonction pour récupérer les chefs depuis l'API
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

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Effacer l'erreur pour ce champ s'il y en a une
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Gérer le changement de date
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      deadline: date
    });
    
    // Effacer l'erreur pour la date s'il y en a une
    if (errors.deadline) {
      setErrors({
        ...errors,
        deadline: null
      });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = "Le nom du projet est requis";
    }
    
    if (!formData.projectLeader) {
      newErrors.projectLeader = "Le chef de projet est requis";
    }
    
    if (!formData.deadline) {
      newErrors.deadline = "La date limite est requise";
    } else if (new Date(formData.deadline) < new Date()) {
      newErrors.deadline = "La date limite ne peut pas être dans le passé";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "La description du projet est requise";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du projet");
      }
      
      // Réinitialiser le formulaire
      setFormData({
        projectName: "",
        projectLeader: "",
        deadline: null,
        description: "",
        priority: "medium"
      });
      
      // Afficher un message de succès
      setSnackbar({
        open: true,
        message: "Projet créé avec succès!",
        severity: "success"
      });
      
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: error.message || "Une erreur est survenue",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fermer la notification
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg">
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
          <Link
            underline="hover"
            color="inherit"
            href="/projects"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <AssignmentIcon sx={{ mr: 0.5 }} fontSize="small" />
            Projets
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 0.5 }} fontSize="small" />
            Nouveau Projet
          </Typography>
        </Breadcrumbs>

        <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText', 
              py: 3,
              px: 3,
              textAlign: 'center',
              backgroundImage: 'linear-gradient(120deg, #1976d2 0%, #64b5f6 100%)'
            }}
          >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
              <AssignmentIcon sx={{ fontSize: 36, mr: 1, verticalAlign: 'middle' }} />
              Créer un Nouveau Projet
            </Typography>
          </Box>
          
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Nom du projet */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontSize: '1.1rem', 
                    color: 'primary.main', 
                    fontWeight: 500, 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
                    Informations du projet
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Nom du projet"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    error={!!errors.projectName}
                    helperText={errors.projectName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AssignmentIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <DatePicker
                      label="Date limite"
                      value={formData.deadline}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.deadline}
                          helperText={errors.deadline}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DateRangeIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                            }
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl 
                    fullWidth 
                    error={!!errors.projectLeader} 
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  >
                    <InputLabel id="project-leader-label">Chef de projet</InputLabel>
                    <Select
                      labelId="project-leader-label"
                      name="projectLeader"
                      value={formData.projectLeader}
                      label="Chef de projet"
                      onChange={handleChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <SupervisorAccountIcon color="primary" />
                        </InputAdornment>
                      }
                      disabled={loadingChefs}
                    >
                      {loadingChefs ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Chargement des chefs...
                        </MenuItem>
                      ) : chefs.length === 0 ? (
                        <MenuItem disabled>Aucun chef disponible</MenuItem>
                      ) : (
                        chefs.map((chef) => (
                          <MenuItem key={chef._id} value={chef._id}>
                            {chef.firstName} {chef.lastName}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    <FormHelperText>{errors.projectLeader}</FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl 
                    fullWidth 
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  >
                    <InputLabel id="priority-label">Priorité</InputLabel>
                    <Select
                      labelId="priority-label"
                      name="priority"
                      value={formData.priority}
                      label="Priorité"
                      onChange={handleChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <FlagIcon color="primary" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="low">
                        <Chip 
                          label="Basse" 
                          size="small" 
                          color="success" 
                          variant="outlined" 
                          sx={{ mr: 1 }} 
                        />
                        Basse priorité
                      </MenuItem>
                      <MenuItem value="medium">
                        <Chip 
                          label="Moyenne" 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                          sx={{ mr: 1 }} 
                        />
                        Priorité moyenne
                      </MenuItem>
                      <MenuItem value="high">
                        <Chip 
                          label="Haute" 
                          size="small" 
                          color="error" 
                          variant="outlined" 
                          sx={{ mr: 1 }} 
                        />
                        Haute priorité
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description du projet"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={!!errors.description}
                    helperText={errors.description}
                    multiline
                    rows={4}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                          <DescriptionIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                      sx={{ 
                        py: 1.5,
                        px: 6,
                        fontSize: "1.1rem",
                        textTransform: "none",
                        minWidth: 250,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)'
                      }}
                    >
                      {loading ? "Création en cours..." : "Créer le projet"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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

export default AddProject;
