import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Box,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarMonth as CalendarIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';

const ProjectSelectionGrid = ({ projects, onSelectProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isCurrentMonthFilter, setIsCurrentMonthFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Get status chip with appropriate color
  const getStatusChip = (status) => {
    let color = "default";
    let label = "Inconnu";

    switch (status) {
      case "pending":
        color = "warning";
        label = "En attente";
        break;
      case "in-progress":
        color = "info";
        label = "En cours";
        break;
      case "completed":
        color = "success";
        label = "Terminé";
        break;
      case "rejected":
        color = "error";
        label = "Rejeté";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Get priority chip with appropriate color
  const getPriorityChip = (priority) => {
    let color = "default";
    let label = "Moyenne";

    switch (priority) {
      case "low":
        color = "success";
        label = "Basse";
        break;
      case "medium":
        color = "warning";
        label = "Moyenne";
        break;
      case "high":
        color = "error";
        label = "Haute";
        break;
      default:
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate if a project is from the current month
  const isCurrentMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Search term filter
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;

    // Current month filter
    let matchesMonth = true;
    if (isCurrentMonthFilter) {
      matchesMonth = isCurrentMonth(project.createdAt);
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesMonth;
  });

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setIsCurrentMonthFilter(false);
  };

  // Toggle current month filter
  const handleToggleCurrentMonthFilter = () => {
    setIsCurrentMonthFilter(!isCurrentMonthFilter);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Rechercher un projet..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box>
            <Tooltip title="Filtres">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ce mois-ci">
              <IconButton
                onClick={handleToggleCurrentMonthFilter}
                color={isCurrentMonthFilter ? "primary" : "default"}
              >
                <CalendarIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Réinitialiser les filtres">
              <IconButton onClick={handleResetFilters}>
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Statut"
                size="small"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="in-progress">En cours</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
                <MenuItem value="rejected">Rejeté</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="priority-filter-label">Priorité</InputLabel>
              <Select
                labelId="priority-filter-label"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priorité"
                size="small"
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="low">Basse</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="month-filter-label">Mois</InputLabel>
              <Select
                labelId="month-filter-label"
                value={isCurrentMonthFilter ? "current" : "all"}
                onChange={(e) => setIsCurrentMonthFilter(e.target.value === "current")}
                label="Mois"
                size="small"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="current">Mois courant</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {filteredProjects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Aucun projet ne correspond à vos critères de recherche
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={handleResetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardActionArea onClick={() => onSelectProject(project)} sx={{ flexGrow: 1 }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      bgcolor: isCurrentMonth(project.createdAt) ? 'primary.light' : 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      position: 'relative',
                    }}
                  >
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', zIndex: 1 }}>
                      {project.projectName}
                    </Typography>
                    {isCurrentMonth(project.createdAt) && (
                      <Chip
                        label="Ce mois-ci"
                        color="secondary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                        }}
                      />
                    )}
                  </CardMedia>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      {getStatusChip(project.status)}
                      {getPriorityChip(project.priority)}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: 40, overflow: 'hidden' }}>
                      {project.description || "Aucune description disponible"}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Échéance: {formatDate(project.deadline)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Progression:</span>
                        <span>{project.completionPercentage || 0}%</span>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={project.completionPercentage || 0}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProjectSelectionGrid;
