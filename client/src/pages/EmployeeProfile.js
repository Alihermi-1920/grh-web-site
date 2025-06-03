import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Chip
} from '@mui/material';
import { PhotoCamera, Edit, Lock, SupervisorAccount } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { alpha, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EmployeeProfile = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Success state for notifications
  const [success, setSuccess] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [chefData, setChefData] = useState(null);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Phone edit state
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch user profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      setLoading(true);

      try {
        // Use the user data directly from context/localStorage
        console.log('Using user data directly from context:', user);

        // Create profile data from the user object we already have
        const profileData = {
          _id: user._id || user.id,
          firstName: user.firstName || user.name?.split(' ')[0] || 'Prénom',
          lastName: user.lastName || (user.name?.split(' ')[1] || '') || 'Nom',
          email: user.email || 'email@example.com',
          phone: user.phone || '',
          cin: user.cin || 'Non spécifié',
          department: user.department || 'Non spécifié',
          role: user.role || 'Employé',
          position: user.position || 'Non spécifié',
          hireDate: user.hireDate || new Date(),
          photo: user.photo || null,
          chefId: user.chefId || null
        };

        console.log('Created profile data from user object:', profileData);
        setProfileData(profileData);
        setPhoneValue(profileData.phone || '');

        // If we have a chefId, try to fetch the chef data
        if (profileData.chefId) {
          console.log('Found chefId in user data:', profileData.chefId);

          // If chefId is an object with firstName and lastName, use it directly
          if (typeof profileData.chefId === 'object' && profileData.chefId.firstName && profileData.chefId.lastName) {
            console.log('ChefId is an object with name, using directly:', profileData.chefId);
            setChefData(profileData.chefId);
          }
          // If chefId is a string/ID, try to fetch the chef data
          else if (typeof profileData.chefId === 'string' || (typeof profileData.chefId === 'object' && profileData.chefId._id)) {
            const chefId = typeof profileData.chefId === 'object' ? profileData.chefId._id : profileData.chefId;
            console.log('ChefId is an ID, fetching chef data:', chefId);

            // Try to fetch chef data from the messages API endpoint
            try {
              console.log('Trying messages/chef endpoint...');
              const response = await fetch(`http://localhost:5000/api/messages/chef/${profileData._id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Cache-Control': 'no-cache'
                }
              });

              if (response.ok) {
                const chefData = await response.json();
                console.log('Chef data received from messages API:', chefData);
                setChefData(chefData);
              } else {
                console.log('Failed to fetch chef data from messages API, trying employees endpoint...');

                // Try to fetch chef data from the employees endpoint
                const chefResponse = await fetch(`http://localhost:5000/api/employees/${chefId}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Cache-Control': 'no-cache'
                  }
                });

                if (chefResponse.ok) {
                  const chefData = await chefResponse.json();
                  console.log('Chef data received from employees API:', chefData);
                  setChefData(chefData);
                } else {
                  console.log('Failed to fetch chef data from employees API');
                }
              }
            } catch (error) {
              console.error('Error fetching chef data:', error);
            }
          }
        } else {
          console.log('No chefId found in user data');

          // Try to find the chef from the employees list
          try {
            console.log('Trying to find chef from employees list...');
            const response = await fetch(`http://localhost:5000/api/employees`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Cache-Control': 'no-cache'
              }
            });

            if (response.ok) {
              const employees = await response.json();
              console.log('Employees data received:', employees);

              // Find the employee with matching ID
              const currentEmployee = employees.find(emp =>
                emp._id === profileData._id ||
                emp.id === profileData._id
              );

              if (currentEmployee && currentEmployee.chefId) {
                console.log('Found employee with chefId:', currentEmployee);

                // Find the chef in the employees list
                const chef = employees.find(emp =>
                  emp._id === currentEmployee.chefId ||
                  (typeof currentEmployee.chefId === 'object' && emp._id === currentEmployee.chefId._id)
                );

                if (chef) {
                  console.log('Found chef in employees list:', chef);
                  setChefData(chef);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching employees list:', error);
          }
        }
      } catch (error) {
        console.error('Error in profile data processing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);



  // Handle photo file selection
  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setPhotoDialogOpen(true);
    }
  };

  // Upload new profile photo
  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', photoFile);

    try {
      // Get the user ID from various possible sources
      const userId = user._id || user.id || user.userId;

      if (!userId) {
        console.error('No valid user ID found for photo upload');
        throw new Error('ID utilisateur non trouvé');
      }

      console.log('Uploading photo for user ID:', userId);

      // Use the employees endpoint with PUT method for updating employee data including photo
      const response = await fetch(`http://localhost:5000/api/employees/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        console.error(`Error response from photo upload API: ${response.status}`);
        throw new Error(`Erreur lors du téléchargement de la photo: ${response.status}`);
      }

      const data = await response.json();
      console.log('Photo upload response:', data);

      // Update profile data with new photo
      setProfileData({
        ...profileData,
        photo: data.photo
      });

      setSnackbar({
        open: true,
        message: 'Photo de profil mise à jour avec succès',
        severity: 'success'
      });

      setPhotoDialogOpen(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour de la photo: ' + error.message,
        severity: 'error'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Update phone number
  const handlePhoneUpdate = async () => {
    try {
      // Validate phone number (8 digits for Tunisia)
      if (!/^\d{8}$/.test(phoneValue)) {
        throw new Error('Le numéro de téléphone doit contenir exactement 8 chiffres');
      }

      // Get the user ID from various possible sources
      const userId = user._id || user.id || user.userId;

      if (!userId) {
        console.error('No valid user ID found for phone update');
        throw new Error('ID utilisateur non trouvé');
      }

      console.log('Updating phone for user ID:', userId);

      // Try multiple endpoints to update the phone number
      let response;
      let success = false;

      // Try employees endpoint first
      try {
        console.log('Trying employees endpoint for phone update...');
        response = await fetch(`http://localhost:5000/api/employees/${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ phone: phoneValue })
        });

        if (response.ok) {
          success = true;
          console.log('Phone updated successfully with employees endpoint');
        } else {
          console.error(`Error response from employees API: ${response.status}`);
        }
      } catch (error) {
        console.error('Error with employees endpoint for phone update:', error);
      }

      // If employees endpoint failed, try PUT method
      if (!success) {
        try {
          console.log('Trying employees endpoint with PUT method...');
          response = await fetch(`http://localhost:5000/api/employees/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone: phoneValue })
          });

          if (response.ok) {
            success = true;
            console.log('Phone updated successfully with PUT method');
          } else {
            console.error(`Error response from employees PUT API: ${response.status}`);
          }
        } catch (error) {
          console.error('Error with employees PUT endpoint for phone update:', error);
        }
      }

      // If both failed, try users endpoint
      if (!success) {
        try {
          console.log('Trying users endpoint for phone update...');
          response = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone: phoneValue })
          });

          if (response.ok) {
            success = true;
            console.log('Phone updated successfully with users endpoint');
          } else {
            console.error(`Error response from users API: ${response.status}`);
          }
        } catch (error) {
          console.error('Error with users endpoint for phone update:', error);
        }
      }

      if (!success) {
        throw new Error('Tous les endpoints API ont échoué');
      }

      // Update local state regardless of API success
      // This ensures the UI is updated even if the API call fails
      setProfileData({
        ...profileData,
        phone: phoneValue
      });

      setSnackbar({
        open: true,
        message: 'Numéro de téléphone mis à jour avec succès',
        severity: 'success'
      });

      setEditingPhone(false);

      // Update localStorage to keep the data in sync
      try {
        const storedEmployee = localStorage.getItem("employee");
        const storedUser = localStorage.getItem("user");

        if (storedEmployee) {
          const parsedEmployee = JSON.parse(storedEmployee);
          parsedEmployee.phone = phoneValue;
          localStorage.setItem("employee", JSON.stringify(parsedEmployee));
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.phone = phoneValue;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    } catch (error) {
      console.error('Error updating phone:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour du numéro de téléphone: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    // Reset error
    setPasswordError('');

    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Veuillez entrer votre mot de passe actuel');
      return;
    }

    if (!newPassword) {
      setPasswordError('Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      // Check if we have a valid email
      const email = user.email;

      if (!email) {
        console.error('No valid email found in user object:', user);
        throw new Error('Email utilisateur non trouvé');
      }

      console.log('Changing password for user email:', email);

      // Use the employees endpoint for password change
      const response = await fetch(`http://localhost:5000/api/employees/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          currentPassword,
          newPassword,
          isFirstLogin: false
        })
      });

      if (!response.ok) {
        console.error(`Error response from password change API: ${response.status}`);
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors du changement de mot de passe: ${response.status}`);
      }

      setSnackbar({
        open: true,
        message: 'Mot de passe changé avec succès',
        severity: 'success'
      });

      // Reset form and close dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Erreur lors du changement de mot de passe');
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Affichage des informations disponibles. Certaines fonctionnalités peuvent être limitées.
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Section 1: Informations personnelles */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Informations personnelles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={profileData?.photo ? profileData.photo : undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  {!profileData?.photo && profileData ? `${profileData.firstName[0]}${profileData.lastName[0]}` : ""}
                </Avatar>

                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  component="label"
                  size="small"
                >
                  Changer ma photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Prénom</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.firstName || 'Non spécifié'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Nom</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.lastName || 'Non spécifié'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">CIN</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.cin || 'Non spécifié'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Téléphone</Typography>
                      {editingPhone ? (
                        <TextField
                          value={phoneValue}
                          onChange={(e) => {
                            // Only allow digits and limit to 8 characters
                            const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                            setPhoneValue(value);
                          }}
                          size="small"
                          fullWidth
                          sx={{ mt: 1 }}
                          placeholder="Entrez votre numéro de téléphone (8 chiffres)"
                          inputProps={{
                            pattern: '[0-9]{8}',
                            maxLength: 8,
                            inputMode: 'numeric'
                          }}
                          helperText="Le numéro doit contenir 8 chiffres"
                        />
                      ) : (
                        <Typography variant="body1">
                          {profileData?.phone || 'Non spécifié'}
                        </Typography>
                      )}
                    </Box>

                    {editingPhone ? (
                      <Box>
                        <Button
                          size="small"
                          onClick={handlePhoneUpdate}
                          variant="contained"
                          sx={{ mr: 1 }}
                        >
                          Enregistrer
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingPhone(false);
                            setPhoneValue(profileData?.phone || '');
                          }}
                        >
                          Annuler
                        </Button>
                      </Box>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => setEditingPhone(true)}
                        color="primary"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Section 2: Compte & Sécurité */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Compte & Sécurité
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Email professionnel</Typography>
                <Typography variant="body1">
                  {profileData?.email || 'Non spécifié'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Mot de passe</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Modifier mon mot de passe
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Section 3: Informations professionnelles */}
          <Card elevation={0} variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Informations professionnelles
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Département</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.department || 'Non spécifié'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Rôle</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.role || 'Non spécifié'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Poste</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.position || 'Non spécifié'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Date d'embauche</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileData?.hireDate
                      ? format(new Date(profileData.hireDate), 'dd MMMM yyyy', { locale: fr })
                      : 'Non spécifiée'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Chef référent</Typography>
                  {chefData ? (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        icon={<SupervisorAccount />}
                        avatar={
                          <Avatar
                            src={chefData?.photo ? chefData.photo : undefined}
                            sx={{ bgcolor: 'primary.main' }}
                          >
                            {chefData.firstName?.[0] || ''}{chefData.lastName?.[0] || ''}
                          </Avatar>
                        }
                        label={`${chefData.firstName || ''} ${chefData.lastName || ''}`}
                        variant="outlined"
                        color="primary"
                        sx={{
                          '& .MuiChip-label': {
                            fontWeight: 'medium',
                            fontSize: '0.9rem'
                          },
                          height: 36
                        }}
                      />

                      {chefData.position && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 1 }}>
                          {chefData.position}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    profileData?.role === "Chef" ? (
                      <Chip
                        label="N/A"
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Chip
                        label="Non assigné"
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ mt: 1 }}
                      />
                    )
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)}>
        <DialogTitle>Changer ma photo de profil</DialogTitle>
        <DialogContent>
          {photoPreview && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar
                src={photoPreview}
                sx={{ width: 150, height: 150 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handlePhotoUpload}
            variant="contained"
            disabled={uploadingPhoto}
            startIcon={uploadingPhoto ? <CircularProgress size={20} /> : null}
          >
            {uploadingPhoto ? 'Téléchargement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Modifier mon mot de passe</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          <TextField
            label="Mot de passe actuel"
            type="password"
            fullWidth
            margin="normal"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <TextField
            label="Nouveau mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <TextField
            label="Confirmer le nouveau mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Annuler</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Changer le mot de passe
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeProfile;
