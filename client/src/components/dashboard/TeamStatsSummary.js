import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  useTheme,
  Grid,
  alpha
} from '@mui/material';
import { 
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  EventBusy as EventBusyIcon,
  Star as StarIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const StatCard = ({ icon, title, value, subtitle, color }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        p: 2, 
        borderRadius: 3, 
        bgcolor: alpha(color, 0.1),
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 10px 20px ${alpha(color, 0.2)}`
        }
      }}
    >
      <Box 
        sx={{ 
          width: 50, 
          height: 50, 
          borderRadius: '50%', 
          bgcolor: alpha(color, 0.2),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {React.cloneElement(icon, { sx: { color: color, fontSize: 28 } })}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold" color={color}>
          {value}
        </Typography>
        <Typography variant="body2" fontWeight="medium" color={theme.palette.text.primary}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const TeamStatsSummary = () => {
  const [stats, setStats] = useState(null);
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
        
        // Fetch tasks for these employees
        const tasksResponse = await fetch(`http://localhost:5000/api/tasks?assignedBy=${user._id}`);
        
        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks data');
        }
        
        const tasks = await tasksResponse.json();
        
        // Fetch projects for this chef
        const projectsResponse = await fetch(`http://localhost:5000/api/projects?projectLeader=${user._id}`);
        
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects data');
        }
        
        const projects = await projectsResponse.json();
        
        // Fetch evaluation results
        const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat/chef/${user._id}`);
        let evaluations = [];
        
        if (evaluationsResponse.ok) {
          evaluations = await evaluationsResponse.json();
        }
        
        // Calculate statistics
        
        // 1. Employee count
        const employeeCount = employees.length;
        
        // 2. Task statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // 3. Project count
        const projectCount = projects.length;
        const activeProjects = projects.filter(project => project.status !== 'completed').length;
        
        // 4. Average evaluation score
        let avgEvaluationScore = 0;
        
        if (evaluations.length > 0) {
          const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
          avgEvaluationScore = totalScore / evaluations.length;
        }
        
        // 5. Overdue tasks
        const today = new Date();
        const overdueTasks = tasks.filter(task => 
          task.status !== 'completed' && 
          task.deadline && 
          new Date(task.deadline) < today
        ).length;
        
        // 6. Average task duration (in days)
        const tasksWithDuration = tasks.filter(task => 
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
        
        setStats({
          employeeCount,
          totalTasks,
          completedTasks,
          completionRate,
          projectCount,
          activeProjects,
          avgEvaluationScore,
          overdueTasks,
          avgTaskDuration
        });
      } catch (err) {
        console.error('Error fetching team stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
      }}
    >
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 200
        }}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      ) : !stats ? (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: 200
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucune donnée disponible
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              icon={<GroupIcon />}
              title="Employés"
              value={stats.employeeCount}
              color={theme.palette.primary.main}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              icon={<AssignmentIcon />}
              title="Projets Actifs"
              value={stats.activeProjects}
              subtitle={`sur ${stats.projectCount} projets`}
              color={theme.palette.secondary.main}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              icon={<CheckCircleIcon />}
              title="Taux de Complétion"
              value={`${stats.completionRate.toFixed(0)}%`}
              subtitle={`${stats.completedTasks} sur ${stats.totalTasks} tâches`}
              color={theme.palette.success.main}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              icon={<StarIcon />}
              title="Score Moyen"
              value={stats.avgEvaluationScore.toFixed(1)}
              subtitle="sur 5 points"
              color="#FF9800" // Orange
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              icon={<EventBusyIcon />}
              title="Tâches en Retard"
              value={stats.overdueTasks}
              color={theme.palette.error.main}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              icon={<SpeedIcon />}
              title="Durée Moyenne"
              value={`${stats.avgTaskDuration.toFixed(1)}j`}
              subtitle="par tâche"
              color="#9C27B0" // Purple
            />
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default TeamStatsSummary;
