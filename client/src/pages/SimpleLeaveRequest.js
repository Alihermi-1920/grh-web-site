import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  CalendarMonth,
  EventAvailable,
  Description,
  MedicalServices
} from '@mui/icons-material';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AuthContext } from '../context/AuthContext';

// Simple date input component
const SimpleDateInput = ({ label, value, onChange, minDate, required }) => {
  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const handleChange = (e) => {
    const dateValue = e.target.value ? new Date(e.target.value) : null;
    onChange(dateValue);
  };

  return (
    <TextField
      label={label}
      type="date"
      value={formatDate(value)}
      onChange={handleChange}
      fullWidth
      required={required}
      InputLabelProps={{ shrink: true }}
      inputProps={{ min: minDate ? formatDate(minDate) : undefined }}
    />
  );
};

const SimpleLeaveRequest = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  // Form state
  const [leaveType, setLeaveType] = useState('Congé payé');
  const [startDate, setStartDate] = useState(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState(addDays(new Date(), 2));
  const [reason, setReason] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(1);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({
    totalDays: 30,
    usedDays: 0,
    remainingDays: 30,
    medicalDays: 0
  });

  // Calculate number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      // Add 1 to include both start and end dates
      const days = differenceInCalendarDays(endDate, startDate) + 1;
      setNumberOfDays(days > 0 ? days : 0);
    } else {
      setNumberOfDays(0);
    }
  }, [startDate, endDate]);

  // Fetch leave balance on component mount
  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    if (!user) return;

    setLoadingBalance(true);
    try {
      // Get employee ID from user object or localStorage
      let employeeId = user._id || user.id;

      if (!employeeId) {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        employeeId = storedUser?._id || storedUser?.id;
      }

      if (!employeeId) {
        console.error('No employee ID found');
        setFeedback({ type: 'error', message: 'ID employé non trouvé' });
        return;
      }

      console.log('Fetching leave balance for employee:', employeeId);

      const response = await fetch(`http://localhost:5001/api/conges/balance/${employeeId}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du solde de congés');
      }

      const data = await response.json();
      console.log('Leave balance data:', data);

      setLeaveBalance({
        totalDays: data.totalDays || 30,
        usedDays: data.usedDays || 0,
        remainingDays: data.remainingDays || 30,
        medicalDays: data.medicalDays || 0
      });
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoadingBalance(false);
    }
  };

  // Submit leave request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      if (!user) {
        throw new Error('Vous devez être connecté pour soumettre une demande de congé');
      }

      // Get employee ID from user object or localStorage
      let employeeId = user._id || user.id;

      if (!employeeId) {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        employeeId = storedUser?._id || storedUser?.id;
      }

      if (!employeeId) {
        throw new Error('ID employé non trouvé');
      }

      console.log('Submitting leave request for employee:', employeeId);

      // Create request data
      const requestData = {
        employee: employeeId,
        leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        numberOfDays,
        reason,
        isMedical: leaveType === 'Congé médical'
      };

      console.log('Request data:', requestData);

      // Send request
      const response = await fetch('http://localhost:5001/api/conges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission de la demande');
      }

      const responseData = await response.json();
      console.log('Leave request submitted successfully:', responseData);

      setFeedback({
        type: 'success',
        message: 'Votre demande de congé a été soumise avec succès'
      });

      // Reset form
      setReason('');
      setStartDate(addDays(new Date(), 1));
      setEndDate(addDays(new Date(), 2));
      setLeaveType('Congé payé');

      // Refresh leave balance
      fetchLeaveBalance();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Demande de Congé Simplifiée
      </Typography>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Leave balance */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{
              height: '100%',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #1a237e 30%, #283593 90%)'
                : 'linear-gradient(45deg, #bbdefb 30%, #e3f2fd 90%)',
              color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Mon Solde de Congés
              </Typography>

              {loadingBalance ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventAvailable sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="body1">
                          Total annuel: <strong>{leaveBalance.totalDays} jours</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonth sx={{ mr: 1, color: theme.palette.error.main }} />
                        <Typography variant="body1">
                          Utilisés: <strong>{leaveBalance.usedDays} jours</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Description sx={{ mr: 1, color: theme.palette.success.main }} />
                        <Typography variant="body1" fontWeight="bold">
                          Disponibles: <strong>{leaveBalance.remainingDays} jours</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    {leaveBalance.medicalDays > 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MedicalServices sx={{ mr: 1, color: theme.palette.info.main }} />
                          <Typography variant="body1">
                            Congés médicaux: <strong>{leaveBalance.medicalDays} jours</strong>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Leave request form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Nouvelle Demande de Congé
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Type de congé"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    fullWidth
                    required
                  >
                    <MenuItem value="Congé payé">Congé payé</MenuItem>
                    <MenuItem value="Congé sans solde">Congé sans solde</MenuItem>
                    <MenuItem value="Congé médical">Congé médical</MenuItem>
                    <MenuItem value="Congé personnel">Congé personnel</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <SimpleDateInput
                    label="Date de début"
                    value={startDate}
                    onChange={setStartDate}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <SimpleDateInput
                    label="Date de fin"
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Motif de la demande"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Nombre de jours: <strong>{numberOfDays}</strong>
                  </Typography>

                  {leaveType !== 'Congé médical' &&
                   leaveBalance &&
                   numberOfDays > leaveBalance.remainingDays && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Solde de congés insuffisant
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading ||
                             (leaveType !== 'Congé médical' &&
                              leaveBalance &&
                              numberOfDays > leaveBalance.remainingDays)}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Soumettre la demande'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleLeaveRequest;
