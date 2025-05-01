import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Alert,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Avatar,
  Container,
  CssBaseline,
  Chip,
  Slide,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  Backdrop,
  Fade,
  Tooltip,
  Divider,
  Rating,
  Zoom,
  SwipeableDrawer,
  useMediaQuery,
  Stack
} from "@mui/material";
import {
  AssignmentInd,
  Grading,
  NoteAdd,
  Person,
  CheckCircle,
  ArrowBack,
  FilterList,
  StarRate,
  PictureAsPdf,
  Refresh,
  Comment,
  CalendarMonth,
  Save,
  ChevronRight,
  ChevronLeft,
  Grade,
  Dashboard,
  HelpOutline
} from "@mui/icons-material";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import format from 'date-fns/format';

const MotionContainer = motion(Box);

const Evaluation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [evaluatedEmployeeIds, setEvaluatedEmployeeIds] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [globalScore, setGlobalScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState(null);
  const [chapterComments, setChapterComments] = useState({});
  const [activeChapter, setActiveChapter] = useState(null);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const formattedPeriode = periode ? format(periode, 'yyyy-MM') : '';

  // Set default period to current month
  useEffect(() => {
    const currentDate = new Date();
    setPeriode(currentDate);
  }, []);

  // Fetch employees and evaluated employees
  useEffect(() => {
    // Trigger fade-in animation after component mounts
    setFadeIn(true);
    setError(""); // Clear any previous errors

    // Get current chef from localStorage
    const currentUser = JSON.parse(localStorage.getItem("employee") || "{}");
    const isChef = currentUser.role === "Chef";
    const chefId = currentUser._id;

    // Fetch employees data - if chef, only get their employees
    const fetchEmployees = async () => {
      try {
        let employeesData = [];

        if (isChef && chefId) {
          // Fetch only employees belonging to this chef
          const response = await fetch(`http://localhost:5000/api/employees/chef/${chefId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.status}`);
          }
          employeesData = await response.json();
        } else {
          // For admin, fetch all employees
          const response = await fetch("http://localhost:5000/api/employees");
          if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.status}`);
          }
          employeesData = await response.json();
        }

        if (!Array.isArray(employeesData)) {
          console.warn("Employees data is not an array:", employeesData);
          employeesData = [];
        }

        setEmployees(employeesData);

        // Now fetch evaluated employees for the current period
        if (periode) {
          try {
            const formattedPeriod = format(periode, 'yyyy-MM');
            let url = `http://localhost:5000/api/evaluationresultat/evaluated-employees?periode=${formattedPeriod}`;

            if (isChef && chefId) {
              url += `&chefId=${chefId}`;
            }

            const evalResponse = await fetch(url);
            if (!evalResponse.ok) {
              throw new Error(`Failed to fetch evaluated employees: ${evalResponse.status}`);
            }

            const evaluatedIds = await evalResponse.json();
            if (!Array.isArray(evaluatedIds)) {
              console.warn("Evaluated IDs is not an array:", evaluatedIds);
              setEvaluatedEmployeeIds([]);
              setFilteredEmployees(employeesData);
            } else {
              setEvaluatedEmployeeIds(evaluatedIds);

              // Filter out already evaluated employees
              const filtered = employeesData.filter(emp => {
                // Check if this employee's ID is in the evaluated IDs list
                return !evaluatedIds.some(evalId => evalId === emp._id);
              });
              setFilteredEmployees(filtered);
            }
          } catch (evalErr) {
            console.error("Error loading evaluated employees:", evalErr);
            // If we can't get evaluated employees, just show all employees
            setFilteredEmployees(employeesData);
          }
        } else {
          setFilteredEmployees(employeesData);
        }
      } catch (err) {
        console.error("Error loading employees:", err);
        setError("Error loading employees. Please try again.");
        setEmployees([]);
        setFilteredEmployees([]);
      }
    };

    fetchEmployees();
  }, [periode]);

  useEffect(() => {
    // Fetch questions data
    fetch("http://localhost:5000/api/qcm")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        if (data.length > 0) {
          const chapters = [...new Set(data.map(q => q.chapter || "Undefined"))];
          setActiveChapter(chapters[0]);
        }
      })
      .catch((err) => setError("Error loading questions"));
  }, []);

  // Group questions by chapter
  const groupedQuestions = questions.reduce((acc, q) => {
    const chap = q.chapter || "Undefined";
    if (!acc[chap]) acc[chap] = [];
    acc[chap].push(q);
    return acc;
  }, {});

  const numChapters = Object.keys(groupedQuestions).length;
  const pointsPerChapter = numChapters > 0 ? 20 / numChapters : 0;

  const handleAnswerChange = (chapter, questionId, value) => {
    setAnswers(prev => ({ ...prev, [chapter]: { ...prev[chapter], [questionId]: value } }));
  };

  const handleCommentChange = (chapter, comment) => {
    setChapterComments(prev => ({ ...prev, [chapter]: comment }));
  };

  const calculateCurrentChapterScore = (chapter) => {
    const chapterAnswers = answers[chapter] || {};
    const obtained = Object.values(chapterAnswers).reduce((a, b) => a + b, 0);
    const totalPossible = groupedQuestions[chapter]?.length * 5 || 0;
    return totalPossible > 0 ? (obtained / totalPossible) * pointsPerChapter : 0;
  };

  const calculateCompletionPercentage = (chapter) => {
    if (!groupedQuestions[chapter]) return 0;
    const answeredCount = Object.keys(answers[chapter] || {}).length;
    const totalCount = groupedQuestions[chapter].length;
    return totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  };

  const calculateOverallCompletionPercentage = () => {
    let answeredTotal = 0;
    let questionsTotal = 0;

    Object.entries(groupedQuestions).forEach(([chap, qs]) => {
      answeredTotal += Object.keys(answers[chap] || {}).length;
      questionsTotal += qs.length;
    });

    return questionsTotal > 0 ? (answeredTotal / questionsTotal) * 100 : 0;
  };

  const handleSubmit = async () => {
    setError("");

    if (!periode) {
      setError("Please select evaluation period");
      return;
    }

    const allAnswered = Object.entries(groupedQuestions).every(([chap, qs]) =>
      qs.every(q => answers[chap]?.[q._id] !== undefined)
    );

    if (!allAnswered) {
      setError("Please answer all questions before submitting");
      return;
    }

    const computedResults = {};
    let globalObtained = 0;

    Object.entries(groupedQuestions).forEach(([chapter, qs]) => {
      const totalObtained = qs.reduce((sum, q) => sum + (answers[chapter]?.[q._id] || 0), 0);
      const chapterScore = (totalObtained / (qs.length * 5)) * pointsPerChapter;
      computedResults[chapter] = parseFloat(chapterScore.toFixed(2));
      globalObtained += chapterScore;
    });

    try {
      setLoading(true);
      await fetch("http://localhost:5000/api/evaluationresultat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee._id,
          employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
          periode: formattedPeriode,
          chapterScores: computedResults,
          globalScore: parseFloat(globalObtained.toFixed(2)),
          chapterComments
        })
      });

      setResults(computedResults);
      setGlobalScore(parseFloat(globalObtained.toFixed(2)));
      setSubmitted(true);

      // Add the current employee ID to the evaluated employees list
      setEvaluatedEmployeeIds(prev => {
        if (!prev || !Array.isArray(prev)) return [selectedEmployee._id];
        return [...prev, selectedEmployee._id];
      });

      // Update the filtered employees list
      setFilteredEmployees(prev => {
        if (!prev || !Array.isArray(prev)) return [];
        return prev.filter(emp => emp._id !== selectedEmployee._id);
      });
    } catch (err) {
      setError("Error saving evaluation");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(theme.palette.primary.main);
    doc.text("Employee Evaluation Report", pageWidth/2, 20, { align: "center" });

    // Employee Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Employee: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 35);
    doc.text(`Position: ${selectedEmployee.position || 'N/A'}`, 20, 43);
    doc.text(`Department: ${selectedEmployee.department || 'N/A'}`, 20, 51);
    doc.text(`Period: ${formattedPeriode}`, 20, 59);
    doc.text(`Overall Score: ${globalScore}/20`, 20, 67);

    // Horizontal line
    doc.setDrawColor(theme.palette.primary.main);
    doc.setLineWidth(0.5);
    doc.line(20, 72, 190, 72);

    // Scores Table
    autoTable(doc, {
      startY: 77,
      head: [['Chapter', 'Score', 'Max Points', 'Performance']],
      body: Object.entries(results).map(([chap, score]) => [
        chap,
        score.toFixed(2),
        pointsPerChapter.toFixed(2),
        score >= pointsPerChapter * 0.8 ? 'Excellent' :
        score >= pointsPerChapter * 0.6 ? 'Good' : 'Needs Improvement'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [theme.palette.primary.main],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Comments Section
    let yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(theme.palette.primary.main);
    doc.text("Manager Comments:", 20, yPos);
    yPos += 10;

    Object.entries(chapterComments).forEach(([chapter, comment]) => {
      if (comment) {
        doc.setFontSize(12);
        doc.setTextColor(theme.palette.text.primary);
        doc.text(`${chapter}:`, 20, yPos);

        doc.setFontSize(10);
        doc.setTextColor(theme.palette.text.secondary);
        const splitText = doc.splitTextToSize(comment, 170);
        doc.text(splitText, 25, yPos + 8);
        yPos += splitText.length * 5 + 20;

        // Don't draw the last line
        if (yPos < 260) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(20, yPos - 8, 190, yPos - 8);
        }
      }
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth/2, 280, { align: "center" });
    doc.text("HRMS Evaluation System", pageWidth/2, 285, { align: "center" });

    doc.save(`evaluation_${selectedEmployee.lastName}_${formattedPeriode}.pdf`);
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setAnswers({});
    setResults({});
    setGlobalScore(null);
    setSubmitted(false);
    setError("");
    setPeriode(null);
    setChapterComments({});
    setActiveChapter(null);
  };

  const navigateToNextChapter = () => {
    const chapters = Object.keys(groupedQuestions);
    const currentIndex = chapters.indexOf(activeChapter);
    if (currentIndex < chapters.length - 1) {
      setActiveChapter(chapters[currentIndex + 1]);
    }
  };

  const navigateToPrevChapter = () => {
    const chapters = Object.keys(groupedQuestions);
    const currentIndex = chapters.indexOf(activeChapter);
    if (currentIndex > 0) {
      setActiveChapter(chapters[currentIndex - 1]);
    }
  };

  const getScoreColor = (score, scoreRange = pointsPerChapter) => {
    if (score >= scoreRange * 0.8) return theme.palette.success.main;
    if (score >= scoreRange * 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getPerformanceRating = (score, scoreRange = pointsPerChapter) => {
    const percentage = score / scoreRange;
    if (percentage >= 0.8) return "Excellent";
    if (percentage >= 0.6) return "Good";
    return "Needs Improvement";
  };

  // Help drawer content
  const helpContent = (
    <Box sx={{ width: 320, p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
        Evaluation Help Guide
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Scoring System</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Each chapter is worth {pointsPerChapter.toFixed(2)} points, for a total of 20 points.
        Rate employees on a scale of 1-5 for each question.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Performance Ratings</Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <Chip size="small" label="Excellent" color="success" sx={{ mr: 1 }} />
        80% or higher of available points
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <Chip size="small" label="Good" color="warning" sx={{ mr: 1 }} />
        60-79% of available points
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <Chip size="small" label="Needs Improvement" color="error" sx={{ mr: 1 }} />
        Below 60% of available points
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Navigation</Typography>
      <Typography variant="body2">
        Use the chapter tabs at the top to move between sections, or use the
        next/previous buttons at the bottom of each section.
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <CssBaseline />

        <Fade in={fadeIn} timeout={800}>
          <Paper
            elevation={4}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.97)}, ${alpha(theme.palette.background.default, 0.9)})`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.15)}, transparent 70%)`,
                zIndex: 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -100,
                left: -100,
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.secondary.light, 0.12)}, transparent 70%)`,
                zIndex: 0
              }}
            />

            {/* Header */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 4,
              pb: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              position: 'relative',
              zIndex: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    mr: 2,
                    width: { xs: 48, md: 56 },
                    height: { xs: 48, md: 56 },
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.4)}`
                  }}
                >
                  <Grading />
                </Avatar>
                <Box>
                  <Typography
                    variant={isMobile ? "h5" : "h4"}
                    sx={{
                      fontWeight: 700,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Employee Evaluation
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Assess employee performance and provide valuable feedback
                  </Typography>
                </Box>
              </Box>

              <Tooltip title="Help Guide">
                <IconButton
                  onClick={() => setHelpDrawerOpen(true)}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <HelpOutline />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Employee Selection */}
            {!selectedEmployee ? (
              <Zoom in={true} timeout={800}>
                <Card
                  variant="outlined"
                  sx={{
                    mb: 4,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                    },
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        mr: 2
                      }}>
                        <Person />
                      </Avatar>
                      <Typography variant="h6" color="primary.dark">Select Employee</Typography>
                    </Box>

                    <Autocomplete
                      options={filteredEmployees}
                      getOptionLabel={(opt) => `${opt.firstName} ${opt.lastName}${opt.department ? ` - ${opt.department}` : ''}`}
                      onChange={(_, v) => setSelectedEmployee(v)}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1.5
                        }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            {option.firstName[0]}{option.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">{option.firstName} {option.lastName}</Typography>
                            {option.department && (
                              <Typography variant="caption" color="text.secondary">
                                {option.department}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search employee"
                          variant="outlined"
                          fullWidth
                          placeholder="Start typing name..."
                          InputProps={{
                            ...params.InputProps,
                            sx: { borderRadius: 2 }
                          }}
                        />
                      )}
                    />

                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 4,
                      pt: 2,
                      borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}`
                    }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Dashboard sx={{ mr: 1, fontSize: 18 }} />
                        Employees available: {filteredEmployees.length}
                        {employees.length !== filteredEmployees.length && (
                          <Typography component="span" variant="body2" sx={{ ml: 1, color: theme.palette.info.main }}>
                            ({employees.length - filteredEmployees.length} already evaluated this period)
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            ) : (
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Fade in={true} timeout={600}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => setSelectedEmployee(null)}
                        sx={{
                          mr: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                        }}
                      >
                        <ArrowBack />
                      </IconButton>
                      <Chip
                        avatar={
                          <Avatar sx={{ bgcolor: theme.palette.primary.dark }}>
                            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                          </Avatar>
                        }
                        label={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                        variant="filled"
                        color="primary"
                        sx={{
                          px: 2,
                          py: 2.5,
                          fontSize: '1rem',
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      />
                    </Box>

                    {!submitted && (
                      <Chip
                        icon={<FilterList />}
                        label={`Overall progress: ${calculateOverallCompletionPercentage().toFixed(0)}%`}
                        color={
                          calculateOverallCompletionPercentage() === 100 ? "success" :
                          calculateOverallCompletionPercentage() > 50 ? "primary" : "default"
                        }
                        sx={{
                          px: 1,
                          display: { xs: 'none', md: 'flex' }
                        }}
                      />
                    )}
                  </Box>
                </Fade>

                {!submitted && (
                  <Fade in={true} timeout={800}>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={6}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                mr: 1.5
                              }}>
                                <CalendarMonth />
                              </Avatar>
                              <Typography variant="h6">Evaluation Period</Typography>
                            </Box>

                            <TextField
                              label="Select Period"
                              type="month"
                              value={formattedPeriode}
                              onChange={(e) => setPeriode(new Date(e.target.value))}
                              fullWidth
                              required
                              helperText="Select year and month for this evaluation"
                              InputLabelProps={{
                                shrink: true,
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                }
                              }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            height: '100%',
                            background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                          }}
                        >
                          <Typography variant="h6" sx={{ color: 'primary.contrastText', fontWeight: 600, mb: 1 }}>
                            Scoring System
                          </Typography>

                          <Divider sx={{ borderColor: alpha('#fff', 0.2), my: 1.5 }} />

                          <Box sx={{ color: 'primary.contrastText' }}>
                            <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                              • Each chapter is worth {pointsPerChapter.toFixed(2)} points
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                              • Questions rated on a scale of 1-5
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              • Total maximum score: 20 points
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  </Fade>
                )}

                {selectedEmployee && !submitted && (
                  <Box>
                    <Fade in={true} timeout={1000}>
                      <Box sx={{ mb: 3, position: 'relative' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            pb: 1,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': {
                              display: 'none'
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '2px',
                              backgroundColor: alpha(theme.palette.divider, 0.3),
                              borderRadius: '1px'
                            }
                          }}
                        >
                          {Object.keys(groupedQuestions).map((chapter, index) => {
                            const isActive = activeChapter === chapter;
                            const completion = calculateCompletionPercentage(chapter);

                            return (
                              <Chip
                                key={chapter}
                                label={chapter}
                                onClick={() => setActiveChapter(chapter)}
                                icon={
                                  completion === 100 ?
                                    <CheckCircle fontSize="small" /> :
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      {index + 1}
                                    </Typography>
                                }
                                color={isActive ? "primary" :
                                       completion === 100 ? "success" : "default"}
                                variant={isActive ? "filled" : "outlined"}
                                sx={{
                                  px: 1,
                                  py: 2.5,
                                  m: 0.5,
                                  transition: 'all 0.3s',
                                  borderWidth: 2,
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2
                                  },
                                  ...(isActive && {
                                    '&::after': {
                                      content: '""',
                                      position: 'absolute',
                                      bottom: -1,
                                      left: '50%',
                                      transform: 'translate',
                                      content: '""',
                                      position: 'absolute',
                                      bottom: -1,
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      width: '80%',
                                      height: '3px',
                                      backgroundColor: theme.palette.primary.main,
                                      borderRadius: '1px',
                                      zIndex: 1
                                    }
                                  })
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </Fade>

                    {activeChapter && groupedQuestions[activeChapter] && (
                      <MotionContainer
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        key={activeChapter}
                      >
                        <Paper
                          elevation={3}
                          sx={{
                            p: { xs: 2, md: 4 },
                            borderRadius: 2,
                            mb: 4,
                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mr: 2 }}>
                              {activeChapter}
                            </Typography>
                            <Chip
                              label={`Score: ${calculateCurrentChapterScore(activeChapter).toFixed(2)}/${pointsPerChapter.toFixed(2)}`}
                              size="small"
                              sx={{
                                bgcolor: alpha(getScoreColor(calculateCurrentChapterScore(activeChapter)), 0.1),
                                color: getScoreColor(calculateCurrentChapterScore(activeChapter)),
                                fontWeight: 600
                              }}
                            />
                          </Box>

                          {groupedQuestions[activeChapter].map((q, idx) => (
                            <Card
                              key={q._id}
                              sx={{
                                mb: 3,
                                borderRadius: 2,
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                                transition: 'all 0.3s',
                                '&:hover': {
                                  transform: 'translateX(4px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                }
                              }}
                            >
                              <CardContent>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                                  {idx + 1}. {q.question}
                                </Typography>

                                <Box sx={{ ml: 1 }}>
                                  <Box sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexWrap: 'wrap'
                                  }}>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                      <Button
                                        key={value}
                                        variant={answers[activeChapter]?.[q._id] === value ? "contained" : "outlined"}
                                        onClick={() => handleAnswerChange(activeChapter, q._id, value)}
                                        sx={{
                                          minWidth: '48px',
                                          height: '48px',
                                          borderRadius: '4px',
                                          p: 0,
                                          fontWeight: 'bold',
                                          ...(answers[activeChapter]?.[q._id] === value
                                            ? {
                                                bgcolor: theme.palette.primary.main,
                                                color: 'white',
                                                '&:hover': {
                                                  bgcolor: theme.palette.primary.dark,
                                                }
                                              }
                                            : {
                                                borderColor: alpha(theme.palette.primary.main, 0.5),
                                                color: theme.palette.primary.main,
                                                '&:hover': {
                                                  borderColor: theme.palette.primary.main,
                                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                }
                                              }
                                          )
                                        }}
                                      >
                                        {value}
                                      </Button>
                                    ))}
                                  </Box>

                                  <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mt: 1,
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.75rem'
                                  }}>
                                    <span>Poor</span>
                                    <span>Average</span>
                                    <span>Excellent</span>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}

                          <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                              <Comment sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Comments for this section
                            </Typography>

                            <TextField
                              multiline
                              rows={4}
                              fullWidth
                              variant="outlined"
                              placeholder="Add your observations and recommendations..."
                              value={chapterComments[activeChapter] || ''}
                              onChange={(e) => handleCommentChange(activeChapter, e.target.value)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2
                                }
                              }}
                            />
                          </Box>

                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 4,
                            pt: 2,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                          }}>
                            <Button
                              variant="outlined"
                              startIcon={<ChevronLeft />}
                              onClick={navigateToPrevChapter}
                              disabled={Object.keys(groupedQuestions).indexOf(activeChapter) === 0}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                minWidth: 120
                              }}
                            >
                              Previous
                            </Button>

                            <Chip
                              label={`Progress: ${calculateCompletionPercentage(activeChapter).toFixed(0)}%`}
                              color={
                                calculateCompletionPercentage(activeChapter) === 100 ? "success" :
                                calculateCompletionPercentage(activeChapter) > 50 ? "primary" : "default"
                              }
                            />

                            <Button
                              variant="contained"
                              endIcon={<ChevronRight />}
                              onClick={navigateToNextChapter}
                              disabled={Object.keys(groupedQuestions).indexOf(activeChapter) === Object.keys(groupedQuestions).length - 1}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                minWidth: 120
                              }}
                            >
                              Next
                            </Button>
                          </Box>
                        </Paper>
                      </MotionContainer>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <Button
                        variant="contained"
                        size="large"
                        disabled={!periode || calculateOverallCompletionPercentage() !== 100}
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Submit Evaluation"}
                      </Button>
                    </Box>

                    {error && (
                      <Slide direction="up" in={!!error}>
                        <Alert
                          severity="error"
                          sx={{
                            mb: 3,
                            borderRadius: 2
                          }}
                        >
                          {error}
                        </Alert>
                      </Slide>
                    )}
                  </Box>
                )}

                {submitted && (
                  <Fade in={true} timeout={800}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: { xs: 2, md: 4 },
                        borderRadius: 2,
                        background: theme.palette.background.paper
                      }}
                    >
                      <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: theme.palette.success.main,
                            boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.3)}`
                          }}
                        >
                          <CheckCircle fontSize="large" />
                        </Avatar>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                          Evaluation Complete
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Evaluation period: {formattedPeriode}
                        </Typography>
                      </Box>

                      <Card
                        sx={{
                          mb: 4,
                          borderRadius: 2,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                        }}
                      >
                        <CardContent>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                            mb: 3
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  mr: 2
                                }}
                              >
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">
                                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                                </Typography>
                                {selectedEmployee.position && (
                                  <Typography variant="body2" color="text.secondary">
                                    {selectedEmployee.position}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            <Chip
                              icon={<Grade />}
                              label={`Global Score: ${globalScore}/20`}
                              color={
                                globalScore >= 16 ? "success" :
                                globalScore >= 12 ? "primary" :
                                globalScore >= 8 ? "warning" : "error"
                              }
                              sx={{
                                px: 2,
                                py: 2.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                              }}
                            />
                          </Box>

                          <Divider sx={{ mb: 3 }} />

                          <Typography variant="h6" sx={{ mb: 2 }}>Results by Chapter</Typography>

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            {Object.entries(results).map(([chapter, score]) => (
                              <Grid item xs={12} sm={6} md={4} key={chapter}>
                                <Card variant="outlined" sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  border: `1px solid ${alpha(getScoreColor(score), 0.5)}`,
                                  bgcolor: alpha(getScoreColor(score), 0.05)
                                }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                                    {chapter}
                                  </Typography>

                                  <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}>
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        color: getScoreColor(score),
                                        fontWeight: 600
                                      }}
                                    >
                                      {score.toFixed(2)}/{pointsPerChapter.toFixed(2)}
                                    </Typography>

                                    <Chip
                                      label={getPerformanceRating(score)}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(getScoreColor(score), 0.2),
                                        color: getScoreColor(score)
                                      }}
                                    />
                                  </Box>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>

                          <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Comments</Typography>

                            {Object.entries(chapterComments).filter(([_, comment]) => comment).length > 0 ? (
                              Object.entries(chapterComments)
                                .filter(([_, comment]) => comment)
                                .map(([chapter, comment]) => (
                                  <Card
                                    key={chapter}
                                    variant="outlined"
                                    sx={{
                                      mb: 2,
                                      p: 2,
                                      borderRadius: 2,
                                      borderLeft: `4px solid ${theme.palette.primary.main}`
                                    }}
                                  >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                                      {chapter}
                                    </Typography>
                                    <Typography variant="body2">
                                      {comment}
                                    </Typography>
                                  </Card>
                                ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No comments provided
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>

                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2,
                        flexWrap: 'wrap'
                      }}>
                        <Button
                          variant="outlined"
                          startIcon={<Refresh />}
                          onClick={resetForm}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none'
                          }}
                        >
                          New Evaluation
                        </Button>

                        <Button
                          variant="contained"
                          startIcon={<PictureAsPdf />}
                          onClick={generatePDF}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            bgcolor: theme.palette.success.main,
                            '&:hover': {
                              bgcolor: theme.palette.success.dark
                            }
                          }}
                        >
                          Export to PDF
                        </Button>
                      </Box>
                    </Paper>
                  </Fade>
                )}
              </Box>
            )}

            {/* Help drawer */}
            <SwipeableDrawer
              anchor="right"
              open={helpDrawerOpen}
              onClose={() => setHelpDrawerOpen(false)}
              onOpen={() => setHelpDrawerOpen(true)}
            >
              {helpContent}
            </SwipeableDrawer>
          </Paper>
        </Fade>
      </Container>
  );
};

export default Evaluation;