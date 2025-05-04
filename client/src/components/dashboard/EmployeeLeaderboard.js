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
  Tooltip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Work as WorkIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const EmployeeLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Function to create a test evaluation for demonstration
  const createTestEvaluation = async () => {
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
        alert('No employees found to evaluate');
        setLoading(false);
        return;
      }

      // Select a random employee
      const randomEmployee = employees[Math.floor(Math.random() * employees.length)];

      // Create a random score between 3 and 5
      const randomScore = (3 + Math.random() * 2).toFixed(1);

      // Create test evaluation data
      const evaluationData = {
        employeeId: randomEmployee._id,
        employeeName: `${randomEmployee.firstName} ${randomEmployee.lastName}`,
        chapterScores: {
          "Performance": parseFloat(randomScore),
          "Communication": parseFloat(randomScore),
          "Teamwork": parseFloat(randomScore),
          "Initiative": parseFloat(randomScore)
        },
        chapterComments: {
          "Performance": "Bon travail",
          "Communication": "Communication efficace",
          "Teamwork": "Bon esprit d'équipe",
          "Initiative": "Prend des initiatives"
        },
        globalScore: parseFloat(randomScore),
        periode: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`
      };

      // Send the evaluation to the server
      const response = await fetch('http://localhost:5000/api/evaluationresultat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evaluationData)
      });

      if (response.ok) {
        alert(`Évaluation créée pour ${randomEmployee.firstName} ${randomEmployee.lastName} avec un score de ${randomScore}`);
        // Refresh the leaderboard
        handleRefresh();
      } else {
        const errorData = await response.json();
        alert(`Erreur lors de la création de l'évaluation: ${errorData.message || response.statusText}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating test evaluation:', error);
      alert(`Erreur: ${error.message}`);
      setLoading(false);
    }
  };

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
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Fetch all evaluation results directly
        let evaluations = [];
        let useRealData = false;

        try {
          // Fetch all evaluation results
          const evaluationsResponse = await fetch(`http://localhost:5000/api/evaluationresultat`);

          if (evaluationsResponse.ok) {
            evaluations = await evaluationsResponse.json();
            console.log("Successfully fetched all evaluations:", evaluations);

            // Filter evaluations for employees under this chef
            const employeeIds = employees.map(emp => emp._id);
            evaluations = evaluations.filter(evaluation =>
              employeeIds.includes(evaluation.employeeId) ||
              (evaluation.employeeId && employeeIds.includes(evaluation.employeeId._id))
            );

            useRealData = evaluations.length > 0;
            console.log("Filtered evaluations for this chef's employees:", evaluations);
          } else {
            console.log("Evaluation endpoint returned non-OK status:", evaluationsResponse.status);
          }
        } catch (error) {
          console.log("Error fetching evaluations:", error);
        }

        if (useRealData) {
          // Process real evaluation data
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
                evaluations: []
              };
            }

            // Use globalScore from the evaluation model
            employeeScores[employeeId].totalScore += evaluation.globalScore || 0;
            employeeScores[employeeId].count += 1;
            employeeScores[employeeId].evaluations.push(evaluation);
          });

          console.log("Processed employee scores:", employeeScores);

          // Calculate average scores and create leaderboard
          const leaderboardData = Object.values(employeeScores)
            .filter(item => item.employee) // Ensure employee exists
            .map(item => ({
              employee: item.employee,
              averageScore: item.count > 0 ? item.totalScore / item.count : 0,
              evaluationCount: item.count,
              lastEvaluation: item.evaluations.sort((a, b) =>
                new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
              )[0]
            }))
            .sort((a, b) => b.averageScore - a.averageScore);

          console.log("Final leaderboard data:", leaderboardData);

          setLeaderboard(leaderboardData);
        } else {
          // Use dummy data with real employee names
          console.log("Using dummy data with real employee names");

          // Create dummy scores for each employee
          const dummyLeaderboard = employees.map(employee => {
            // Generate a random score between 3.0 and 5.0
            const score = (3 + Math.random() * 2).toFixed(1);

            return {
              employee: employee,
              averageScore: parseFloat(score),
              evaluationCount: Math.floor(Math.random() * 5) + 1 // Random count between 1 and 5
            };
          });

          // Sort by score (highest first)
          dummyLeaderboard.sort((a, b) => b.averageScore - a.averageScore);

          // Take only the top 5
          setLeaderboard(dummyLeaderboard.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);

        // Fallback to completely static data if even employee fetch fails
        const staticLeaderboard = [
          {
            employee: {
              _id: '1',
              firstName: 'Sophie',
              lastName: 'Martin',
              photo: ''
            },
            averageScore: 4.8,
            evaluationCount: 5
          },
          {
            employee: {
              _id: '2',
              firstName: 'Thomas',
              lastName: 'Dubois',
              photo: ''
            },
            averageScore: 4.5,
            evaluationCount: 4
          },
          {
            employee: {
              _id: '3',
              firstName: 'Emma',
              lastName: 'Bernard',
              photo: ''
            },
            averageScore: 4.2,
            evaluationCount: 6
          },
          {
            employee: {
              _id: '4',
              firstName: 'Lucas',
              lastName: 'Petit',
              photo: ''
            },
            averageScore: 3.9,
            evaluationCount: 3
          },
          {
            employee: {
              _id: '5',
              firstName: 'Chloé',
              lastName: 'Moreau',
              photo: ''
            },
            averageScore: 3.7,
            evaluationCount: 4
          }
        ];

        setLeaderboard(staticLeaderboard);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, refreshKey]);

  // Function to get medal color based on rank
  const getMedalColor = (index) => {
    switch (index) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return theme.palette.grey[400];
    }
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrophyIcon sx={{ mr: 1, color: '#FFD700' }} />
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              color: theme.palette.text.primary,
              fontSize: '1.1rem'
            }}
          >
            Classement des Employés
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <Box
            onClick={handleRefresh}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 1,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <RefreshIcon
              sx={{
                fontSize: '1.2rem',
                color: theme.palette.primary.main,
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)'
                  },
                  '100%': {
                    transform: 'rotate(360deg)'
                  }
                }
              }}
            />
          </Box>
        </Tooltip>
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
          {leaderboard.map((item, index) => (
            <React.Fragment key={item.employee._id}>
              <ListItem
                sx={{
                  py: 1.5,
                  px: 1,
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': index < 3 ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: getMedalColor(index)
                  } : {}
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={item.employee.photo}
                    alt={`${item.employee.firstName} ${item.employee.lastName}`}
                    sx={{
                      border: index < 3 ? `2px solid ${getMedalColor(index)}` : 'none',
                      width: 45,
                      height: 45
                    }}
                  >
                    {item.employee.firstName?.[0]}{item.employee.lastName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {index + 1}. {item.employee.firstName} {item.employee.lastName}
                      </Typography>
                      {index < 3 && (
                        <Chip
                          label={index === 0 ? '1er' : index === 1 ? '2ème' : '3ème'}
                          size="small"
                          sx={{
                            ml: 1,
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: alpha(getMedalColor(index), 0.2),
                            color: index === 0 ? '#B7950B' : index === 1 ? '#707B7C' : '#A04000',
                            fontWeight: 'bold'
                          }}
                        />
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
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      color: getMedalColor(index),
                      textShadow: index < 3 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {item.averageScore.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    sur 20
                  </Typography>
                </Box>
              </ListItem>
              {index < leaderboard.length - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default EmployeeLeaderboard;
