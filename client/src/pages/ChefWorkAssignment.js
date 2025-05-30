// src/pages/ChefWorkAssignment.js
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  Tooltip,
  useTheme,
  OutlinedInput,
  Checkbox,
  ListItemText
} from "@mui/material";
// https://mui.com/material-ui/react-text-field/
// https://mui.com/material-ui/react-button/
// https://mui.com/material-ui/react-select/
// https://mui.com/material-ui/react-chip/
// https://mui.com/material-ui/react-card/
// https://mui.com/material-ui/react-dialog/
// https://mui.com/material-ui/react-alert/
// https://mui.com/material-ui/react-snackbar/
// https://mui.com/material-ui/react-avatar/

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
// https://mui.com/material-ui/material-icons/

import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { API_ENDPOINTS } from "../utils/apiConfig";

const ChefWorkAssignment = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  
  // États pour le formulaire d'assignation
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [employesSelectionnes, setEmployesSelectionnes] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  
  // États pour la gestion des données
  const [employes, setEmployes] = useState([]);
  const [assignations, setAssignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployes, setLoadingEmployes] = useState(false);
  const [loadingAssignations, setLoadingAssignations] = useState(false);
  
  // États pour les messages d'erreur et de succès
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [snackbarOuverte, setSnackbarOuverte] = useState(false);
  
  // État pour la boîte de dialogue de confirmation de suppression
  const [dialogueSuppressionOuvert, setDialogueSuppressionOuvert] = useState(false);
  const [assignationASupprimer, setAssignationASupprimer] = useState(null);

  // Récupérer les employés du chef connecté
  useEffect(() => {
    const recupererEmployes = async () => {
      if (!user || !user._id) {
        console.error("Utilisateur non connecté ou ID manquant");
        setErreur("Vous devez être connecté en tant que chef pour accéder à cette page");
        setSnackbarOuverte(true);
        return;
      }
      
      // Vérifier que l'utilisateur est bien un chef
      if (user.role !== "Chef") {
        console.error("L'utilisateur n'est pas un chef");
        setErreur("Vous devez être un chef pour accéder à cette page");
        setSnackbarOuverte(true);
        return;
      }
      
      setLoadingEmployes(true);
      try {
        const reponse = await axios.get(API_ENDPOINTS.EMPLOYEES_BY_CHEF(user._id));
        console.log("Employés récupérés:", reponse.data);
        setEmployes(reponse.data);
      } catch (erreur) {
        console.error("Erreur lors de la récupération des employés:", erreur);
        setErreur("Impossible de récupérer la liste des employés");
        setSnackbarOuverte(true);
      } finally {
        setLoadingEmployes(false);
      }
    };
    
    recupererEmployes();
  }, [user]);

  // Récupérer les assignations de travail du chef
  useEffect(() => {
    const recupererAssignations = async () => {
      if (!user || !user._id) {
        console.error("Utilisateur non connecté ou ID manquant");
        return;
      }
      
      // Vérifier que l'utilisateur est bien un chef
      if (user.role !== "Chef") {
        console.error("L'utilisateur n'est pas un chef");
        return;
      }
      
      setLoadingAssignations(true);
      try {
        const reponse = await axios.get(API_ENDPOINTS.WORK_ASSIGNMENTS_BY_CHEF(user._id));
        console.log("Assignations récupérées:", reponse.data);
        setAssignations(reponse.data);
      } catch (erreur) {
        console.error("Erreur lors de la récupération des assignations:", erreur);
        setErreur("Impossible de récupérer les assignations de travail");
        setSnackbarOuverte(true);
      } finally {
        setLoadingAssignations(false);
      }
    };
    
    recupererAssignations();
  }, [user]);

  // Gérer la soumission du formulaire d'assignation
  const soumettreAssignation = async (e) => {
    e.preventDefault();
    
    // Vérifier que tous les champs obligatoires sont remplis
    if (!titre || !description || employesSelectionnes.length === 0) {
      setErreur("Veuillez remplir tous les champs obligatoires");
      setSnackbarOuverte(true);
      return;
    }
    
    // Vérifier que des fichiers ont été ajoutés
    if (fichiers.length === 0) {
      setErreur("Veuillez joindre au moins un fichier");
      setSnackbarOuverte(true);
      return;
    }
    
    setLoading(true);
    
    try {
      // Créer un objet FormData pour envoyer les fichiers
      const formData = new FormData();
      formData.append("titre", titre);
      formData.append("description", description);
      formData.append("chef", user._id);
      
      // Ajouter chaque employé sélectionné
      employesSelectionnes.forEach(employeId => {
        formData.append("employes", employeId);
      });
      
      // Ajouter les fichiers s'il y en a
      fichiers.forEach((fichier) => {
        formData.append("fichiers", fichier);
      });
      
      // Envoyer la requête
      const reponse = await axios.post(API_ENDPOINTS.WORK_ASSIGNMENTS, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Assignation créée:", reponse.data);
      
      // Récupérer l'assignation complète avec les informations des employés
      try {
        const assignationComplete = await axios.get(API_ENDPOINTS.WORK_ASSIGNMENT_BY_ID(reponse.data._id));
        // Mettre à jour la liste des assignations
        setAssignations([assignationComplete.data, ...assignations]);
      } catch (erreurRecuperation) {
        console.error("Erreur lors de la récupération de l'assignation complète:", erreurRecuperation);
        // Fallback: utiliser la réponse initiale
        setAssignations([reponse.data, ...assignations]);
      }
      
      // Réinitialiser le formulaire
      setTitre("");
      setDescription("");
      setDateLimite("");
      setEmployesSelectionnes([]);
      setFichiers([]);
      
      // Afficher un message de succès
      setSucces("Assignation de travail créée avec succès");
      setSnackbarOuverte(true);
    } catch (erreur) {
      console.error("Erreur lors de la création de l'assignation:", erreur);
      setErreur("Impossible de créer l'assignation de travail");
      setSnackbarOuverte(true);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection des fichiers
  const gererSelectionFichiers = (e) => {
    setFichiers(Array.from(e.target.files));
  };

  // Ouvrir la boîte de dialogue de confirmation de suppression
  const ouvrirDialogueSuppression = (assignation) => {
    setAssignationASupprimer(assignation);
    setDialogueSuppressionOuvert(true);
  };

  // Fermer la boîte de dialogue de confirmation de suppression
  const fermerDialogueSuppression = () => {
    setDialogueSuppressionOuvert(false);
    setAssignationASupprimer(null);
  };

  // Supprimer une assignation
  const supprimerAssignation = async () => {
    if (!assignationASupprimer) return;
    
    try {
      await axios.delete(API_ENDPOINTS.WORK_ASSIGNMENT_BY_ID(assignationASupprimer._id));
      
      // Mettre à jour la liste des assignations
      setAssignations(assignations.filter((a) => a._id !== assignationASupprimer._id));
      
      // Afficher un message de succès
      setSucces("Assignation de travail supprimée avec succès");
      setSnackbarOuverte(true);
    } catch (erreur) {
      console.error("Erreur lors de la suppression de l'assignation:", erreur);
      setErreur("Impossible de supprimer l'assignation de travail");
      setSnackbarOuverte(true);
    } finally {
      fermerDialogueSuppression();
    }
  };

  // Formater la date pour l'affichage
  const formaterDate = (date) => {
    return format(new Date(date), "dd MMMM yyyy", { locale: fr });
  };

  // Gérer le changement de sélection des employés
  const handleEmployesChange = (event) => {
    const { value } = event.target;
    
    // Vérifier si "all" est sélectionné
    if (value.includes("all")) {
      // Si tous les employés sont déjà sélectionnés, désélectionner tout
      if (employesSelectionnes.length === employes.length) {
        setEmployesSelectionnes([]);
      } else {
        // Sinon, sélectionner tous les employés
        setEmployesSelectionnes(employes.map(emp => emp._id));
      }
    } else {
      // Comportement normal pour les autres sélections
      setEmployesSelectionnes(value);
    }
  };

  // Obtenir les noms des employés sélectionnés pour l'affichage
  const getEmployeNames = (employeIds, allEmployes) => {
    if (!employeIds || !Array.isArray(employeIds)) return "";
    
    return employeIds.map(id => {
      const employe = allEmployes.find(e => e._id === id);
      return employe ? `${employe.firstName} ${employe.lastName}` : "";
    }).filter(name => name).join(", ");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Titre de la page */}
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Assignation de Travail
      </Typography>
      
      <Grid container spacing={4}>
        {/* Formulaire d'assignation */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Nouvelle Assignation
            </Typography>
            
            <form onSubmit={soumettreAssignation}>
              <TextField
                label="Titre"
                variant="outlined"
                fullWidth
                margin="normal"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
              />
              
              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="employes-select-label">Sélectionner des employés</InputLabel>
                <Select
                  labelId="employes-select-label"
                  multiple
                  value={employesSelectionnes}
                  onChange={handleEmployesChange}
                  input={<OutlinedInput label="Sélectionner des employés" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const employe = employes.find(e => e._id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={employe ? `${employe.firstName} ${employe.lastName}` : value} 
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {/* Option "Tout sélectionner" */}
                  <MenuItem value="all">
                    <Checkbox 
                      checked={employes.length > 0 && employesSelectionnes.length === employes.length} 
                      indeterminate={employesSelectionnes.length > 0 && employesSelectionnes.length < employes.length}
                    />
                    <ListItemText primary="Tout sélectionner" />
                  </MenuItem>
                  
                  {/* Séparateur après l'option "Tout sélectionner" */}
                  <Divider />
                  
                  {loadingEmployes ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Chargement...
                    </MenuItem>
                  ) : employes.length === 0 ? (
                    <MenuItem disabled>Aucun employé trouvé</MenuItem>
                  ) : (
                    employes.map((employe) => (
                      <MenuItem key={employe._id} value={employe._id}>
                        <Checkbox checked={employesSelectionnes.indexOf(employe._id) > -1} />
                        <ListItemText 
                          primary={`${employe.firstName} ${employe.lastName}`} 
                          secondary={`CIN: ${employe.cin || 'Non spécifié'}`}
                        />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Fichiers* (obligatoire)
                </Typography>
                <input
                  accept="*/*"
                  style={{ display: "none" }}
                  id="fichier-input"
                  multiple
                  type="file"
                  onChange={gererSelectionFichiers}
                />
                <label htmlFor="fichier-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFileIcon />}
                    sx={{ mb: 2 }}
                  >
                    Joindre des fichiers
                  </Button>
                </label>
                
                {fichiers.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fichiers sélectionnés:
                    </Typography>
                    {fichiers.map((fichier, index) => (
                      <Chip
                        key={index}
                        label={fichier.name}
                        onDelete={() => setFichiers(fichiers.filter((_, i) => i !== index))}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {loading ? "Création en cours..." : "Assigner le travail"}
              </Button>
            </form>
          </Paper>
        </Grid>
        
        {/* Liste des assignations */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              minHeight: 400,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Assignations de Travail
              </Typography>
            </Box>
            
            {loadingAssignations ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : assignations.length === 0 ? (
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  Aucune assignation de travail trouvée
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.palette.grey[100] }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Titre</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date de Création</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Employé</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>CIN</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fichiers</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Réponse</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignations.flatMap((assignation) => {
                      // Vérifier si l'assignation a des employés
                      const employesList = assignation.employes && Array.isArray(assignation.employes) 
                        ? assignation.employes 
                        : assignation.employe 
                          ? [assignation.employe] 
                          : [];
                      
                      // Si aucun employé, afficher une ligne avec des cellules vides
                      if (employesList.length === 0) {
                        return [
                          <tr key={assignation._id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {assignation.titre}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2">
                                {formaterDate(assignation.dateCreation)}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2">-</Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2">-</Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2">-</Typography>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => ouvrirDialogueSuppression(assignation)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </td>
                          </tr>
                        ];
                      }
                      
                      // Sinon, créer une ligne pour chaque employé
                      return employesList.map((employe, index) => {
                        // Vérifier si l'employé a des informations valides
                        if (!employe || typeof employe !== 'object') {
                          return null;
                        }
                        
                        // Trouver les fichiers de réponse pour cet employé
                        const fichierReponses = assignation.fichiers
                          ? assignation.fichiers.filter(f => 
                              f.dateUpload && 
                              new Date(f.dateUpload) > new Date(assignation.dateCreation))
                          : [];
                        
                        return (
                          <tr key={`${assignation._id}-${employe._id || index}`} style={{ borderBottom: '1px solid #eee' }}>
                            {/* Afficher le titre et la date uniquement pour le premier employé */}
                            {index === 0 ? (
                              <>
                                <td style={{ padding: '12px' }} rowSpan={employesList.length}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {assignation.titre}
                                  </Typography>
                                </td>
                                <td style={{ padding: '12px' }} rowSpan={employesList.length}>
                                  <Typography variant="body2">
                                    {formaterDate(assignation.dateCreation)}
                                  </Typography>
                                </td>
                              </>
                            ) : null}
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2">
                                {employe.firstName && employe.lastName 
                                  ? `${employe.firstName} ${employe.lastName}`
                                  : "Employé inconnu"}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2">
                                {employe.cin || "Non spécifié"}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Box>
                                {/* Afficher les fichiers du chef */}
                                {assignation.fichiers && assignation.fichiers.filter(f => 
                                  !f.dateUpload || new Date(f.dateUpload) <= new Date(assignation.dateCreation)).length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                    {assignation.fichiers.filter(f => 
                                      !f.dateUpload || new Date(f.dateUpload) <= new Date(assignation.dateCreation)).map((fichier, idx) => (
                                      <Tooltip key={idx} title={fichier.nomFichier}>
                                        <IconButton 
                                          size="small"
                                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fichier.cheminFichier}`}
                                          target="_blank"
                                          color="primary"
                                        >
                                          <DownloadIcon />
                                        </IconButton>
                                      </Tooltip>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <Box>
                                {/* Afficher les fichiers de réponse */}
                                {assignation.statut === "Terminé" && fichierReponses.length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {fichierReponses.map((fichier, idx) => (
                                      <Tooltip key={idx} title={fichier.nomFichier}>
                                        <IconButton 
                                          size="small"
                                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fichier.cheminFichier}`}
                                          target="_blank"
                                          color="primary"
                                        >
                                          <DownloadIcon />
                                        </IconButton>
                                      </Tooltip>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </td>
                            {/* Afficher les actions uniquement pour le premier employé */}
                            {index === 0 ? (
                              <td style={{ padding: '12px', textAlign: 'center' }} rowSpan={employesList.length}>
                                <Tooltip title="Supprimer">
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => ouvrirDialogueSuppression(assignation)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </td>
                            ) : null}
                          </tr>
                        );
                      }).filter(Boolean); // Filtrer les valeurs null
                    })}
                  </tbody>
                </table>
                </Box>
              )}
            </Paper>
        </Grid>
      </Grid>
      
      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog open={dialogueSuppressionOuvert} onClose={fermerDialogueSuppression}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cette assignation de travail ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={fermerDialogueSuppression} color="primary">
            Annuler
          </Button>
          <Button onClick={supprimerAssignation} color="error" startIcon={<DeleteIcon />}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar pour les messages d'erreur et de succès */}
      <Snackbar
        open={snackbarOuverte}
        autoHideDuration={6000}
        onClose={() => setSnackbarOuverte(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOuverte(false)}
          severity={erreur ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {erreur || succes}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChefWorkAssignment;