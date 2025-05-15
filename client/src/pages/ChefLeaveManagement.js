// src/pages/ChefLeaveManagement.js
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  useTheme
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarMonth,
  EventAvailable,
  Description,
  Download,
  Close,
  ThumbUp,
  ThumbDown,
  AttachFileOutlined,
  InfoOutlined,
  Image,
  PictureAsPdf,
  Email
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AuthContext } from "../context/AuthContext";

const ChefLeaveManagement = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [justification, setJustification] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Charger les demandes de congé
  const fetchLeaves = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      console.log("Fetching leave requests for chef:", user._id);

      // Utiliser l'API_URL pour être cohérent avec le reste de l'application
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

      // Make sure we're using the correct parameter name (chef instead of chefId)
      const response = await fetch(`${API_URL}/api/conges?chef=${user._id}`);

      if (!response.ok) {
        let errorMessage = "Erreur lors de la récupération des demandes de congé";
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // If not JSON, get text
            const errorText = await response.text();
            console.error("Server returned non-JSON response:", errorText);
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing success response:", parseError);
        // Use empty array if parsing fails
        data = [];
      }
      console.log("Leave requests data:", data);

      // Process each leave request to ensure documents are properly handled
      const processedData = [];

      for (const leave of data) {
        try {
          // Make a direct request for each leave to get complete data including documents
          const detailResponse = await fetch(`http://localhost:5000/api/conges/${leave._id}`);

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            console.log(`Detailed data for leave request ${leave._id}:`, detailData);

            // Ensure documents is always an array
            if (!Array.isArray(detailData.documents)) {
              detailData.documents = [];
            }

            // Log document information
            console.log(`Documents for leave request ${leave._id}: ${detailData.documents.length}`);
            detailData.documents.forEach((doc, index) => {
              console.log(`Document ${index + 1}:`, doc.originalName, doc.filePath);
            });

            processedData.push(detailData);
          } else {
            console.error(`Failed to fetch detailed data for leave request ${leave._id}`);
            // Fall back to original data
            if (!Array.isArray(leave.documents)) {
              leave.documents = [];
            }
            processedData.push(leave);
          }
        } catch (error) {
          console.error(`Error processing leave request ${leave._id}:`, error);
          // Fall back to original data
          if (!Array.isArray(leave.documents)) {
            leave.documents = [];
          }
          processedData.push(leave);
        }
      }

      // Debug document information
      processedData.forEach((leave, index) => {
        console.log(`Leave ${index + 1} (${leave._id}):`);
        console.log(`- Employee: ${leave.employee?.firstName} ${leave.employee?.lastName}`);
        console.log(`- Status: ${leave.status}`);
        console.log(`- Documents: ${leave.documents ? leave.documents.length : 0}`);

        if (!leave.documents || leave.documents.length === 0) {
          console.log('  - No documents attached to this leave request');
        } else {
          leave.documents.forEach((doc, docIndex) => {
            console.log(`  - Document ${docIndex + 1}:`);
            console.log(`    Name: ${doc.originalName || 'No name'}`);
            console.log(`    Path: ${doc.filePath || 'No path'}`);
            console.log(`    Type: ${doc.fileType || 'No type'}`);
            console.log(`    Size: ${doc.fileSize || 'No size'}`);
          });
        }
      });

      // Use the processed data with properly handled documents
      setLeaves(processedData);
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchLeaves();
  }, [user]);

  // Filtrer les congés selon l'onglet sélectionné
  const filteredLeaves = () => {
    switch (tabValue) {
      case 0: // Toutes les demandes
        return leaves;
      case 1: // En attente
        return leaves.filter(leave => leave.status === "En attente");
      case 2: // Approuvées
        return leaves.filter(leave => leave.status === "Approuvé");
      case 3: // Rejetées
        return leaves.filter(leave => leave.status === "Rejeté");
      default:
        return leaves;
    }
  };

  // Ouvrir la boîte de dialogue de confirmation
  const handleOpenDialog = (leave, action) => {
    setSelectedLeave({ ...leave, action });
    setJustification("");
    setDialogOpen(true);
  };



  // Fermer la boîte de dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLeave(null);
    setJustification("");
  };

  // Approuver ou rejeter une demande
  const handleUpdateStatus = async () => {
    if (!selectedLeave) return;

    setActionLoading(true);
    try {
      // Utiliser l'API_URL pour être cohérent avec le reste de l'application
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

      // Mettre à jour le statut de la demande
      const response = await fetch(`${API_URL}/api/conges/${selectedLeave._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          status: selectedLeave.action === "approve" ? "Approuvé" : "Rejeté",
          justification: justification
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = "Erreur lors de la mise à jour du statut";
        let errorDetails = "";

        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();

            if (errorData.error === "Solde de congé insuffisant") {
              errorMessage = "Solde de congé insuffisant";
              if (errorData.remainingDays !== undefined && errorData.requestedDays !== undefined) {
                errorDetails = `L'employé ne dispose que de ${errorData.remainingDays} jour(s) de congé, mais la demande est de ${errorData.requestedDays} jour(s).`;
              }
            } else {
              errorMessage = errorData.error || errorMessage;
              errorDetails = errorData.message || errorData.details || "";
            }
          } else {
            // If not JSON, get text
            const errorText = await response.text();
            console.error("Server returned non-JSON response:", errorText);
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        throw new Error(fullErrorMessage);
      }

      console.log("Response data:", responseData);

      // Show success message (email notifications are now sent manually)
      setFeedback({
        type: "success",
        message: `Demande ${selectedLeave.action === "approve" ? "approuvée" : "rejetée"} avec succès`
      });

      // Rafraîchir les données
      fetchLeaves();
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({ type: "error", message: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Prévisualiser un document
  const handlePreviewDocument = (document) => {
    console.log('Preview document:', document);

    if (!document) {
      console.error('Document is null or undefined');
      setFeedback({
        type: 'error',
        message: 'Document invalide'
      });
      return;
    }

    console.log('Document path:', document.filePath);

    // Ensure document has all required properties
    const enhancedDocument = {
      ...document,
      // Make sure filePath exists and is properly formatted
      filePath: document.filePath || '',
      // Make sure originalName exists
      originalName: document.originalName || `Document ${Math.floor(Math.random() * 1000)}`,
      // Make sure fileType exists
      fileType: document.fileType || 'application/octet-stream',
      // Make sure fileSize exists
      fileSize: document.fileSize || 0
    };

    console.log('Enhanced document:', enhancedDocument);

    // Determine the full URL
    let fullUrl;
    if (!enhancedDocument.filePath) {
      console.error('Document has no file path');
      fullUrl = '';
    } else if (enhancedDocument.filePath.startsWith('/uploads')) {
      fullUrl = enhancedDocument.filePath;
      console.log('Using relative path:', fullUrl);
    } else if (enhancedDocument.filePath.startsWith('http')) {
      fullUrl = enhancedDocument.filePath;
      console.log('Using absolute URL:', fullUrl);
    } else {
      fullUrl = "http://localhost:5000" + enhancedDocument.filePath;
      console.log('Using server URL:', fullUrl);
    }

    console.log('Full URL for preview:', fullUrl);

    // Update the document with the full URL for easier access in the preview dialog
    enhancedDocument.fullUrl = fullUrl;

    setPreviewDocument(enhancedDocument);
    setPreviewOpen(true);
  };

  // Fermer la prévisualisation
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDocument(null);
  };

  // Télécharger un document
  const handleDownloadDocument = (document) => {
    if (!document) {
      console.error('Invalid document');
      setFeedback({
        type: 'error',
        message: 'Document invalide'
      });
      return;
    }

    if (!document.filePath && !document.fullUrl) {
      console.error('Missing file path');
      setFeedback({
        type: 'error',
        message: 'Impossible de télécharger le document: chemin de fichier manquant'
      });
      return;
    }

    // Use the fullUrl if available, otherwise determine the URL from filePath
    let url = document.fullUrl;

    if (!url) {
      if (document.filePath.startsWith('/uploads')) {
        // If the path starts with /uploads, use it directly
        url = document.filePath;
      } else if (document.filePath.startsWith('http')) {
        // If it's already a full URL, use it as is
        url = document.filePath;
      } else {
        // Otherwise, prepend the server URL
        url = "http://localhost:5000" + document.filePath;
      }
    }

    console.log('Download URL:', url);

    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';

      // Set download attribute with filename if available
      if (document.originalName) {
        link.download = document.originalName;
      }

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      setFeedback({
        type: 'error',
        message: 'Erreur lors du téléchargement du document'
      });

      // Fallback to window.open
      try {
        window.open(url, "_blank");
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setFeedback({
          type: 'error',
          message: 'Erreur lors de l\'ouverture du document'
        });
      }
    }
  };

  // Obtenir la couleur du statut
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

  // Obtenir l'icône du statut
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

  // Envoyer une notification par email
  const handleSendEmail = async (leave) => {
    try {
      setActionLoading(true);

      // Utiliser l'API_URL pour être cohérent avec le reste de l'application
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

      console.log(`Sending email notification for leave request: ${leave._id}`);

      // Récupérer les informations de l'employé et de la demande de congé
      const employeeEmail = leave.employee?.email || 'huiihyii212@gmail.com';
      const employeeName = leave.employee?.firstName && leave.employee?.lastName
        ? `${leave.employee.firstName} ${leave.employee.lastName}`
        : "Employé";

      // Essayer d'abord l'endpoint de notification de congé
      try {
        // Construire l'URL avec tous les paramètres nécessaires
        const params = new URLSearchParams({
          email: employeeEmail,
          name: employeeName,
          status: leave.status,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.numberOfDays || '1',
          type: leave.leaveType || 'Congé payé',
          reason: leave.reason || 'Non spécifiée'
        });

        // Ajouter la justification si elle existe
        if (leave.justification) {
          params.append('justification', leave.justification);
        }

        const leaveNotificationUrl = `${API_URL}/api/leave-notification?${params.toString()}`;
        console.log(`Trying leave notification endpoint: ${leaveNotificationUrl}`);

        // Appeler l'API pour envoyer l'email
        const response = await fetch(leaveNotificationUrl, {
          // Ajouter un timeout pour éviter que la requête ne reste bloquée
          signal: AbortSignal.timeout(5000) // 5 secondes
        });

        if (response.ok) {
          console.log('Leave notification endpoint successful');

          // Afficher un message de succès
          setFeedback({
            type: "success",
            message: (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ mr: 1, fontSize: 18 }} />
                <span>Notification envoyée avec succès à l'employé</span>
              </Box>
            )
          });

          return; // Sortir de la fonction si l'envoi a réussi
        } else {
          const errorText = await response.text();
          console.error('Leave notification endpoint error:', errorText);
          console.log('Falling back to test email endpoint...');
        }
      } catch (leaveNotificationError) {
        console.error('Error with leave notification endpoint:', leaveNotificationError);
        console.log('Falling back to test email endpoint...');
      }

      // Si l'endpoint de notification de congé a échoué, essayer l'endpoint de test email
      try {
        const encodedEmail = encodeURIComponent(employeeEmail);
        const testEmailUrl = `${API_URL}/api/test-email?email=${encodedEmail}`;
        console.log(`Trying test email endpoint: ${testEmailUrl}`);

        const response = await fetch(testEmailUrl);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Test email endpoint error:', errorText);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        console.log('Test email endpoint successful');

        // Afficher un message de succès
        setFeedback({
          type: "success",
          message: (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Email sx={{ mr: 1, fontSize: 18 }} />
              <span>Notification envoyée avec succès à l'employé</span>
            </Box>
          )
        });
      } catch (testEmailError) {
        console.error('Error with test email endpoint:', testEmailError);
        throw testEmailError; // Relancer l'erreur pour qu'elle soit traitée par le bloc catch principal
      }

    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      setFeedback({
        type: "error",
        message: `Erreur: ${error.message}`
      });
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
        Gestion des Demandes de Congé
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

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Description sx={{ mr: 1 }} />
                <span>Toutes</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTime sx={{ mr: 1 }} />
                <span>En attente</span>
                {leaves.filter(l => l.status === "En attente").length > 0 && (
                  <Chip
                    label={leaves.filter(l => l.status === "En attente").length}
                    size="small"
                    color="warning"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircle sx={{ mr: 1 }} />
                <span>Approuvées</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Cancel sx={{ mr: 1 }} />
                <span>Rejetées</span>
              </Box>
            }
          />
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredLeaves().length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Aucune demande de congé trouvée dans cette catégorie.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredLeaves().map((leave) => (
              <Grid item xs={12} sm={6} md={4} key={leave._id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderLeft: "4px solid " + getStatusColor(leave.status),
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {leave.leaveType}
                      </Typography>
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
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        src={leave.employee?.photo}
                        alt={leave.employee?.firstName}
                        sx={{ width: 32, height: 32, mr: 1 }}
                      />
                      <Typography variant="body2">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={1}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CalendarMonth fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                        <Typography variant="body2">
                          Du {leave.startDate ? format(new Date(leave.startDate), "dd/MM/yyyy", { locale: fr }) : "Non défini"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CalendarMonth fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                        <Typography variant="body2">
                          Au {leave.endDate ? format(new Date(leave.endDate), "dd/MM/yyyy", { locale: fr }) : "Non défini"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EventAvailable fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {leave.numberOfDays} jour{leave.numberOfDays > 1 ? "s" : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <Description fontSize="small" sx={{ mr: 1, mt: 0.5, color: "text.secondary" }} />
                        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                          {leave.reason}
                        </Typography>
                      </Box>

                      {leave.documents && Array.isArray(leave.documents) && leave.documents.length > 0 ? (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.main', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <Typography variant="subtitle2" color="white" fontWeight="bold" display="flex" alignItems="center" gutterBottom>
                            <AttachFileOutlined sx={{ mr: 1 }} />
                            Documents joints ({leave.documents.length}):
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {leave.documents.map((doc, index) => {
                              // Log document for debugging
                              console.log(`Rendering document ${index + 1}:`, doc);

                              // Determine icon based on file type
                              let icon = <Description fontSize="small" />;
                              if (doc.fileType?.includes('image')) {
                                icon = <Image fontSize="small" />;
                              } else if (doc.fileType?.includes('pdf')) {
                                icon = <PictureAsPdf fontSize="small" />;
                              }

                              // Ensure document has a name
                              const docName = doc.originalName || `Document ${index + 1}`;
                              const displayName = docName.length > 10 ? docName.substring(0, 10) + '...' : docName;

                              return (
                                <Tooltip key={index} title={docName}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={icon}
                                    onClick={() => handlePreviewDocument(doc)}
                                    sx={{
                                      color: 'white',
                                      textTransform: 'none',
                                      bgcolor: 'rgba(255,255,255,0.2)',
                                      '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.3)',
                                      },
                                      mb: 1
                                    }}
                                  >
                                    {displayName}
                                  </Button>
                                </Tooltip>
                              );
                            })}
                          </Stack>
                        </Box>
                      ) : leave.leaveType === "Congé médical" ? (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e91e63', borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <Typography variant="subtitle2" color="white" fontWeight="bold" display="flex" alignItems="center">
                            <InfoOutlined sx={{ mr: 1 }} />
                            Justificatif médical requis
                          </Typography>
                          <Typography variant="caption" color="white" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
                            L'employé doit fournir un justificatif médical pour cette demande.
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <InfoOutlined fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Aucun document joint
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {leave.status === "En attente" ? (
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<ThumbDown />}
                          onClick={() => handleOpenDialog(leave, "reject")}
                        >
                          Rejeter
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<ThumbUp />}
                          onClick={() => handleOpenDialog(leave, "approve")}
                        >
                          Approuver
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<Email />}
                          onClick={() => handleSendEmail(leave)}
                          disabled={actionLoading}
                        >
                          Envoyer notification
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Boîte de dialogue de confirmation */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedLeave?.action === "approve" ? "Approuver la demande" : "Rejeter la demande"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir {selectedLeave?.action === "approve" ? "approuver" : "rejeter"} cette demande de congé ?
          </Typography>
          <TextField
            label="Commentaire (optionnel)"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleUpdateStatus}
            color={selectedLeave?.action === "approve" ? "success" : "error"}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : selectedLeave?.action === "approve" ? (
              "Approuver"
            ) : (
              "Rejeter"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prévisualisation de document */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: 'primary.main',
            color: 'white',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {previewDocument?.fileType?.includes("image") ? (
              <Box sx={{ position: 'relative', width: 40, height: 40, mr: 2, borderRadius: 1, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
                <img
                  src={previewDocument?.fullUrl || previewDocument?.filePath}
                  alt="Thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    console.error('Error loading thumbnail image');
                    e.target.src = '/uploads/placeholder.png';
                  }}
                />
              </Box>
            ) : previewDocument?.fileType?.includes("pdf") ? (
              <PictureAsPdf sx={{ fontSize: 32, mr: 2, color: 'rgba(255,255,255,0.9)' }} />
            ) : (
              <Description sx={{ fontSize: 32, mr: 2, color: 'rgba(255,255,255,0.9)' }} />
            )}
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {previewDocument?.originalName || "Document"}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {previewDocument?.fileType?.split('/')[1]?.toUpperCase() || 'Document'}
                {previewDocument?.fileSize && ` • ${Math.round(previewDocument.fileSize / 1024)} KB`}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClosePreview}
            size="medium"
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {previewDocument?.fileType?.includes("image") ? (
            <Box sx={{
              textAlign: "center",
              p: 2,
              bgcolor: '#f5f5f5',
              height: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <img
                src={previewDocument?.fullUrl || previewDocument?.filePath}
                alt={previewDocument?.originalName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: 'contain',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  borderRadius: 4
                }}
                onError={(e) => {
                  console.error('Error loading preview image');
                  e.target.src = '/uploads/placeholder.png';
                  setFeedback({
                    type: 'error',
                    message: 'Erreur lors du chargement de l\'image'
                  });
                }}
              />
            </Box>
          ) : previewDocument?.fileType?.includes("pdf") ? (
            <Box sx={{ height: "70vh", position: 'relative' }}>
              <iframe
                src={previewDocument?.fullUrl || previewDocument?.filePath}
                width="100%"
                height="100%"
                title={previewDocument?.originalName}
                style={{ border: "none" }}
                onError={() => {
                  console.error('Error loading PDF');
                  setFeedback({
                    type: 'error',
                    message: 'Erreur lors du chargement du PDF'
                  });
                }}
              />
            </Box>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center', height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{
                p: 3,
                borderRadius: '50%',
                bgcolor: theme.palette.grey[100],
                display: 'inline-flex',
                mb: 3
              }}>
                <Description sx={{ fontSize: 80, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
                Ce type de fichier ne peut pas être prévisualisé
              </Typography>
              <Typography color="text.secondary" paragraph sx={{ maxWidth: 500 }}>
                Le fichier "{previewDocument?.originalName}" ne peut pas être affiché dans le navigateur.
                Veuillez le télécharger pour le consulter.
              </Typography>
              <Button
                onClick={() => handleDownloadDocument(previewDocument)}
                color="primary"
                variant="contained"
                size="large"
                startIcon={<Download />}
                sx={{ mt: 2 }}
              >
                Télécharger le fichier
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
          <Button
            onClick={handleClosePreview}
            color="inherit"
            startIcon={<Close />}
          >
            Fermer
          </Button>
          {(previewDocument?.fileType?.includes("image") || previewDocument?.fileType?.includes("pdf")) && (
            <Button
              onClick={() => handleDownloadDocument(previewDocument)}
              color="primary"
              variant="contained"
              startIcon={<Download />}
            >
              Télécharger
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChefLeaveManagement;
