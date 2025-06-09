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
  useTheme,
  Snackbar,
  Tabs,
  Tab,
  Divider,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepButton,
  Fade,
  Zoom,
  Grow,
  MobileStepper,
  useMediaQuery,
  Backdrop,
  LinearProgress,
  FormControl,
  Select
} from '@mui/material';
import {
  CalendarMonth,
  EventAvailable,
  Description,
  MedicalServices,
  CloudUpload,
  CheckCircle,
  Cancel,
  AccessTime,
  Person,
  Visibility,
  Download,
  Close,
  History,
  NavigateNext,
  NavigateBefore,
  CategoryOutlined,
  DateRangeOutlined,
  SubjectOutlined,
  AttachFileOutlined,
  CheckCircleOutline,
  Celebration,
  PictureAsPdf,
  InfoOutlined,
  Attachment
} from '@mui/icons-material';
import { downloadLeavePDF } from '../utils/pdfGenerator';
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

const FinalLeaveRequest = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  // Form state
  const [leaveType, setLeaveType] = useState('Congé payé');
  const [startDate, setStartDate] = useState(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState(addDays(new Date(), 2));
  const [reason, setReason] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [documents, setDocuments] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({
    totalDays: 30,
    usedDays: 0,
    remainingDays: 30,
    medicalDays: 0
  });
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [historyTabValue, setHistoryTabValue] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  // Responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Steps for the stepper
  const steps = [
    {
      label: 'Type de congé',
      description: 'Sélectionnez le type de congé que vous souhaitez demander',
      icon: <CategoryOutlined />,
      color: theme.palette.primary.main
    },
    {
      label: 'Période',
      description: 'Choisissez les dates de début et de fin de votre congé',
      icon: <DateRangeOutlined />,
      color: theme.palette.secondary.main
    },
    {
      label: 'Motif',
      description: 'Expliquez la raison de votre demande de congé',
      icon: <SubjectOutlined />,
      color: theme.palette.info.main
    },
    {
      label: 'Documents',
      description: 'Ajoutez des documents justificatifs si nécessaire',
      icon: <AttachFileOutlined />,
      color: theme.palette.warning.main,
      optional: true
    },
    {
      label: 'Confirmation',
      description: 'Vérifiez et confirmez votre demande',
      icon: <CheckCircleOutline />,
      color: theme.palette.success.main
    }
  ];

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

  // Fetch leave balance and history on component mount
  useEffect(() => {
    fetchLeaveBalance();
    fetchLeaveHistory();
  }, []);

  // Get employee ID from various sources
  const getEmployeeId = () => {
    let employeeId = null;

    // Try to get from user context
    if (user && (user._id || user.id)) {
      employeeId = user._id || user.id;
      console.log('Got employee ID from user context:', employeeId);
    }

    // If not found, try localStorage
    if (!employeeId) {
      try {
        // Try employee key
        const storedEmployee = localStorage.getItem('employee');
        if (storedEmployee) {
          const parsedEmployee = JSON.parse(storedEmployee);
          employeeId = parsedEmployee._id || parsedEmployee.id;
          console.log('Got employee ID from localStorage (employee):', employeeId);
        }

        // Try user key if still not found
        if (!employeeId) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            employeeId = parsedUser._id || parsedUser.id;
            console.log('Got employee ID from localStorage (user):', employeeId);
          }
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    // Fallback to hardcoded ID for testing
    if (!employeeId) {
      employeeId = '67dc85b85f3551562c5457ca'; // Replace with a valid ID from your database
      console.log('Using hardcoded employee ID:', employeeId);
    }

    return employeeId;
  };

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    setLoadingBalance(true);
    try {
      const employeeId = getEmployeeId();

      if (!employeeId) {
        console.error('No employee ID found');
        setFeedback({ type: 'error', message: 'ID employé non trouvé' });
        return;
      }

      console.log('Fetching leave balance for employee:', employeeId);

      const response = await fetch(`http://localhost:5000/api/conges/balance/${employeeId}`);

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la récupération du solde de congés';
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // If not JSON, get text
            const errorText = await response.text();
            console.error('Server returned non-JSON response:', errorText);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        // Use default values if parsing fails
        data = {
          totalDays: 30,
          usedDays: 0,
          remainingDays: 30,
          medicalDays: 0
        };
      }
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

  // Fetch leave history
  const fetchLeaveHistory = async () => {
    setLoadingHistory(true);
    try {
      const employeeId = getEmployeeId();

      if (!employeeId) {
        console.error('No employee ID found');
        setFeedback({ type: 'error', message: 'ID employé non trouvé' });
        return;
      }

      console.log('Fetching leave history for employee:', employeeId);

      const response = await fetch(`http://localhost:5000/api/conges?employee=${employeeId}`);

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la récupération de l\'historique des congés';
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // If not JSON, get text
            const errorText = await response.text();
            console.error('Server returned non-JSON response:', errorText);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        // Use empty array if parsing fails
        data = [];
      }
      console.log('Leave history data:', data);

      // Sort by date (newest first)
      const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setLeaveHistory(sortedData);
    } catch (error) {
      console.error('Error fetching leave history:', error);
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter leave history by status
  const filteredLeaveHistory = () => {
    switch (historyTabValue) {
      case 0: // All
        return leaveHistory;
      case 1: // Pending
        return leaveHistory.filter(leave => leave.status === 'En attente');
      case 2: // Approved
        return leaveHistory.filter(leave => leave.status === 'Approuvé');
      case 3: // Rejected
        return leaveHistory.filter(leave => leave.status === 'Rejeté');
      default:
        return leaveHistory;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approuvé':
        return theme.palette.success.main;
      case 'Rejeté':
        return theme.palette.error.main;
      case 'En attente':
      default:
        return theme.palette.warning.main;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approuvé':
        return <CheckCircle fontSize="small" />;
      case 'Rejeté':
        return <Cancel fontSize="small" />;
      case 'En attente':
      default:
        return <AccessTime fontSize="small" />;
    }
  };

  // Preview document
  const handlePreviewDocument = (document) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };


  // Close preview
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setTimeout(() => {
      setPreviewDocument(null);
      setSelectedLeave(null);
    }, 300); // Delay to avoid UI flicker
  };

  // Download document
  const handleDownloadDocument = (document) => {
    window.open(`http://localhost:5000${document.filePath}`, '_blank');
  };

  // Stepper navigation functions
  const handleNext = () => {
    // Update progress
    setFormProgress(((activeStep + 1) / steps.length) * 100);

    // Mark current step as completed
    const newCompleted = { ...completed };
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);

    // Move to next step
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setFormProgress(((activeStep - 1) / steps.length) * 100);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
    setFormProgress((step / steps.length) * 100);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
    setFormProgress(0);
  };

  // Check if current step is completed
  const isStepComplete = (step) => {
    switch (step) {
      case 0: // Type de congé
        return !!leaveType;
      case 1: // Période
        return startDate && endDate && numberOfDays > 0;
      case 2: // Motif
        return reason.trim().length >= 10;
      case 3: // Documents
        return true; // Optional step
      case 4: // Confirmation
        return true; // Just a review step
      default:
        return false;
    }
  };

  // Check if we can proceed to next step
  const canProceed = () => {
    return isStepComplete(activeStep);
  };

  // Handle success dialog
  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
    setTabValue(1); // Switch to history tab
    handleReset(); // Reset form
  };

  // Handle file change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFeedback({
          type: 'error',
          message: `Le fichier "${file.name}" est trop volumineux. La taille maximale est de 10MB.`
        });
        return false;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf',
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setFeedback({
          type: 'error',
          message: `Le type de fichier "${file.name}" n'est pas pris en charge. Types acceptés: JPG, PNG, GIF, PDF, DOC, DOCX.`
        });
        return false;
      }

      return true;
    });

    // Update documents state
    setDocuments(prevDocs => [...prevDocs, ...validFiles]);

    // Show success message
    if (validFiles.length > 0) {
      setFeedback({
        type: 'success',
        message: `${validFiles.length} fichier(s) ajouté(s) avec succès. N'oubliez pas de soumettre votre demande.`
      });
    }
  };

  // Submit leave request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const employeeId = getEmployeeId();

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
        isMedical: leaveType === 'Congé médical',
        isUnpaid: leaveType === 'Congé sans solde'
      };

      console.log('Request data:', requestData);

      // Improved approach - handle files properly
      console.log('Using improved approach with file support');

      let response = null;

      // Create a URL with employee ID in query params
      const url = new URL('http://localhost:5000/api/conges');

      // Add employee ID to query params
      url.searchParams.append('employee', employeeId);

      console.log('Request URL with query params:', url.toString());

      // If there are documents, use FormData to submit everything at once
      if (documents.length > 0) {
        console.log(`Using FormData to submit leave request with ${documents.length} documents`);

        // Create FormData
        const formData = new FormData();

        // Add all request data fields - IMPORTANT: Convert all values to strings
        formData.append('employee', employeeId);
        formData.append('leaveType', leaveType);
        formData.append('startDate', startDate.toISOString());
        formData.append('endDate', endDate.toISOString());
        formData.append('numberOfDays', numberOfDays.toString());
        formData.append('reason', reason);
        formData.append('isMedical', (leaveType === 'Congé médical').toString());

        // Add special flag for unpaid leave
        formData.append('isUnpaid', (leaveType === 'Congé sans solde').toString());

        // Add all documents
        documents.forEach((file, index) => {
          console.log(`Adding document ${index + 1}:`, file.name, file.type, file.size);
          formData.append('documents', file);
        });

        // Log FormData contents
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }

        // Use a direct approach with multiple ways to pass the employee ID
        const formDataUrl = new URL('http://localhost:5000/api/conges');
        formDataUrl.searchParams.append('employee', employeeId);

        // For medical leave with documents, use a completely different approach
        if (leaveType === 'Congé médical') {
          console.log('Using completely new approach for medical leave with documents');

          // First, create the leave request without documents
          const jsonResponse = await fetch('http://localhost:5000/api/conges', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Employee-ID': employeeId
            },
            body: JSON.stringify({
              employee: employeeId,
              leaveType: leaveType,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              numberOfDays: numberOfDays,
              reason: reason,
              isMedical: true
            })
          });

          console.log('JSON response status:', jsonResponse.status);

          if (!jsonResponse.ok) {
            throw new Error('Failed to create medical leave request');
          }

          const leaveData = await jsonResponse.json();
          console.log('Created leave request:', leaveData);

          // Now upload the documents separately if needed
          if (documents.length > 0) {
            const docFormData = new FormData();
            documents.forEach(file => {
              docFormData.append('documents', file);
            });

            // Upload documents to the created leave request
            const docResponse = await fetch(`http://localhost:5000/api/conges/${leaveData._id}/documents?employee=${employeeId}`, {
              method: 'POST',
              headers: {
                'X-Employee-ID': employeeId
              },
              body: docFormData
            });

            console.log('Document upload response:', docResponse.status);

            if (!docResponse.ok) {
              console.warn('Failed to upload documents, but leave request was created');
            }
          }

          response = jsonResponse;
        } else {
          // For non-medical leave, use the normal approach
          response = await fetch(formDataUrl.toString(), {
            method: 'POST',
            headers: {
              'X-Employee-ID': employeeId
            },
            body: formData
          });
        }

        console.log('Response status from FormData request:', response.status);
      } else {
        // If no documents, use JSON
        console.log('No documents, using JSON request');

        // For unpaid leave, add special handling
        if (leaveType === 'Congé sans solde') {
          console.log('Using special approach for unpaid leave');

          // Make sure the isUnpaid flag is set
          const unpaidRequestData = {
            ...requestData,
            isUnpaid: true,
            deductFromBalance: false
          };

          response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Employee-ID': employeeId
            },
            body: JSON.stringify(unpaidRequestData)
          });
        } else {
          // For other types of leave without documents
          response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Employee-ID': employeeId
            },
            body: JSON.stringify(requestData)
          });
        }

        console.log('Response status from JSON request:', response.status);
      }

      console.log('Response status:', response.status);

      // Log the final response for debugging
      console.log('Final response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la soumission de la demande';
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          console.log('Response content type:', contentType);

          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.log('Error data:', errorData);
            errorMessage = errorData.error || errorMessage;
          } else {
            // If not JSON, get text
            const errorText = await response.text();
            console.error('Server returned non-JSON response:', errorText);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        console.error('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        responseData = { message: 'Demande soumise, mais la réponse du serveur est invalide' };
      }
      console.log('Leave request submitted successfully:', responseData);

      // Show success dialog instead of snackbar
      setSuccessDialogOpen(true);

      // Reset form (will be done after closing success dialog)

      // Refresh leave balance and history
      fetchLeaveBalance();
      fetchLeaveHistory();
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
        Gestion des Congés
      </Typography>

      {feedback && (
        <Snackbar
          open={!!feedback}
          autoHideDuration={6000}
          onClose={() => setFeedback(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setFeedback(null)}
            severity={feedback.type}
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        </Snackbar>
      )}

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={handleCloseSuccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
              : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
            color: 'white',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden', p: 3 }}>
          {/* Animated background elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }}
          />

          <DialogContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1, p: 3 }}>
            <Zoom in={successDialogOpen} timeout={700}>
              <Avatar
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <Celebration sx={{ fontSize: 40 }} />
              </Avatar>
            </Zoom>

            <Fade in={successDialogOpen} timeout={1000}>
              <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
                Demande Envoyée avec Succès!
              </Typography>
            </Fade>

            <Fade in={successDialogOpen} timeout={1300}>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                Votre demande de congé a été soumise et est en attente d'approbation par votre responsable.
                Vous pouvez suivre son statut dans l'onglet "Historique".
              </Typography>
            </Fade>

            {documents.length > 0 && (
              <Fade in={successDialogOpen} timeout={1500}>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <Typography variant="body2">
                    <strong>Documents joints ({documents.length}):</strong> Vos documents ont été enregistrés avec votre demande.
                  </Typography>
                </Alert>
              </Fade>
            )}

            <Button
              variant="contained"
              onClick={handleCloseSuccessDialog}
              sx={{
                mt: 2,
                bgcolor: 'white',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                px: 4,
                py: 1.2,
                borderRadius: 8,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Voir l'historique
            </Button>
          </DialogContent>
        </Box>
      </Dialog>

      {/* Tabs */}
      {/* Main Content */}
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
                color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
                borderRadius: 2,
                overflow: 'hidden'
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
                      {/* Paid Leave Section */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                          Congés Payés
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EventAvailable sx={{ mr: 1, color: theme.palette.primary.main }} />
                          <Typography variant="body1">
                            Total annuel: <strong>{leaveBalance.totalDays} jours</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarMonth sx={{ mr: 1, color: theme.palette.error.main }} />
                          <Typography variant="body1">
                            Utilisés: <strong>{leaveBalance.usedDays} jours</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Description sx={{ mr: 1, color: theme.palette.success.main }} />
                          <Typography variant="body1" fontWeight="bold">
                            Disponibles: <strong>{leaveBalance.remainingDays} jours</strong>
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Medical Leave Section */}
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="#e91e63" fontWeight="bold" gutterBottom>
                          Congés Médicaux
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MedicalServices sx={{ mr: 1, color: "#e91e63" }} />
                          <Typography variant="body1">
                            Utilisés: <strong>{leaveBalance.medicalDays || 0} jours</strong>
                            <Tooltip title="Les congés médicaux ne sont pas déduits de votre solde annuel">
                              <InfoOutlined sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Unpaid Leave Section */}
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="#9c27b0" fontWeight="bold" gutterBottom>
                          Congés Sans Solde
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarMonth sx={{ mr: 1, color: "#9c27b0" }} />
                          <Typography variant="body1">
                            Utilisés: <strong>{leaveHistory.filter(leave => leave.leaveType === 'Congé sans solde' && leave.status === 'Approuvé').reduce((total, leave) => total + leave.numberOfDays, 0)} jours</strong>
                            <Tooltip title="Les congés sans solde ne sont pas déduits de votre solde annuel">
                              <InfoOutlined sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Personal Leave Section */}
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="#ff9800" fontWeight="bold" gutterBottom>
                          Congés Personnels
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1, color: "#ff9800" }} />
                          <Typography variant="body1">
                            Utilisés: <strong>{leaveHistory.filter(leave => leave.leaveType === 'Congé personnel' && leave.status === 'Approuvé').reduce((total, leave) => total + leave.numberOfDays, 0)} jours</strong>
                            <Tooltip title="Les congés personnels sont déduits de votre solde annuel">
                              <InfoOutlined sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Leave request form with stepper */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom, rgba(30,40,60,0.8), rgba(30,40,60,0.4))'
                  : 'white',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                Nouvelle Demande de Congé
              </Typography>

              {/* Progress bar */}
              <Box sx={{ width: '100%', mb: 3 }}>
                <LinearProgress
                  variant="determinate"
                  value={formProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #42a5f5, #1976d2)'
                    }
                  }}
                />
              </Box>

              {/* Desktop Stepper */}
              {!isMobile && (
                <Stepper
                  activeStep={activeStep}
                  alternativeLabel
                  sx={{
                    mb: 4,
                    '& .MuiStepLabel-label': {
                      mt: 1
                    }
                  }}
                >
                  {steps.map((step, index) => (
                    <Step key={step.label} completed={completed[index]}>
                      <StepButton
                        onClick={handleStep(index)}
                        sx={{
                          '& .MuiStepLabel-iconContainer': {
                            '& .MuiStepIcon-root': {
                              color: completed[index] ? step.color : 'grey.400',
                              '&.Mui-active': {
                                color: step.color
                              }
                            }
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={activeStep === index ? 'bold' : 'normal'}
                        >
                          {step.label}
                          {step.optional && ' (Optionnel)'}
                        </Typography>
                      </StepButton>
                    </Step>
                  ))}
                </Stepper>
              )}

              {/* Mobile Stepper */}
              {isMobile && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary"
                    gutterBottom
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {steps[activeStep].icon}
                    <Box component="span" sx={{ ml: 1 }}>
                      {steps[activeStep].label}
                    </Box>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    {steps[activeStep].description}
                  </Typography>
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                {/* Step 1: Type de congé */}
                {activeStep === 0 && (
                  <Fade in={activeStep === 0} timeout={500}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Sélectionnez le type de congé que vous souhaitez demander:
                      </Typography>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {[
                          { value: 'Congé payé', color: '#1976d2', icon: <EventAvailable /> },
                          { value: 'Congé sans solde', color: '#9c27b0', icon: <CalendarMonth /> },
                          { value: 'Congé médical', color: '#e91e63', icon: <MedicalServices /> },
                          { value: 'Congé personnel', color: '#ff9800', icon: <Person /> }
                        ].map((option) => (
                          <Grid item xs={12} sm={6} key={option.value}>
                            <Card
                              variant={leaveType === option.value ? 'elevation' : 'outlined'}
                              elevation={leaveType === option.value ? 8 : 0}
                              onClick={() => setLeaveType(option.value)}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                transform: leaveType === option.value ? 'scale(1.02)' : 'scale(1)',
                                borderColor: leaveType === option.value ? option.color : 'divider',
                                borderWidth: leaveType === option.value ? 2 : 1,
                                borderRadius: 2,
                                '&:hover': {
                                  borderColor: option.color,
                                  boxShadow: 2
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  sx={{
                                    bgcolor: leaveType === option.value ? option.color : 'action.selected',
                                    color: 'white',
                                    mr: 2
                                  }}
                                >
                                  {option.icon}
                                </Avatar>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={leaveType === option.value ? 'bold' : 'medium'}
                                >
                                  {option.value}
                                </Typography>
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {/* Step 2: Période */}
                {activeStep === 1 && (
                  <Fade in={activeStep === 1} timeout={500}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Sélectionnez la période de votre congé:
                      </Typography>

                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <Card
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              borderColor: theme.palette.primary.main,
                              borderWidth: 2
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              fontWeight="bold"
                              gutterBottom
                            >
                              Date de début
                            </Typography>
                            <SimpleDateInput
                              label="Sélectionnez une date"
                              value={startDate}
                              onChange={setStartDate}
                              required
                            />
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Card
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              borderColor: theme.palette.secondary.main,
                              borderWidth: 2
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="secondary"
                              fontWeight="bold"
                              gutterBottom
                            >
                              Date de fin
                            </Typography>
                            <SimpleDateInput
                              label="Sélectionnez une date"
                              value={endDate}
                              onChange={setEndDate}
                              minDate={startDate}
                              required
                            />
                          </Card>
                        </Grid>

                        <Grid item xs={12}>
                          <Card
                            sx={{
                              p: 2,
                              mt: 2,
                              borderRadius: 2,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(25, 118, 210, 0.05)'
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                              Durée totale:
                            </Typography>
                            <Typography variant="h4" color="primary" fontWeight="bold">
                              {numberOfDays} {numberOfDays > 1 ? 'jours' : 'jour'}
                            </Typography>

                            {leaveType === 'Congé payé' &&
                             leaveBalance &&
                             numberOfDays > leaveBalance.remainingDays && (
                              <Alert
                                severity="error"
                                sx={{
                                  mt: 2,
                                  borderRadius: 2
                                }}
                                icon={<Cancel />}
                              >
                                <Typography fontWeight="medium">
                                  Solde de congés insuffisant
                                </Typography>
                              </Alert>
                            )}
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {/* Step 3: Motif */}
                {activeStep === 2 && (
                  <Fade in={activeStep === 2} timeout={500}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Veuillez indiquer le motif de votre demande de congé:
                      </Typography>

                      <Card
                        variant="outlined"
                        sx={{
                          p: 3,
                          mt: 2,
                          borderRadius: 2,
                          borderColor: theme.palette.info.main,
                          borderWidth: 2
                        }}
                      >
                        <TextField
                          label="Motif de la demande"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          multiline
                          rows={5}
                          fullWidth
                          required
                          placeholder="Veuillez expliquer la raison de votre demande de congé..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                          helperText={
                            reason.length < 10
                              ? `Minimum 10 caractères (${reason.length}/10)`
                              : `${reason.length} caractères`
                          }
                          error={reason.length > 0 && reason.length < 10}
                        />
                      </Card>
                    </Box>
                  </Fade>
                )}

                {/* Step 4: Documents */}
                {activeStep === 3 && (
                  <Fade in={activeStep === 3} timeout={500}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {leaveType === 'Congé médical'
                          ? 'Veuillez ajouter vos justificatifs médicaux:'
                          : 'Vous pouvez ajouter des documents justificatifs (optionnel):'}
                      </Typography>

                      <Card
                        variant="outlined"
                        sx={{
                          p: 3,
                          mt: 2,
                          borderRadius: 2,
                          borderColor: theme.palette.warning.main,
                          borderWidth: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255, 152, 0, 0.02)'
                        }}
                      >
                        <Box
                          sx={{
                            border: '2px dashed',
                            borderColor: documents.length > 0 ? 'success.main' : 'warning.main',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            bgcolor: documents.length > 0
                              ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)')
                              : 'transparent',
                            '&:hover': {
                              borderColor: documents.length > 0 ? 'success.main' : 'primary.main',
                              bgcolor: documents.length > 0
                                ? (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)')
                                : 'rgba(25, 118, 210, 0.04)'
                            }
                          }}
                        >
                          <input
                            type="file"
                            id="document-upload"
                            multiple
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <label htmlFor="document-upload">
                            <Button
                              component="span"
                              variant="contained"
                              startIcon={<CloudUpload />}
                              color={documents.length > 0 ? "success" : "primary"}
                              sx={{
                                borderRadius: 8,
                                px: 3,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: 3
                              }}
                            >
                              {documents.length > 0
                                ? 'Ajouter plus de documents'
                                : leaveType === 'Congé médical'
                                  ? 'Ajouter un justificatif médical'
                                  : 'Ajouter des documents'}
                            </Button>
                          </label>

                          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                            Formats acceptés: PDF, JPG, PNG (max 10MB)
                          </Typography>

                          {leaveType === 'Congé médical' && documents.length === 0 && (
                            <Alert
                              severity="warning"
                              sx={{
                                mt: 3,
                                borderRadius: 2,
                                maxWidth: 400,
                                mx: 'auto'
                              }}
                            >
                              <Typography fontWeight="medium">
                                Un justificatif médical est requis pour ce type de congé
                              </Typography>
                            </Alert>
                          )}
                        </Box>

                        {documents.length > 0 && (
                          <Box sx={{ mt: 3, textAlign: 'left' }}>
                            <Typography variant="subtitle1" color="success.main" fontWeight="bold" gutterBottom>
                              Documents sélectionnés:
                            </Typography>

                            <Grid container spacing={1}>
                              {documents.map((file, index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      p: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      borderRadius: 2
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        bgcolor: 'success.main',
                                        mr: 1,
                                        width: 32,
                                        height: 32
                                      }}
                                    >
                                      <Description fontSize="small" />
                                    </Avatar>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {file.name}
                                    </Typography>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Card>
                    </Box>
                  </Fade>
                )}

                {/* Step 5: Confirmation */}
                {activeStep === 4 && (
                  <Fade in={activeStep === 4} timeout={500}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Veuillez vérifier les informations de votre demande:
                      </Typography>

                      <Card
                        variant="outlined"
                        sx={{
                          p: 3,
                          mt: 2,
                          borderRadius: 2,
                          borderColor: theme.palette.success.main,
                          borderWidth: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.02)'
                        }}
                      >
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Type de congé
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                              {leaveType}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Durée
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                              {numberOfDays} {numberOfDays > 1 ? 'jours' : 'jour'}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Date de début
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {format(startDate, 'dd MMMM yyyy', { locale: fr })}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Date de fin
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {format(endDate, 'dd MMMM yyyy', { locale: fr })}
                            </Typography>
                          </Grid>

                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Motif
                            </Typography>
                            <Typography variant="body1">
                              {reason}
                            </Typography>
                          </Grid>

                          {documents.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Documents joints
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {documents.map((file, index) => (
                                  <Chip
                                    key={index}
                                    icon={<Description />}
                                    label={file.name}
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                  />
                                ))}
                              </Box>
                            </Grid>
                          )}

                          {leaveType === 'Congé payé' &&
                           leaveBalance &&
                           numberOfDays > leaveBalance.remainingDays && (
                            <Grid item xs={12}>
                              <Alert
                                severity="error"
                                sx={{
                                  mt: 2,
                                  borderRadius: 2
                                }}
                                icon={<Cancel />}
                              >
                                <Typography fontWeight="medium">
                                  Solde de congés insuffisant
                                </Typography>
                              </Alert>
                            </Grid>
                          )}
                        </Grid>
                      </Card>
                    </Box>
                  </Fade>
                )}

                {/* Navigation buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4, pb: 2 }}>
                  <Button
                    variant="outlined"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{
                      mr: 1,
                      borderRadius: 6,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                    startIcon={<NavigateBefore />}
                  >
                    Précédent
                  </Button>

                  <Box sx={{ flex: '1 1 auto' }} />

                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      disabled={loading ||
                               (leaveType === 'Congé payé' &&
                                leaveBalance &&
                                numberOfDays > leaveBalance.remainingDays) ||
                               (leaveType === 'Congé médical' && documents.length === 0)}
                      sx={{
                        py: 1.2,
                        px: 4,
                        borderRadius: 6,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: 3
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Soumettre la demande'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      sx={{
                        py: 1.2,
                        px: 4,
                        borderRadius: 6,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                      endIcon={<NavigateNext />}
                    >
                      Suivant
                    </Button>
                  )}
                </Box>
              </form>
            </Paper>
          </Grid>
        </Grid>

      {/* Historique des demandes */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(to bottom, rgba(30,40,60,0.8), rgba(30,40,60,0.4))'
              : 'white'
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
            Historique des Demandes
          </Typography>

          {loadingHistory ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : leaveHistory.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Aucune demande de congé trouvée.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Période</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Jours</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Motif</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Commentaire du chef</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Statut</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((leave) => (
                    <tr key={leave._id} style={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2" fontWeight="medium">
                          {leave.leaveType}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2">
                          {leave.startDate ? format(new Date(leave.startDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                          {" → "}
                          {leave.endDate ? format(new Date(leave.endDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2">
                          {leave.numberOfDays} jour{leave.numberOfDays > 1 ? "s" : ""}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2">
                          {leave.reason || "-"}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          {leave.chefJustification || "-"}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Chip
                          icon={getStatusIcon(leave.status)}
                          label={leave.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(leave.status) + "20",
                            color: getStatusColor(leave.status),
                            fontWeight: "bold"
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {leave.documents && leave.documents.length > 0 && (
                            <Tooltip title="Voir le document joint">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handlePreviewDocument(leave.documents[0])}
                              >
                                <Attachment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(leave.status === 'Approuvé' || leave.status === 'Rejeté') && (
                            <Tooltip title="Télécharger le formulaire PDF">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => downloadLeavePDF(leave, user)}
                              >
                                <PictureAsPdf fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Paper>

      
      {/* Document Preview Dialog */}
      <Dialog open={previewOpen && previewDocument} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="div">
            {previewDocument?.originalName}
          </Typography>
          <IconButton onClick={handleClosePreview} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewDocument?.fileType.includes("image") ? (
            <Box sx={{ textAlign: "center" }}>
              <img
                src={previewDocument?.filePath}
                alt={previewDocument?.originalName}
                style={{ maxWidth: "100%", maxHeight: "70vh" }}
              />
            </Box>
          ) : previewDocument?.fileType.includes("pdf") ? (
            <Box sx={{ height: "70vh" }}>
              <iframe
                src={previewDocument?.filePath}
                width="100%"
                height="100%"
                title={previewDocument?.originalName}
                style={{ border: "none" }}
              />
            </Box>
          ) : (
            <Typography>
              Ce type de fichier ne peut pas être prévisualisé. Veuillez le télécharger.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleDownloadDocument(previewDocument)}
            color="primary"
            startIcon={<Download />}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinalLeaveRequest;
