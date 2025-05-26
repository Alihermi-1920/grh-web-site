import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  useTheme
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { AuthContext } from '../../context/AuthContext';

// Composant principal du tableau de classement des employés
const EmployeeLeaderboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  // Fonction pour récupérer les données des employés et leurs évaluations
  const fetchEmployeeData = async () => {
    if (!user || !user._id) return;

    try {
      setLoading(true);
      setError(null);

      // Récupérer les employés sous ce chef
      const employeesResponse = await fetch(`http://localhost:5000/api/employees/chef/${user._id}`);
      
      if (!employeesResponse.ok) {
        throw new Error('Impossible de récupérer les données des employés');
      }
      
      const employeesData = await employeesResponse.json();

      if (employeesData.length === 0) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      // Récupérer toutes les évaluations
      const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat/chef/${user._id}`);
      
      if (!evaluationsResponse.ok) {
        throw new Error('Impossible de récupérer les données d\'évaluation');
      }
      
      const evaluationsData = await evaluationsResponse.json();

      // Regrouper les évaluations par employé
      const employeeEvaluations = {};

      evaluationsData.forEach(evaluation => {
        if (evaluation.employeeId) {
          const employeeId = typeof evaluation.employeeId === 'object' ? evaluation.employeeId._id : evaluation.employeeId;
          
          if (!employeeEvaluations[employeeId]) {
            employeeEvaluations[employeeId] = [];
          }
          
          employeeEvaluations[employeeId].push(evaluation);
        }
      });

      // Calculer les scores moyens pour chaque employé
      const employeesWithScores = employeesData.map(employee => {
        const evaluations = employeeEvaluations[employee._id] || [];
        let totalScore = 0;
        
        evaluations.forEach(evaluation => {
          // Utiliser directement le globalScore de l'évaluation
          totalScore += evaluation.globalScore || 0;
        });
        
        const averageScore = evaluations.length > 0 ? totalScore / evaluations.length : 0;
        
        return {
          ...employee,
          averageScore,
          evaluationCount: evaluations.length
        };
      });

      // Filtrer les employés qui ont au moins une évaluation et trier par score moyen
      const sortedEmployees = employeesWithScores
        .filter(employee => employee.evaluationCount > 0)
        .sort((a, b) => b.averageScore - a.averageScore);

      setEmployees(sortedEmployees);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchEmployeeData();
  }, [user]);

  // Fonction pour déterminer la couleur de la médaille en fonction du rang
  const getMedalColor = (index) => {
    switch (index) {
      case 0: return theme.palette.warning.main; // Or pour le 1er
      case 1: return theme.palette.grey[400]; // Argent pour le 2ème
      case 2: return theme.palette.warning.dark; // Bronze pour le 3ème
      default: return theme.palette.grey[300]; // Gris pour les autres
    }
  };

  // Fonction pour afficher les étoiles de notation
  const renderRatingStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score - fullStars >= 0.5;
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon 
            key={i} 
            fontSize="small" 
            sx={{ color: theme.palette.warning.main, width: 16, height: 16 }} 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarIcon 
            key={i} 
            fontSize="small" 
            sx={{ color: theme.palette.warning.main, width: 16, height: 16 }} 
          />
        );
      } else {
        stars.push(
          <StarBorderIcon 
            key={i} 
            fontSize="small" 
            sx={{ color: theme.palette.warning.main, width: 16, height: 16 }} 
          />
        );
      }
    }
    
    return stars;
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        p: 2
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="600">
          Classement des Employés
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress size={30} />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : employees.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography color="text.secondary">Aucune évaluation disponible</Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
          {employees.map((employee, index) => (
            <React.Fragment key={employee._id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                sx={{
                  py: 1.5,
                  px: 2,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={employee.photo}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    sx={{
                      width: 40,
                      height: 40,
                      border: index < 3 ? `2px solid ${getMedalColor(index)}` : 'none'
                    }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      <Box 
                        sx={{
                          ml: 1,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'medium',
                          bgcolor: index < 3 ? getMedalColor(index) : theme.palette.grey[100],
                          color: index < 3 ? '#fff' : theme.palette.text.primary
                        }}
                      >
                        #{index + 1}
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {renderRatingStars(employee.averageScore)}
                      <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
                        ({employee.evaluationCount} évaluation{employee.evaluationCount > 1 ? 's' : ''})
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body2" fontWeight="bold">
                  {employee.averageScore.toFixed(1)}/5
                </Typography>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default EmployeeLeaderboard;
