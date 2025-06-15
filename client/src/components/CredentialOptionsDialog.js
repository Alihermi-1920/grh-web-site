// src/components/CredentialOptionsDialog.js
// Material UI Dialog: https://mui.com/material-ui/react-dialog/
// Material UI Checkbox: https://mui.com/material-ui/react-checkbox/
// Material UI Button: https://mui.com/material-ui/react-button/
// Material UI Alert: https://mui.com/material-ui/react-alert/
// Material UI Typography: https://mui.com/material-ui/react-typography/
// Material UI Box: https://mui.com/material-ui/react-box/
// Material UI Grid: https://mui.com/material-ui/react-grid/
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Paper
} from '@mui/material';
import {
  Email as EmailIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { downloadCredentialPDF } from '../utils/credentialPdfGenerator';

const CredentialOptionsDialog = ({ open, onClose, employee }) => {
  const [selectedOptions, setSelectedOptions] = useState({
    digital: false,
    letter: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleOptionChange = (option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Fonction pour gérer la génération des PDFs
  // Cette fonction télécharge les PDFs sélectionnés avec un délai suffisant entre eux
  const handleGenerate = async () => {
    if ((!selectedOptions.digital && !selectedOptions.letter) || !employee) return;

    setIsGenerating(true);

    try {
      console.log("Generating PDFs with options:", selectedOptions);
      console.log("Employee data:", employee);

      // Fonction pour attendre un délai spécifié
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Générer les PDFs sélectionnés avec un délai suffisant entre eux
      if (selectedOptions.digital) {
        console.log("Generating digital PDF");
        downloadCredentialPDF(employee, 'digital');
        // Attendre 3 secondes avant de générer le prochain PDF (délai augmenté)
        if (selectedOptions.letter) await wait(3000);
      }

      if (selectedOptions.letter) {
        console.log("Generating letter PDF");
        downloadCredentialPDF(employee, 'letter');
      }

      // Attendre un peu avant de marquer comme terminé
      await wait(1000);
      setIsGenerated(true);
      setIsGenerating(false);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedOptions({ digital: false, letter: false });
    setIsGenerated(false);
    onClose();
  };

  if (!employee) return null;

  // Rendu du composant
  return (
    <Dialog
      open={open}
      // Désactiver la fermeture lorsqu'on clique à l'extérieur ou appuie sur Escape
      // https://mui.com/material-ui/api/dialog/#props
      disableEscapeKeyDown={!isGenerated} // Désactive la fermeture avec la touche Escape si les documents ne sont pas générés
      onClose={(event, reason) => {
        // Ne ferme le dialogue que si les documents ont été générés ou si l'utilisateur clique sur un bouton
        if (isGenerated || reason !== 'backdropClick') {
          handleClose();
        }
      }}
      maxWidth="sm"
      fullWidth
      // Material UI Dialog PaperProps: https://mui.com/material-ui/api/dialog/#props
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      {/* Titre du dialogue */}
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 2
      }}>
        Générer les identifiants pour {employee.firstName} {employee.lastName}
      </DialogTitle>

      {/* Contenu du dialogue */}
      <DialogContent sx={{ py: 3 }}>
        {isGenerated ? (
          // Affichage après génération réussie
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckIcon sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Document(s) généré(s) avec succès!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Le(s) PDF contenant les identifiants a/ont été téléchargé(s).
            </Typography>
            <Alert severity="info" sx={{ mt: 2, mx: 'auto' }}>
              N'oubliez pas de transmettre ce(s) document(s) de manière sécurisée à l'employé.
            </Alert>
          </Box>
        ) : (
          // Affichage des options de génération
          <>
            <Typography variant="body1" paragraph>
              Sélectionnez le(s) format(s) d'identifiants à générer:
            </Typography>

            {/* Options simplifiées */}
            <Box sx={{ mb: 3 }}>
              {/* Option 1: Version Digitale */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  borderColor: selectedOptions.digital ? 'primary.main' : 'divider',
                  borderWidth: selectedOptions.digital ? 2 : 1
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedOptions.digital}
                      onChange={() => handleOptionChange('digital')}
                      color="primary"
                    />
                  }
                  label={
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <EmailIcon color="primary" />
                      </Grid>
                      <Grid item xs>
                        <Typography variant="subtitle1">Version Digitale</Typography>
                        <Typography variant="body2" color="text.secondary">
                          PDF optimisé pour l'envoi par email
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>

              {/* Option 2: Lettre Imprimable */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  borderColor: selectedOptions.letter ? 'primary.main' : 'divider',
                  borderWidth: selectedOptions.letter ? 2 : 1
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedOptions.letter}
                      onChange={() => handleOptionChange('letter')}
                      color="primary"
                    />
                  }
                  label={
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <PrintIcon color="primary" />
                      </Grid>
                      <Grid item xs>
                        <Typography variant="subtitle1">Lettre Imprimable</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Format lettre avec lignes de pliage pour enveloppe
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            </Box>

            {/* Message d'information */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={selectedOptions.digital || selectedOptions.letter ? 'normal' : 'bold'}>
                {selectedOptions.digital || selectedOptions.letter
                  ? (selectedOptions.digital && selectedOptions.letter
                    ? "Les deux documents seront téléchargés l'un après l'autre. Veuillez attendre que les téléchargements soient terminés avant de fermer cette fenêtre."
                    : "Le document sélectionné sera téléchargé automatiquement. Veuillez attendre que le téléchargement soit terminé avant de fermer cette fenêtre.")
                    : "IMPORTANT: Vous devez sélectionner au moins une option et générer les identifiants avant de fermer cette fenêtre, sinon les informations seront perdues."}
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      {/* Actions du dialogue */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
        <Button onClick={handleClose} color="inherit">
          {isGenerated ? 'Fermer' : 'Annuler'}
        </Button>

        {!isGenerated && (
          <Button
            onClick={handleGenerate}
            variant="contained"
            color="primary"
            disabled={(!selectedOptions.digital && !selectedOptions.letter) || isGenerating}
            startIcon={isGenerating ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {isGenerating ? 'Génération en cours...' :
              'Générer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CredentialOptionsDialog;
