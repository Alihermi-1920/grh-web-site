import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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
  Legend
);

const EvaluationScoreTrends = () => {
  const [chartData, setChartData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user || !user._id) return;

      try {
        // Fetch employees under this chef
        const response = await fetch(`http://localhost:5000/api/employees/chef/${user._id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch employees data');
        }

        const employeesData = await response.json();
        setEmployees(employeesData);

        // Set default selected employee if available
        if (employeesData.length > 0) {
          setSelectedEmployee(employeesData[0]._id);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Impossible de charger les données des employés');
      }
    };

    fetchEmployees();
  }, [user]);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      if (!user || !user._id || (selectedEmployee === 'all' && employees.length === 0)) return;

      try {
        setLoading(true);

        // Fetch evaluation results
        let url = `http://localhost:5000/api/evaluationresultat/chef/${user._id}`;
        if (selectedEmployee !== 'all') {
          url = `http://localhost:5000/api/evaluationresultat/employee/${selectedEmployee}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch evaluation data');
        }

        const evaluations = await response.json();

        if (evaluations.length === 0) {
          setChartData(null);
          setLoading(false);
          return;
        }

        // Process evaluation data
        let processedData;

        if (selectedEmployee === 'all') {
          // Group by month and calculate average for all employees
          const groupedByMonth = {};

          evaluations.forEach(evaluation => {
            const date = new Date(evaluation.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

            if (!groupedByMonth[monthYear]) {
              groupedByMonth[monthYear] = {
                total: 0,
                count: 0,
                month: date.getMonth(),
                year: date.getFullYear()
              };
            }

            groupedByMonth[monthYear].total += evaluation.score;
            groupedByMonth[monthYear].count += 1;
          });

          // Calculate averages and sort by date
          const monthlyAverages = Object.entries(groupedByMonth)
            .map(([key, data]) => ({
              monthYear: key,
              average: data.total / data.count,
              month: data.month,
              year: data.year
            }))
            .sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return a.month - b.month;
            });

          processedData = {
            labels: monthlyAverages.map(item => {
              const date = new Date(item.year, item.month);
              return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            }),
            datasets: [
              {
                label: 'Score moyen d\'évaluation',
                data: monthlyAverages.map(item => item.average.toFixed(1)),
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main,
                tension: 0.3,
                pointBackgroundColor: theme.palette.primary.main,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
              }
            ]
          };
        } else {
          // Filter evaluations for the selected employee
          const employeeEvals = evaluations.filter(evaluation =>
            evaluation.employee === selectedEmployee ||
            (evaluation.employee && evaluation.employee._id === selectedEmployee)
          );

          // Sort by date
          const sortedEvals = employeeEvals.sort((a, b) =>
            new Date(a.date) - new Date(b.date)
          );

          // Get employee name
          const employeeName = employees.find(emp => emp._id === selectedEmployee)?.firstName || 'Employé';

          processedData = {
            labels: sortedEvals.map(evaluation =>
              new Date(evaluation.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
            ),
            datasets: [
              {
                label: `Score d'évaluation de ${employeeName}`,
                data: sortedEvals.map(evaluation => evaluation.score),
                borderColor: theme.palette.secondary.main,
                backgroundColor: theme.palette.secondary.main,
                tension: 0.3,
                pointBackgroundColor: theme.palette.secondary.main,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
              }
            ]
          };
        }

        setChartData(processedData);
      } catch (err) {
        console.error('Error fetching evaluation data:', err);
        setError('Impossible de charger les données d\'évaluation');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationData();
  }, [user, selectedEmployee, employees, theme]);

  const handleEmployeeChange = (event) => {
    setSelectedEmployee(event.target.value);
  };

  if (loading && !chartData) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="600">
          Tendances des Évaluations
        </Typography>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="employee-select-label">Employé</InputLabel>
          <Select
            labelId="employee-select-label"
            id="employee-select"
            value={selectedEmployee}
            label="Employé"
            onChange={handleEmployeeChange}
          >
            <MenuItem value="all">Tous les employés</MenuItem>
            {employees.map(employee => (
              <MenuItem key={employee._id} value={employee._id}>
                {employee.firstName} {employee.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!chartData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée d'évaluation disponible
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: 250, position: 'relative' }}>
          <Line
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
                      return `${label}: ${value}/5`;
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
                  max: 5,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default EvaluationScoreTrends;
