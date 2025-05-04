import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Avatar,
  ListItemAvatar,
  Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const DeadlineTracker = () => {
  const [tasks, setTasks] = useState([]);
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

        // Get upcoming deadlines and overdue tasks
        const upcomingTasks = dashboardData.upcomingDeadlines || [];
        const overdueTasks = dashboardData.overdueTasks || [];

        // Combine and sort by deadline (closest first)
        const combinedTasks = [...upcomingTasks, ...overdueTasks].sort((a, b) =>
          new Date(a.deadline) - new Date(b.deadline)
        );

        // Take only the next 5 tasks
        setTasks(combinedTasks.slice(0, 5));
      } catch (err) {
        console.error('Error fetching deadline data:', err);
        setError('Impossible de charger les données des échéances');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Function to calculate days remaining and status
  const getDeadlineInfo = (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'on-time';
    if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 2) {
      status = 'urgent';
    }

    return { diffDays, status };
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

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
        },
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" fontWeight="600" gutterBottom>
        Suivi des Échéances
      </Typography>

      {tasks.length === 0 ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
          flexGrow: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucune tâche avec échéance à venir
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', p: 0, flexGrow: 1 }}>
          {tasks.map((task, index) => {
            const { diffDays, status } = getDeadlineInfo(task.deadline);

            return (
              <React.Fragment key={task._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    py: 1.5,
                    px: 0,
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          status === 'overdue' ? theme.palette.error.main :
                          status === 'urgent' ? theme.palette.warning.main :
                          theme.palette.success.light
                      }}
                    >
                      {status === 'overdue' ? (
                        <WarningIcon />
                      ) : status === 'urgent' ? (
                        <AccessTimeIcon />
                      ) : (
                        <CheckCircleIcon />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap sx={{ maxWidth: '100%' }}>
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mr: 1 }}
                          >
                            Échéance: {formatDate(task.deadline)}
                          </Typography>
                          <Chip
                            label={
                              status === 'overdue' ? 'En retard' :
                              status === 'urgent' ? 'Urgent' : 'À temps'
                            }
                            size="small"
                            color={
                              status === 'overdue' ? 'error' :
                              status === 'urgent' ? 'warning' : 'success'
                            }
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Assigné à: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < tasks.length - 1 && <Divider component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      )}

      <Button
        variant="text"
        color="primary"
        endIcon={<ArrowForwardIcon />}
        sx={{ alignSelf: 'flex-end', mt: 1 }}
        onClick={() => window.location.href = '/chef-dashboard'}
      >
        Voir toutes les tâches
      </Button>
    </Paper>
  );
};

export default DeadlineTracker;
