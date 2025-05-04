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
  Chip,
  Divider,
  Avatar,
  ListItemAvatar,
  Button,
  alpha
} from '@mui/material';
import {
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const DeadlineTracker = () => {
  const [tasks, setTasks] = useState([]);
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

        const allTasks = await response.json();

        // Filter incomplete tasks
        const incompleteTasks = allTasks.filter(task =>
          task.status !== 'completed' && task.deadline
        );

        // Sort by deadline (closest first)
        const sortedTasks = incompleteTasks.sort((a, b) =>
          new Date(a.deadline) - new Date(b.deadline)
        );

        // Take only the next 5 tasks
        setTasks(sortedTasks.slice(0, 5));
      } catch (err) {
        console.error('Error fetching deadline data:', err);
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
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
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
        <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          fontWeight="600"
          sx={{
            color: theme.palette.text.primary,
            fontSize: '1.1rem'
          }}
        >
          Échéances à Venir
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
          <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main, opacity: 0.7 }} />
          <Typography variant="body1" color="text.secondary">
            Aucune échéance à venir
          </Typography>
        </Box>
      ) : (
        <List
          sx={{
            width: '100%',
            p: 0,
            flexGrow: 1,
            overflow: 'auto',
            '& .MuiListItem-root': {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                transform: 'translateY(-2px)'
              }
            }
          }}
        >
          {tasks.map((task, index) => {
            const { diffDays, status } = getDeadlineInfo(task.deadline);

            return (
              <React.Fragment key={task._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    py: 1.5,
                    px: 1,
                    borderRadius: 2
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          status === 'overdue' ? alpha(theme.palette.error.main, 0.1) :
                          status === 'urgent' ? alpha(theme.palette.warning.main, 0.1) :
                          alpha(theme.palette.success.light, 0.1),
                        color:
                          status === 'overdue' ? theme.palette.error.main :
                          status === 'urgent' ? theme.palette.warning.main :
                          theme.palette.success.main
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
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        noWrap
                        sx={{ maxWidth: '100%' }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Box
                            component="span"
                            sx={{
                              mr: 1,
                              fontSize: '0.8rem',
                              color: theme.palette.text.secondary
                            }}
                          >
                            {formatDate(task.deadline)}
                          </Box>
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
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            fontSize: '0.8rem',
                            color: theme.palette.text.secondary,
                            display: 'block'
                          }}
                        >
                          {task.assignedTo ?
                            `${task.assignedTo.firstName} ${task.assignedTo.lastName}` :
                            'Non assigné'}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < tasks.length - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
              </React.Fragment>
            );
          })}
        </List>
      )}

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
        onClick={() => window.location.href = '/chef-dashboard/tasks'}
      >
        Voir toutes les tâches
      </Button>
    </Paper>
  );
};

export default DeadlineTracker;
