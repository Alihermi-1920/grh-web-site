import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Avatar,
} from "@mui/material";

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Filtre par date (format "YYYY-MM-DD")

  // Récupérer les présences depuis l'API
  const fetchAttendance = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/presence")
      .then((res) => {
        if (!res.ok)
          throw new Error("Erreur lors de la récupération des présences");
        return res.json();
      })
      .then((data) => {
        setAttendanceRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Récupérer la liste des employés pour le sélecteur de check‑in
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) =>
        console.error("Erreur lors de la récupération des employés :", err)
      );
  }, []);

  // Au montage, récupérer les présences
  useEffect(() => {
    fetchAttendance();
  }, []);

  // Filtrer les enregistrements par la date sélectionnée
  const filteredRecords = selectedDate
    ? attendanceRecords.filter((record) => {
        const recordDate = new Date(record.checkIn)
          .toISOString()
          .split("T")[0];
        return recordDate === selectedDate;
      })
    : attendanceRecords;

  // Gestion du check‑in
  const handleCheckIn = () => {
    if (!selectedEmployee) {
      alert("Veuillez sélectionner un employé");
      return;
    }
    setLoading(true);
    fetch("http://localhost:5000/api/presence/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: selectedEmployee,
        checkIn: new Date().toISOString(),
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setLoading(false);
        setSelectedEmployee("");
        fetchAttendance();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Gestion du check‑out pour un enregistrement
  const handleCheckOut = (recordId) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/presence/checkout/${recordId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkOut: new Date().toISOString() }),
    })
      .then((res) => res.json())
      .then(() => {
        setLoading(false);
        fetchAttendance();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Composant pour afficher le nom de l'employé avec son avatar
  const EmployeeInfo = ({ employee }) => {
    if (!employee || !employee.firstName) {
      return "Employé inconnu";
    }
    let photoSrc;
    if (employee.photo && typeof employee.photo === "string") {
      photoSrc = `/${employee.photo.split(/(\\|\/)/g).pop()}`;
    }
    const initials = `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Avatar src={photoSrc} sx={{ width: 32, height: 32, mr: 1 }}>
          {!photoSrc && initials}
        </Avatar>
        <Typography variant="body2">
          {employee.firstName} {employee.lastName}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Système de présence des employés
      </Typography>

      {/* Filtre de date */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Filtrer par date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Formulaire de Check‑In */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1">Enregistrer une arrivée (Check‑In)</Typography>
        <TextField
          select
          label="Sélectionner un employé"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          sx={{ minWidth: 300, mr: 2 }}
        >
          <MenuItem value="">-- Sélectionnez un employé --</MenuItem>
          {employees.map((emp) => (
            <MenuItem key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName} ({emp.department})
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleCheckIn} disabled={loading}>
          Check‑In
        </Button>
      </Box>

      {/* Présences en cours (sans Check‑Out) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Présences en cours (sans Check‑Out)
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="ongoing attendance">
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Heure d'entrée</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .filter((rec) => !rec.checkOut)
                  .map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <EmployeeInfo employee={record.employeeId} />
                      </TableCell>
                      <TableCell>
                        {record.employeeId?.department || "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(record.checkIn).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          onClick={() => handleCheckOut(record._id)}
                          disabled={loading}
                        >
                          Check‑Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Historique complet des présences */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Historique complet des présences
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="attendance history">
              <TableHead>
                <TableRow>
                  <TableCell>Nom Employé</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Heure d'entrée</TableCell>
                  <TableCell>Heure de sortie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <EmployeeInfo employee={record.employeeId} />
                    </TableCell>
                    <TableCell>
                      {record.employeeId?.department || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(record.checkIn).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default Attendance;
