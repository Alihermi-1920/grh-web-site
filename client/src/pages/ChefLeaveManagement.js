// src/pages/ChefLeaveManagement.js
import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ThumbUp,
  ThumbDown,
  CheckCircle,
  Cancel,
  AccessTime,
  Email,
  PictureAsPdf,
  Image,
  Description,
  Visibility,
  Download,
  Close,
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AuthContext } from "../context/AuthContext";

const ChefLeaveManagement = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");
  const [justification, setJustification] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Fonction pour récupérer les demandes de congé
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/conges?chef=${user?._id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des demandes de congé");
      }
      const data = await response.json();

      // Traiter les données pour inclure les documents
      const leavesWithDocuments = await Promise.all(
        data.map(async (leave) => {
          if (leave._id) {
            try {
              const docResponse = await fetch(
                `http://localhost:5000/api/conges/${leave._id}/documents?employee=${leave.employee?._id || leave.employee}`
              );
              if (docResponse.ok) {
                const documents = await docResponse.json();
                return { ...leave, documents };
              }
            } catch (error) {
              console.error("Erreur lors de la récupération des documents:", error);
            }
          }
          return leave;
        })
      );

      setLeaves(leavesWithDocuments);
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({
        type: "error",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  // Filtrer les congés en fonction de l'onglet sélectionné
  const filteredLeaves = () => {
    return leaves;
  };

  // Ouvrir la boîte de dialogue d'approbation/rejet
  const handleOpenDialog = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setJustification("");
    setDialogOpen(true);
  };

  // Fermer la boîte de dialogue
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLeave(null);
    setActionType("");
    setJustification("");
  };

  // Ouvrir la prévisualisation du document
  const handlePreviewDocument = (document) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  // Fermer la prévisualisation du document
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDocument(null);
  };

  // Mettre à jour le statut d'une demande de congé
  const handleUpdateStatus = async () => {
    if (!selectedLeave) return;

    const newStatus = actionType === "approve" ? "Approuvé" : "Rejeté";

    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:5000/api/conges/${selectedLeave._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          chefJustification: justification,
          chef: user?._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour du statut");
      }

      // Mettre à jour l'état local
      setLeaves(
        leaves.map((leave) =>
          leave._id === selectedLeave._id
            ? { ...leave, status: newStatus, chefJustification: justification }
            : leave
        )
      );

      setFeedback({
        type: "success",
        message: `Demande de congé ${newStatus.toLowerCase()} avec succès`,
      });

      // Envoyer un email de notification
      try {
        const emailResponse = await fetch(`http://localhost:5000/api/conges/${selectedLeave._id}/notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            chefJustification: justification,
            chef: user?._id,
          }),
        });

        if (emailResponse.ok) {
          setFeedback({
            type: "success",
            message: `Demande de congé ${newStatus.toLowerCase()} avec succès. Notification envoyée à l'employé.`,
          });
        }
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // Ne pas changer le feedback de succès, juste logger l'erreur
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({
        type: "error",
        message: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Télécharger un document
  const handleDownloadDocument = (document) => {
    window.open(`http://localhost:5000${document.filePath}`, "_blank");
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (status) => {
    switch (status) {
      case "Approuvé":
        return "green";
      case "Rejeté":
        return "red";
      case "En attente":
        return "orange";
      default:
        return "grey";
    }
  };

  // Obtenir l'icône en fonction du statut
  const getStatusIcon = (status) => {
    switch (status) {
      case "Approuvé":
        return <CheckCircle fontSize="small" />;
      case "Rejeté":
        return <Cancel fontSize="small" />;
      case "En attente":
        return <AccessTime fontSize="small" />;
      default:
        return null;
    }
  };

  // Envoyer un email de notification
  const handleSendEmail = async (leave) => {
    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:5000/api/conges/${leave._id}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: leave.status,
          chefJustification: leave.chefJustification,
          chef: user?._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'envoi de l'email");
      }

      // Tester l'endpoint d'email
      try {
        const testEmailResponse = await fetch(`http://localhost:5000/api/email/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: leave.employee?.email || "test@example.com",
          }),
        });

        if (!testEmailResponse.ok) {
          const errorData = await testEmailResponse.json();
          throw new Error(errorData.message || "Erreur lors du test d'email");
        }

        setFeedback({
          type: "success",
          message: (
            <Box sx={{ display: "flex", alignItems: "center" }}>
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

  // Fonction pour afficher les documents
  const renderDocuments = (documents) => {
    if (!documents || documents.length === 0) return "Aucun";
    
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {documents.map((doc, index) => (
          <Tooltip key={index} title={doc.originalName || `Document ${index + 1}`}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => handlePreviewDocument(doc)}
              sx={{ mb: 1, textTransform: 'none' }}
            >
              {doc.originalName ? 
                (doc.originalName.length > 15 ? doc.originalName.substring(0, 12) + '...' : doc.originalName) : 
                `Document ${index + 1}`}
            </Button>
          </Tooltip>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Afficher les messages de feedback */}
      {feedback && (
        <Alert 
          severity={feedback.type} 
          sx={{ mb: 2 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Gestion des Congés
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredLeaves().length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Aucune demande de congé trouvée.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Table des demandes de congé */}
            {/* Documentation: https://mui.com/material-ui/react-table/ */}
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Employé</TableCell>
                    <TableCell>CIN</TableCell>
                    <TableCell>Type de congé</TableCell>
                    <TableCell>Période</TableCell>
                    <TableCell>Durée</TableCell>
                    <TableCell>Raison</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeaves().map((leave) => (
                    <TableRow key={leave._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={leave.employee?.photo} 
                            alt={leave.employee?.firstName}
                            sx={{ width: 32, height: 32, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {leave.employee?.cin || "Non renseigné"}
                        </Typography>
                      </TableCell>
                      <TableCell>{leave.leaveType}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            Du {leave.startDate ? format(new Date(leave.startDate), "dd/MM/yyyy", { locale: fr }) : "Non défini"}
                          </Typography>
                          <Typography variant="body2">
                            Au {leave.endDate ? format(new Date(leave.endDate), "dd/MM/yyyy", { locale: fr }) : "Non défini"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {leave.numberOfDays} jour{leave.numberOfDays > 1 ? "s" : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {leave.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {leave.documents && leave.documents.length > 0 ? (
                          <Stack direction="row" spacing={1}>
                            {leave.documents.map((doc, index) => (
                              <Tooltip key={index} title={doc.originalName || `Document ${index + 1}`}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handlePreviewDocument(doc)}
                                >
                                  {doc.fileType?.includes('image') ? (
                                    <Image fontSize="small" />
                                  ) : doc.fileType?.includes('pdf') ? (
                                    <PictureAsPdf fontSize="small" />
                                  ) : (
                                    <Description fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Stack>
                        ) : leave.leaveType === "Congé médical" ? (
                          <Chip 
                            label="Justificatif requis" 
                            size="small" 
                            color="error" 
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Aucun
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{
                            color: getStatusColor(leave.status),
                            fontWeight: "bold"
                          }}
                        >
                          {leave.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {leave.status === "En attente" ? (
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Approuver">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleOpenDialog(leave, "approve")}
                              >
                                <ThumbUp fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rejeter">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDialog(leave, "reject")}
                              >
                                <ThumbDown fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Tooltip title="Envoyer notification">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSendEmail(leave)}
                              disabled={actionLoading}
                            >
                              <Email fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Boîte de dialogue d'approbation/rejet */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === "approve" ? "Approuver la demande de congé" : "Rejeter la demande de congé"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Vous êtes sur le point de {actionType === "approve" ? "approuver" : "rejeter"} la demande de congé de{" "}
            <strong>{selectedLeave?.employee?.firstName} {selectedLeave?.employee?.lastName}</strong>.
          </Typography>
          <TextField
            label="Commentaire (optionnel)"
            multiline
            rows={4}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
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
            color={actionType === "approve" ? "success" : "error"}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : actionType === "approve" ? (
              "Approuver"
            ) : (
              "Rejeter"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue de prévisualisation de document */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        {previewDocument && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{previewDocument.originalName}</Typography>
                <IconButton onClick={handleClosePreview} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {previewDocument.fileType?.includes("image") ? (
                <Box sx={{ textAlign: "center" }}>
                  <img
                    src={`http://localhost:5000${previewDocument.filePath}`}
                    alt={previewDocument.originalName}
                    style={{ maxWidth: "100%", maxHeight: "70vh" }}
                  />
                </Box>
              ) : previewDocument.fileType?.includes("pdf") ? (
                <Box sx={{ height: "70vh" }}>
                  <iframe
                    src={`http://localhost:5000${previewDocument.filePath}`}
                    width="100%"
                    height="100%"
                    title={previewDocument.originalName}
                    style={{ border: "none" }}
                  />
                </Box>
              ) : (
                <Typography>Ce type de fichier ne peut pas être prévisualisé.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleDownloadDocument(previewDocument)}
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

export default ChefLeaveManagement;
