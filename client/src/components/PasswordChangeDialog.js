import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import axios from 'axios';

const PasswordChangeDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation states
  const [emailError, setEmailError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!email) {
      setEmailError('L\'email est requis');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Current password validation
    if (!currentPassword) {
      setCurrentPasswordError('Le mot de passe actuel est requis');
      isValid = false;
    } else {
      setCurrentPasswordError('');
    }

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
    setSuccess(false);

    try {
      // Use the existing login endpoint to verify credentials first
      const loginResponse = await axios.post('http://localhost:5000/api/employees/login', {
        email,
        password: currentPassword
      });

      if (loginResponse.status === 200) {
        // If login is successful, update the password using the update endpoint
        const userId = loginResponse.data._id;
        const updateResponse = await axios.put(`http://localhost:5000/api/employees/${userId}`, {
          password: newPassword
        });

        setSuccess(true);

        // Reset form after successful password change
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      } else {
        setError('Email ou mot de passe incorrect');
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Une erreur est survenue');
      } else {
        setError('Erreur de connexion au serveur');
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setEmailError('');
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LockResetIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight="600">
            Changer votre mot de passe
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Mot de passe changé avec succès!
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            required
            autoFocus
          />

          <TextField
            label="Mot de passe actuel"
            type={showCurrentPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={!!currentPasswordError}
            helperText={currentPasswordError}
            disabled={loading}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

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

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Chargement...' : 'Changer le mot de passe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeDialog;
