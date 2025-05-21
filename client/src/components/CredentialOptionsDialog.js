// src/components/CredentialOptionsDialog.js
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
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel
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

  const handleGenerate = () => {
    if ((!selectedOptions.digital && !selectedOptions.letter) || !employee) return;

    setIsGenerating(true);

    // Small delay to show loading state
    setTimeout(() => {
      try {
        console.log("Generating PDFs with options:", selectedOptions);
        console.log("Employee data:", employee);

        // Generate selected PDFs
        if (selectedOptions.digital) {
          console.log("Generating digital PDF");
          downloadCredentialPDF(employee, 'digital');
        }

        // Generate letter PDF
        if (selectedOptions.letter) {
          console.log("Generating letter PDF");
          // Add a small delay if both are selected to prevent browser issues
          if (selectedOptions.digital) {
            setTimeout(() => {
              downloadCredentialPDF(employee, 'letter');
            }, 800);
          } else {
            downloadCredentialPDF(employee, 'letter');
          }
        }

        // Mark as complete
        setTimeout(() => {
          setIsGenerated(true);
          setIsGenerating(false);
        }, selectedOptions.digital && selectedOptions.letter ? 1000 : 500);

      } catch (error) {
        console.error('Error generating PDF:', error);
        setIsGenerating(false);
      }
    }, 1000);
  };

  const handleClose = () => {
    setSelectedOptions({ digital: false, letter: false });
    setIsGenerated(false);
    onClose();
  };

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 2.5,
        fontSize: '1.5rem'
      }}>
        Générer les identifiants pour {employee.firstName} {employee.lastName}
      </DialogTitle>

      <DialogContent sx={{ py: 4 }}>
        {isGenerated ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Document généré avec succès!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Le PDF contenant les identifiants a été téléchargé.
            </Typography>
            <Alert severity="info" sx={{ mt: 2, mx: 'auto', maxWidth: 500 }}>
              N'oubliez pas de transmettre ce document de manière sécurisée à l'employé.
            </Alert>
          </Box>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              Choisissez le format du document d'identifiants à générer pour le nouvel employé:
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderColor: selectedOptions.digital ? 'primary.main' : 'divider',
                    borderWidth: selectedOptions.digital ? 2 : 1,
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedOptions.digital}
                        onChange={() => handleOptionChange('digital')}
                        onClick={(e) => e.stopPropagation()}
                        color="primary"
                      />
                    }
                    label=""
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      zIndex: 10,
                      m: 0,
                      p: 1
                    }}
                  />
                  <CardActionArea
                    onClick={() => handleOptionChange('digital')}
                    sx={{ height: '100%' }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.light',
                        color: 'white'
                      }}
                    >
                      <EmailIcon sx={{ fontSize: 60 }} />
                    </CardMedia>
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        Version Digitale
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PDF optimisé pour l'envoi par email. Contient les identifiants de connexion
                        et des instructions pour le premier accès au système.
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="primary">
                        Idéal pour l'envoi électronique
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderColor: selectedOptions.letter ? 'primary.main' : 'divider',
                    borderWidth: selectedOptions.letter ? 2 : 1,
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedOptions.letter}
                        onChange={() => handleOptionChange('letter')}
                        onClick={(e) => e.stopPropagation()}
                        color="primary"
                      />
                    }
                    label=""
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      zIndex: 10,
                      m: 0,
                      p: 1
                    }}
                  />
                  <CardActionArea
                    onClick={() => handleOptionChange('letter')}
                    sx={{ height: '100%' }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'secondary.light',
                        color: 'white'
                      }}
                    >
                      <PrintIcon sx={{ fontSize: 60 }} />
                    </CardMedia>
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        Lettre Imprimable
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Format lettre avec lignes de pliage pour enveloppe. Contient les identifiants
                        et un avertissement de sécurité pour le premier accès.
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="secondary">
                        Idéal pour la remise en main propre
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>

            {(selectedOptions.digital || selectedOptions.letter) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {selectedOptions.digital && selectedOptions.letter
                    ? "Les documents contiennent des informations sensibles. Assurez-vous de les transmettre via des canaux sécurisés."
                    : selectedOptions.digital
                      ? "Ce document contient des informations sensibles. Assurez-vous de l'envoyer via un canal sécurisé."
                      : "Après impression, pliez la lettre selon les lignes pointillées et placez-la dans une enveloppe."}
                </Typography>
              </Alert>
            )}
          </>
        )}
      </DialogContent>

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
              (selectedOptions.digital && selectedOptions.letter) ?
                'Générer les documents' : 'Générer le document'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CredentialOptionsDialog;
