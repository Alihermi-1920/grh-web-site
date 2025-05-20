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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  Info,
  ArrowBack,
  ArrowForward,
  BarChart,
  TrendingUp,
  Comment
} from "@mui/icons-material";
import { format } from 'date-fns';
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeEvaluations, setEmployeeEvaluations] = useState([]);
  const [mobileView, setMobileView] = useState(window.innerWidth < 960);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sortOption, setSortOption] = useState("none");
  const [years, setYears] = useState(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
  });

  // Months array for dropdown
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

  // Helper function to get color based on score
  const getScoreColor = (score) => {
    if (score >= 16) return theme.palette.success.main;
    if (score >= 12) return theme.palette.info.main;
    if (score >= 8) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Helper function to get performance rating based on score
  const getPerformanceRating = (score) => {
    // For global scores (out of 20)
    if (score >= 16) return "Excellent";
    if (score >= 12) return "Bon";
    if (score >= 8) return "Moyen";
    return "À améliorer";
  };

  // Helper function to get performance rating for chapter scores (out of 10)
  const getChapterPerformanceRating = (score) => {
    // For chapter scores (out of 10)
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Bon";
    if (score >= 4) return "Moyen";
    return "À améliorer";
  };

  // Helper function to extract CIN from employee data
  const extractCIN = (evaluation) => {
    // Check all possible locations where CIN might be stored
    if (evaluation.employeeId?.cin) return evaluation.employeeId.cin;
    if (evaluation.employeeId?.CIN) return evaluation.employeeId.CIN;
    if (evaluation.CIN) return evaluation.CIN;
    if (evaluation.cin) return evaluation.cin;

    // If employeeId is populated with employee data
    const employee = employees.find(emp => emp._id === (evaluation.employeeId?._id || evaluation.employeeId));
    if (employee?.cin) return employee.cin;
    if (employee?.CIN) return employee.CIN;

    // If we still don't have a CIN, check if there's a numeric ID that looks like a CIN
    if (typeof evaluation.employeeId === 'object') {
      for (const key in evaluation.employeeId) {
        const value = evaluation.employeeId[key];
        if (typeof value === 'string' && /^\d{8}$/.test(value)) {
          return value;
        }
      }
    }

    return "Non disponible";
  };

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

      // Add user role and chef ID if user is a chef
      if (user && user.role === "Chef") {
        queryParams.append("userRole", "Chef");
        queryParams.append("chefId", user._id);
      }

      // Add timestamp to prevent caching
      queryParams.append("_t", Date.now());

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/evaluationresultat?${queryParams}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch evaluations");
      }

      const data = await response.json();

      // Group evaluations by employee
      const groupedByEmployee = data.reduce((acc, evaluation) => {
        const employeeId = evaluation.employeeId?._id || evaluation.employeeId;
        if (!acc[employeeId]) {
          acc[employeeId] = [];
        }
        acc[employeeId].push(evaluation);
        return acc;
      }, {});

      setEvaluations(data);
      setFilteredEvaluations(data);

      // If there are evaluations and no employee is selected, select the first one
      if (data.length > 0 && !selectedEmployeeId) {
        const firstEmployeeId = data[0].employeeId?._id || data[0].employeeId;
        setSelectedEmployeeId(firstEmployeeId);
        setEmployeeEvaluations(groupedByEmployee[firstEmployeeId] || []);

        if (groupedByEmployee[firstEmployeeId]?.length > 0) {
          setSelectedEvaluation(groupedByEmployee[firstEmployeeId][0]);
        }
      } else if (selectedEmployeeId) {
        setEmployeeEvaluations(groupedByEmployee[selectedEmployeeId] || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      setError("Failed to load evaluations. Please try again.");
      setLoading(false);
    }
  };

  // Fetch employees from the server
  const fetchEmployees = async () => {
    try {
      // If user is a chef, only fetch their employees
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let url = `${API_URL}/api/employees`;

      if (user && user.role === "Chef") {
        url = `${API_URL}/api/employees/chef/${user._id}`;
      }

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeId(employeeId);

    // Find evaluations for this employee
    const employeeEvals = evaluations.filter(evaluation =>
      (evaluation.employeeId?._id || evaluation.employeeId) === employeeId
    );

    setEmployeeEvaluations(employeeEvals);

    // Select the first evaluation if available
    if (employeeEvals.length > 0) {
      setSelectedEvaluation(employeeEvals[0]);
    } else {
      setSelectedEvaluation(null);
    }
  };

  // Handle evaluation selection
  const handleEvaluationSelect = (evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  // Handle view evaluation
  const handleViewEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setDetailDialogOpen(true);
  };

  // Handle delete evaluation
  const handleDeleteEvaluation = async (id) => {
    setDeleteLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/evaluationresultat/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Failed to delete evaluation");
      }

      // Remove the deleted evaluation from state
      setEvaluations(evaluations.filter(evaluation => evaluation._id !== id));
      setFilteredEvaluations(filteredEvaluations.filter(evaluation => evaluation._id !== id));

      // If the deleted evaluation was selected, clear selection
      if (selectedEvaluation && selectedEvaluation._id === id) {
        setSelectedEvaluation(null);
      }

      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      setError("Failed to delete evaluation. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle search
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      setFilteredEvaluations(evaluations);
      return;
    }

    const filtered = evaluations.filter(evaluation => {
      const employeeName = evaluation.employeeName.toLowerCase();
      return employeeName.includes(query);
    });

    setFilteredEvaluations(filtered);

    // If there are results and no employee is selected, select the first one
    if (filtered.length > 0 && !selectedEmployeeId) {
      const firstEmployeeId = filtered[0].employeeId?._id || filtered[0].employeeId;
      handleEmployeeSelect(firstEmployeeId);
    }
  };

  // Handle month change
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  // Handle year change
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setSearchQuery("");
  };

  // Generate PDF for an evaluation
  const generatePDF = (evaluation) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add company logo or header
    doc.setFontSize(20);
    doc.setTextColor(theme.palette.primary.main);
    doc.text("Rapport d'Évaluation", pageWidth/2, 20, { align: "center" });

    // Employee info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employé: ${evaluation.employeeName}`, 20, 35);
    doc.text(`Poste: ${evaluation.employeeId?.position || "N/A"}`, 20, 43);
    doc.text(`Département: ${evaluation.employeeId?.department || "N/A"}`, 20, 51);
    doc.text(`Période: ${evaluation.periode || format(new Date(evaluation.date), 'yyyy-MM')}`, 20, 59);
    doc.text(`Score Global: ${evaluation.globalScore}/20`, 20, 67);

    // Horizontal line
    doc.setDrawColor(theme.palette.primary.main);
    doc.setLineWidth(0.5);
    doc.line(20, 72, 190, 72);

    // Convert Map to array for the table
    const chapterScores = Object.entries(evaluation.chapterScores).map(([chapter, score]) => {
      return [chapter, score, getChapterPerformanceRating(score)];
    });

    // Scores Table
    autoTable(doc, {
      startY: 77,
      head: [['Chapitre', 'Score', 'Performance']],
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

    // Comments section if available
    if (evaluation.chapterComments && Object.keys(evaluation.chapterComments).length > 0) {
      const finalY = doc.lastAutoTable.finalY || 150;

      doc.text("Commentaires:", 20, finalY + 10);

      let commentY = finalY + 20;
      Object.entries(evaluation.chapterComments).forEach(([chapter, comment]) => {
        if (comment && comment.trim()) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`${chapter}:`, 20, commentY);
          doc.setFont(undefined, 'normal');

          // Handle multiline comments
          const textLines = doc.splitTextToSize(comment, 170);
          doc.text(textLines, 20, commentY + 5);

          commentY += 10 + (textLines.length * 5);
        }
      });
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth/2, 280, { align: "center" });
    doc.text("Système d'Évaluation HRMS", pageWidth/2, 285, { align: "center" });

    doc.save(`evaluation_${evaluation.employeeName.replace(/\s+/g, '_')}_${evaluation.periode || format(new Date(evaluation.date), 'yyyy-MM')}.pdf`);
  };

  // Initial data loading
  useEffect(() => {
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    fetchEvaluations();
  }, [selectedYear, selectedMonth]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 960);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Group evaluations by employee for the sidebar
  const groupedEvaluations = evaluations.reduce((acc, evaluation) => {
    const employeeId = evaluation.employeeId?._id || evaluation.employeeId;
    const employeeName = evaluation.employeeName;

    if (!acc[employeeId]) {
      acc[employeeId] = {
        id: employeeId,
        name: employeeName,
        department: evaluation.employeeId?.department || "",
        position: evaluation.employeeId?.position || "",
        evaluations: []
      };
    }

    acc[employeeId].evaluations.push(evaluation);
    return acc;
  }, {});

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{
          fontWeight: 700,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Assessment fontSize="large" sx={{ color: theme.palette.primary.main }} />
          Résultats d'Évaluation
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Employee List with Filters */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper
            elevation={4}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              height: 'calc(100vh - 180px)',
              display: 'flex',
              flexDirection: 'column',
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
            }}
          >
            {/* Filters Section */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: alpha(theme.palette.primary.main, 0.03)
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                Filtres
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="month-select-label">Mois</InputLabel>
                    <Select
                      labelId="month-select-label"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      label="Mois"
                    >
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="year-select-label">Année</InputLabel>
                    <Select
                      labelId="year-select-label"
                      value={selectedYear}
                      onChange={handleYearChange}
                      label="Année"
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher par nom ou CIN..."
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleResetFilters}
                    size="small"
                  >
                    Réinitialiser
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Employee List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {Object.values(groupedEvaluations)
                    .filter(employee =>
                      !searchQuery ||
                      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(employee => {
                      // Get the latest evaluation for this employee
                      const latestEval = employee.evaluations.sort((a, b) =>
                        new Date(b.date) - new Date(a.date)
                      )[0];

                      return (
                        <ListItemButton
                          key={employee.id}
                          selected={selectedEmployeeId === employee.id}
                          onClick={() => handleEmployeeSelect(employee.id)}
                          sx={{
                            py: 2,
                            px: 2,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            transition: 'all 0.2s ease',
                            background: selectedEmployeeId === employee.id
                              ? theme.palette.mode === 'dark'
                                ? '#1e2a3b' // Dark navy blue for dark mode
                                : '#e6f0f9' // Light blue for light mode
                              : 'transparent',
                            '&:hover': {
                              background: theme.palette.mode === 'dark'
                                ? '#1a2436'
                                : '#edf2f7'
                            },
                            // Override the purple selection color from theme
                            '&.Mui-selected': {
                              backgroundColor: theme.palette.mode === 'dark' ? '#1e2a3b' : '#e6f0f9',
                              color: theme.palette.text.primary,
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#1a2436' : '#edf2f7',
                                color: theme.palette.text.primary
                              }
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: alpha(getScoreColor(latestEval.globalScore), 0.2),
                                color: getScoreColor(latestEval.globalScore),
                                fontWeight: 'bold',
                                width: 50,
                                height: 50,
                                mr: 2
                              }}
                            >
                              {employee.name.charAt(0)}
                            </Avatar>

                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {employee.name}
                              </Typography>

                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Person fontSize="small" />
                                CIN: {extractCIN(latestEval)}
                              </Typography>

                              <Typography variant="body2" color="text.secondary">
                                {employee.position || employee.department || "Aucun poste"}
                              </Typography>
                            </Box>

                            <Box sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              ml: 1
                            }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 'bold',
                                  color: getScoreColor(latestEval.globalScore)
                                }}
                              >
                                {latestEval.globalScore}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                /20
                              </Typography>
                            </Box>
                          </Box>
                        </ListItemButton>
                      );
                    })}
                </List>
              )}

              {Object.keys(groupedEvaluations).length === 0 && !loading && (
                <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Info sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucune évaluation trouvée
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Essayez de modifier vos filtres ou sélectionnez une autre période
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Evaluation Details */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper
            elevation={4}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              height: 'calc(100vh - 180px)',
              display: 'flex',
              flexDirection: 'column',
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
            }}
          >
            {selectedEvaluation ? (
              <>
                {/* Header */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {selectedEvaluation.employeeName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        icon={<CalendarMonth />}
                        label={selectedEvaluation.periode || format(new Date(selectedEvaluation.date), 'yyyy-MM')}
                        size="small"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person fontSize="small" />
                        CIN: {extractCIN(selectedEvaluation)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: alpha(getScoreColor(selectedEvaluation.globalScore), 0.1),
                      p: 1,
                      borderRadius: 2
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: getScoreColor(selectedEvaluation.globalScore) }}>
                        {selectedEvaluation.globalScore}
                      </Typography>
                      <Typography variant="caption" sx={{ color: getScoreColor(selectedEvaluation.globalScore) }}>
                        Score Global /20
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      onClick={() => generatePDF(selectedEvaluation)}
                      sx={{
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    >
                      Exporter PDF
                    </Button>
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Assessment /> Performance par Chapitre
                  </Typography>

                  {/* Professional Table Layout */}
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                      borderRadius: 0,
                      mb: 4
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{
                          backgroundColor: theme.palette.mode === 'dark' ? '#1e2a3b' : '#f8fafc',
                        }}>
                          <TableCell sx={{
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                          }}>
                            Chapitre
                          </TableCell>
                          <TableCell align="center" sx={{
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                          }}>
                            Score
                          </TableCell>
                          <TableCell align="center" sx={{
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                          }}>
                            Performance
                          </TableCell>
                          <TableCell sx={{
                            fontWeight: 'bold',
                            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                            width: '30%'
                          }}>
                            Progression
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedEvaluation.chapterScores).map(([chapter, score]) => (
                          <TableRow
                            key={chapter}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              '&:nth-of-type(even)': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#171923' : '#f8fafc',
                              }
                            }}
                          >
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{
                                fontWeight: 500,
                                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                              }}
                            >
                              {chapter}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 'bold',
                                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                              }}
                            >
                              {score}/10
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.5,
                                  backgroundColor: theme.palette.mode === 'dark' ? '#2d3748' : '#f1f5f9',
                                  color: theme.palette.text.primary,
                                  fontWeight: 'medium',
                                  fontSize: '0.875rem',
                                  border: `1px solid ${theme.palette.mode === 'dark' ? '#4a5568' : '#e2e8f0'}`,
                                }}
                              >
                                {getChapterPerformanceRating(score)}
                              </Box>
                            </TableCell>
                            <TableCell
                              sx={{
                                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    flexGrow: 1,
                                    height: 8,
                                    bgcolor: theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0',
                                    position: 'relative',
                                    mr: 2
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      height: '100%',
                                      width: `${(score / 10) * 100}%`,
                                      backgroundColor: theme.palette.mode === 'dark' ? '#4a5568' : '#64748b',
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ minWidth: '45px' }}>
                                  {(score / 10) * 100}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {selectedEvaluation.chapterComments && Object.keys(selectedEvaluation.chapterComments).length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2
                      }}>
                        <Comment /> Commentaires
                      </Typography>

                      {Object.entries(selectedEvaluation.chapterComments)
                        .filter(([_, comment]) => comment && comment.trim())
                        .map(([chapter, comment]) => (
                          <Card
                            key={chapter}
                            elevation={0}
                            sx={{
                              p: 0,
                              mb: 3,
                              position: 'relative',
                              overflow: 'hidden',
                              border: `1px solid ${theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0'}`,
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a202c' : '#ffffff',
                              borderRadius: 0,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {/* Professional header with chapter name */}
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: theme.palette.mode === 'dark' ? '#2d3748' : '#f8fafc',
                                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#4a5568' : '#e2e8f0'}`,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  color: theme.palette.text.primary,
                                }}
                              >
                                {chapter}
                              </Typography>
                            </Box>

                            {/* Comment content */}
                            <Box sx={{ p: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-line'
                                }}
                              >
                                {comment}
                              </Typography>
                            </Box>
                          </Card>
                        ))}
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: 4,
                textAlign: 'center'
              }}>
                <Assessment sx={{ fontSize: 100, color: alpha(theme.palette.primary.main, 0.2), mb: 3 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Détails de l'Évaluation
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                  Sélectionnez un employé dans la liste à gauche pour voir les détails de son évaluation.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EvaluationResults;
