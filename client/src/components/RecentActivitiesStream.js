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
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Button
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const RecentActivitiesStream = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);

        // Fetch activities data for this chef
        const response = await fetch(`http://localhost:5000/api/dashboard/chef/${user._id}/activities`);

        if (!response.ok) {
          throw new Error('Failed to fetch activities data');
        }

        const activitiesData = await response.json();

        if (activitiesData.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }

        // Convert date strings to Date objects
        const processedActivities = activitiesData.map(activity => ({
          ...activity,
          date: new Date(activity.date)
        }));

        // Take only the 10 most recent activities
        setActivities(processedActivities.slice(0, 10));
      } catch (err) {
        console.error('Error fetching activities data:', err);
        setError('Impossible de charger les activités récentes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? 'hier' : `il y a ${diffDay} jours`;
    }
    if (diffHour > 0) {
      return `il y a ${diffHour} h`;
    }
    if (diffMin > 0) {
      return `il y a ${diffMin} min`;
    }
    return 'à l\'instant';
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
        return <AssignmentIcon />;
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
        Activités Récentes
      </Typography>

      {activities.length === 0 ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
          flexGrow: 1
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucune activité récente
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', p: 0, flexGrow: 1, maxHeight: 400, overflow: 'auto' }}>
          {activities.map((activity, index) => (
            <React.Fragment key={`${activity.type}-${activity.date.getTime()}-${index}`}>
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
                  <Avatar sx={{ bgcolor: getAvatarColor(activity) }}>
                    {getActivityIcon(activity)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle2" component="span">
                        {activity.user ? `${activity.user.firstName || ''} ${activity.user.lastName || ''}` : 'Utilisateur'}
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
                          color={activity.task.status === 'completed' ? 'success' : 'warning'}
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

                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatRelativeTime(activity.date)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {activity.content}
                      </Typography>

                      {activity.task && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Tâche: {activity.task.title}
                        </Typography>
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
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      <Button
        variant="text"
        color="primary"
        endIcon={<ArrowForwardIcon />}
        sx={{ alignSelf: 'flex-end', mt: 1 }}
        onClick={() => window.location.href = '/chef-dashboard'}
      >
        Voir toutes les activités
      </Button>
    </Paper>
  );
};

export default RecentActivitiesStream;
