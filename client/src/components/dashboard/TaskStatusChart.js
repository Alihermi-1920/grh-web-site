import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  useTheme,
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const TaskStatusChart = () => {
  const [chartData, setChartData] = useState(null);
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    inProgress: 0,
    review: 0,
    completed: 0,
    blocked: 0,
    onHold: 0,
    total: 0
  });
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

        const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

        // Update task stats
        setTaskStats({
          pending: statusCounts['pending'],
          inProgress: statusCounts['in-progress'],
          review: statusCounts['review'],
          completed: statusCounts['completed'],
          blocked: statusCounts['blocked'],
          onHold: statusCounts['on-hold'],
          total: total
        });
      } catch (err) {
        console.error('Error fetching task data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate percentages
  const getPercentage = (value) => {
    return taskStats.total > 0 ? Math.round((value / taskStats.total) * 100) : 0;
  };

  return (
    <Card
      elevation={0}
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AssignmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          fontWeight="600"
          sx={{
            color: theme.palette.text.primary,
            fontSize: '1.1rem'
          }}
        >
          Distribution des Tâches
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      ) : taskStats.total === 0 ? (
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1
        }}>
          <AssignmentIcon sx={{ fontSize: 40, color: theme.palette.grey[400], opacity: 0.7 }} />
          <Typography variant="body1" color="text.secondary">
            Aucune tâche trouvée
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, mt: 1 }}>
          {/* Total Tasks */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3
          }}>
            <Typography
              variant="h3"
              fontWeight="bold"
              color={theme.palette.primary.main}
              sx={{
                textShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(25, 118, 210, 0.3)' : 'none',
                letterSpacing: '-1px'
              }}
            >
              {taskStats.total}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ ml: 1, mt: 1.5 }}
            >
              tâches
            </Typography>
          </Box>

          {/* Task Distribution Bars */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Pending Tasks */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">En attente</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {taskStats.pending}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({getPercentage(taskStats.pending)}%)
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  height: 24,
                  width: '100%',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${getPercentage(taskStats.pending)}%`,
                    bgcolor: theme.palette.warning.main,
                    transition: 'width 1s ease-in-out'
                  }}
                />
              </Box>
            </Box>

            {/* In Progress Tasks */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">En cours</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {taskStats.inProgress}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({getPercentage(taskStats.inProgress)}%)
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  height: 24,
                  width: '100%',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${getPercentage(taskStats.inProgress)}%`,
                    bgcolor: theme.palette.info.main,
                    transition: 'width 1s ease-in-out'
                  }}
                />
              </Box>
            </Box>

            {/* Review Tasks */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">En révision</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {taskStats.review}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({getPercentage(taskStats.review)}%)
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  height: 24,
                  width: '100%',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${getPercentage(taskStats.review)}%`,
                    bgcolor: theme.palette.secondary.main,
                    transition: 'width 1s ease-in-out'
                  }}
                />
              </Box>
            </Box>

            {/* Completed Tasks */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">Terminé</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {taskStats.completed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({getPercentage(taskStats.completed)}%)
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  height: 24,
                  width: '100%',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${getPercentage(taskStats.completed)}%`,
                    bgcolor: theme.palette.success.main,
                    transition: 'width 1s ease-in-out'
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default TaskStatusChart;
