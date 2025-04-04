// src/pages/AddEmployee.js
import React, { useState } from "react";
import { 
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Snackbar,
  Grid
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { PersonAdd, Close } from "@mui/icons-material";

// Composant Alert pour le Snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const AddEmployee = ({ onCancel, onSuccess, departments }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    role: "",
    position: "",
    hireDate: ""
  });
  
  // État pour le fichier photo et son aperçu
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = "Numéro invalide (10 chiffres requis)";
    if (!formData.department) newErrors.department = "Sélectionnez un département";
    if (!formData.role) newErrors.role = "Sélectionnez un rôle";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      // Utiliser FormData pour envoyer à la fois les données et la photo
      const dataToSend = new FormData();
      for (const key in formData) {
        dataToSend.append(key, formData[key]);
      }
      if (photo) {
        dataToSend.append("photo", photo); // Nom du champ "photo" correspondant à multer
      }
      
      try {
        const response = await fetch("http://localhost:5000/api/employees", {
          method: "POST",
          // Ne pas définir le Content-Type pour laisser le navigateur le définir automatiquement
          body: dataToSend
        });
        const data = await response.json();

        if (!response.ok) {
          console.error("Erreur lors de l'ajout de l'employé :", data.message);
          setSnackbar({ open: true, message: data.message || "Erreur lors de l'ajout de l'employé", severity: "error" });
          return;
        }

        console.log("Employé ajouté avec succès :", data);
        setSnackbar({ open: true, message: "Employé ajouté avec succès", severity: "success" });
        onSuccess();
        // Réinitialiser le formulaire
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          department: "",
          role: "",
          position: "",
          hireDate: ""
        });
        setPhoto(null);
        setPhotoPreview(null);
      } catch (error) {
        console.error("Erreur de connexion :", error);
        setSnackbar({ open: true, message: "Erreur de connexion", severity: "error" });
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, position: "relative" }}>
        <IconButton 
          sx={{ position: "absolute", right: 16, top: 16 }}
          onClick={onCancel}
        >
          <Close />
        </IconButton>
        
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
            <PersonAdd sx={{ fontSize: 40, verticalAlign: "middle", mr: 1 }} />
            Nouvel Employé
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
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
              />
            </Grid>

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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.department}>
                <InputLabel>Département</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  label="Département"
                  onChange={handleChange}
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
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel>Rôle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Rôle"
                  onChange={handleChange}
                >
                  <MenuItem value="Chef">Chef</MenuItem>
                  <MenuItem value="Employé">Employé</MenuItem>
                </Select>
                <FormHelperText>{errors.role}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poste"
                name="position"
                value={formData.position}
                onChange={handleChange}
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
              />
            </Grid>

            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                Ajouter une photo
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
              {photoPreview && (
                <Box mt={2}>
                  <img src={photoPreview} alt="Aperçu" style={{ maxWidth: "200px" }} />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{ 
                  py: 2,
                  px: 4,
                  fontSize: "1.1rem",
                  textTransform: "none",
                  minWidth: 250
                }}
              >
                <PersonAdd sx={{ mr: 1 }} />
                Enregistrer l'employé
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
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
