// src/pages/EmployeeWorkView.js
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  Input,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { API_ENDPOINTS } from "../utils/apiConfig";

const EmployeeWorkView = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  
  // États pour la gestion des données
  const [travaux, setTravaux] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour les messages d'erreur et de succès
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [snackbarOuverte, setSnackbarOuverte] = useState(false);
  
  // État pour les fichiers uploadés
  const [fichiersUploades, setFichiersUploades] = useState({});

  // Récupérer les travaux assignés à l'employé connecté
  useEffect(() => {
    const recupererTravaux = async () => {
      if (!user || !user._id) {
        console.error("Utilisateur non connecté ou ID manquant");
        setErreur("Vous devez être connecté pour accéder à cette page");
        setSnackbarOuverte(true);
        return;
      }
      
      // Vérifier que l'utilisateur est bien un employé
      if (user.role !== "Employé") {
        console.error("L'utilisateur n'est pas un employé");
        setErreur("Vous devez être un employé pour accéder à cette page");
        setSnackbarOuverte(true);
        return;
      }
      
      setLoading(true);
      try {
        const reponse = await axios.get(API_ENDPOINTS.WORK_ASSIGNMENTS_BY_EMPLOYEE(user._id));
        console.log("Travaux récupérés:", reponse.data);
        setTravaux(reponse.data);
      } catch (erreur) {
        console.error("Erreur lors de la récupération des travaux:", erreur);
        setErreur("Impossible de récupérer les travaux assignés");
        setSnackbarOuverte(true);
      } finally {
        setLoading(false);
      }
    };
    
    recupererTravaux();
  }, [user]);

  // Gérer l'upload de fichiers
  const gererUploadFichier = (travailId, fichier) => {
    if (fichier) {
      setFichiersUploades(prev => ({
        ...prev,
        [travailId]: fichier
      }));
      setSucces(`Fichier "${fichier.name}" sélectionné pour upload`);
      setSnackbarOuverte(true);
    }
  };

  // Soumettre le travail
  const soumettreTravaill = async (travailId) => {
    const fichier = fichiersUploades[travailId];
    if (!fichier) {
      setErreur("Veuillez sélectionner un fichier avant de soumettre");
      setSnackbarOuverte(true);
      return;
    }
  
    const formData = new FormData();
    formData.append('statut', 'Terminé');
    formData.append('fichierReponse', fichier);
  
    try {
      await axios.patch(API_ENDPOINTS.WORK_ASSIGNMENT_STATUS(travailId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Mettre à jour la liste des travaux
      setTravaux(travaux.map(t => 
        t._id === travailId ? { ...t, statut: 'Terminé' } : t
      ));
      
      // Supprimer le fichier de l'état local
      setFichiersUploades(prev => {
        const nouveau = { ...prev };
        delete nouveau[travailId];
        return nouveau;
      });
      
      setSucces("Travail soumis avec succès");
      setSnackbarOuverte(true);
    } catch (error) {
      console.error("Erreur lors de la soumission du travail:", error);
      setErreur("Impossible de soumettre le travail");
      setSnackbarOuverte(true);
    }
  };

  // Formater la date pour l'affichage
  const formaterDate = (date) => {
    return format(new Date(date), "dd MMMM yyyy", { locale: fr });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Titre de la page */}
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Mes Travaux
      </Typography>
      
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
            Liste des Travaux Assignés
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : travaux.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Aucun travail assigné trouvé
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: theme.palette.grey[100] }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Titre</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fichiers du Chef</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Mon Travail</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {travaux.map((travail) => (
                  <tr key={travail._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {travail.titre}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Créé le: {formaterDate(travail.dateCreation)}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {travail.fichiers && travail.fichiers.filter(f => 
                        !f.dateUpload || new Date(f.dateUpload) <= new Date(travail.dateCreation)).length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {travail.fichiers.filter(f => 
                            !f.dateUpload || new Date(f.dateUpload) <= new Date(travail.dateCreation)).map((fichier, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              size="small"
                              startIcon={<AttachFileIcon />}
                              component="a"
                              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fichier.cheminFichier}`}
                              target="_blank"
                              sx={{ justifyContent: 'flex-start', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                            >
                              {fichier.nomFichier}
                            </Button>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Aucun fichier
                        </Typography>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {travail.statut === 'Terminé' ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          
                          {travail.fichiers && travail.fichiers.filter(f => 
                            f.dateUpload && new Date(f.dateUpload) > new Date(travail.dateCreation)).length > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {travail.fichiers.filter(f => 
                                f.dateUpload && new Date(f.dateUpload) > new Date(travail.dateCreation)).map((fichier, index) => (
                                <Button
                                  key={index}
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AttachFileIcon />}
                                  component="a"
                                  href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fichier.cheminFichier}`}
                                  target="_blank"
                                  sx={{ justifyContent: 'flex-start', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                >
                                  {fichier.nomFichier}
                                </Button>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Input
                            type="file"
                            onChange={(e) => gererUploadFichier(travail._id, e.target.files[0])}
                            sx={{ fontSize: '0.875rem' }}
                          />
                          {fichiersUploades[travail._id] && (
                            <Typography variant="caption" color="primary">
                              Fichier sélectionné: {fichiersUploades[travail._id].name}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => soumettreTravaill(travail._id)}
                        disabled={travail.statut === 'Terminé' || !fichiersUploades[travail._id]}
                      >
                        Soumettre
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>
      
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

export default EmployeeWorkView;