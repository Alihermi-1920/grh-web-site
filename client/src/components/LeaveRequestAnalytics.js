import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  useTheme,
  Grid,
  Chip
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { AuthContext } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const LeaveRequestAnalytics = () => {
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);
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
          setStats(null);
          setChartData(null);
          setLoading(false);
          return;
        }
        
        // Get employee IDs
        const employeeIds = employees.map(emp => emp._id);
        
        // Fetch leave requests for these employees
        const leaveResponse = await fetch(`http://localhost:5000/api/conges/chef/${user._id}`);
        
        if (!leaveResponse.ok) {
          throw new Error('Failed to fetch leave requests data');
        }
        
        const leaveRequests = await leaveResponse.json();
        
        // Filter leave requests for employees under this chef
        const filteredRequests = leaveRequests.filter(req => 
          employeeIds.includes(req.employee._id || req.employee)
        );
        
        // Calculate statistics
        const totalRequests = filteredRequests.length;
        const pendingRequests = filteredRequests.filter(req => req.status === 'pending').length;
        const approvedRequests = filteredRequests.filter(req => req.status === 'approved').length;
        const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected').length;
        
        setStats({
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests
        });
        
        // Group by month for chart
        const monthlyData = {};
        const currentYear = new Date().getFullYear();
        
        // Initialize all months
        for (let i = 0; i < 12; i++) {
          const monthKey = `${i + 1}/${currentYear}`;
          monthlyData[monthKey] = {
            approved: 0,
            rejected: 0,
            pending: 0,
            month: i
          };
        }
        
        // Count requests by month and status
        filteredRequests.forEach(req => {
          const date = new Date(req.startDate);
          if (date.getFullYear() === currentYear) {
            const monthKey = `${date.getMonth() + 1}/${currentYear}`;
            if (monthlyData[monthKey]) {
              monthlyData[monthKey][req.status] += 1;
            }
          }
        });
        
        // Convert to arrays for chart
        const months = Object.keys(monthlyData)
          .sort((a, b) => {
            const [monthA] = a.split('/');
            const [monthB] = b.split('/');
            return parseInt(monthA) - parseInt(monthB);
          });
        
        const approvedData = months.map(month => monthlyData[month].approved);
        const rejectedData = months.map(month => monthlyData[month].rejected);
        const pendingData = months.map(month => monthlyData[month].pending);
        
        // Format month labels
        const monthLabels = months.map(month => {
          const [monthNum] = month.split('/');
          const date = new Date(currentYear, parseInt(monthNum) - 1, 1);
          return date.toLocaleDateString('fr-FR', { month: 'short' });
        });
        
        setChartData({
          labels: monthLabels,
          datasets: [
            {
              label: 'Approuvées',
              data: approvedData,
              backgroundColor: theme.palette.success.main,
              borderColor: theme.palette.success.dark,
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'En attente',
              data: pendingData,
              backgroundColor: theme.palette.warning.main,
              borderColor: theme.palette.warning.dark,
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Rejetées',
              data: rejectedData,
              backgroundColor: theme.palette.error.main,
              borderColor: theme.palette.error.dark,
              borderWidth: 1,
              borderRadius: 4,
            }
          ],
        });
      } catch (err) {
        console.error('Error fetching leave request data:', err);
        setError('Impossible de charger les données des demandes de congé');
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
        Analyse des Demandes de Congé
      </Typography>
      
      {!stats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée de congé disponible
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color={theme.palette.warning.main}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  En attente
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color={theme.palette.success.main}>
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approuvées
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color={theme.palette.error.main}>
                  {stats.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejetées
                </Typography>
              </Box>
            </Box>
          </Grid>
          
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
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
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
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
              <Chip 
                label={`${stats.pending} en attente`} 
                color="warning" 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`${stats.approved} approuvées`} 
                color="success" 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`${stats.rejected} rejetées`} 
                color="error" 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default LeaveRequestAnalytics;
