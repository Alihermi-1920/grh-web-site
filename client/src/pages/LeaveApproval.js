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
  Alert
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon
} from "@mui/icons-material";

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchLeaves = async () => {
    try {
      console.log("Fetching leave requests...");
      const response = await fetch("http://localhost:5000/api/conges");
      if (!response.ok) throw new Error("Erreur lors de la récupération des demandes de congé.");
      const data = await response.json();

      // Debug: Log the leave requests and their statuses
      console.log("Fetched leave requests:", data);
      console.log("Number of leave requests:", data.length);

      if (data.length === 0) {
        console.log("No leave requests found!");
      } else {
        console.log("Leave request statuses:");
        data.forEach(leave => {
          console.log(`Leave ${leave._id}: status = "${leave.status}", type = "${leave.leaveType}", employee = ${leave.employee?._id || 'unknown'}`);
        });
      }

      setLeaves(data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateLeaveStatus = async (id, newStatus) => {
    try {
      console.log(`Updating leave request ${id} to status: ${newStatus}`);

      // First, get the current leave request to check its status
      const getResponse = await fetch(`http://localhost:5000/api/conges/${id}`);
      if (!getResponse.ok) {
        throw new Error("Erreur lors de la récupération de la demande de congé.");
      }

      const leaveRequest = await getResponse.json();
      console.log("Current leave request:", leaveRequest);
      console.log(`Current status: "${leaveRequest.status}", changing to: "${newStatus}"`);

      // Update the status
      const updateResponse = await fetch(`http://localhost:5000/api/conges/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour du statut.");
      }

      const updatedData = await updateResponse.json();
      console.log("Update response:", updatedData);
      console.log(`Leave request ${id} status updated to: "${newStatus}"`);

      setFeedback(`Demande ${newStatus === "Approuvé" ? "acceptée" : "rejetée"} avec succès !`);

      // Fetch the updated list of leave requests
      console.log("Fetching updated leave requests...");
      await fetchLeaves();

      // Check if the status was actually updated
      console.log("Checking if status was updated correctly...");
      const checkResponse = await fetch(`http://localhost:5000/api/conges/${id}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log(`After update, leave request ${id} status is: "${checkData.status}"`);
      }
    } catch (err) {
      console.error("Error updating leave status:", err);
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

      <Paper sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
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
            {leaves.map((leave) => {
              // Debug info
              console.log(`Rendering row for leave ${leave._id} with status "${leave.status}"`);

              // Determine status color and icon
              let statusColor = "default";
              let StatusIcon = null;

              if (leave.status === "Approuvé") {
                statusColor = "success";
                StatusIcon = CheckCircleIcon;
              } else if (leave.status === "Rejeté") {
                statusColor = "error";
                StatusIcon = CancelIcon;
              } else if (leave.status === "En attente") {
                statusColor = "warning";
                StatusIcon = PendingIcon;
              }

              return (
                <TableRow key={leave._id} hover>
                  <TableCell>
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </TableCell>
                  <TableCell>{leave.leaveType}</TableCell>
                  <TableCell>
                    {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{leave.numberOfDays}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {StatusIcon && <StatusIcon fontSize="small" color={statusColor} sx={{ mr: 1 }} />}
                      {leave.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {console.log(`Rendering action buttons for leave ${leave._id} with status "${leave.status}"`)}
                    {leave.status === "En attente" ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => updateLeaveStatus(leave._id, "Approuvé")}
                        >
                          Accepter
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => updateLeaveStatus(leave._id, "Rejeté")}
                        >
                          Rejeter
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucune action disponible
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default LeaveApproval;
