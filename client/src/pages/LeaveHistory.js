// src/pages/LeaveHistory.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from "@mui/material";

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const employee = JSON.parse(localStorage.getItem("employee")); // Employé connecté

  // Fonction pour calculer la date de fin à partir de la date de début et du nombre de jours
  const calculateEndDate = (startDate, numberOfDays) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + numberOfDays - 1);
    return end;
  };

  const fetchLeaves = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/conges");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des congés");
      }
      const data = await response.json();

      // Filtrer pour n'afficher que les congés valides de l'employé connecté
      const userLeaves = data.filter((leave) => {
        if (!employee?._id) return false;
        // Ignore la demande si le champ employee est false
        if (leave.employee === false) return false;
        // Si leave.employee est un objet peuplé, comparer les _id
        if (typeof leave.employee === "object" && leave.employee._id) {
          return leave.employee._id.toString() === employee._id.toString();
        }
        // Sinon, supposer que leave.employee est une chaîne
        return leave.employee.toString() === employee._id.toString();
      });

      setLeaves(userLeaves);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    if (employee) {
      fetchLeaves();
    }
  }, [employee, fetchLeaves]);

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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Historique des Demandes de Congé
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : leaves.length === 0 ? (
        <Typography>Aucune demande de congé trouvée.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table aria-label="table des congés">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Période</TableCell>
                <TableCell>Jours</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Commentaires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((leave) => {
                const startDate = new Date(leave.leaveDate);
                const endDate = calculateEndDate(leave.leaveDate, leave.numberOfDays);
                return (
                  <TableRow key={leave._id}>
                    <TableCell>{leave.leaveType}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Du {startDate.toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Au {endDate.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{leave.numberOfDays} jour{leave.numberOfDays > 1 ? "s" : ""}</TableCell>
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
                    <TableCell>{leave.adminJustification || leave.chefJustification || "Aucun commentaire"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LeaveHistory;
