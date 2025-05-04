import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  useTheme 
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AuthContext } from '../../context/AuthContext';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const TaskStatusChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
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
        
        // Count tasks by status
        const statusCounts = {
          'pending': 0,
          'in-progress': 0,
          'review': 0,
          'completed': 0,
          'blocked': 0,
          'on-hold': 0
        };
        
        tasks.forEach(task => {
          if (statusCounts.hasOwnProperty(task.status)) {
            statusCounts[task.status]++;
          }
        });
        
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
                statusCounts['pending'],
                statusCounts['in-progress'],
                statusCounts['review'],
                statusCounts['completed'],
                statusCounts['blocked'],
                statusCounts['on-hold']
              ],
              backgroundColor: [
                '#FFCA28', // amber for pending
                '#29B6F6', // light blue for in-progress
                '#9575CD', // deep purple for review
                '#66BB6A', // green for completed
                '#EF5350', // red for blocked
                '#BDBDBD'  // grey for on-hold
              ],
              borderColor: [
                '#FFA000', // darker amber
                '#0288D1', // darker blue
                '#673AB7', // darker purple
                '#388E3C', // darker green
                '#D32F2F', // darker red
                '#757575'  // darker grey
              ],
              borderWidth: 1,
              hoverOffset: 5
            },
          ],
        });
      } catch (err) {
        console.error('Error fetching task data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography 
        variant="h6" 
        fontWeight="600" 
        sx={{ 
          mb: 2,
          color: theme.palette.text.primary,
          fontSize: '1.1rem'
        }}
      >
        Distribution des Tâches
      </Typography>
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {loading ? (
          <CircularProgress size={40} thickness={4} />
        ) : !chartData || chartData.datasets[0].data.every(value => value === 0) ? (
          <Typography variant="body1" color="text.secondary">
            Aucune tâche trouvée
          </Typography>
        ) : (
          <Box sx={{ height: 240, width: '100%', position: 'relative' }}>
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
                        size: 11,
                        family: "'Inter', sans-serif"
                      },
                      color: theme.palette.text.secondary
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                      size: 13,
                      family: "'Inter', sans-serif"
                    },
                    bodyFont: {
                      size: 12,
                      family: "'Inter', sans-serif"
                    },
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
                },
                animation: {
                  animateScale: true,
                  animateRotate: true
                }
              }}
            />
            {chartData && (
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {chartData.datasets[0].data.reduce((a, b) => a + b, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tâches
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TaskStatusChart;
