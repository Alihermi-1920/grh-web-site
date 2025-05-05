import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  alpha,
  Chip,
  LinearProgress,
  Button,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Flag as FlagIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskProgress = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  });
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);

        // Fetch tasks assigned to this employee using the employee-specific endpoint
        const tasksResponse = await fetch(`http://localhost:5000/api/tasks/employee/${user._id}`);

        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks data');
        }

        const tasksData = await tasksResponse.json();
        console.log("Fetched tasks for employee:", tasksData);

        // Calculate task statistics
        const now = new Date();
        const completedTasks = tasksData.filter(task => task.status === 'completed');
        const inProgressTasks = tasksData.filter(task => task.status === 'in-progress');
        const overdueTasks = tasksData.filter(task =>
          task.status !== 'completed' &&
          task.deadline &&
          new Date(task.deadline) < now
        );

        setStats({
          total: tasksData.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          overdue: overdueTasks.length
        });

        // Sort tasks by deadline (closest first)
        const sortedTasks = [...tasksData].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });

        setTasks(sortedTasks);
      } catch (err) {
        console.error('Error fetching tasks data:', err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format relative time
  const formatRelativeTime = (date) => {
    if (!date) return 'Pas de date limite';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  // Get task status info
  const getTaskStatusInfo = (task) => {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;

    if (task.status === 'completed') {
      return {
        label: 'Terminée',
        color: 'success',
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
      };
    } else if (deadline && deadline < now) {
      return {
        label: 'En retard',
        color: 'error',
        icon: <WarningIcon sx={{ fontSize: 16 }} />
      };
    } else if (deadline && deadline < new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)) {
      return {
        label: 'Urgent',
        color: 'warning',
        icon: <ScheduleIcon sx={{ fontSize: 16 }} />
      };
    } else {
      return {
        label: 'En cours',
        color: 'info',
        icon: <AssignmentIcon sx={{ fontSize: 16 }} />
      };
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (stats.total === 0) return 0;
    return (stats.completed / stats.total) * 100;
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
          Vos Tâches
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
      ) : tasks.length === 0 ? (
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
            Aucune tâche assignée
          </Typography>
        </Box>
      ) : (
        <>
          {/* Task statistics */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progression globale
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stats.completed} sur {stats.total} tâches
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={getCompletionPercentage()}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${stats.completed} Terminées`}
                size="small"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<AssignmentIcon />}
                label={`${stats.inProgress} En cours`}
                size="small"
                color="info"
                variant="outlined"
              />
              <Chip
                icon={<WarningIcon />}
                label={`${stats.overdue} En retard`}
                size="small"
                color="error"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Task list */}
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              color: theme.palette.text.secondary,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FlagIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Tâches à venir
          </Typography>

          <List
            sx={{
              width: '100%',
              p: 0,
              flexGrow: 1,
              overflow: 'auto',
              maxHeight: 300,
              '& .MuiListItem-root': {
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)'
                }
              }
            }}
          >
            {tasks.slice(0, 5).map((task, index) => {
              const statusInfo = getTaskStatusInfo(task);

              return (
                <React.Fragment key={task._id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderRadius: 2
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {statusInfo.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {task.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={statusInfo.label}
                              size="small"
                              color={statusInfo.color}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />

                            <Tooltip title={task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'Pas de date limite'}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem'
                                }}
                              >
                                <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                {formatRelativeTime(task.deadline)}
                              </Box>
                            </Tooltip>
                          </Box>

                          {task.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}
                            >
                              {task.description.length > 60
                                ? `${task.description.substring(0, 60)}...`
                                : task.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < Math.min(tasks.length, 5) - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
                </React.Fragment>
              );
            })}
          </List>

          <Button
            variant="text"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            sx={{
              alignSelf: 'flex-end',
              mt: 2,
              textTransform: 'none',
              fontWeight: 'medium'
            }}
            onClick={() => window.location.href = '/employee-dashboard/tasks'}
          >
            Voir toutes les tâches
          </Button>
        </>
      )}
    </Paper>
  );
};

export default TaskProgress;
