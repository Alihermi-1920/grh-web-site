// Composant de résumé des statistiques d'équipe
// Documentation Material UI Card: https://mui.com/material-ui/react-card/
// Documentation Material UI Grid: https://mui.com/material-ui/react-grid/
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  useTheme,
  Grid
} from '@mui/material';
import {
  Group as GroupIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Composant StatCard simplifié
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%'
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {React.cloneElement(icon, { sx: { color: color, fontSize: 20 } })}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold" color={color}>
          {value}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// Composant principal TeamStatsSummary
const TeamStatsSummary = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);

        // Fetch employees under this chef
        const employeesResponse = await fetch(`http://localhost:5000/api/employees/chef/${user._id}`);

        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees data');
        }

        const employees = await employeesResponse.json();


        // Fetch evaluation results
        const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat/chef/${user._id}`);
        let evaluations = [];

        if (evaluationsResponse.ok) {
          evaluations = await evaluationsResponse.json();
        }

        // Calculate statistics

        // 1. Employee count
        const employeeCount = employees.length;


        // 4. Average evaluation score
        let avgEvaluationScore = 0;

        if (evaluations.length > 0) {
          const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
          avgEvaluationScore = totalScore / evaluations.length;
        }


        setStats({
          employeeCount,
          avgEvaluationScore
        });
      } catch (err) {
        console.error('Error fetching team stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Statistiques de l'équipe
      </Typography>
      
      {loading ? (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 150,
          py: 3
        }}>
          <CircularProgress size={30} />
        </Box>
      ) : !stats ? (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 150,
          py: 3
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée disponible
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={6}>
            <StatCard
              icon={<GroupIcon />}
              title="Employés"
              value={stats.employeeCount}
              color={theme.palette.primary.main}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <StatCard
              icon={<StarIcon />}
              title="Score Moyen"
              value={stats.avgEvaluationScore.toFixed(1)}
              subtitle="sur 5 points"
              color={theme.palette.warning.main}
            />
          </Grid>
        </Grid>
      )}
    </Card>
  );
};

export default TeamStatsSummary;
