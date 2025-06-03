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
  useTheme,
  Chip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { AuthContext } from '../../context/AuthContext';

// Composant principal du tableau de classement des employés
const EmployeeLeaderboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const primaryColor = '#685cfe'; // Couleur principale du thème

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
      case 0: return '#FFD700'; // Or pour le 1er
      case 1: return '#e65a22'; // Argent pour le 2ème
      case 2: return '#17e8b4'; // Bronze pour le 3ème
      default: return primaryColor; // Couleur principale pour les autres
    }
  };

  // Fonction pour obtenir l'icône de trophée pour les 3 premiers
  const getTrophyIcon = (index) => {
    if (index < 3) {
      return <EmojiEventsIcon sx={{ color: getMedalColor(index), mr: 1 }} />;
    }
    return null;
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        boxShadow: '0 6px 18px 0 rgba(0,0,0,0.06)',
        p: 3,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <EmojiEventsIcon sx={{ color: primaryColor, mr: 1, fontSize: 28 }} />
        <Typography variant="h6" fontWeight="600" color={primaryColor}>
          Classement des Employés
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress size={30} sx={{ color: primaryColor }} />
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
              {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
              <ListItem
                sx={{
                  py: 2,
                  px: 2,
                  borderRadius: 2,
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    bgcolor: `${primaryColor}10`,
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={employee.photo}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    sx={{
                      width: 50,
                      height: 50,
                      border: index < 3 ? `2px solid ${getMedalColor(index)}` : 'none',
                      boxShadow: index < 3 ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getTrophyIcon(index)}
                      <Typography variant="body1" fontWeight="medium">
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      <Chip 
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: index < 3 ? getMedalColor(index) : `${primaryColor}20`,
                          color: index < 3 ? '#fff' : primaryColor,
                          fontWeight: 'bold',
                          height: 24
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {employee.evaluationCount} évaluation{employee.evaluationCount > 1 ? 's' : ''}
                    </Typography>
                  }
                />
                <Box 
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ 
                      color: index < 3 ? getMedalColor(index) : primaryColor,
                    }}
                  >
                    {employee.averageScore.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    sur 5
                  </Typography>
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default EmployeeLeaderboard;
