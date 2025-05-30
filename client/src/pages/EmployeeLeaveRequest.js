// src/pages/EmployeeLeaveRequest.js
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  Fade,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Badge
} from "@mui/material";
import SimpleDateInput from "../components/SimpleDateInput";
import { differenceInCalendarDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CloudUpload,
  Delete,
  Info,
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarMonth,
  Description,
  MedicalServices,
  EventAvailable,
  NavigateNext,
  NavigateBefore,
  History,
  ExpandMore,
  ExpandLess,
  Visibility,
  Download,
  Close
} from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";

const EmployeeLeaveRequest = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [leaveType, setLeaveType] = useState("Congé payé");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  // États pour l'interface utilisateur et les données
  const [showHistory, setShowHistory] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState("");
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [numberOfDays, setNumberOfDays] = useState(0);

  // Steps for the stepper
  const steps = [
    {
      label: "Type de congé",
      description: "Sélectionnez le type de congé que vous souhaitez demander"
    },
    {
      label: "Période",
      description: "Sélectionnez les dates de début et de fin de votre congé"
    },
    {
      label: "Motif et documents",
      description: "Indiquez le motif de votre demande et joignez des documents si nécessaire"
    },
    {
      label: "Confirmation",
      description: "Vérifiez les informations et soumettez votre demande"
    }
  ];

  // Calculate days between two dates
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    return differenceInCalendarDays(end, start) + 1;
  };

  // Update number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      setNumberOfDays(calculateDays(startDate, endDate));
    } else {
      setNumberOfDays(0);
    }
  }, [startDate, endDate]);

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    // Try different formats of the ID
    let employeeId = user?._id || user?.id;

    // If we still don't have an ID, try to get it from localStorage
    if (!employeeId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && (storedUser._id || storedUser.id)) {
          employeeId = storedUser._id || storedUser.id;
          console.log("Using employee ID from localStorage:", employeeId);
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }

    // If we still don't have an ID, use a hardcoded one for testing
    if (!employeeId) {
      employeeId = "6810df012d66d7c2dd7be2c3"; // Replace with a valid employee ID from your database
      console.log("Using hardcoded employee ID:", employeeId);
    }

    // Make sure the ID is valid
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid employee ID format, using hardcoded ID instead");
      employeeId = "67dc85b85f3551562c5457ca"; // Valid employee ID: Hakim Hermi
    }

    // Final check for employee ID
    if (!employeeId || !employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid employee ID, cannot fetch leave balance");
      setLeaveBalance({
        totalDays: 30,
        usedDays: 0,
        remainingDays: 30,
        medicalDays: 0
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching leave balance for user:", employeeId);
      const response = await fetch("http://localhost:5000/api/conges/balance/" + employeeId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Erreur lors de la récupération du solde de congés");
      }

      const data = await response.json();
      console.log("Leave balance data:", data);

      // The API returns an object with totalDays, usedDays, remainingDays, etc.
      // Make sure it has the structure we expect
      if (data && typeof data === 'object') {
        setLeaveBalance({
          totalDays: data.totalDays || 30,
          usedDays: data.usedDays || 0,
          remainingDays: data.remainingDays || 30,
          medicalDays: data.medicalDays || 0
        });
      } else {
        // Fallback to default values if the API response is not as expected
        console.warn("Unexpected API response format for leave balance, using default values");
        setLeaveBalance({
          totalDays: 30,
          usedDays: 0,
          remainingDays: 30,
          medicalDays: 0
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave history
  const fetchLeaveHistory = async () => {
    // Try different formats of the ID
    let employeeId = user?._id || user?.id;

    // If we still don't have an ID, try to get it from localStorage
    if (!employeeId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && (storedUser._id || storedUser.id)) {
          employeeId = storedUser._id || storedUser.id;
          console.log("Using employee ID from localStorage:", employeeId);
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }

    // If we still don't have an ID, use a hardcoded one for testing
    if (!employeeId) {
      employeeId = "6810df012d66d7c2dd7be2c3"; // Replace with a valid employee ID from your database
      console.log("Using hardcoded employee ID:", employeeId);
    }

    // Make sure the ID is valid
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid employee ID format, using hardcoded ID instead");
      employeeId = "67dc85b85f3551562c5457ca"; // Valid employee ID: Hakim Hermi
    }

    // Final check for employee ID
    if (!employeeId || !employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid employee ID, cannot fetch leave history");
      setLeaveHistory([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      console.log("Fetching leave history for user:", employeeId);

      // Try both employee and employeeId parameters for compatibility
      const response = await fetch(`http://localhost:5000/api/conges?employee=${employeeId}&employeeId=${employeeId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Erreur lors de la récupération de l'historique des congés");
      }

      const data = await response.json();
      console.log("Leave history data:", data);

      if (Array.isArray(data)) {
        // Sort by date (newest first)
        const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLeaveHistory(sortedData);
      } else {
        // Fallback to empty array if the API response is not as expected
        console.warn("Unexpected API response format for leave history, using empty array");
        setLeaveHistory([]);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log("Component mounted, user:", user);

    // Try to get user from localStorage if not available in context
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          console.log("Found user in localStorage:", storedUser);
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }

    // Always fetch data, even if user is not logged in (for testing purposes)
    fetchLeaveBalance();
    fetchLeaveHistory();

    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      console.log("Refreshing data...");
      fetchLeaveBalance();
      fetchLeaveHistory();
    }, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Update data when user changes
  useEffect(() => {
    if (user) {
      console.log("User changed, refreshing data...");
      fetchLeaveBalance();
      fetchLeaveHistory();
    }
  }, [user]);

  // Handle file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size
    }));
    setDocuments([...documents, ...newFiles]);
  };

  // Remove a document
  const handleRemoveFile = (index) => {
    const newFiles = [...documents];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setDocuments(newFiles);
  };

  // Handle next step
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0 && !leaveType) {
      setFeedback({ type: "error", message: "Veuillez sélectionner un type de congé" });
      return;
    }

    if (activeStep === 1) {
      if (!startDate || !endDate) {
        setFeedback({ type: "error", message: "Veuillez sélectionner les dates de début et de fin" });
        return;
      }

      if (numberOfDays <= 0) {
        setFeedback({ type: "error", message: "La période de congé doit être d'au moins un jour" });
        return;
      }

      // Check if leave balance is sufficient
      if (leaveType !== "Congé médical" && leaveBalance && numberOfDays > leaveBalance.remainingDays) {
        setFeedback({ type: "error", message: "Solde de congés insuffisant" });
        return;
      }
    }

    if (activeStep === 2) {
      if (!reason) {
        setFeedback({ type: "error", message: "Veuillez indiquer le motif de votre demande" });
        return;
      }

      if (leaveType === "Congé médical" && documents.length === 0) {
        setFeedback({ type: "error", message: "Veuillez joindre un justificatif médical" });
        return;
      }
    }

    setFeedback(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle form reset
  const handleReset = () => {
    setActiveStep(0);
    setLeaveType("Congé payé");
    setStartDate(null);
    setEndDate(null);
    setReason("");
    setDocuments([]);
    setNumberOfDays(0);
    setFeedback(null);
  };

  // Submit leave request
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      // Check if user is logged in
      if (!user) {
        throw new Error("Vous n'êtes pas connecté. Veuillez vous reconnecter.");
      }

      // Log the user object to see its structure
      console.log("User object:", user);

      // Get the employee ID from the user object
      // Try different formats of the ID
      let employeeId = user._id || user.id;

      // If we still don't have an ID, try to get it from localStorage
      if (!employeeId) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser && (storedUser._id || storedUser.id)) {
            employeeId = storedUser._id || storedUser.id;
            console.log("Using employee ID from localStorage:", employeeId);
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }

      // If we still don't have an ID, use a hardcoded one for testing
      if (!employeeId) {
        employeeId = "67dc85b85f3551562c5457ca"; // Valid employee ID: Hakim Hermi
        console.log("Using hardcoded employee ID:", employeeId);
      } else {
        console.log("Using employee ID from user object:", employeeId);
      }

      // Make sure the ID is valid
      if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        console.error("Invalid employee ID format, using hardcoded ID instead");
        employeeId = "67dc85b85f3551562c5457ca"; // Valid employee ID: Hakim Hermi
      }

      // Check if the employee exists
      try {
        const checkResponse = await fetch(`http://localhost:5000/api/employees/${employeeId}`);
        if (!checkResponse.ok) {
          console.error("Employee not found, using hardcoded ID instead");
          employeeId = "67dc85b85f3551562c5457ca"; // Valid employee ID: Hakim Hermi
        } else {
          const employeeData = await checkResponse.json();
          console.log("Employee found:", employeeData);
        }
      } catch (error) {
        console.error("Error checking employee:", error);
      }

      // Final check for employee ID
      if (!employeeId || !employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error("ID d'employé invalide. Veuillez vous reconnecter.");
      }

      // Create FormData for the request
      const formData = new FormData();

      // Make sure employee ID is a string
      const employeeIdStr = String(employeeId).trim();
      console.log("Employee ID to be sent:", employeeIdStr);

      // Add employee ID as a field multiple times with different names for redundancy
      formData.append("employee", employeeIdStr);
      formData.append("employeeId", employeeIdStr);
      formData.append("employee_id", employeeIdStr);

      // Also add it as the first field to ensure it's processed first
      const entries = Array.from(formData.entries());
      formData.delete("employee");
      formData.delete("employeeId");
      formData.delete("employee_id");

      // Re-add employee ID fields first
      formData.append("employee", employeeIdStr);
      formData.append("employeeId", employeeIdStr);
      formData.append("employee_id", employeeIdStr);

      // Then add back the other fields
      for (const [key, value] of entries) {
        if (key !== "employee" && key !== "employeeId" && key !== "employee_id") {
          formData.append(key, value);
        }
      }

      // Add other fields
      formData.append("leaveType", leaveType);
      formData.append("startDate", startDate.toISOString());
      formData.append("endDate", endDate.toISOString());
      formData.append("numberOfDays", numberOfDays);
      formData.append("reason", reason);
      formData.append("isMedical", leaveType === "Congé médical" ? "true" : "false");

      // Log all form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Add documents if any
      if (documents.length > 0) {
        documents.forEach(doc => {
          formData.append("documents", doc.file);
        });
      }

      console.log("Submitting leave request for employee:", employeeId);

      try {
        console.log("Sending leave request to server...");

        // Try both approaches: JSON and FormData
        console.log("Trying both JSON and FormData approaches");

        // First, create a JSON object with all the data
        const jsonData = {
          employee: employeeIdStr,
          employeeId: employeeIdStr,
          employee_id: employeeIdStr,
          leaveType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          numberOfDays,
          reason,
          isMedical: leaveType === "Congé médical"
        };

        // Make sure the employee ID is included in the URL as a query parameter for redundancy
        const baseUrl = "http://localhost:5000/api/conges";
        const url = `${baseUrl}?employee=${employeeIdStr}&employeeId=${employeeIdStr}`;
        console.log("Request URL:", url);

        let response;

        // If we have documents, use FormData
        if (documents.length > 0) {
          console.log("Using FormData approach (with documents)");
          response = await fetch(url, {
            method: "POST",
            body: formData
          });
        } else {
          // Try JSON approach first
          try {
            console.log("Using JSON approach");
            response = await fetch(`${baseUrl}/json`, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(jsonData)
            });

            // If JSON approach fails, try FormData as fallback
            if (!response.ok) {
              console.log("JSON approach failed, trying FormData as fallback");
              response = await fetch(url, {
                method: "POST",
                body: formData
              });
            }
          } catch (error) {
            console.log("JSON approach error, trying FormData as fallback");
            response = await fetch(url, {
              method: "POST",
              body: formData
            });
          }
        }

        if (!response.ok) {
          let errorMessage = "Erreur lors de la soumission de la demande";
          try {
            // Clone the response before reading it
            const errorResponse = response.clone();
            const errorData = await errorResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error("Failed to parse error response:", jsonError);
            try {
              // Try to get text instead from a clone
              const textResponse = response.clone();
              const errorText = await textResponse.text();
              if (errorText) errorMessage = errorText;
            } catch (textError) {
              console.error("Failed to get error text:", textError);
            }
          }
          throw new Error(errorMessage);
        }

        // Try to parse the response
        let responseData;
        try {
          // Clone the response before reading it
          const jsonResponse = response.clone();
          responseData = await jsonResponse.json();
          console.log("Leave request submitted successfully:", responseData);
        } catch (jsonError) {
          console.warn("Could not parse response as JSON, but request was successful");
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      setFeedback({
        type: "success",
        message: "Votre demande de congé a été soumise avec succès"
      });

      // Reset form
      handleReset();

      // Refresh data
      fetchLeaveBalance();
      fetchLeaveHistory();
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({ type: "error", message: error.message });
      setActiveStep(0); // Go back to first step on error
    } finally {
      setSubmitting(false);
    }
  };

  // View leave details
  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setHistoryDialog(true);
  };

  // Preview document
  const handlePreviewDocument = (document) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  // Close preview
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDocument(null);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Approuvé":
        return theme.palette.success.main;
      case "Rejeté":
        return theme.palette.error.main;
      case "En attente":
      default:
        return theme.palette.warning.main;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Approuvé":
        return <CheckCircle fontSize="small" />;
      case "Rejeté":
        return <Cancel fontSize="small" />;
      case "En attente":
      default:
        return <AccessTime fontSize="small" />;
    }
  };

  // Suppression des fonctions liées à la pagination

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Gestion des Congés
      </Typography>

      {!user && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          Vous n'êtes pas connecté. Veuillez vous connecter pour accéder à cette page.
        </Alert>
      )}

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
        {/* Solde de congés */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{
              height: "100%",
              background: theme.palette.mode === "dark"
                ? "linear-gradient(45deg, #1a237e 30%, #283593 90%)"
                : "linear-gradient(45deg, #bbdefb 30%, #e3f2fd 90%)",
              color: theme.palette.mode === "dark" ? "white" : "inherit",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Mon Solde de Congés
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <EventAvailable sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="body1">
                          Total annuel: <strong>{leaveBalance?.totalDays || 30} jours</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <CalendarMonth sx={{ mr: 1, color: theme.palette.error.main }} />
                        <Typography variant="body1">
                          Utilisés: <strong>{leaveBalance?.usedDays || 0} jours</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Description sx={{ mr: 1, color: theme.palette.success.main }} />
                        <Typography variant="body1" fontWeight="bold">
                          Disponibles: <strong>{leaveBalance?.remainingDays || 30} jours</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    {leaveBalance?.medicalDays > 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
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

        {/* Formulaire de demande par étapes */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Nouvelle Demande de Congé
            </Typography>

            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>

                    {/* Step 1: Type de congé */}
                    {index === 0 && (
                      <Box sx={{ py: 1 }}>
                        <TextField
                          select
                          label="Type de congé"
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value)}
                          fullWidth
                          required
                          variant="outlined"
                          sx={{ mb: 2 }}
                        >
                          <MenuItem value="Congé payé">Congé payé</MenuItem>
                          <MenuItem value="Congé sans solde">Congé sans solde</MenuItem>
                          <MenuItem value="Congé médical">Congé médical</MenuItem>
                          <MenuItem value="Congé personnel">Congé personnel</MenuItem>
                        </TextField>

                        {leaveType === "Congé médical" && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Les congés médicaux nécessitent un justificatif et ne sont pas déduits de votre solde annuel.
                          </Alert>
                        )}
                      </Box>
                    )}

                    {/* Step 2: Période */}
                    {index === 1 && (
                      <Box sx={{ py: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <SimpleDateInput
                              label="Date de début"
                              value={startDate}
                              onChange={(newValue) => {
                                setStartDate(newValue);
                                if (endDate && newValue > endDate) {
                                  setEndDate(newValue);
                                }
                              }}
                              required={true}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <SimpleDateInput
                              label="Date de fin"
                              value={endDate}
                              onChange={(newValue) => setEndDate(newValue)}
                              minDate={startDate || undefined}
                              required={true}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                Jours demandés:
                              </Typography>
                              <Chip
                                label={numberOfDays + " jour" + (numberOfDays > 1 ? "s" : "")}
                                color={
                                  numberOfDays > 0
                                    ? leaveType === "Congé médical" || (leaveBalance && numberOfDays <= leaveBalance.remainingDays)
                                      ? "success"
                                      : "error"
                                    : "default"
                                }
                              />
                              {leaveType !== "Congé médical" && leaveBalance && numberOfDays > leaveBalance.remainingDays && (
                                <Tooltip title="Solde insuffisant">
                                  <IconButton size="small" color="error">
                                    <Info />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Step 3: Motif et documents */}
                    {index === 2 && (
                      <Box sx={{ py: 1 }}>
                        <TextField
                          label="Motif de la demande"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          multiline
                          rows={3}
                          fullWidth
                          required
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />

                        {leaveType === "Congé médical" && (
                          <>
                            <Typography variant="subtitle2" gutterBottom color="primary">
                              Justificatif médical (obligatoire)
                            </Typography>
                            <Box
                              sx={{
                                border: "2px dashed",
                                borderColor: "divider",
                                borderRadius: 1,
                                p: 2,
                                mb: 2,
                                textAlign: "center"
                              }}
                            >
                              <input
                                type="file"
                                id="document-upload"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              <label htmlFor="document-upload">
                                <Button
                                  component="span"
                                  variant="outlined"
                                  startIcon={<CloudUpload />}
                                  sx={{ mb: 1 }}
                                >
                                  Ajouter un document
                                </Button>
                              </label>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Formats acceptés: PDF, JPG, PNG (max 10MB)
                              </Typography>
                            </Box>

                            {documents.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Documents joints ({documents.length})
                                </Typography>
                                <Stack spacing={1}>
                                  {documents.map((doc, index) => (
                                    <Box
                                      key={index}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        p: 1,
                                        borderRadius: 1,
                                        bgcolor: "action.hover"
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ flex: 1, mr: 1 }} noWrap>
                                        {doc.name}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveFile(index)}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                    )}

                    {/* Step 4: Confirmation */}
                    {index === 3 && (
                      <Box sx={{ py: 1 }}>
                        <Card variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Récapitulatif de votre demande
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Type de congé:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {leaveType}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Nombre de jours:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {numberOfDays} jour{numberOfDays > 1 ? "s" : ""}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Date de début:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: fr }) : "-"}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Date de fin:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: fr }) : "-"}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                  Motif:
                                </Typography>
                                <Typography variant="body1">
                                  {reason}
                                </Typography>
                              </Grid>
                              {leaveType === "Congé médical" && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Documents joints:
                                  </Typography>
                                  <Typography variant="body1">
                                    {documents.length} document{documents.length > 1 ? "s" : ""}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    <Box sx={{ mb: 2, mt: 1 }}>
                      <div>
                        <Button
                          disabled={activeStep === 0}
                          onClick={handleBack}
                          sx={{ mr: 1 }}
                          startIcon={<NavigateBefore />}
                        >
                          Retour
                        </Button>

                        {activeStep === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleSubmit}
                            color="primary"
                            disabled={submitting}
                            endIcon={submitting ? <CircularProgress size={16} /> : <CheckCircle />}
                          >
                            Soumettre
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            color="primary"
                            endIcon={<NavigateNext />}
                          >
                            Suivant
                          </Button>
                        )}
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {activeStep === steps.length && (
              <Paper square elevation={0} sx={{ p: 3, mt: 2, bgcolor: "success.light", color: "success.contrastText" }}>
                <Typography variant="h6" gutterBottom>
                  Demande soumise avec succès!
                </Typography>
                <Typography paragraph>
                  Votre demande de congé a été enregistrée et est en attente d'approbation.
                </Typography>
                <Button onClick={handleReset} variant="outlined" sx={{ mt: 1, mr: 1 }}>
                  Nouvelle demande
                </Button>
              </Paper>
            )}
          </Paper>
        </Grid>

        {/* Historique des demandes - Bouton pour afficher/masquer */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={showHistory ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowHistory(!showHistory)}
              sx={{ mt: 2 }}
            >
              {showHistory ? "Masquer l'historique" : "Afficher l'historique des demandes"}
              <Badge
                badgeContent={leaveHistory.length}
                color="primary"
                sx={{ ml: 1 }}
                max={99}
              />
            </Button>

            {!loadingHistory && leaveHistory.length > 0 && (
              <Tooltip title="Voir l'historique complet">
                <IconButton
                  color="primary"
                  onClick={() => {
                    setSelectedLeave(null);
                    setHistoryDialog(true);
                  }}
                  sx={{ mt: 2 }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Collapse in={showHistory} timeout="auto" unmountOnExit>
            <Paper elevation={3} sx={{ p: 3, mt: 1 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Historique des Demandes
              </Typography>
              {loadingHistory ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : leaveHistory.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                  Aucune demande de congé trouvée.
                </Typography>
              ) : (
                <TableContainer>
                  <Table aria-label="tableau des demandes de congé">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}>
                        <TableCell>Type</TableCell>
                        <TableCell>Période</TableCell>
                        <TableCell align="center">Jours</TableCell>
                        <TableCell align="center">Statut</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveHistory.map((leave) => (
                        <TableRow
                          key={leave._id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: theme.palette.action.hover }
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Typography variant="body2" fontWeight="medium">
                              {leave.leaveType}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {leave.startDate ? format(new Date(leave.startDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                              {" → "}
                              {leave.endDate ? format(new Date(leave.endDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {leave.numberOfDays} jour{leave.numberOfDays > 1 ? "s" : ""}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography 
                              variant="body2" 
                              sx={{
                                color: leave.status === "Approuvé" ? "green" : 
                                       leave.status === "Rejeté" ? "red" : "orange",
                                fontWeight: "bold"
                              }}
                            >
                              {leave.status}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewLeave(leave)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Collapse>
        </Grid>
      </Grid>

      {/* Dialogue d'historique des congés */}
      <Dialog
        open={historyDialog}
        onClose={() => setHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLeave ? (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">
                  Détails de la demande
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: selectedLeave.status === "Approuvé" ? "green" : 
                           selectedLeave.status === "Rejeté" ? "red" : "orange",
                    fontWeight: "bold"
                  }}
                >
                  {selectedLeave.status}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Contenu existant pour les détails d'un congé spécifique */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type de congé
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLeave.leaveType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nombre de jours
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLeave.numberOfDays} jour{selectedLeave.numberOfDays > 1 ? "s" : ""}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date de début
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLeave.startDate ? format(new Date(selectedLeave.startDate), "dd MMMM yyyy", { locale: fr }) : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date de fin
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLeave.endDate ? format(new Date(selectedLeave.endDate), "dd MMMM yyyy", { locale: fr }) : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Motif
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: "action.hover" }}>
                    <Typography variant="body1">
                      {selectedLeave.reason}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedLeave.chefJustification && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Commentaire du responsable
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: "action.hover" }}>
                      <Typography variant="body1">
                        {selectedLeave.chefJustification}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {selectedLeave.documents && selectedLeave.documents.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Documents joints
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {selectedLeave.documents.map((doc, index) => (
                        <Chip
                          key={index}
                          label={doc.originalName}
                          onClick={() => handlePreviewDocument(doc)}
                          onDelete={() => window.open("http://localhost:5000" + doc.filePath, "_blank")}
                          deleteIcon={<Download />}
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialog(false)}>
                Fermer
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>
              <Typography variant="h6">
                Historique des Demandes de Congé
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {loadingHistory ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : leaveHistory.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                  Aucune demande de congé trouvée.
                </Typography>
              ) : (
                <TableContainer>
                  <Table aria-label="tableau des demandes de congé">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}>
                        <TableCell>Type</TableCell>
                        <TableCell>Période</TableCell>
                        <TableCell align="center">Jours</TableCell>
                        <TableCell align="center">Statut</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveHistory.map((leave) => (
                        <TableRow
                          key={leave._id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: theme.palette.action.hover }
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Typography variant="body2" fontWeight="medium">
                              {leave.leaveType}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {leave.startDate ? format(new Date(leave.startDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                              {" → "}
                              {leave.endDate ? format(new Date(leave.endDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {leave.numberOfDays} jour{leave.numberOfDays > 1 ? "s" : ""}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography 
                              variant="body2" 
                              sx={{
                                color: leave.status === "Approuvé" ? "green" : 
                                       leave.status === "Rejeté" ? "red" : "orange",
                                fontWeight: "bold"
                              }}
                            >
                              {leave.status}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewLeave(leave)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialog(false)}>
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialogue de prévisualisation de document */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        {previewDocument && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">
                  {previewDocument.originalName}
                </Typography>
                <IconButton onClick={handleClosePreview} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {previewDocument.fileType?.includes("image") ? (
                <Box sx={{ textAlign: "center" }}>
                  <img
                    src={"http://localhost:5000" + previewDocument.filePath}
                    alt={previewDocument.originalName}
                    style={{ maxWidth: "100%", maxHeight: "70vh" }}
                  />
                </Box>
              ) : previewDocument.fileType?.includes("pdf") ? (
                <Box sx={{ height: "70vh" }}>
                  <iframe
                    src={"http://localhost:5000" + previewDocument.filePath}
                    width="100%"
                    height="100%"
                    title={previewDocument.originalName}
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
                onClick={() => window.open("http://localhost:5000" + previewDocument.filePath, "_blank")}
                startIcon={<Download />}
              >
                Télécharger
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EmployeeLeaveRequest;
