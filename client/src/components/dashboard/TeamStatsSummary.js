
import React, { useState, useEffect, useContext } from 'react';
import { Box, Grid, Typography, Paper, CircularProgress, useTheme } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { AuthContext } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../utils/apiConfig';

// Composant pour afficher une carte de statistique
const StatCard = ({ icon, title, value, color, bgColor }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        borderRadius: 3,
        bgcolor: bgColor,
        boxShadow: '0 8px 24px 0 rgba(0,0,0,0.08)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 28px 0 rgba(0,0,0,0.12)'
        }
      }}
    >
      <Box
        sx={{
          width: 70,
          height: 70,
          display: 'flex',
          borderRadius: 2,
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: color,
          color: '#fff',
          mr: 3
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 36 } })}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

// Composant principal pour afficher les statistiques de l'équipe
const TeamStatsSummary = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const primaryColor = '#685cfe'; // Couleur principale du thème

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);

        // Récupérer le nombre d'employés
        const employeesResponse = await fetch(`http://localhost:5000/api/employees/chef/${user._id}`);
        
        if (!employeesResponse.ok) {
          throw new Error('Impossible de récupérer les données des employés');
        }
        
        const employeesData = await employeesResponse.json();
        setEmployeeCount(employeesData.length);

        // Récupérer le nombre d'assignations de travail
        const assignmentsResponse = await fetch(API_ENDPOINTS.WORK_ASSIGNMENTS_BY_CHEF(user._id));
        
        if (!assignmentsResponse.ok) {
          throw new Error('Impossible de récupérer les données des assignations');
        }
        
        const assignmentsData = await assignmentsResponse.json();
        setAssignmentsCount(assignmentsData.length);

      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={40} sx={{ color: primaryColor }} />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <StatCard
          icon={<GroupIcon />}
          title="Employés"
          value={employeeCount}
          color={primaryColor}
          bgColor={`${primaryColor}10`}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <StatCard
          icon={<AssignmentIcon />}
          title="Travaux Assignés"
          value={assignmentsCount}
          color="#FF6B8A"
          bgColor="#FF6B8A10"
        />
      </Grid>
    </Grid>
  );
};

export default TeamStatsSummary;
