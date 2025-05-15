import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  alpha,
  Button
} from '@mui/material';
import {
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  EventNote as EventNoteIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
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
        console.log("Fetched employees:", employees);

        if (employees.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }

        // Get employee IDs
        const employeeIds = employees.map(emp => emp._id);

        // Fetch tasks for these employees
        const tasksResponse = await fetch(`http://localhost:5000/api/tasks?assignedBy=${user._id}`);
        let tasks = [];

        if (tasksResponse.ok) {
          tasks = await tasksResponse.json();
          console.log("Fetched tasks:", tasks);
        }

        // Fetch leave requests
        const leaveResponse = await fetch(`http://localhost:5000/api/conges`);
        let leaveRequests = [];

        if (leaveResponse.ok) {
          const allLeaveRequests = await leaveResponse.json();
          console.log("Fetched all leave requests:", allLeaveRequests);

          // Filter for leave requests from employees under this chef
          leaveRequests = allLeaveRequests.filter(req => {
            const employeeId = req.employee && req.employee._id ? req.employee._id : req.employee;
            return employeeIds.includes(employeeId);
          });

          console.log("Filtered leave requests:", leaveRequests);
        }

        // Extract activities from tasks and leave requests
        const allActivities = [];

        // Process tasks
        tasks.forEach(task => {
          // Process comments
          if (task.comments && task.comments.length > 0) {
            task.comments.forEach(comment => {
              allActivities.push({
                type: 'comment',
                date: new Date(comment.date || comment.createdAt || task.updatedAt),
                task: task,
                user: comment.author || task.assignedTo || { firstName: 'Utilisateur', lastName: '' },
                content: comment.content || 'Commentaire'
              });
            });
          }

          // Process attachments
          if (task.attachments && task.attachments.length > 0) {
            task.attachments.forEach(attachment => {
              allActivities.push({
                type: 'file',
                date: new Date(attachment.uploadDate || task.updatedAt),
                task: task,
                user: task.assignedTo || { firstName: 'Utilisateur', lastName: '' },
                content: attachment.originalname || 'Fichier'
              });
            });
          }

          // Process status changes (using updatedAt as a proxy)
          allActivities.push({
            type: 'status',
            date: new Date(task.updatedAt || task.createdAt),
            task: task,
            user: task.assignedTo || { firstName: 'Utilisateur', lastName: '' },
            content: `Statut mis à jour: ${task.status || 'en cours'}`
          });
        });

        // Process leave requests
        leaveRequests.forEach(req => {
          allActivities.push({
            type: 'leave',
            date: new Date(req.createdAt || req.updatedAt || new Date()),
            user: req.employee || { firstName: 'Employé', lastName: '' },
            content: `Demande de congé du ${new Date(req.startDate).toLocaleDateString('fr-FR')} au ${new Date(req.endDate).toLocaleDateString('fr-FR')}`,
            status: req.status || 'pending'
          });
        });

        // If we have no real activities, just leave the list empty
        if (allActivities.length === 0) {
          console.log("No real activities found");
        }

        // Sort by date (newest first)
        const sortedActivities = allActivities
          .filter(activity => activity.date) // Filter out activities without dates
          .sort((a, b) => b.date - a.date);

        console.log("Final activities:", sortedActivities);

        // Take only the 8 most recent activities
        setActivities(sortedActivities.slice(0, 8));
      } catch (err) {
        console.error('Error fetching activities data:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format relative time
  const formatRelativeTime = (date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  // Get icon for activity type
  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case 'comment':
        return <CommentIcon />;
      case 'file':
        return <AttachFileIcon />;
      case 'status':
        return activity.task.status === 'completed' ? <CheckCircleIcon /> : <UpdateIcon />;
      case 'leave':
        return <EventNoteIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  // Get avatar background color
  const getAvatarColor = (activity) => {
    switch (activity.type) {
      case 'comment':
        return theme.palette.info.main;
      case 'file':
        return theme.palette.secondary.main;
      case 'status':
        return activity.task.status === 'completed' ? theme.palette.success.main : theme.palette.warning.main;
      case 'leave':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
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
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          fontWeight="600"
          sx={{
            color: theme.palette.text.primary,
            fontSize: '1.1rem'
          }}
        >
          Activités Récentes
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
      ) : activities.length === 0 ? (
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucune activité récente
          </Typography>
        </Box>
      ) : (
        <List
          sx={{
            width: '100%',
            p: 0,
            flexGrow: 1,
            overflow: 'auto',
            maxHeight: 400,
            '& .MuiListItem-root': {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                transform: 'translateY(-2px)'
              }
            }
          }}
        >
          {activities.map((activity, index) => (
            <React.Fragment key={`${activity.type}-${activity.date.getTime()}-${index}`}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  py: 1.5,
                  px: 1,
                  borderRadius: 2,
                  display: 'flex'
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: alpha(getAvatarColor(activity), 0.1),
                      color: getAvatarColor(activity)
                    }}
                  >
                    {getActivityIcon(activity)}
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle2" component="span" fontWeight="medium">
                      {activity.user ?
                        `${activity.user.firstName || ''} ${activity.user.lastName || ''}` :
                        'Utilisateur'}
                    </Typography>

                    {activity.type === 'comment' && (
                      <Chip
                        label="Commentaire"
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}

                    {activity.type === 'file' && (
                      <Chip
                        label="Fichier"
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}

                    {activity.type === 'status' && (
                      <Chip
                        label="Statut"
                        size="small"
                        color={activity.task && activity.task.status === 'completed' ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}

                    {activity.type === 'leave' && (
                      <Chip
                        label="Congé"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}

                    <Box
                      component="span"
                      sx={{
                        ml: 'auto',
                        fontSize: '0.75rem',
                        color: theme.palette.text.secondary
                      }}
                    >
                      {formatRelativeTime(activity.date)}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 0.5 }}>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.85rem',
                        color: theme.palette.text.secondary,
                        display: 'block'
                      }}
                    >
                      {activity.content}
                    </Box>

                    {activity.task && (
                      <Box
                        component="span"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          fontSize: '0.75rem',
                          color: theme.palette.text.secondary
                        }}
                      >
                        Tâche: {activity.task.title}
                      </Box>
                    )}

                    {activity.type === 'leave' && (
                      <Chip
                        label={
                          activity.status === 'approved' ? 'Approuvé' :
                          activity.status === 'rejected' ? 'Rejeté' : 'En attente'
                        }
                        size="small"
                        color={
                          activity.status === 'approved' ? 'success' :
                          activity.status === 'rejected' ? 'error' : 'warning'
                        }
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </ListItem>
              {index < activities.length - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
            </React.Fragment>
          ))}
        </List>
      )}


    </Card>
  );
};

export default RecentActivities;
