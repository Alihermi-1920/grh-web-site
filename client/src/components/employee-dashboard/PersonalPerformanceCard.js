import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  Grid,
  alpha,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const StatCard = ({ icon, title, value, subtitle, color, trend }) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend > 0) {
      return <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
    } else if (trend < 0) {
      return <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
    } else {
      return <TrendingFlatIcon sx={{ color: theme.palette.grey[500], fontSize: 16 }} />;
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold" color={color}>
            {value}
          </Typography>
          {getTrendIcon()}
        </Box>
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

const PersonalPerformanceCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);

        // Fetch all evaluations
        const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat`);

        if (!evaluationsResponse.ok) {
          throw new Error('Failed to fetch evaluation data');
        }

        const allEvaluations = await evaluationsResponse.json();
        console.log("Fetched all evaluations:", allEvaluations);

        // Filter evaluations for current user
        const userEvaluations = allEvaluations.filter(evaluation => {
          const evalEmployeeId = evaluation.employeeId && evaluation.employeeId._id
            ? evaluation.employeeId._id
            : evaluation.employeeId;

          return evalEmployeeId === user._id;
        });

        console.log("User evaluations:", userEvaluations);

        if (userEvaluations.length === 0) {
          setStats({
            averageScore: 0,
            rank: 'N/A',
            trend: 0,
            evaluationCount: 0,
            lastEvaluationDate: null,
            highestScore: 0,
            lowestScore: 0
          });
          setLoading(false);
          return;
        }

        // Sort evaluations by date (newest first)
        userEvaluations.sort((a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );

        // Calculate average score
        const totalScore = userEvaluations.reduce((sum, evaluation) => sum + (evaluation.globalScore || 0), 0);
        const averageScore = totalScore / userEvaluations.length;

        // Calculate trend (compare last two evaluations)
        let trend = 0;
        if (userEvaluations.length >= 2) {
          const latestScore = userEvaluations[0].globalScore || 0;
          const previousScore = userEvaluations[1].globalScore || 0;
          trend = latestScore - previousScore;
        }

        // Calculate highest and lowest scores
        const scores = userEvaluations.map(evaluation => evaluation.globalScore || 0);
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);

        // Calculate rank
        // Group all evaluations by employee and calculate average scores
        const employeeScores = {};

        allEvaluations.forEach(evaluation => {
          const employeeId = evaluation.employeeId && evaluation.employeeId._id
            ? evaluation.employeeId._id
            : evaluation.employeeId;

          if (!employeeId) return;

          if (!employeeScores[employeeId]) {
            employeeScores[employeeId] = {
              totalScore: 0,
              count: 0
            };
          }

          employeeScores[employeeId].totalScore += evaluation.globalScore || 0;
          employeeScores[employeeId].count += 1;
        });

        // Calculate average scores for each employee
        const averageScores = Object.entries(employeeScores).map(([employeeId, data]) => ({
          employeeId,
          averageScore: data.count > 0 ? data.totalScore / data.count : 0
        }));

        // Sort by average score (highest first)
        averageScores.sort((a, b) => b.averageScore - a.averageScore);

        // Find current user's rank
        const userRank = averageScores.findIndex(item => item.employeeId === user._id) + 1;

        setStats({
          averageScore: averageScore,
          rank: userRank,
          trend: trend,
          evaluationCount: userEvaluations.length,
          lastEvaluationDate: new Date(userEvaluations[0].date || userEvaluations[0].createdAt),
          highestScore: highestScore,
          lowestScore: lowestScore
        });
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setStats({
          averageScore: 0,
          rank: 'N/A',
          trend: 0,
          evaluationCount: 0,
          lastEvaluationDate: null,
          highestScore: 0,
          lowestScore: 0
        });
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
      <Typography
        variant="h6"
        fontWeight="600"
        sx={{
          color: theme.palette.text.primary,
          fontSize: '1.1rem',
          mb: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <AssessmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        Votre Performance
      </Typography>

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
          <Grid item xs={12} sm={6}>
            <StatCard
              icon={<StarIcon />}
              title="Score Moyen"
              value={stats.averageScore.toFixed(1)}
              subtitle="sur 20 points"
              color={theme.palette.primary.main}
              trend={stats.trend}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StatCard
              icon={<TrophyIcon />}
              title="Classement"
              value={stats.rank === 'N/A' ? 'N/A' : `${stats.rank}${stats.rank === 1 ? 'er' : 'ème'}`}
              subtitle={`sur ${Object.keys(stats).length} employés`}
              color={theme.palette.secondary.main}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StatCard
              icon={<SpeedIcon />}
              title="Meilleur Score"
              value={stats.highestScore.toFixed(1)}
              subtitle="sur 20 points"
              color={theme.palette.success.main}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Tooltip title={stats.lastEvaluationDate ? `Dernière évaluation: ${stats.lastEvaluationDate.toLocaleDateString('fr-FR')}` : ''}>
              <Box sx={{ height: '100%' }}>
                <StatCard
                  icon={<AssessmentIcon />}
                  title="Évaluations"
                  value={stats.evaluationCount}
                  subtitle={stats.lastEvaluationDate ? `Dernière: ${stats.lastEvaluationDate.toLocaleDateString('fr-FR')}` : 'Aucune évaluation'}
                  color="#9C27B0" // Purple
                />
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default PersonalPerformanceCard;
