import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  useTheme,
  Divider,
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { AuthContext } from '../../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const ProjectProgressChart = () => {
  const [chartData, setChartData] = useState(null);
  const [topProjects, setTopProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);
        // Fetch projects for this chef
        const response = await fetch(`http://localhost:5000/api/projects?projectLeader=${user._id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }
        
        const projects = await response.json();
        
        // Sort projects by completion percentage (highest first)
        const sortedProjects = [...projects].sort((a, b) => 
          (b.completionPercentage || 0) - (a.completionPercentage || 0)
        );
        
        // Get top 5 projects for detailed view
        setTopProjects(sortedProjects.slice(0, 5));
        
        // Get top 8 projects for chart
        const topChartProjects = sortedProjects.slice(0, 8);
        
        // Prepare chart data
        setChartData({
          labels: topChartProjects.map(project => project.projectName),
          datasets: [
            {
              label: 'Progression (%)',
              data: topChartProjects.map(project => project.completionPercentage || 0),
              backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(54, 162, 235, 0.7)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)'
              ],
              borderWidth: 1,
              borderRadius: 6,
            }
          ],
        });
      } catch (err) {
        console.error('Error fetching project data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Function to get color based on progress
  const getProgressColor = (progress) => {
    if (progress >= 75) return theme.palette.success.main;
    if (progress >= 50) return theme.palette.info.main;
    if (progress >= 25) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

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
        Progression des Projets
      </Typography>
      
      {loading ? (
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      ) : !chartData || chartData.datasets[0].data.length === 0 ? (
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucun projet trouvé
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: 200, mb: 2 }}>
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
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
                        return `Progression: ${context.raw}%`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 10,
                        family: "'Inter', sans-serif"
                      },
                      color: theme.palette.text.secondary,
                      maxRotation: 45,
                      minRotation: 45
                    }
                  },
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                      color: theme.palette.divider
                    },
                    ticks: {
                      font: {
                        size: 10,
                        family: "'Inter', sans-serif"
                      },
                      color: theme.palette.text.secondary,
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                },
                animation: {
                  duration: 1000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography 
            variant="subtitle2" 
            fontWeight="600" 
            sx={{ mb: 1.5, color: theme.palette.text.secondary }}
          >
            Top Projets
          </Typography>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {topProjects.map((project, index) => (
              <Box key={project._id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Tooltip title={project.projectName}>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium" 
                      noWrap 
                      sx={{ 
                        flexGrow: 1,
                        maxWidth: '70%'
                      }}
                    >
                      {project.projectName}
                    </Typography>
                  </Tooltip>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    sx={{ 
                      color: getProgressColor(project.completionPercentage || 0)
                    }}
                  >
                    {project.completionPercentage || 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={project.completionPercentage || 0} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(project.completionPercentage || 0)
                    }
                  }} 
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ProjectProgressChart;
