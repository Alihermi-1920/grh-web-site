// src/components/EmployeeTaskList.js
import React, { useState, useEffect, useContext } from "react";
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";

const EmployeeTaskList = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // On suppose que l'API accepte un paramètre employeeId pour filtrer les tâches assignées
      fetch(`http://localhost:5000/api/tasks?employeeId=${user._id}`)
        .then((res) => res.json())
        .then((data) => {
          setTasks(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération des tâches :", err);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Mes Tâches Assignées
      </Typography>
      {tasks.length === 0 ? (
        <Typography variant="body1">Aucune tâche assignée.</Typography>
      ) : (
        <List>
          {tasks.map((task) => (
            <ListItem
              key={task._id}
              sx={{
                mb: 1,
                backgroundColor: "#fff",
                borderRadius: 1,
                boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
                p: 2,
              }}
            >
              <ListItemText
                primary={task.name}
                secondary={`Deadline: ${task.deadline} | Priorité: ${task.priority} | Statut: ${task.status}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default EmployeeTaskList;
