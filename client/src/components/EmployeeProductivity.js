import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  useTheme,
  Avatar,
  LinearProgress,
  Tooltip,
  Grid
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
import { AuthContext } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const EmployeeProductivity = () => {
  const [chartData, setChartData] = useState(null);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        
        if (employees.length === 0) {
          setEmployeeStats([]);
          setChartData(null);
          setLoading(false);
          return;
        }
        
        // Fetch all tasks
        const tasksResponse = await fetch(`http://localhost:5000/api/tasks?assignedBy=${user._id}`);
        
        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks data');
        }
        
        const tasks = await tasksResponse.json();
        
        // Calculate productivity metrics for each employee
        const employeeMetrics = employees.map(employee => {
          // Get tasks assigned to this employee
          const employeeTasks = tasks.filter(task => 
            task.assignedTo && 
            (task.assignedTo._id === employee._id || task.assignedTo === employee._id)
          );
          
          // Calculate completion rate
          const totalTasks = employeeTasks.length;
          const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
          const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          // Calculate on-time completion
          const completedOnTime = employeeTasks.filter(task => {
            if (task.status !== 'completed') return false;
            
            const completedDate = new Date(task.updatedAt);
            const deadlineDate = new Date(task.deadline);
            
            return completedDate <= deadlineDate;
          }).length;
          
          const onTimeRate = completedTasks > 0 ? (completedOnTime / completedTasks) * 100 : 0;
          
          return {
            employee,
            totalTasks,
            completedTasks,
            completionRate,
            onTimeRate
          };
        });
        
        // Sort by completion rate (highest first)
        const sortedMetrics = employeeMetrics.sort((a, b) => b.completionRate - a.completionRate);
        
        setEmployeeStats(sortedMetrics);
        
        // Prepare chart data (top 5 employees)
        const topEmployees = sortedMetrics.slice(0, 5);
        
        setChartData({
          labels: topEmployees.map(item => `${item.employee.firstName} ${item.employee.lastName}`),
          datasets: [
            {
              label: 'Taux de complétion (%)',
              data: topEmployees.map(item => item.completionRate.toFixed(1)),
              backgroundColor: theme.palette.primary.main,
              borderColor: theme.palette.primary.dark,
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Taux de complétion à temps (%)',
              data: topEmployees.map(item => item.onTimeRate.toFixed(1)),
              backgroundColor: theme.palette.secondary.main,
              borderColor: theme.palette.secondary.dark,
              borderWidth: 1,
              borderRadius: 4,
            }
          ],
        });
      } catch (err) {
        console.error('Error fetching productivity data:', err);
        setError('Impossible de charger les données de productivité');
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
        Productivité des Employés
      </Typography>
      
      {employeeStats.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée de productivité disponible
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ height: 250, position: 'relative' }}>
              {chartData && (
                <Bar 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
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
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}%`;
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
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Top Performers
            </Typography>
            
            <Box sx={{ mt: 1 }}>
              {employeeStats.slice(0, 3).map((stat, index) => (
                <Box key={stat.employee._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      src={stat.employee.photo} 
                      alt={`${stat.employee.firstName} ${stat.employee.lastName}`}
                      sx={{ width: 32, height: 32, mr: 1.5 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {stat.employee.firstName} {stat.employee.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.completedTasks} tâches terminées sur {stat.totalTasks}
                      </Typography>
                    </Box>
                    <Tooltip title="Taux de complétion">
                      <Typography variant="body2" fontWeight="bold">
                        {stat.completionRate.toFixed(0)}%
                      </Typography>
                    </Tooltip>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stat.completionRate} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        bgcolor: index === 0 
                          ? theme.palette.success.main 
                          : index === 1 
                            ? theme.palette.primary.main 
                            : theme.palette.secondary.main
                      }
                    }} 
                  />
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default EmployeeProductivity;
