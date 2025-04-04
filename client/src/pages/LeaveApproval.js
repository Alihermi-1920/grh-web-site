// src/pages/LeaveApproval.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Alert,
} from "@mui/material";

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchLeaves = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/conges");
      if (!response.ok) throw new Error("Erreur lors de la récupération des demandes de congé.");
      const data = await response.json();
      setLeaves(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateLeaveStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/conges/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut.");
      setFeedback(`Demande ${newStatus === "Accepted" ? "acceptée" : "rejetée"} avec succès !`);
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Gestion des demandes de congé
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {feedback && <Alert severity="success" sx={{ mb: 2 }}>{feedback}</Alert>}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Employé</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Jours</TableCell>
              <TableCell>Raison</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave._id}>
                <TableCell>{leave._id}</TableCell>
                <TableCell>
                  {leave.employee?.firstName} {leave.employee?.lastName}
                </TableCell>
                <TableCell>{leave.leaveType}</TableCell>
                <TableCell>{new Date(leave.leaveDate).toLocaleDateString()}</TableCell>
                <TableCell>{leave.numberOfDays}</TableCell>
                <TableCell>{leave.reason}</TableCell>
                <TableCell>{leave.status}</TableCell>
                <TableCell>
                  {leave.status === "Pending" && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => updateLeaveStatus(leave._id, "Accepted")}
                        sx={{ mr: 1 }}
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => updateLeaveStatus(leave._id, "Rejected")}
                      >
                        Rejeter
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default LeaveApproval;
