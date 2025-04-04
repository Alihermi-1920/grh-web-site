// src/pages/ProjectPage.js
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  MenuItem,
  Avatar,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material";

const ProjectPage = () => {
  const [projectName, setProjectName] = useState("");
  const [projectLeader, setProjectLeader] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [team, setTeam] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Récupération de la liste des employés
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/employees")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des employés");
        return res.json();
      })
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Impossible de charger la liste des employés");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation des champs requis
    if (!projectName || !projectLeader || !deadline) {
      setError("Veuillez remplir tous les champs obligatoires");
      setLoading(false);
      return;
    }

    const projectData = {
      projectName,
      projectLeader: projectLeader._id,
      deadline,
      description,
      priority: priority || "medium",
      team: team.map((emp) => emp._id),
    };

    try {
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création du projet");
      }

      // Réinitialisation du formulaire après création réussie
      setProjectName("");
      setProjectLeader(null);
      setDeadline("");
      setDescription("");
      setPriority("");
      setTeam([]);
      
      alert("Projet créé avec succès !");
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, p: 3, background: "white", borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Créer un projet
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nom du projet *"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <Autocomplete
            options={employees}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar src={option.photo} sx={{ mr: 1, width: 24, height: 24 }} />
                {option.firstName} {option.lastName}
              </Box>
            )}
            value={projectLeader}
            onChange={(event, newValue) => setProjectLeader(newValue)}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chef de projet *"
                variant="outlined"
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            fullWidth
            type="date"
            label="Deadline *"
            InputLabelProps={{ shrink: true }}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            select
            fullWidth
            label="Priorité"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          >
            <MenuItem value="low">Faible</MenuItem>
            <MenuItem value="medium">Moyenne</MenuItem>
            <MenuItem value="high">Haute</MenuItem>
          </TextField>

          <Autocomplete
            multiple
            options={employees}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar src={option.photo} sx={{ mr: 1, width: 24, height: 24 }} />
                {option.firstName} {option.lastName}
              </Box>
            )}
            value={team}
            onChange={(event, newValue) => setTeam(newValue)}
            loading={loading}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Équipe"
                variant="outlined"
                helperText="Sélectionnez les membres de l'équipe"
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? "Création en cours..." : "Créer le projet"}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default ProjectPage;
