import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  CircularProgress,
  Autocomplete,
  Avatar,
} from "@mui/material";

const TaskManager = () => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState(null); // Un objet employé
  const [priority, setPriority] = useState('Medium');
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]); // Liste des employés
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Charger les employés au montage du composant
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await fetch("http://localhost:5000/api/employees");
        if (!response.ok) throw new Error("Erreur lors du chargement des employés");
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleCreateTask = async () => {
    // Vérifier qu'un employé est sélectionné
    if (!assignedTo) {
      console.error("Aucun employé sélectionné");
      return;
    }

    // Préparer le nouvel objet tâche en utilisant les noms de champs du nouveau modèle
    const newTask = {
      name: taskTitle,                // anciennement title
      details: taskDescription,       // anciennement description
      deadline: dueDate,              // anciennement dueDate
      assignedEmployee: assignedTo._id, // nouveau nom de champ pour l'employé assigné
      priority,
      status: "In Progress",
    };

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const data = await response.json();
      if (response.ok) {
        setTasks(prevTasks => [...prevTasks, data]);
        // Réinitialiser les champs du formulaire après création
        setTaskTitle('');
        setTaskDescription('');
        setDueDate('');
        setAssignedTo(null);
        setPriority('Medium');
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les employés dont le rôle est "Employé"
  const filteredEmployees = employees.filter(emp => emp.role === 'Employé');

  return (
    <Box sx={{ p: 3, background: "white", borderRadius: 3 }}>
      <Typography variant="h6">Créer une nouvelle tâche</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField
          label="Titre de la tâche"
          fullWidth
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
        />
        <TextField
          type="date"
          label="Date limite"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {/* Sélection d'un employé via Autocomplete */}
        <Autocomplete
          options={filteredEmployees}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
          value={assignedTo}
          onChange={(event, newValue) => setAssignedTo(newValue)}
          loading={loadingEmployees}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Attribuer à"
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingEmployees ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Avatar src={option.photo} sx={{ mr: 1, width: 24, height: 24 }} />
              {option.firstName} {option.lastName}
            </Box>
          )}
        />

        {/* Sélection de la priorité */}
        <FormControl fullWidth>
          <InputLabel>Priorité</InputLabel>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            label="Priorité"
          >
            <MenuItem value="Low">Basse</MenuItem>
            <MenuItem value="Medium">Moyenne</MenuItem>
            <MenuItem value="High">Haute</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleCreateTask}
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Créer la tâche"}
        </Button>
      </Stack>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Liste des Tâches</Typography>
        {tasks.map((task) => (
          <Box
            key={task._id}
            sx={{
              padding: 2,
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              borderRadius: 2,
              mt: 1,
            }}
          >
            <Typography variant="body1" fontWeight="bold">{task.name}</Typography>
            <Typography variant="body2">{task.details}</Typography>
            <Typography variant="body2">
              Attribuée à:{" "}
              {task.assignedEmployee
                ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`
                : "Non assigné"}
            </Typography>
            <Typography variant="body2">Date limite: {task.deadline}</Typography>
            <Typography variant="body2">Priorité: {task.priority}</Typography>
            <Typography variant="body2">Statut: {task.status}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TaskManager;
