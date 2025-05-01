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
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from "@mui/material";
import {
  Assignment,
  CalendarToday,
  Person,
  Description,
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

  // UI State
  const [employees, setEmployees] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch chefs list
  useEffect(() => {
    const fetchChefs = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/employees/chefs");
        if (!res.ok) throw new Error("Erreur lors de la récupération des chefs");
        const data = await res.json();
        setChefs(data);
      } catch (error) {
        console.error(error);
        setError("Impossible de charger la liste des chefs");
      } finally {
        setLoading(false);
      }
    };
    fetchChefs();
  }, []);

  // Validation du formulaire
  const validateForm = () => {
    if (!projectName.trim()) {
      setError("Le nom du projet est obligatoire");
      return false;
    }
    if (!projectLeader) {
      setError("Un chef de projet est requis");
      return false;
    }
    if (!deadline) {
      setError("La date limite est obligatoire");
      return false;
    }
    if (!description.trim()) {
      setError("La description du projet est obligatoire");
      return false;
    }
    setError("");
    return true;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const projectData = {
      projectName,
      projectLeader: projectLeader._id,
      deadline,
      description,
      priority,
      status: "planning", // Statut par défaut
      team: [], // Équipe vide par défaut
      budget: 0, // Budget à 0 par défaut
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

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Erreur lors de la création du projet");
      }

      setSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setProjectName("");
        setProjectLeader(null);
        setDeadline("");
        setDescription("");
        setPriority("medium");
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Render form content
  const renderFormContent = () => {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 3 }}>
          Remplissez les informations du projet
        </Typography>

        <TextField
          fullWidth
          label="Nom du projet *"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.2)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.5)' : undefined,
              },
              '& .MuiInputBase-input': {
                color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
              }
            },
            '& .MuiInputLabel-root': {
              color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
            }
          }}
          disabled={loading}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Assignment color={localStorage.getItem("themeMode") === "dark" ? "info" : "primary"} />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          id="project-leader"
          options={chefs}
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
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.2)' : undefined,
                  },
                  '&:hover fieldset': {
                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.5)' : undefined,
                  },
                  '& .MuiInputBase-input': {
                    color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
                  }
                },
                '& .MuiInputLabel-root': {
                  color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Person color={localStorage.getItem("themeMode") === "dark" ? "info" : "primary"} />
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
          InputLabelProps={{
            shrink: true,
            sx: {
              color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
            }
          }}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.2)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.5)' : undefined,
              },
              '& .MuiInputBase-input': {
                color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
              }
            }
          }}
          disabled={loading}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarToday color={localStorage.getItem("themeMode") === "dark" ? "info" : "primary"} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Description *"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.2)' : undefined,
              },
              '&:hover fieldset': {
                borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.5)' : undefined,
              },
              '& .MuiInputBase-input': {
                color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
              }
            },
            '& .MuiInputLabel-root': {
              color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
            }
          }}
          disabled={loading}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Description color={localStorage.getItem("themeMode") === "dark" ? "info" : "primary"} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.2)' : undefined,
            },
            '&:hover fieldset': {
              borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.5)' : undefined,
            },
            '& .MuiInputBase-input': {
              color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
            }
          },
          '& .MuiInputLabel-root': {
            color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
          }
        }}>
          <InputLabel id="priority-label">Priorité *</InputLabel>
          <Select
            labelId="priority-label"
            value={priority}
            label="Priorité *"
            onChange={(e) => setPriority(e.target.value)}
            disabled={loading}
            required
            startAdornment={
              <InputAdornment position="start">
                <Flag color={localStorage.getItem("themeMode") === "dark" ? "info" : "primary"} />
              </InputAdornment>
            }
          >
            <MenuItem
              value="low"
              sx={{
                color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
                '&:hover': {
                  backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.08)' : undefined
                },
                '&.Mui-selected': {
                  backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(25, 118, 210, 0.15)' : undefined,
                  '&:hover': {
                    backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(25, 118, 210, 0.25)' : undefined
                  }
                }
              }}
            >
              Faible
            </MenuItem>
            <MenuItem
              value="medium"
              sx={{
                color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
                '&:hover': {
                  backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.08)' : undefined
                },
                '&.Mui-selected': {
                  backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(25, 118, 210, 0.15)' : undefined,
                  '&:hover': {
                    backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(25, 118, 210, 0.25)' : undefined
                  }
                }
              }}
            >
              Moyenne
            </MenuItem>
            <MenuItem
              value="high"
              sx={{
                color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
                '&:hover': {
                  backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.08)' : undefined
                },
                '&.Mui-selected': {
                  backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(25, 118, 210, 0.15)' : undefined,
                  '&:hover': {
                    backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(25, 118, 210, 0.25)' : undefined
                  }
                }
              }}
            >
              Haute
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{
        mt: 4,
        p: { xs: 2, md: 4 },
        background: localStorage.getItem("themeMode") === "dark"
          ? 'linear-gradient(135deg, rgba(66, 66, 66, 0.95), rgba(33, 33, 33, 0.9))'
          : 'white',
        color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
        borderRadius: 2,
        boxShadow: 2
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Créer un nouveau projet
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>Projet créé avec succès !</Alert>}

        <form onSubmit={handleSubmit}>
          {renderFormContent()}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                minWidth: 180,
                py: 1.2,
                borderRadius: 2,
                background: localStorage.getItem("themeMode") === "dark"
                  ? 'linear-gradient(45deg, rgba(25, 118, 210, 0.9) 30%, rgba(66, 165, 245, 0.9) 90%)'
                  : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: localStorage.getItem("themeMode") === "dark"
                    ? 'linear-gradient(45deg, rgba(25, 118, 210, 1) 30%, rgba(66, 165, 245, 1) 90%)'
                    : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  boxShadow: '0 6px 12px rgba(25, 118, 210, 0.4)'
                },
                '&.Mui-disabled': {
                  background: localStorage.getItem("themeMode") === "dark"
                    ? 'rgba(25, 118, 210, 0.3)'
                    : undefined
                }
              }}
            >
              {loading ? "Création en cours..." : "Créer le projet"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ProjectPage;