// Composant de graphique de performance des employés utilisant Material UI et Chart.js
// Documentation Material UI Card: https://mui.com/material-ui/react-card/
// Documentation Material UI LinearProgress: https://mui.com/material-ui/react-progress/
// Documentation Material UI Avatar: https://mui.com/material-ui/react-avatar/
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  useTheme,
  Avatar,
  LinearProgress,
  Divider
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

// Create custom horizontal bar component
// Documentation Chart.js: https://www.chartjs.org/docs/latest/
const CustomHorizontalBar = ({ data, options }) => {
  const chartOptions = {
    ...options,
    indexAxis: 'y'
  };

  return <Bar data={data} options={chartOptions} />;
};

// Composant principal EmployeePerformanceChart
// Documentation Material UI Box: https://mui.com/material-ui/react-box/
// Documentation Material UI Typography: https://mui.com/material-ui/react-typography/
const EmployeePerformanceChart = () => {
  const [chartData, setChartData] = useState(null);
  const [employeeStats, setEmployeeStats] = useState([]);
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

        // Prepare chart data (top 6 employees)
        const topEmployees = sortedMetrics.slice(0, 6);

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
              barThickness: 15,
            }
          ],
        });
      } catch (err) {
        console.error('Error fetching productivity data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, theme]);

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}
    >
      <Typography
        variant="h6"
        fontWeight="600"
        sx={{ mb: 2 }}
      >
        Performance des Employés
      </Typography>

      {loading ? (
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3
        }}>
          <CircularProgress size={30} />
        </Box>
      ) : employeeStats.length === 0 ? (
        <Box 
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 3,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Aucune donnée de performance disponible
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: 200, mb: 2, p: 1, borderRadius: 2 }}>
            {chartData && (
              <CustomHorizontalBar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 40, 60, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      titleFont: {
                        size: 13
                      },
                      bodyFont: {
                        size: 12
                      },
                      callbacks: {
                        label: function(context) {
                          return `Taux de complétion: ${context.raw}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      max: 100,
                      grid: {
                        color: theme.palette.divider
                      },
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      }
                    },
                    y: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="subtitle2"
            fontWeight="600"
            sx={{ mb: 1.5, color: theme.palette.text.secondary }}
          >
            Top Performers
          </Typography>

          {/* Liste des top performers */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {employeeStats.slice(0, 3).map((stat, index) => (
              <Box 
                key={stat.employee._id} 
                sx={{ 
                  mb: 2, 
                  p: 1.5, 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
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
                      Performance basée sur les tâches assignées
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {stat.completionRate.toFixed(0)}%
                  </Typography>
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
        </Box>
      )}
    </Card>
  );
};

export default EmployeePerformanceChart;
