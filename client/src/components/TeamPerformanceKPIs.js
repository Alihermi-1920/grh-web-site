import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EventBusy as EventBusyIcon,
  Speed as SpeedIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const TeamPerformanceKPIs = () => {
  const [kpis, setKpis] = useState(null);
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
          setKpis(null);
          setLoading(false);
          return;
        }

        // Get employee IDs
        const employeeIds = employees.map(emp => emp._id);

        // Fetch tasks for these employees
        const tasksResponse = await fetch(`http://localhost:5000/api/tasks?assignedBy=${user._id}`);

        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks data');
        }

        const tasks = await tasksResponse.json();

        // Filter tasks for employees under this chef
        const filteredTasks = tasks.filter(task =>
          employeeIds.includes(task.assignedTo?._id || task.assignedTo)
        );

        // Fetch evaluation results
        const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat/chef/${user._id}`);
        let evaluations = [];

        if (evaluationsResponse.ok) {
          evaluations = await evaluationsResponse.json();
        }

        // Fetch leave requests
        const leaveResponse = await fetch(`http://localhost:5000/api/conges/chef/${user._id}`);
        let leaveRequests = [];

        if (leaveResponse.ok) {
          leaveRequests = await leaveResponse.json();

          // Filter for employees under this chef
          leaveRequests = leaveRequests.filter(req =>
            employeeIds.includes(req.employee._id || req.employee)
          );
        }

        // Calculate KPIs

        // 1. Task completion rate
        const totalTasks = filteredTasks.length;
        const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // 2. On-time completion rate
        const completedOnTime = filteredTasks.filter(task => {
          if (task.status !== 'completed') return false;

          const completedDate = new Date(task.updatedAt);
          const deadlineDate = new Date(task.deadline);

          return completedDate <= deadlineDate;
        }).length;

        const onTimeRate = completedTasks > 0 ? (completedOnTime / completedTasks) * 100 : 0;

        // 3. Average task duration (in days)
        const tasksWithDuration = filteredTasks.filter(task =>
          task.status === 'completed' && task.createdAt && task.updatedAt
        );

        let avgTaskDuration = 0;

        if (tasksWithDuration.length > 0) {
          const totalDuration = tasksWithDuration.reduce((sum, task) => {
            const createdDate = new Date(task.createdAt);
            const completedDate = new Date(task.updatedAt);
            const durationMs = completedDate - createdDate;
            const durationDays = durationMs / (1000 * 60 * 60 * 24);
            return sum + durationDays;
          }, 0);

          avgTaskDuration = totalDuration / tasksWithDuration.length;
        }

        // 4. Average evaluation score
        let avgEvaluationScore = 0;

        if (evaluations.length > 0) {
          const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
          avgEvaluationScore = totalScore / evaluations.length;
        }

        // 5. Team availability
        const currentDate = new Date();
        const employeesOnLeave = leaveRequests.filter(req => {
          if (req.status !== 'approved') return false;

          const startDate = new Date(req.startDate);
          const endDate = new Date(req.endDate);

          return currentDate >= startDate && currentDate <= endDate;
        }).length;

        const teamAvailability = employees.length > 0
          ? ((employees.length - employeesOnLeave) / employees.length) * 100
          : 0;

        // 6. Blocked tasks percentage
        const blockedTasks = filteredTasks.filter(task =>
          task.status === 'blocked' || task.status === 'on-hold'
        ).length;

        const blockedTasksRate = totalTasks > 0 ? (blockedTasks / totalTasks) * 100 : 0;

        // 7. Active projects count
        const projectIds = [...new Set(filteredTasks.map(task =>
          task.project?._id || task.project
        ).filter(id => id))];

        const activeProjectsCount = projectIds.length;

        // 8. Tasks per employee
        const tasksPerEmployee = employees.length > 0 ? totalTasks / employees.length : 0;

        setKpis({
          taskCompletionRate,
          onTimeRate,
          avgTaskDuration,
          avgEvaluationScore,
          teamAvailability,
          blockedTasksRate,
          activeProjectsCount,
          tasksPerEmployee,
          totalEmployees: employees.length,
          totalTasks
        });
      } catch (err) {
        console.error('Error fetching KPI data:', err);
        setError('Impossible de charger les indicateurs de performance');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
        Indicateurs de Performance d'Équipe
      </Typography>

      {!kpis ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée de performance disponible
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                <Typography variant="body2" fontWeight="medium">
                  Taux de complétion des tâches
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {kpis.taskCompletionRate.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={kpis.taskCompletionRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.success.main
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {kpis.completedTasks} tâches terminées sur {kpis.totalTasks}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                <Typography variant="body2" fontWeight="medium">
                  Taux de complétion à temps
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {kpis.onTimeRate.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={kpis.onTimeRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.warning.main
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <GroupIcon sx={{ color: theme.palette.primary.main, fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {kpis.totalEmployees}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Employés
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <AssignmentIcon sx={{ color: theme.palette.secondary.main, fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {kpis.activeProjectsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Projets actifs
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <StarIcon sx={{ color: theme.palette.info.main, fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {kpis.avgEvaluationScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Score moyen
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <SpeedIcon sx={{ color: theme.palette.error.main, fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {kpis.avgTaskDuration.toFixed(1)}j
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Durée moyenne
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="body2" fontWeight="medium">
                  Disponibilité de l'équipe
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {kpis.teamAvailability.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={kpis.teamAvailability}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.primary.main
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EventBusyIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                <Typography variant="body2" fontWeight="medium">
                  Tâches bloquées
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {kpis.blockedTasksRate.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={kpis.blockedTasksRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.error.main
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default TeamPerformanceKPIs;
