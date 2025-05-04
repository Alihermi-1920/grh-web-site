import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, CircularProgress, Paper, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { AuthContext } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TaskCompletionTimeline = () => {
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
        // Fetch tasks assigned by this chef
        const response = await fetch(`http://localhost:5000/api/tasks?assignedBy=${user._id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch task data');
        }
        
        const tasks = await response.json();
        
        // Filter completed tasks
        const completedTasks = tasks.filter(task => task.status === 'completed');
        
        // Group by completion date (using createdAt as fallback if completedAt is not available)
        const groupedByDate = {};
        
        // Get date range for the last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        // Initialize all dates in the range with 0
        for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          groupedByDate[dateStr] = 0;
        }
        
        // Count completed tasks by date
        completedTasks.forEach(task => {
          const completionDate = task.completedAt || task.updatedAt;
          if (completionDate) {
            const dateStr = new Date(completionDate).toISOString().split('T')[0];
            if (new Date(dateStr) >= thirtyDaysAgo && new Date(dateStr) <= today) {
              groupedByDate[dateStr] = (groupedByDate[dateStr] || 0) + 1;
            }
          }
        });
        
        // Sort dates
        const sortedDates = Object.keys(groupedByDate).sort();
        
        // Calculate cumulative completion
        let cumulativeCompletion = 0;
        const cumulativeData = sortedDates.map(date => {
          cumulativeCompletion += groupedByDate[date];
          return cumulativeCompletion;
        });
        
        // Format dates for display (DD/MM)
        const formattedDates = sortedDates.map(date => {
          const [year, month, day] = date.split('-');
          return `${day}/${month}`;
        });
        
        // Prepare chart data
        setChartData({
          labels: formattedDates,
          datasets: [
            {
              label: 'Tâches terminées (cumulatif)',
              data: cumulativeData,
              borderColor: theme.palette.primary.main,
              backgroundColor: `${theme.palette.primary.main}20`,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: theme.palette.primary.main,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
            }
          ],
        });
      } catch (err) {
        console.error('Error fetching task completion data:', err);
        setError('Impossible de charger les données de complétion des tâches');
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
        Évolution des Tâches Terminées
      </Typography>
      
      {chartData && chartData.datasets[0].data.every(value => value === 0) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune tâche terminée trouvée
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: 250, position: 'relative' }}>
          {chartData && (
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      maxTicksLimit: 10,
                      maxRotation: 0
                    }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
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

export default TaskCompletionTimeline;
