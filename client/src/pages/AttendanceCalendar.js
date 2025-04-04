// src/pages/AttendanceCalendar.js
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";

const AttendanceCalendar = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fonction pour récupérer les présences depuis l'API
  const fetchAttendance = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/presence")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des présences");
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

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Fonction pour obtenir les enregistrements pour une date donnée
  const getAttendanceForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return attendanceRecords.filter((record) => {
      const recordDate = new Date(record.checkIn).toISOString().split("T")[0];
      return recordDate === dateStr;
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Calendrier de présence des employés
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Calendar
          onChange={(date) => setSelectedDate(date)}
          value={selectedDate}
          tileContent={({ date, view }) => {
            // Dans la vue "mois", on affiche un point si des présences existent pour cette date
            if (view === "month") {
              const records = getAttendanceForDate(date);
              if (records.length > 0) {
                return (
                  <div
                    style={{
                      textAlign: "center",
                      color: "green",
                      fontSize: "1.2em",
                      lineHeight: "1em",
                    }}
                  >
                    •
                  </div>
                );
              }
            }
            return null;
          }}
        />
      )}

      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }} elevation={3}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Présences pour le {selectedDate.toLocaleDateString()}:
          </Typography>
          {getAttendanceForDate(selectedDate).length === 0 ? (
            <Typography>Aucune présence enregistrée</Typography>
          ) : (
            getAttendanceForDate(selectedDate).map((record) => (
              <Box key={record._id} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {/* On suppose que record.employeeId contient les informations de l'employé */}
                  {record.employeeId?.firstName || "Employé"}{" "}
                  {record.employeeId?.lastName || ""} - Check‑In:{" "}
                  {new Date(record.checkIn).toLocaleTimeString()}
                  {record.checkOut &&
                    `, Check‑Out: ${new Date(record.checkOut).toLocaleTimeString()}`}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AttendanceCalendar;
