import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, CircularProgress, Paper, useTheme } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AuthContext } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const TaskStatusChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);
        // Fetch dashboard data for this chef
        const response = await fetch(`http://localhost:5000/api/dashboard/chef/${user._id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        const taskStats = dashboardData.taskStats;

        // Prepare chart data
        setChartData({
          labels: [
            'En attente',
            'En cours',
            'En révision',
            'Terminé',
            'Bloqué',
            'En pause'
          ],
          datasets: [
            {
              data: [
                taskStats.byStatus.pending,
                taskStats.byStatus.inProgress,
                taskStats.byStatus.review,
                taskStats.byStatus.completed,
                taskStats.byStatus.blocked,
                taskStats.byStatus.onHold
              ],
              backgroundColor: [
                theme.palette.warning.main,
                theme.palette.info.main,
                theme.palette.secondary.main,
                theme.palette.success.main,
                theme.palette.error.main,
                theme.palette.grey[500]
              ],
              borderColor: [
                theme.palette.warning.dark,
                theme.palette.info.dark,
                theme.palette.secondary.dark,
                theme.palette.success.dark,
                theme.palette.error.dark,
                theme.palette.grey[700]
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        console.error('Error fetching task data:', err);
        setError('Impossible de charger les données des tâches');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, theme]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        height: '100%',
        background: theme.palette.background.paper,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        }
      }}
    >
      <Typography variant="h6" fontWeight="600" gutterBottom>
        Distribution des Tâches par Statut
      </Typography>

      {chartData && chartData.datasets[0].data.every(value => value === 0) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune tâche trouvée
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: 250, position: 'relative' }}>
          {chartData && (
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TaskStatusChart;
