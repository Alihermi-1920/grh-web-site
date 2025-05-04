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
  ListItemAvatar,
  Avatar,
  Divider,
  alpha,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Remove as NeutralIcon,
  Whatshot as HotstreakIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const MotivationalLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);

        // Fetch all evaluation results
        const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat`);

        if (!evaluationsResponse.ok) {
          throw new Error('Failed to fetch evaluation data');
        }

        const evaluations = await evaluationsResponse.json();
        console.log("Fetched evaluations:", evaluations);

        // Fetch all employees
        const employeesResponse = await fetch(`http://localhost:5000/api/employees`);

        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees data');
        }

        const employees = await employeesResponse.json();
        console.log("Fetched employees:", employees);

        // Group evaluations by employee and calculate average score
        const employeeScores = {};

        evaluations.forEach(evaluation => {
          // Handle both populated and non-populated employeeId
          const employeeId = evaluation.employeeId && evaluation.employeeId._id
            ? evaluation.employeeId._id
            : evaluation.employeeId;

          if (!employeeId) {
            console.log("Skipping evaluation with no employeeId:", evaluation);
            return;
          }

          if (!employeeScores[employeeId]) {
            // Find the employee either from the populated data or from our employees list
            const employee = evaluation.employeeId && evaluation.employeeId.firstName
              ? evaluation.employeeId
              : employees.find(emp => emp._id === employeeId);

            if (!employee) {
              console.log("Could not find employee for ID:", employeeId);
              return;
            }

            employeeScores[employeeId] = {
              employee: employee,
              totalScore: 0,
              count: 0,
              evaluations: [],
              previousRank: null,
              streak: 0
            };
          }

          // Use globalScore from the evaluation model
          employeeScores[employeeId].totalScore += evaluation.globalScore || 0;
          employeeScores[employeeId].count += 1;
          employeeScores[employeeId].evaluations.push(evaluation);
        });

        // Calculate average scores and create leaderboard
        let leaderboardData = Object.values(employeeScores)
          .filter(item => item.employee) // Ensure employee exists
          .map(item => ({
            employee: item.employee,
            averageScore: item.count > 0 ? item.totalScore / item.count : 0,
            evaluationCount: item.count,
            lastEvaluation: item.evaluations.sort((a, b) =>
              new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
            )[0],
            previousRank: item.previousRank,
            streak: item.streak
          }))
          .sort((a, b) => b.averageScore - a.averageScore);

        // Add rank information
        leaderboardData = leaderboardData.map((item, index) => ({
          ...item,
          rank: index + 1,
          // Simulate rank change (in a real app, you'd store previous ranks in the database)
          rankChange: Math.random() > 0.7
            ? Math.floor(Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1)
            : 0,
          // Simulate streak (in a real app, this would be calculated from historical data)
          streak: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0
        }));

        // Find current user's rank
        const currentUserRank = leaderboardData.find(
          item => item.employee && item.employee._id === user._id
        );

        if (currentUserRank) {
          setUserRank(currentUserRank);
        }

        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Function to get rating stars
  const getRatingStars = (score) => {
    // Ensure score is a valid number
    const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;

    // Convert score from 20 to 5 scale
    const scoreOutOf5 = (validScore / 20) * 5;

    // Calculate stars
    const fullStars = Math.floor(scoreOutOf5);
    const hasHalfStar = scoreOutOf5 - fullStars >= 0.5;
    const maxStars = 5;

    // Calculate empty stars (ensure it's not negative)
    const emptyStars = Math.max(0, maxStars - fullStars - (hasHalfStar ? 1 : 0));

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, i) => (
          <StarIcon key={`full-${i}`} sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
        ))}

        {/* Half star if needed */}
        {hasHalfStar && (
          <StarIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, i) => (
          <StarBorderIcon key={`empty-${i}`} sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
        ))}
      </Box>
    );
  };

  // Function to get medal color based on rank
  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return theme.palette.grey[400];
    }
  };

  // Function to get rank change icon and color
  const getRankChangeDisplay = (change) => {
    if (change > 0) {
      return {
        icon: <ArrowUpwardIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />,
        text: `+${change}`,
        color: theme.palette.success.main
      };
    } else if (change < 0) {
      return {
        icon: <ArrowDownwardIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />,
        text: `${change}`,
        color: theme.palette.error.main
      };
    } else {
      return {
        icon: <NeutralIcon sx={{ fontSize: 14, color: theme.palette.grey[500] }} />,
        text: '0',
        color: theme.palette.grey[500]
      };
    }
  };

  // Calculate progress to next rank for the current user
  const getProgressToNextRank = () => {
    if (!userRank || userRank.rank === 1) return 100; // Already at the top

    const currentScore = userRank.averageScore;
    const nextRankEmployee = leaderboard.find(item => item.rank === userRank.rank - 1);

    if (!nextRankEmployee) return 100;

    const nextRankScore = nextRankEmployee.averageScore;
    const prevRankEmployee = leaderboard.find(item => item.rank === userRank.rank + 1);
    const prevRankScore = prevRankEmployee ? prevRankEmployee.averageScore : 0;

    // Calculate progress percentage
    const totalGap = nextRankScore - prevRankScore;
    const userProgress = currentScore - prevRankScore;

    return Math.min(100, Math.max(0, (userProgress / totalGap) * 100));
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
        <TrophyIcon sx={{ mr: 1, color: '#FFD700' }} />
        <Typography
          variant="h6"
          fontWeight="600"
          sx={{
            color: theme.palette.text.primary,
            fontSize: '1.1rem'
          }}
        >
          Classement des Performances
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
      ) : leaderboard.length === 0 ? (
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1
        }}>
          <PersonIcon sx={{ fontSize: 40, color: theme.palette.grey[400], opacity: 0.7 }} />
          <Typography variant="body1" color="text.secondary">
            Aucune évaluation trouvée
          </Typography>
        </Box>
      ) : (
        <>
          {/* User's current rank card - only show if user is found in leaderboard */}
          {userRank && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={userRank.employee.photo}
                  alt={`${userRank.employee.firstName} ${userRank.employee.lastName}`}
                  sx={{
                    width: 50,
                    height: 50,
                    border: userRank.rank <= 3 ? `2px solid ${getMedalColor(userRank.rank)}` : 'none'
                  }}
                >
                  {userRank.employee.firstName?.[0]}{userRank.employee.lastName?.[0]}
                </Avatar>

                <Box sx={{ ml: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Votre Position: {userRank.rank}{userRank.rank === 1 ? 'er' : 'ème'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.9rem',
                        color: theme.palette.text.secondary
                      }}
                    >
                      Score: {userRank.averageScore.toFixed(1)}/20
                    </Box>
                    {getRatingStars(userRank.averageScore)}
                  </Box>
                </Box>

                <Box
                  sx={{
                    ml: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                  }}
                >
                  {userRank.rankChange !== 0 && (
                    <Tooltip title={userRank.rankChange > 0 ? "Progression" : "Régression"}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getRankChangeDisplay(userRank.rankChange).icon}
                        <Typography
                          variant="body2"
                          sx={{
                            color: getRankChangeDisplay(userRank.rankChange).color,
                            fontWeight: 'bold',
                            ml: 0.5
                          }}
                        >
                          {getRankChangeDisplay(userRank.rankChange).text}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}

                  {userRank.streak > 0 && (
                    <Tooltip title={`${userRank.streak} évaluations positives consécutives`}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <HotstreakIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.warning.main,
                            fontWeight: 'bold',
                            ml: 0.5
                          }}
                        >
                          {userRank.streak}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Progress to next rank */}
              {userRank.rank > 1 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progression vers le rang supérieur
                    </Typography>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      {Math.round(getProgressToNextRank())}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressToNextRank()}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Leaderboard list */}
          <List
            sx={{
              width: '100%',
              p: 0,
              flexGrow: 1,
              overflow: 'auto',
              maxHeight: userRank ? 300 : 400,
              '& .MuiListItem-root': {
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)'
                }
              }
            }}
          >
            {leaderboard.slice(0, 10).map((item) => (
              <React.Fragment key={item.employee._id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 1,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: item.employee._id === user._id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&::before': item.rank <= 3 ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      backgroundColor: getMedalColor(item.rank)
                    } : {}
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={item.employee.photo}
                      alt={`${item.employee.firstName} ${item.employee.lastName}`}
                      sx={{
                        border: item.rank <= 3 ? `2px solid ${getMedalColor(item.rank)}` : 'none',
                        width: 40,
                        height: 40
                      }}
                    >
                      {item.employee.firstName?.[0]}{item.employee.lastName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {item.rank}. {item.employee.firstName} {item.employee.lastName}
                        </Typography>
                        {item.rank <= 3 && (
                          <Chip
                            label={item.rank === 1 ? '1er' : item.rank === 2 ? '2ème' : '3ème'}
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(getMedalColor(item.rank), 0.2),
                              color: item.rank === 1 ? '#B7950B' : item.rank === 2 ? '#707B7C' : '#A04000',
                              fontWeight: 'bold'
                            }}
                          />
                        )}

                        {item.streak > 0 && (
                          <Tooltip title={`${item.streak} évaluations positives consécutives`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                              <HotstreakIcon sx={{ color: theme.palette.warning.main, fontSize: 14 }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.warning.main,
                                  fontWeight: 'bold',
                                  ml: 0.5
                                }}
                              >
                                {item.streak}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
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
                            Score: {item.averageScore.toFixed(1)}/20
                          </Box>
                          {getRatingStars(item.averageScore)}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            fontSize: '0.75rem',
                            display: 'block',
                            color: theme.palette.text.secondary
                          }}
                        >
                          {item.evaluationCount} évaluation{item.evaluationCount > 1 ? 's' : ''}
                        </Box>
                      </Box>
                    }
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 1
                    }}
                  >
                    {item.rankChange !== 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getRankChangeDisplay(item.rankChange).icon}
                        <Typography
                          variant="caption"
                          sx={{
                            color: getRankChangeDisplay(item.rankChange).color,
                            fontWeight: 'bold'
                          }}
                        >
                          {getRankChangeDisplay(item.rankChange).text}
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        color: getMedalColor(item.rank),
                        textShadow: item.rank <= 3 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {item.averageScore.toFixed(1)}
                    </Typography>
                  </Box>
                </ListItem>
                {item.rank < leaderboard.length && <Divider component="li" sx={{ opacity: 0.6 }} />}
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default MotivationalLeaderboard;
