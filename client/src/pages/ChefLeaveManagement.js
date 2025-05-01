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
  Person,
  Description,
  Visibility,
  Download,
  Close,
  ThumbUp,
  ThumbDown
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

      // Make sure we're using the correct parameter name (chef instead of chefId)
      const response = await fetch("http://localhost:5005/api/conges?chef=" + user._id);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Erreur lors de la récupération des demandes de congé");
      }

      const data = await response.json();
      console.log("Leave requests data:", data);
      setLeaves(data);
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
      const response = await fetch("http://localhost:5005/api/conges/" + selectedLeave._id + "/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedLeave.action === "approve" ? "Approuvé" : "Rejeté",
          justification: justification
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut");

      setFeedback({
        type: "success",
        message: "Demande " + (selectedLeave.action === "approve" ? "approuvée" : "rejetée") + " avec succès"
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
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  // Fermer la prévisualisation
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDocument(null);
  };

  // Télécharger un document
  const handleDownloadDocument = (document) => {
    window.open("http://localhost:5005" + document.filePath, "_blank");
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

                      {leave.documents && leave.documents.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Documents joints:
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            {leave.documents.map((doc, index) => (
                              <Tooltip key={index} title={doc.originalName}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handlePreviewDocument(doc)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>

                    {leave.status === "En attente" && (
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
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
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

export default ChefLeaveManagement;
