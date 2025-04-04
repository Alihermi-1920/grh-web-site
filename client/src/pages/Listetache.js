import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent, 
  Grid 
} from "@mui/material";

const ListeTache = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/tasks");
      if (!response.ok) throw new Error("Erreur lors du chargement des tâches");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          fontWeight: "bold", 
          color: "primary.main", 
          fontFamily: "Roboto, sans-serif" 
        }}
      >
        Liste des Tâches
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : tasks.length === 0 ? (
        <Typography 
          variant="body1" 
          sx={{ fontFamily: "Roboto, sans-serif" }}
        >
          Aucune tâche disponible.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task._id}>
              <Card 
                sx={{ 
                  boxShadow: 3, 
                  borderRadius: 2, 
                  transition: "transform 0.2s", 
                  "&:hover": { transform: "scale(1.02)" } 
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: "bold", 
                      mb: 1,
                      fontFamily: "Roboto, sans-serif"
                    }}
                  >
                    {task.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1,
                      fontFamily: "Roboto, sans-serif"
                    }}
                  >
                    {task.details}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5,
                      fontFamily: "Roboto, sans-serif"
                    }}
                  >
                    <strong>Attribuée à :</strong>{" "}
                    {task.assignedEmployee
                      ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`
                      : "Non assigné"}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5,
                      fontFamily: "Roboto, sans-serif"
                    }}
                  >
                    <strong>Date limite :</strong> {new Date(task.deadline).toLocaleDateString()}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5,
                      fontFamily: "Roboto, sans-serif"
                    }}
                  >
                    <strong>Priorité :</strong> {task.priority}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: "Roboto, sans-serif"
                    }}
                  >
                    <strong>Statut :</strong> {task.status}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ListeTache;
