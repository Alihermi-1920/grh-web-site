// src/pages/EvaluationResults.js
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Fade,
  Autocomplete
} from "@mui/material";
import {
  Assessment,
  FilterList,
  Search,
  CalendarMonth,
  Person,
  Grade,
  Delete,
  Visibility,
  PictureAsPdf,
  Download,
  Close,
  Refresh,
  Info
} from "@mui/icons-material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, getYear, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EvaluationResults = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  // State variables
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("none"); // Options: none, highToLow, lowToHigh
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Years for filter dropdown (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Months for filter dropdown
  const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" }
  ];

  // Fetch evaluations from the server
  const fetchEvaluations = async () => {
    setLoading(true);
    setError("");

    try {
      // Build query parameters
      let queryParams = new URLSearchParams();

      // Add filters if they exist
      if (selectedYear) queryParams.append("year", selectedYear);
      if (selectedMonth) queryParams.append("month", selectedMonth);
      if (selectedEmployee) queryParams.append("employeeId", selectedEmployee._id);

      // Add user role and chef ID if user is a chef
      if (user && user.role === "Chef") {
        queryParams.append("userRole", "Chef");
        queryParams.append("chefId", user._id);
      }

      const response = await fetch(`http://localhost:5000/api/evaluationresultat?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch evaluations");
      }

      const data = await response.json();
      setEvaluations(data);
      setFilteredEvaluations(data);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      setError("Failed to load evaluations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees from the server
  const fetchEmployees = async () => {
    try {
      // If user is a chef, only fetch their employees
      let url = "http://localhost:5000/api/employees";

      if (user && user.role === "Chef") {
        url = `http://localhost:5000/api/employees/chef/${user._id}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Don't set error state here to avoid blocking the main functionality
    }
  };

  // Apply filters to the evaluations
  const applyFilters = () => {
    if (!evaluations.length) return;

    let filtered = [...evaluations];

    // Filter by employee
    if (selectedEmployee) {
      filtered = filtered.filter(evaluation =>
        evaluation.employeeId && evaluation.employeeId._id === selectedEmployee._id
      );
    }

    // Filter by search query (employee name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(evaluation => {
        const employeeName = evaluation.employeeName.toLowerCase();
        return employeeName.includes(query);
      });
    }

    // Sort by score if option is selected
    if (sortOption !== "none") {
      filtered.sort((a, b) => {
        const scoreA = parseFloat(a.globalScore);
        const scoreB = parseFloat(b.globalScore);

        if (sortOption === "highToLow") {
          return scoreB - scoreA; // Descending order (high to low)
        } else {
          return scoreA - scoreB; // Ascending order (low to high)
        }
      });
    }

    // Set the filtered evaluations
    setFilteredEvaluations(filtered);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSelectedEmployee(null);
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth("");
    setSearchQuery("");
    setSortOption("none");
    fetchEvaluations();
  };

  // Delete an evaluation
  const handleDeleteEvaluation = async (id) => {
    setDeleteLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/evaluationresultat/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete evaluation");
      }

      // Remove the deleted evaluation from state
      setEvaluations(prev => prev.filter(evaluation => evaluation._id !== id));
      setFilteredEvaluations(prev => prev.filter(evaluation => evaluation._id !== id));

      // Close the confirmation dialog
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      setError("Failed to delete evaluation. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open evaluation detail dialog
  const handleViewEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setDetailDialogOpen(true);
  };

  // Generate PDF for an evaluation
  const generatePDF = (evaluation) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(theme.palette.primary.main);
    doc.text("Employee Evaluation Report", pageWidth/2, 20, { align: "center" });

    // Employee Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Employee: ${evaluation.employeeName}`, 20, 35);

    if (evaluation.employeeId && evaluation.employeeId.position) {
      doc.text(`Position: ${evaluation.employeeId.position}`, 20, 43);
    }

    if (evaluation.employeeId && evaluation.employeeId.department) {
      doc.text(`Department: ${evaluation.employeeId.department}`, 20, 51);
    }

    doc.text(`Period: ${evaluation.periode || format(new Date(evaluation.date), 'yyyy-MM')}`, 20, 59);
    doc.text(`Overall Score: ${evaluation.globalScore}/20`, 20, 67);

    // Horizontal line
    doc.setDrawColor(theme.palette.primary.main);
    doc.setLineWidth(0.5);
    doc.line(20, 72, 190, 72);

    // Convert Map to array for the table
    const chapterScores = Object.entries(evaluation.chapterScores).map(([chapter, score]) => {
      return [chapter, score, getPerformanceRating(score)];
    });

    // Scores Table
    autoTable(doc, {
      startY: 77,
      head: [['Chapter', 'Score', 'Performance']],
      body: chapterScores.map(([chapter, score, performance]) => [
        chapter,
        `${score}/10`,
        performance
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
        0: { cellWidth: 100 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Comments Section if available
    if (evaluation.chapterComments && Object.keys(evaluation.chapterComments).length > 0) {
      let yPos = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.setTextColor(theme.palette.primary.main);
      doc.text("Manager Comments:", 20, yPos);
      yPos += 10;

      Object.entries(evaluation.chapterComments).forEach(([chapter, comment]) => {
        if (comment) {
          doc.setFontSize(12);
          doc.setTextColor(theme.palette.text.primary);
          doc.text(`${chapter}:`, 20, yPos);

          doc.setFontSize(10);
          doc.setTextColor(theme.palette.text.secondary);
          const splitText = doc.splitTextToSize(comment, 170);
          doc.text(splitText, 25, yPos + 8);
          yPos += splitText.length * 5 + 20;
        }
      });
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth/2, 280, { align: "center" });
    doc.text("HRMS Evaluation System", pageWidth/2, 285, { align: "center" });

    doc.save(`evaluation_${evaluation.employeeName.replace(/\s+/g, '_')}_${evaluation.periode || format(new Date(evaluation.date), 'yyyy-MM')}.pdf`);
  };

  // Helper function to determine performance rating based on score
  const getPerformanceRating = (score) => {
    const scoreNum = parseFloat(score);
    if (scoreNum >= 8) return "Excellent";
    if (scoreNum >= 6) return "Good";
    if (scoreNum >= 4) return "Average";
    return "Needs Improvement";
  };

  // Helper function to get color based on score
  const getScoreColor = (score) => {
    const scoreNum = parseFloat(score);
    if (scoreNum >= 8) return theme.palette.success.main;
    if (scoreNum >= 6) return theme.palette.info.main;
    if (scoreNum >= 4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Fetch evaluations and employees on component mount
  useEffect(() => {
    fetchEvaluations();
    fetchEmployees();
  }, []);

  // Apply filters when filter criteria change
  useEffect(() => {
    applyFilters();
  }, [evaluations, selectedEmployee, selectedYear, selectedMonth, searchQuery, sortOption]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 2,
              background: localStorage.getItem("themeMode") === "dark"
                ? `linear-gradient(135deg, rgba(66, 66, 66, 0.95), rgba(33, 33, 33, 0.9))`
                : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.9)})`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit'
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
                    width: 56,
                    height: 56,
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.4)}`
                  }}
                >
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Evaluation Results
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary
                    }}
                  >
                    View and manage employee performance evaluations
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Filters Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                bgcolor: localStorage.getItem("themeMode") === "dark"
                  ? 'rgba(55, 55, 55, 0.5)'
                  : alpha(theme.palette.primary.light, 0.05),
                border: `1px solid ${localStorage.getItem("themeMode") === "dark"
                  ? alpha(theme.palette.primary.main, 0.3)
                  : alpha(theme.palette.primary.main, 0.1)}`,
                position: 'relative',
                zIndex: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FilterList sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6">Filters</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={employees}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    value={selectedEmployee}
                    onChange={(_, newValue) => setSelectedEmployee(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <Person color="action" sx={{ ml: 1, mr: 0.5 }} />
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="year-select-label">Year</InputLabel>
                    <Select
                      labelId="year-select-label"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      label="Year"
                      startAdornment={<CalendarMonth color="action" sx={{ ml: 1, mr: 0.5 }} />}
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="month-select-label">Month</InputLabel>
                    <Select
                      labelId="month-select-label"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      label="Month"
                      startAdornment={<CalendarMonth color="action" sx={{ ml: 1, mr: 0.5 }} />}
                    >
                      <MenuItem value="">All Months</MenuItem>
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Search by name"
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search color="action" sx={{ mr: 0.5 }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="sort-select-label">Trier par score</InputLabel>
                    <Select
                      labelId="sort-select-label"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      label="Trier par score"
                      startAdornment={<Grade color="action" sx={{ ml: 1, mr: 0.5 }} />}
                    >
                      <MenuItem value="none">Aucun tri</MenuItem>
                      <MenuItem value="highToLow">Score élevé à faible</MenuItem>
                      <MenuItem value="lowToHigh">Score faible à élevé</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={handleResetFilters}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Results Section */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading evaluations...
                  </Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 4 }}>
                  {error}
                </Alert>
              ) : filteredEvaluations.length === 0 ? (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.light, 0.1),
                    border: `1px dashed ${alpha(theme.palette.info.main, 0.4)}`
                  }}
                >
                  <Info sx={{ fontSize: 60, color: theme.palette.info.main, opacity: 0.7, mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    No evaluations found
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Try adjusting your filters or create new evaluations
                  </Typography>
                </Paper>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                      {filteredEvaluations.length} {filteredEvaluations.length === 1 ? 'Evaluation' : 'Evaluations'} Found
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {filteredEvaluations.map((evaluation) => (
                      <Grid item xs={12} md={6} lg={4} key={evaluation._id}>
                        <Card
                          sx={{
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            bgcolor: localStorage.getItem("themeMode") === "dark" ? 'rgba(66, 66, 66, 0.9)' : 'white',
                            color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                            },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <CardContent sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{
                              p: 2,
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <Avatar
                                src={evaluation.employeeId && evaluation.employeeId.photo ? evaluation.employeeId.photo : ''}
                                alt={evaluation.employeeName}
                                sx={{
                                  width: 56,
                                  height: 56,
                                  border: `2px solid ${theme.palette.primary.main}`
                                }}
                              >
                                {evaluation.employeeName ? evaluation.employeeName.charAt(0) : 'E'}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" noWrap>
                                  {evaluation.employeeName}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={localStorage.getItem("themeMode") === "dark" ? "rgba(255,255,255,0.7)" : "text.secondary"}
                                  noWrap
                                >
                                  {evaluation.employeeId && evaluation.employeeId.position ? evaluation.employeeId.position : 'No position'} •
                                  {evaluation.employeeId && evaluation.employeeId.department ? evaluation.employeeId.department : 'No department'}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Chip
                                  icon={<CalendarMonth />}
                                  label={evaluation.periode || format(new Date(evaluation.date), 'yyyy-MM')}
                                  size="small"
                                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                                />
                                <Chip
                                  icon={<Grade />}
                                  label={`Score: ${evaluation.globalScore}/20`}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(getScoreColor(evaluation.globalScore), 0.1),
                                    color: getScoreColor(evaluation.globalScore),
                                    fontWeight: 'bold'
                                  }}
                                />
                              </Box>

                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                color={localStorage.getItem("themeMode") === "dark" ? "rgba(255,255,255,0.9)" : "text.primary"}
                              >
                                Performance by Chapter:
                              </Typography>

                              {Object.entries(evaluation.chapterScores).slice(0, 3).map(([chapter, score]) => (
                                <Box key={chapter} sx={{ mb: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography
                                      variant="body2"
                                      noWrap
                                      sx={{
                                        maxWidth: '70%',
                                        color: localStorage.getItem("themeMode") === "dark" ? "rgba(255,255,255,0.8)" : "text.primary"
                                      }}
                                    >
                                      {chapter}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 'bold',
                                        color: getScoreColor(score)
                                      }}
                                    >
                                      {score}/10
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: 4,
                                      bgcolor: alpha(theme.palette.grey[300], 0.5),
                                      borderRadius: 2,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${(score / 10) * 100}%`,
                                        height: '100%',
                                        bgcolor: getScoreColor(score),
                                        borderRadius: 2
                                      }}
                                    />
                                  </Box>
                                </Box>
                              ))}

                              {Object.keys(evaluation.chapterScores).length > 3 && (
                                <Typography
                                  variant="body2"
                                  color={localStorage.getItem("themeMode") === "dark" ? "rgba(255,255,255,0.6)" : "text.secondary"}
                                  align="center"
                                  sx={{ mt: 1 }}
                                >
                                  +{Object.keys(evaluation.chapterScores).length - 3} more chapters
                                </Typography>
                              )}
                            </Box>

                            <Box sx={{
                              mt: 'auto',
                              p: 2,
                              pt: 1,
                              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handleViewEvaluation(evaluation)}
                                sx={{
                                  borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.5)' : undefined,
                                  color: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.8)' : undefined,
                                  '&:hover': {
                                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.8)' : undefined,
                                    backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.08)' : undefined
                                  }
                                }}
                              >
                                View Details
                              </Button>

                              <Box>
                                <Tooltip title="Export to PDF">
                                  <IconButton
                                    color="primary"
                                    onClick={() => generatePDF(evaluation)}
                                    size="small"
                                    sx={{
                                      mr: 1,
                                      color: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.8)' : undefined,
                                      '&:hover': {
                                        backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(144, 202, 249, 0.08)' : undefined
                                      }
                                    }}
                                  >
                                    <PictureAsPdf />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete Evaluation">
                                  <IconButton
                                    color="error"
                                    onClick={() => {
                                      setDeleteId(evaluation._id);
                                      setConfirmDeleteOpen(true);
                                    }}
                                    size="small"
                                    sx={{
                                      color: localStorage.getItem("themeMode") === "dark" ? 'rgba(244, 67, 54, 0.8)' : undefined,
                                      '&:hover': {
                                        backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(244, 67, 54, 0.08)' : undefined
                                      }
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Box>

            {/* Evaluation Detail Dialog */}
            <Dialog
              open={detailDialogOpen}
              onClose={() => setDetailDialogOpen(false)}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  overflow: 'hidden'
                }
              }}
            >
              {selectedEvaluation && (
                <>
                  <DialogTitle sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="h6">
                      Evaluation Details
                    </Typography>
                    <IconButton
                      onClick={() => setDetailDialogOpen(false)}
                      sx={{ color: 'white' }}
                    >
                      <Close />
                    </IconButton>
                  </DialogTitle>

                  <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        src={selectedEvaluation.employeeId && selectedEvaluation.employeeId.photo ? selectedEvaluation.employeeId.photo : ''}
                        alt={selectedEvaluation.employeeName}
                        sx={{
                          width: 64,
                          height: 64,
                          mr: 2,
                          border: `2px solid ${theme.palette.primary.main}`
                        }}
                      >
                        {selectedEvaluation.employeeName ? selectedEvaluation.employeeName.charAt(0) : 'E'}
                      </Avatar>
                      <Box>
                        <Typography variant="h5">
                          {selectedEvaluation.employeeName}
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                          {selectedEvaluation.employeeId && selectedEvaluation.employeeId.position ? selectedEvaluation.employeeId.position : 'No position'} •
                          {selectedEvaluation.employeeId && selectedEvaluation.employeeId.department ? selectedEvaluation.employeeId.department : 'No department'}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<Grade />}
                        label={`Global Score: ${selectedEvaluation.globalScore}/20`}
                        sx={{
                          ml: 'auto',
                          bgcolor: alpha(getScoreColor(selectedEvaluation.globalScore), 0.1),
                          color: getScoreColor(selectedEvaluation.globalScore),
                          fontWeight: 'bold',
                          px: 2,
                          py: 2.5,
                          fontSize: '1rem'
                        }}
                      />
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          Evaluation Period
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 2
                          }}
                        >
                          <CalendarMonth color="primary" sx={{ mr: 1 }} />
                          <Typography>
                            {selectedEvaluation.periode || format(new Date(selectedEvaluation.date), 'yyyy-MM')}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          Evaluation Date
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 2
                          }}
                        >
                          <CalendarMonth color="primary" sx={{ mr: 1 }} />
                          <Typography>
                            {format(new Date(selectedEvaluation.date), 'PPP', { locale: fr })}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                      Chapter Scores
                    </Typography>

                    <Grid container spacing={2}>
                      {Object.entries(selectedEvaluation.chapterScores).map(([chapter, score]) => (
                        <Grid item xs={12} sm={6} md={4} key={chapter}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              borderLeft: `4px solid ${getScoreColor(score)}`
                            }}
                          >
                            <Typography variant="subtitle1" gutterBottom>
                              {chapter}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 'bold',
                                  color: getScoreColor(score)
                                }}
                              >
                                {score}/10
                              </Typography>
                              <Chip
                                label={getPerformanceRating(score)}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getScoreColor(score), 0.1),
                                  color: getScoreColor(score)
                                }}
                              />
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    {selectedEvaluation.chapterComments && Object.keys(selectedEvaluation.chapterComments).length > 0 && (
                      <>
                        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                          Comments
                        </Typography>

                        {Object.entries(selectedEvaluation.chapterComments)
                          .filter(([_, comment]) => comment)
                          .map(([chapter, comment]) => (
                            <Paper
                              key={chapter}
                              variant="outlined"
                              sx={{
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                borderLeft: `4px solid ${theme.palette.primary.main}`
                              }}
                            >
                              <Typography variant="subtitle1" gutterBottom>
                                {chapter}
                              </Typography>
                              <Typography variant="body2">
                                {comment}
                              </Typography>
                            </Paper>
                          ))
                        }
                      </>
                    )}
                  </DialogContent>

                  <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      onClick={() => setDetailDialogOpen(false)}
                      variant="outlined"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => generatePDF(selectedEvaluation)}
                      variant="contained"
                      startIcon={<Download />}
                      color="primary"
                    >
                      Export to PDF
                    </Button>
                  </DialogActions>
                </>
              )}
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
              open={confirmDeleteOpen}
              onClose={() => setConfirmDeleteOpen(false)}
              maxWidth="xs"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 2
                }
              }}
            >
              <DialogTitle>
                Confirm Deletion
              </DialogTitle>
              <DialogContent>
                <Typography>
                  Are you sure you want to delete this evaluation? This action cannot be undone.
                </Typography>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button
                  onClick={() => setConfirmDeleteOpen(false)}
                  variant="outlined"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteEvaluation(deleteId)}
                  variant="contained"
                  color="error"
                  disabled={deleteLoading}
                  startIcon={deleteLoading ? <CircularProgress size={20} /> : <Delete />}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Fade>
      </Container>
    </LocalizationProvider>
  );
};

export default EvaluationResults;
