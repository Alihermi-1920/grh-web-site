import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockReset as LockResetIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import axios from 'axios';

const FirstLoginPasswordChange = ({ open, user, onSuccess }) => {
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation states
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    // Reset form when dialog opens
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setNewPasswordError('');
      setConfirmPasswordError('');
    }
  }, [open]);

  const validateForm = () => {
    let isValid = true;

    // New password validation
    if (!newPassword) {
      setNewPasswordError('Le nouveau mot de passe est requis');
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    } else {
      setNewPasswordError('');
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Veuillez confirmer votre nouveau mot de passe');
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/employees/change-password', {
        email: user.email,
        newPassword,
        isFirstLogin: true
      });

      setLoading(false);

      if (response.status === 200) {
        // Show success message
        setError('');
        alert('Mot de passe changé avec succès! Vous allez être redirigé vers votre tableau de bord.');

        // Call the onSuccess callback to update the user state
        onSuccess();
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Une erreur est survenue');
      } else {
        setError('Erreur de connexion au serveur');
      }
    }
  };

  // Only show the dialog if we have a user and the dialog should be open
  if (!user || !open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(211, 47, 47, 0.3)',
          border: '1px solid rgba(211, 47, 47, 0.2)',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pb: 2,
        pt: 3,
        bgcolor: '#d32f2f', // Red color
        color: 'white',
        borderBottom: '4px solid #b71c1c' // Darker red border
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <SecurityIcon sx={{ fontSize: 50, mb: 1.5, animation: 'pulse 1.5s infinite' }} />
          <Typography variant="h5" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Changement de mot de passe requis
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 1, opacity: 0.9, fontWeight: 400 }}>
            Mesure de sécurité obligatoire
          </Typography>

          <style>
            {`
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            `}
          </style>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 4, bgcolor: '#fafafa' }}>
        <Box sx={{
          py: 2,
          px: 2,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'rgba(211, 47, 47, 0.08)',
          border: '1px solid rgba(211, 47, 47, 0.2)'
        }}>
          <Typography variant="body1" paragraph sx={{ display: 'flex', alignItems: 'center', color: '#d32f2f', fontWeight: 500 }}>
            <SecurityIcon sx={{ mr: 1, fontSize: 20 }} />
            Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre première connexion.
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Veuillez choisir un nouveau mot de passe sécurisé que vous n'utilisez pas sur d'autres sites.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
            variant="filled"
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Nouveau mot de passe"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!newPasswordError}
            helperText={newPasswordError}
            disabled={loading}
            required
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#d32f2f',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#d32f2f',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Confirmer le nouveau mot de passe"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
            disabled={loading}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#d32f2f',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#d32f2f',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        py: 3,
        bgcolor: '#fafafa',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          fullWidth
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
          sx={{
            bgcolor: '#d32f2f',
            '&:hover': {
              bgcolor: '#b71c1c'
            },
            py: 1.5,
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
          }}
        >
          {loading ? 'Chargement...' : 'CHANGER MON MOT DE PASSE'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FirstLoginPasswordChange;
