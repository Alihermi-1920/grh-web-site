// src/pages/LeaveManagement.js
import React, { useState, useContext } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  MenuItem,
  Stack,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";

const LeaveManagement = ({ onLeaveSubmit }) => {
  // Récupération de l'utilisateur connecté via le contexte (celui-ci contient son _id)
  const { user } = useContext(AuthContext);
  
  const [leaveType, setLeaveType] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveType || !leaveDate || !numberOfDays || !reason) {
      setFeedback({ type: "error", message: "Veuillez renseigner tous les champs." });
      return;
    }
    try {
      // Le champ 'employee' est automatiquement renseigné avec l'ID de l'utilisateur connecté.
      const payload = { leaveType, leaveDate, numberOfDays, reason, employee: user?._id };
      const response = await fetch("http://localhost:5000/api/conges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note : l'en-tête Authorization n'est pas utilisé ici car on suppose que l'authentification est gérée ailleurs.
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Erreur lors de la soumission de la demande.");
      const data = await response.json();
      setFeedback({ type: "success", message: "Demande de congé soumise avec succès !" });
      if (onLeaveSubmit) onLeaveSubmit(data);
      // Réinitialiser les champs du formulaire
      setLeaveType("");
      setLeaveDate("");
      setNumberOfDays(1);
      setReason("");
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Demande de Congé
        </Typography>
        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              select
              label="Type de Congé"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="Congé payé">Congé payé</MenuItem>
              <MenuItem value="Congé sans solde">Congé sans solde</MenuItem>
              <MenuItem value="Maladie">Maladie</MenuItem>
              <MenuItem value="Personnel">Congé Personnel</MenuItem>
            </TextField>
            <TextField
              label="Date du congé"
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Nombre de jours"
              type="number"
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(Number(e.target.value))}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Raison"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
            />
            <Button type="submit" variant="contained" color="primary">
              Envoyer la demande
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default LeaveManagement;
