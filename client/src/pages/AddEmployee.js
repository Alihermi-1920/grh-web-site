// src/pages/AddEmployee.js
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
  Avatar,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Zoom,
  CircularProgress,
  Alert as MuiAlert
} from "@mui/material";
import {
  PersonAdd,
  Email,
  Lock,
  WorkOutline,
  Business,
  CalendarMonth,
  PhotoCamera,
  Info,
  CheckCircle,
  ContactPhone,
  CreditCard,
  SupervisorAccount,
  Cake,
  Wc
} from "@mui/icons-material";

// Composant Alert pour le Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const AddEmployee = ({ onSuccess, departments }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    cin: "",
    birthDate: "",
    gender: "",
    department: "",
    role: "",
    position: "",
    hireDate: "",
    chefId: ""
  });

  // État pour le fichier photo et son aperçu
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // État pour la liste des chefs
  const [chefs, setChefs] = useState([]);
  const [loadingChefs, setLoadingChefs] = useState(false);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Charger la liste des chefs
  useEffect(() => {
    if (formData.role === "Employé") {
      fetchChefs();
    }
  }, [formData.role]);

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "Champ requis";
    if (!formData.lastName) newErrors.lastName = "Champ requis";
    if (!formData.email) {
      newErrors.email = "Champ requis";
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.password) newErrors.password = "Champ requis";

    // Validation stricte pour le numéro de téléphone (exactement 8 chiffres)
    if (!formData.phone) {
      newErrors.phone = "Champ requis";
    } else if (!/^\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Numéro invalide (exactement 8 chiffres requis)";
    }

    // Validation pour le CIN (exactement 8 chiffres)
    if (!formData.cin) {
      newErrors.cin = "Champ requis";
    } else if (!/^\d{8}$/.test(formData.cin)) {
      newErrors.cin = "CIN invalide (exactement 8 chiffres requis)";
    }
    // Note: La vérification de l'unicité du CIN est faite de manière asynchrone
    // dans handleNumberInput et handleSubmit

    if (!formData.department) newErrors.department = "Sélectionnez un département";
    if (!formData.role) newErrors.role = "Sélectionnez un rôle";

    // Validation du chef si le rôle est "Employé"
    if (formData.role === "Employé" && !formData.chefId) {
      newErrors.chefId = "Sélectionnez un chef responsable";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction pour limiter l'entrée aux chiffres seulement
  const handleNumberInput = (e, maxLength) => {
    // Bloquer les caractères non numériques
    if (!/^[0-9]*$/.test(e.target.value)) {
      return;
    }

    // Limiter la longueur à maxLength
    if (e.target.value.length <= maxLength) {
      setFormData({ ...formData, [e.target.name]: e.target.value });

      // Si c'est le CIN et qu'il a 8 chiffres, vérifier s'il existe déjà
      if (e.target.name === "cin" && e.target.value.length === 8) {
        checkCinExists(e.target.value);
      }
    }
  };

  // Fonction pour vérifier si un CIN existe déjà
  const checkCinExists = async (cin) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/check-cin/${cin}`);
      const data = await response.json();

      if (data.exists) {
        setErrors({...errors, cin: "Ce CIN est déjà utilisé par un autre employé"});
      } else {
        // Si le CIN n'existe pas, on supprime l'erreur s'il y en avait une
        const newErrors = {...errors};
        delete newErrors.cin;
        setErrors(newErrors);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du CIN:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Vérification finale des champs critiques
      if (formData.phone.length !== 8 || formData.cin.length !== 8) {
        setSnackbar({
          open: true,
          message: "Le téléphone et le CIN doivent contenir exactement 8 chiffres.",
          severity: "error"
        });
        return;
      }

      // Vérifier si le CIN existe déjà
      try {
        const cinResponse = await fetch(`http://localhost:5000/api/employees/check-cin/${formData.cin}`);
        const cinData = await cinResponse.json();

        if (cinData.exists) {
          setErrors({...errors, cin: "Ce CIN est déjà utilisé par un autre employé"});
          setSnackbar({
            open: true,
            message: "Ce CIN est déjà utilisé par un autre employé",
            severity: "error"
          });
          return;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du CIN:", error);
      }

      // Afficher un message de chargement
      setSnackbar({ open: true, message: "Envoi en cours...", severity: "info" });

      try {
        // Utiliser FormData pour envoyer à la fois les données et la photo
        const dataToSend = new FormData();

        // Ajouter tous les champs du formulaire
        for (const key in formData) {
          dataToSend.append(key, formData[key]);
        }

        // Ajouter la photo si elle existe
        if (photo) {
          dataToSend.append("photo", photo);
        }

        // Envoyer les données au serveur
        const response = await fetch("http://localhost:5000/api/employees", {
          method: "POST",
          body: dataToSend
        });

        // Analyser la réponse
        const result = await response.json();

        // Vérifier si la requête a échoué
        if (!response.ok) {
          // Vérifier si l'erreur est liée à un email déjà utilisé
          if (result.message && result.message.includes("duplicate key") && result.message.includes("email")) {
            setSnackbar({
              open: true,
              message: "Cet email est déjà utilisé par un autre employé",
              severity: "error"
            });
            setErrors({...errors, email: "Cet email est déjà utilisé"});
          } else {
            setSnackbar({
              open: true,
              message: result.message || "Erreur lors de l'ajout de l'employé",
              severity: "error"
            });
          }
          return;
        }

        // Si tout s'est bien passé
        console.log("Employé ajouté avec succès :", result);

        // Afficher un message de succès
        setSnackbar({
          open: true,
          message: "Employé ajouté avec succès!",
          severity: "success"
        });

        // Réinitialiser le formulaire
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          cin: "",
          birthDate: "",
          gender: "",
          department: "",
          role: "",
          position: "",
          hireDate: "",
          chefId: ""
        });
        setPhoto(null);
        setPhotoPreview(null);
        setErrors({});

        // Notifier le composant parent du succès
        if (typeof onSuccess === 'function') {
          onSuccess(result);
        }
      } catch (error) {
        console.error("Erreur lors de la soumission du formulaire:", error);
        setSnackbar({
          open: true,
          message: "Erreur de connexion au serveur. Vérifiez que le serveur est en marche.",
          severity: "error"
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si le rôle change, réinitialiser le chef
    if (name === "role") {
      setFormData({
        ...formData,
        [name]: value,
        chefId: "" // Réinitialiser le chef quand le rôle change
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 4
        }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: 3,
            textAlign: 'center',
            backgroundImage: 'linear-gradient(120deg, #1976d2 0%, #64b5f6 100%)'
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
            <PersonAdd sx={{ fontSize: 36, mr: 1, verticalAlign: 'middle' }} />
            Nouvel Employé
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 5 }, pt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', color: 'primary.main', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1, fontSize: 20 }} />
                Informations personnelles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonAdd color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '1.5px',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonAdd color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '1.5px',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Tooltip
                    title="Date de naissance de l'employé"
                    arrow
                    placement="top"
                    TransitionComponent={Zoom}
                  >
                    <TextField
                      fullWidth
                      label="Date de naissance"
                      name="birthDate"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.birthDate}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Cake color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          '&:hover fieldset': {
                            borderColor: 'primary.light',
                          },
                          '&.Mui-focused fieldset': {
                            borderWidth: '1.5px',
                          },
                        }
                      }}
                    />
                  </Tooltip>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
                    <InputLabel>Genre</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender}
                      label="Genre"
                      onChange={handleChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <Wc color="primary" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="Homme">Homme</MenuItem>
                      <MenuItem value="Femme">Femme</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Tooltip
                    title="Numéro de carte d'identité nationale (8 chiffres)"
                    arrow
                    placement="top"
                    TransitionComponent={Zoom}
                  >
                    <TextField
                      fullWidth
                      label="CIN"
                      name="cin"
                      value={formData.cin}
                      onChange={(e) => handleNumberInput(e, 8)}
                      error={!!errors.cin}
                      helperText={errors.cin || "Exactement 8 chiffres"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CreditCard color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: formData.cin.length === 8 && (
                          <InputAdornment position="end">
                            <CheckCircle color="success" />
                          </InputAdornment>
                        )
                      }}
                      variant="outlined"
                      inputProps={{ maxLength: 8 }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          '&:hover fieldset': {
                            borderColor: formData.cin.length === 8 ? 'success.light' : 'primary.light',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: formData.cin.length === 8 ? 'success.main' : 'primary.main',
                            borderWidth: '1.5px',
                          },
                        }
                      }}
                    />
                  </Tooltip>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Tooltip
                    title="Numéro de téléphone de l'employé (8 chiffres)"
                    arrow
                    placement="top"
                    TransitionComponent={Zoom}
                  >
                    <TextField
                      fullWidth
                      label="Téléphone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => handleNumberInput(e, 8)}
                      error={!!errors.phone}
                      helperText={errors.phone || "Exactement 8 chiffres"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ContactPhone color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: formData.phone.length === 8 && (
                          <InputAdornment position="end">
                            <CheckCircle color="success" />
                          </InputAdornment>
                        )
                      }}
                      variant="outlined"
                      inputProps={{ maxLength: 8 }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          '&:hover fieldset': {
                            borderColor: formData.phone.length === 8 ? 'success.light' : 'primary.light',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: formData.phone.length === 8 ? 'success.main' : 'primary.main',
                            borderWidth: '1.5px',
                          },
                        }
                      }}
                    />
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', color: 'primary.main', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1, fontSize: 20 }} />
                Compte & Accès
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '1.5px',
                        },
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mot de passe"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: 'primary.light',
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '1.5px',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', color: 'primary.main', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 1, fontSize: 20 }} />
                Informations professionnelles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.department} variant="outlined" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
                    <InputLabel>Département</InputLabel>
                    <Select
                      name="department"
                      value={formData.department}
                      label="Département"
                      onChange={handleChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <Business color="primary" />
                        </InputAdornment>
                      }
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.department}</FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.role} variant="outlined" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
                    <InputLabel>Rôle</InputLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      label="Rôle"
                      onChange={handleChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <WorkOutline color="primary" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="Chef">Chef</MenuItem>
                      <MenuItem value="Employé">Employé</MenuItem>
                    </Select>
                    <FormHelperText>{errors.role}</FormHelperText>
                  </FormControl>
                </Grid>

                {formData.role === "Employé" && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.chefId} variant="outlined" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
                      <InputLabel>Chef responsable</InputLabel>
                      <Select
                        name="chefId"
                        value={formData.chefId}
                        label="Chef responsable"
                        onChange={handleChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <SupervisorAccount color="primary" />
                          </InputAdornment>
                        }
                        disabled={loadingChefs || chefs.length === 0}
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
                      <FormHelperText>
                        {errors.chefId || (chefs.length === 0 && !loadingChefs ? "Aucun chef disponible. Veuillez d'abord ajouter un chef." : "")}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12} sm={formData.role === "Employé" ? 12 : 6}>
                  <TextField
                    fullWidth
                    label="Poste"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WorkOutline color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date d'embauche"
                    name="hireDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.hireDate}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonth color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', color: 'primary.main', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <PhotoCamera sx={{ mr: 1, fontSize: 20 }} />
                Photo de profil
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack direction="row" spacing={3} alignItems="center">
                <Box>
                  {photoPreview ? (
                    <Avatar
                      src={photoPreview}
                      alt="Aperçu"
                      sx={{ width: 100, height: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  ) : (
                    <Avatar sx={{ width: 100, height: 100, bgcolor: 'grey.200' }}>
                      <PersonAdd sx={{ fontSize: 40, color: 'grey.500' }} />
                    </Avatar>
                  )}
                </Box>

                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.main' },
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  Choisir une photo
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
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
                <PersonAdd sx={{ mr: 1 }} />
                Enregistrer l'employé
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddEmployee;
