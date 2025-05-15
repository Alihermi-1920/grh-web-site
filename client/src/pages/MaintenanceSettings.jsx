// src/pages/MaintenanceSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const MaintenanceSettings = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [globalMaintenance, setGlobalMaintenance] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch maintenance settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Get the admin token from localStorage
      const employee = JSON.parse(localStorage.getItem('employee') || '{}');
      const token = employee.token || '';

      const response = await axios.get(`${API_URL}/api/maintenance/status`);

      if (response.data.success) {
        setSettings(response.data);
        setGlobalMaintenance(response.data.isGlobalMaintenance);
        setGlobalMessage(response.data.globalMessage || response.data.globalMaintenanceMessage || '');
      } else {
        setSnackbar({
          open: true,
          message: 'Erreur lors de la récupération des paramètres de maintenance',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la récupération des paramètres de maintenance',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the confirmation dialog
  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  // Handle closing the confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  // Update global maintenance settings
  const updateGlobalSettings = async () => {
    // Close the confirmation dialog
    setConfirmDialogOpen(false);

    setSaving(true);
    try {
      // Get the admin token from localStorage
      const employee = JSON.parse(localStorage.getItem('employee') || '{}');
      const token = employee.token || '';

      const response = await axios.put(
        `${API_URL}/api/maintenance/global`,
        {
          isGlobalMaintenance: globalMaintenance,
          globalMaintenanceMessage: globalMessage
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSettings(response.data.data);
        setSnackbar({
          open: true,
          message: globalMaintenance
            ? 'Mode maintenance activé avec succès'
            : 'Mode maintenance désactivé avec succès',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Erreur lors de la mise à jour des paramètres de maintenance',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating global maintenance settings:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour des paramètres de maintenance',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: theme.palette.primary.main,
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          paddingBottom: '8px',
          marginBottom: '24px'
        }}
      >
        Paramètres de Maintenance
      </Typography>

      {/* Global Maintenance Settings */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: '12px',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(to right bottom, #1a1a2e, #16213e)'
            : 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.2)'
            : '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: theme.palette.text.primary
          }}
        >
          Maintenance Globale
        </Typography>
        <Divider sx={{ mb: 3, backgroundColor: theme.palette.primary.light }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{
              backgroundColor: globalMaintenance ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              padding: '16px',
              borderRadius: '8px',
              transition: 'background-color 0.3s ease'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={globalMaintenance}
                    onChange={(e) => setGlobalMaintenance(e.target.checked)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme.palette.primary.main
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: theme.palette.primary.main
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body1" sx={{ fontWeight: 'medium', ml: 1 }}>
                    {globalMaintenance ? 'Maintenance Activée' : 'Maintenance Désactivée'}
                  </Typography>
                }
              />

              <Box mt={2} sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                p: 2,
                borderRadius: '4px',
                borderLeft: `4px solid ${theme.palette.info.main}`
              }}>
                <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'textSecondary'}>
                  <b>Note:</b> Les administrateurs ont toujours accès au système, même pendant la maintenance.
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Message de maintenance"
              multiline
              rows={4}
              value={globalMessage}
              onChange={(e) => setGlobalMessage(e.target.value)}
              variant="outlined"
              placeholder="Le système est actuellement en maintenance. Veuillez réessayer plus tard."
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.light,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Grid>
        </Grid>

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenConfirmDialog}
            disabled={saving}
            sx={{
              minWidth: '220px',
              py: 1.2,
              px: 3,
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            {saving ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                <span>Enregistrement...</span>
              </Box>
            ) : (
              'Enregistrer les paramètres'
            )}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: '1.2rem'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            padding: '8px'
          }
        }}
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            fontWeight: 'bold',
            color: globalMaintenance ? theme.palette.success.main : theme.palette.error.main,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2
          }}
        >
          {globalMaintenance
            ? "Activer le mode maintenance ?"
            : "Désactiver le mode maintenance ?"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText id="alert-dialog-description">
            {globalMaintenance
              ? "Êtes-vous sûr de vouloir activer le mode maintenance ? Tous les utilisateurs (sauf les administrateurs) seront déconnectés et ne pourront pas accéder au système."
              : "Êtes-vous sûr de vouloir désactiver le mode maintenance ? Tous les utilisateurs pourront à nouveau accéder au système."}
          </DialogContentText>
          {globalMaintenance && (
            <Box mt={2} p={2} sx={{
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: '4px',
              borderLeft: `4px solid ${theme.palette.warning.main}`
            }}>
              <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'textSecondary'}>
                <b>Message de maintenance :</b> {globalMessage || "Le système est actuellement en maintenance. Veuillez réessayer plus tard."}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseConfirmDialog}
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 'medium'
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={updateGlobalSettings}
            variant="contained"
            color={globalMaintenance ? "primary" : "error"}
            autoFocus
            sx={{
              fontWeight: 'bold',
              px: 3
            }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceSettings;
