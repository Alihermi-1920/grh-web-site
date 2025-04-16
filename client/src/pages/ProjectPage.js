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
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Chip,
} from "@mui/material";
import { 
  Assignment, 
  AttachMoney, 
  CalendarToday, 
  Person, 
  Description, 
  GroupAdd, 
  Save,
  Flag
} from "@mui/icons-material";

const ProjectPage = () => {
  // Form State
  const [projectName, setProjectName] = useState("");
  const [projectLeader, setProjectLeader] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("planning");
  const [team, setTeam] = useState([]);
  const [budget, setBudget] = useState("");
  
  // UI State
  const [activeStep, setActiveStep] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Steps for project creation
  const steps = ["Informations de base", "Détails du projet", "Équipe du projet"];

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/employees");
        if (!res.ok) throw new Error("Erreur lors de la récupération des employés");
        const data = await res.json();
        setEmployees(data);
      } catch (error) {
        console.error(error);
        setError("Impossible de charger la liste des employés");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Navigation between steps
  const handleNext = () => {
    if (activeStep === 0 && !validateBasicInfo()) return;
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Validation for step 1
  const validateBasicInfo = () => {
    if (!projectName.trim()) {
      setError("Le nom du projet est obligatoire");
      return false;
    }
    if (!projectLeader) {
      setError("Un chef de projet est requis");
      return false;
    }
    setError("");
    return true;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Final validation
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
      priority,
      status,
      team: team.map((emp) => emp._id),
      budget: budget || 0,
      completionPercentage: 0,
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

      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setProjectName("");
        setProjectLeader(null);
        setDeadline("");
        setDescription("");
        setPriority("medium");
        setStatus("planning");
        setTeam([]);
        setBudget("");
        setActiveStep(0);
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Render different steps based on activeStep
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              Commençons par les informations essentielles de votre projet.
            </Typography>
            <TextField
              fullWidth
              label="Nom du projet *"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              sx={{ mb: 3 }}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Assignment color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Autocomplete
              id="project-leader"
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
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
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
              label="Date d'échéance *"
              InputLabelProps={{ shrink: true }}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              sx={{ mb: 3 }}
              disabled={loading}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              Précisez les détails de votre projet pour une meilleure organisation.
            </Typography>
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 3 }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="priority-label">Priorité</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={priority}
                    label="Priorité"
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={loading}
                    startAdornment={
                      <InputAdornment position="start">
                        <Flag color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="low">Faible</MenuItem>
                    <MenuItem value="medium">Moyenne</MenuItem>
                    <MenuItem value="high">Haute</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="status-label">Statut initial</InputLabel>
                  <Select
                    labelId="status-label"
                    value={status}
                    label="Statut initial"
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="planning">Planification</MenuItem>
                    <MenuItem value="in-progress">En cours</MenuItem>
                    <MenuItem value="on-hold">En attente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Budget (€)"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              sx={{ mb: 3 }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Sélectionnez les membres de l'équipe qui travailleront sur ce projet.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Note: Le chef de projet pourra modifier l'équipe ultérieurement.
            </Typography>
            
            <Autocomplete
              multiple
              id="team-members"
              options={employees.filter(emp => emp._id !== (projectLeader?._id || ''))}
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Membres de l'équipe"
                  variant="outlined"
                  helperText="Ajoutez les membres initiaux de l'équipe"
                  sx={{ mb: 2 }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <GroupAdd color="primary" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
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

            {team.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Équipe sélectionnée:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {team.map((member) => (
                    <Chip
                      key={member._id}
                      avatar={<Avatar src={member.photo} />}
                      label={`${member.firstName} ${member.lastName}`}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        );
      default:
        return "Étape inconnue";
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ mt: 4, p: { xs: 2, md: 4 }, background: "white", borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Créer un nouveau projet
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>Projet créé avec succès !</Alert>}

        <form onSubmit={handleSubmit}>
          {getStepContent(activeStep)}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
            >
              Précédent
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  {loading ? "Création en cours..." : "Créer le projet"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Suivant
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ProjectPage;