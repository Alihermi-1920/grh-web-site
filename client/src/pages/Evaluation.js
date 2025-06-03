import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Container,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from "@mui/material";
// Basic Material-UI components from: https://mui.com/material-ui/react-box/
// Typography: https://mui.com/material-ui/react-typography/
// Button: https://mui.com/material-ui/react-button/
// TextField: https://mui.com/material-ui/react-text-field/
// Alert: https://mui.com/material-ui/react-alert/
// Paper: https://mui.com/material-ui/react-paper/
// Card: https://mui.com/material-ui/react-card/
// Grid: https://mui.com/material-ui/react-grid/
// Container: https://mui.com/material-ui/react-container/
// Select: https://mui.com/material-ui/react-select/

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import format from 'date-fns/format';

const Evaluation = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [evaluatedEmployeeIds, setEvaluatedEmployeeIds] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [globalScore, setGlobalScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("");
  const [chapterComments, setChapterComments] = useState({});

  // Set default period to current month
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = format(currentDate, 'yyyy-MM');
    setPeriode(currentMonth);
  }, []);

  // Store user info in state
  const [userInfo, setUserInfo] = useState({
    isChef: false,
    chefId: null
  });

  // Fetch employees and evaluated employees
  useEffect(() => {
    setError("");
    
    // Flag to prevent state updates if component unmounts
    let isMounted = true;

    // Get current chef from localStorage
    const currentUser = JSON.parse(localStorage.getItem("employee") || "{}");
    const isChef = currentUser.role === "Chef";
    const chefId = currentUser._id;

    setUserInfo({
      isChef,
      chefId
    });

    const fetchEmployees = async () => {
      try {
        let employeesData = [];

        if (isChef && chefId) {
          const response = await fetch(`http://localhost:5000/api/employees/chef/${chefId}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.status}`);
          }
          employeesData = await response.json();
        } else {
          const response = await fetch("http://localhost:5000/api/employees", {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.status}`);
          }
          employeesData = await response.json();
        }

        if (!Array.isArray(employeesData)) {
          employeesData = [];
        }

        if (!isMounted) return; // Don't update state if component unmounted
        setEmployees(employeesData);

        if (periode) {
          try {
            let url = `http://localhost:5000/api/evaluationresultat/evaluated-employees?periode=${periode}`;

            if (isChef && chefId) {
              url += `&chefId=${chefId}`;
            }

            // Add timestamp to prevent caching
            url += `&_t=${Date.now()}`;

            const evalResponse = await fetch(url, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            if (!evalResponse.ok) {
              throw new Error(`Failed to fetch evaluated employees: ${evalResponse.status}`);
            }

            const evaluatedIds = await evalResponse.json();

            if (!isMounted) return; // Don't update state if component unmounted

            if (!Array.isArray(evaluatedIds)) {
              setEvaluatedEmployeeIds([]);
              setFilteredEmployees(employeesData);
            } else {
              // Update localStorage with fresh data from server
              localStorage.setItem(`evaluatedEmployees_${periode}`, JSON.stringify(evaluatedIds));
              setEvaluatedEmployeeIds(evaluatedIds);

              const notEvaluatedEmployees = employeesData.filter(emp => {
                const empIdStr = emp._id.toString();
                const isEvaluated = evaluatedIds.includes(empIdStr);
                return !isEvaluated;
              });

              setFilteredEmployees(notEvaluatedEmployees);

              if (selectedEmployee && evaluatedIds.includes(selectedEmployee.toString())) {
                setSelectedEmployee("");
                setAnswers({});
              }
            }
          } catch (evalErr) {
            console.error("Error loading evaluated employees:", evalErr);

            if (!isMounted) return; // Don't update state if component unmounted

            if (periode) {
              const cachedEvaluatedIds = localStorage.getItem(`evaluatedEmployees_${periode}`);

              if (cachedEvaluatedIds) {
                try {
                  const evaluatedIds = JSON.parse(cachedEvaluatedIds);
                  setEvaluatedEmployeeIds(evaluatedIds);

                  const notEvaluatedEmployees = employeesData.filter(emp =>
                    !evaluatedIds.includes(emp._id.toString())
                  );

                  setFilteredEmployees(notEvaluatedEmployees);
                  return;
                } catch (e) {
                  console.error("Error parsing cached evaluated employees:", e);
                }
              }
            }

            setFilteredEmployees(employeesData);
          }
        } else {
          setFilteredEmployees(employeesData);
        }
      } catch (err) {
        console.error("Error loading employees:", err);
        if (!isMounted) return; // Don't update state if component unmounted
        setError("Error loading employees. Please try again.");
        setEmployees([]);
        setFilteredEmployees([]);
      }
    };

    fetchEmployees();

    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [periode, selectedEmployee]); // Added selectedEmployee as dependency to refresh when it changes
  useEffect(() => {
    // Fetch questions data
    let isMounted = true;
    
    fetch("http://localhost:5000/api/qcm")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setQuestions(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("Error loading questions");
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, []);

  // Group questions by chapter
  const groupedQuestions = questions.reduce((acc, q) => {
    const chap = q.chapter || "Undefined";
    if (!acc[chap]) acc[chap] = [];
    acc[chap].push(q);
    return acc;
  }, {});

  const handleAnswerChange = (chapter, questionId, value) => {
    setAnswers(prev => ({ ...prev, [chapter]: { ...prev[chapter], [questionId]: value } }));
  };

  const handleCommentChange = (chapter, comment) => {
    setChapterComments(prev => ({ ...prev, [chapter]: comment }));
  };

  const calculateCurrentChapterScore = (chapter) => {
    const chapterAnswers = answers[chapter] || {};
    const obtained = Object.values(chapterAnswers).reduce((a, b) => a + b, 0);
    const totalPossible = groupedQuestions[chapter]?.length * 10 || 0;
    return totalPossible > 0 ? (obtained / totalPossible) * 10 : 0;
  };

  const handleSubmit = async () => {
    setError("");

    if (!periode) {
      setError("Veuillez sélectionner une période d'évaluation");
      return;
    }

    if (!selectedEmployee) {
      setError("Veuillez sélectionner un employé");
      return;
    }

    const allAnswered = Object.entries(groupedQuestions).every(([chap, qs]) =>
      qs.every(q => answers[chap]?.[q._id] !== undefined)
    );

    if (!allAnswered) {
      setError("Veuillez répondre à toutes les questions avant de soumettre");
      return;
    }

    const computedResults = {};
    let chapterScoresSum = 0;
    let numChaptersWithAnswers = 0;

    Object.entries(groupedQuestions).forEach(([chapter, qs]) => {
      const totalObtained = qs.reduce((sum, q) => sum + (answers[chapter]?.[q._id] || 0), 0);
      const chapterScore = (totalObtained / (qs.length * 10)) * 10;
      computedResults[chapter] = parseFloat(chapterScore.toFixed(2));
      chapterScoresSum += chapterScore;
      numChaptersWithAnswers++;
    });

    const globalObtained = numChaptersWithAnswers > 0 ? (chapterScoresSum * 2) / numChaptersWithAnswers : 0;

    try {
      setLoading(true);
      const selectedEmp = employees.find(emp => emp._id === selectedEmployee);
      
      await fetch("http://localhost:5000/api/evaluationresultat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
          periode: periode,
          chapterScores: computedResults,
          globalScore: parseFloat(globalObtained.toFixed(2)),
          chapterComments
        })
      });

      setResults(computedResults);
      setGlobalScore(parseFloat(globalObtained.toFixed(2)));
      setSubmitted(true);

      const newEvaluatedIds = [...(Array.isArray(evaluatedEmployeeIds) ? evaluatedEmployeeIds : []), selectedEmployee];
      setEvaluatedEmployeeIds(newEvaluatedIds);

      if (periode) {
        localStorage.setItem(`evaluatedEmployees_${periode}`, JSON.stringify(newEvaluatedIds));
      }

      const newFilteredList = filteredEmployees.filter(emp => emp._id.toString() !== selectedEmployee);
      setFilteredEmployees(newFilteredList);

    } catch (err) {
      setError("Error saving evaluation");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const selectedEmp = employees.find(emp => emp._id === selectedEmployee);
    const doc = new jsPDF();

    // Simple PDF generation from jsPDF documentation: https://github.com/parallax/jsPDF
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text("Rapport d'Évaluation d'Employé", 20, 20);

    doc.setFontSize(12);
    doc.text(`Employé: ${selectedEmp.firstName} ${selectedEmp.lastName}`, 20, 40);
    doc.text(`Période: ${periode}`, 20, 50);
    doc.text(`Score Global: ${globalScore}/20`, 20, 60);

    // Add table using autoTable plugin: https://github.com/simonbengtsson/jsPDF-AutoTable
    autoTable(doc, {
      startY: 70,
      head: [['Chapitre', 'Score', 'Points Max']],
      body: Object.entries(results).map(([chap, score]) => [
        chap,
        score.toFixed(2),
        '10.00'
      ])
    });

    doc.save(`evaluation_${selectedEmp.lastName}_${periode}.pdf`);
  };

  const resetForm = () => {
    setSelectedEmployee("");
    setAnswers({});
    setResults({});
    setGlobalScore(null);
    setSubmitted(false);
    setError("");
    setChapterComments({});

    // Directly refresh the data without using setTimeout
    if (periode) {
      // Force a refresh of the evaluated employees data
      const refreshData = async () => {
        try {
          const currentUser = JSON.parse(localStorage.getItem("employee") || "{}");
          const isChef = currentUser.role === "Chef";
          const chefId = currentUser._id;
          
          let url = `http://localhost:5000/api/evaluationresultat/evaluated-employees?periode=${periode}`;
          
          if (isChef && chefId) {
            url += `&chefId=${chefId}`;
          }
          
          url += `&_t=${Date.now()}`; // Add timestamp to prevent caching
          
          const evalResponse = await fetch(url, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!evalResponse.ok) {
            throw new Error(`Failed to fetch evaluated employees: ${evalResponse.status}`);
          }
          
          const evaluatedIds = await evalResponse.json();
          
          if (Array.isArray(evaluatedIds)) {
            localStorage.setItem(`evaluatedEmployees_${periode}`, JSON.stringify(evaluatedIds));
            setEvaluatedEmployeeIds(evaluatedIds);
            
            const notEvaluatedEmployees = employees.filter(emp => {
              const empIdStr = emp._id.toString();
              const isEvaluated = evaluatedIds.includes(empIdStr);
              return !isEvaluated;
            });
            
            setFilteredEmployees(notEvaluatedEmployees);
          }
        } catch (err) {
          console.error("Error refreshing evaluated employees:", err);
        }
      };
      
      refreshData();
    }
  };

  const selectedEmployeeData = employees.find(emp => emp._id === selectedEmployee);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Simple Paper component from: https://mui.com/material-ui/react-paper/ */}
      <Paper sx={{ p: 3 }}>
        {/* Basic Typography from: https://mui.com/material-ui/react-typography/ */}
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Évaluation des Employés
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!submitted ? (
          <Box>
            {/* Selection Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  
                  <TextField
                    type="month"
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormHelperText>Sélectionnez l'année et le mois</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sélectionner un Employé</InputLabel>
                  {/* Basic Select from: https://mui.com/material-ui/react-select/ */}
                  <Select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    label="Sélectionner un Employé"
                  >
                    {filteredEmployees.map((emp) => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} {emp.department && `- ${emp.department}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {filteredEmployees.length === 0 ? 
                      "Tous les employés ont été évalués pour cette période" : 
                      `${filteredEmployees.length} employés disponibles`}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            {/* Questions Section */}
            {selectedEmployee && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Évaluation de: {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
                </Typography>

                {Object.entries(groupedQuestions).map(([chapter, chapterQuestions]) => (
                  <Card key={chapter} sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {chapter}
                      </Typography>

                      {chapterQuestions.map((question, index) => (
                        <Box key={question._id} sx={{ mb: 3 }}>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {index + 1}. {question.question}
                          </Typography>

                          <FormControl>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                <Button
                                  key={value}
                                  variant={answers[chapter]?.[question._id] === value ? "contained" : "outlined"}
                                  onClick={() => handleAnswerChange(chapter, question._id, value)}
                                  size="small"
                                  sx={{ 
                                    minWidth: '40px',
                                    ...(answers[chapter]?.[question._id] === value ? {
                                      bgcolor: '#685cfe',
                                      '&:hover': {
                                        bgcolor: '#5348c7'
                                      }
                                    } : {
                                      color: '#685cfe',
                                      borderColor: '#685cfe',
                                      '&:hover': {
                                        borderColor: '#5348c7',
                                        bgcolor: 'rgba(104, 92, 254, 0.1)'
                                      }
                                    })
                                  }}
                                >
                                  {value}
                                </Button>
                              ))}
                            </Box>
                          </FormControl>
                        </Box>
                      ))}

                      <TextField
                        label={`Commentaires pour ${chapter}`}
                        multiline
                        rows={3}
                        fullWidth
                        value={chapterComments[chapter] || ''}
                        onChange={(e) => handleCommentChange(chapter, e.target.value)}
                        sx={{ mt: 2 }}
                      />

                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Score du Chapitre: {calculateCurrentChapterScore(chapter).toFixed(2)}/10
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    mt: 2,
                    bgcolor: '#685cfe',
                    '&:hover': {
                      bgcolor: '#5348c7'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Soumettre l'Évaluation"}
                </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          /* Results Section */
          <Box>
            <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', color: '#685cfe', fontWeight: 'bold' }}>
              Évaluation Complétée
            </Typography>

            <Card 
              elevation={3} 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(104, 92, 254, 0.2)'
              }}
            >
              <Box sx={{ 
                bgcolor: '#685cfe', 
                color: 'white', 
                py: 2, 
                px: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
                </Typography>
                <Typography variant="body1">
                  Période: {periode}
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 4, 
                  mt: 1 
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#685cfe' }}>
                    Score Global: {globalScore}/20
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#685cfe', 
                  borderBottom: '2px solid #685cfe',
                  pb: 1,
                  fontWeight: 'bold'
                }}>
                  Résultats par Chapitre:
                </Typography>

                <Box sx={{ overflowX: 'auto' }}>
                  <Box sx={{
                    display: 'table',
                    width: '100%',
                    borderCollapse: 'collapse',
                    mb: 3
                  }}>
                    <Box sx={{ display: 'table-header-group' }}>
                      <Box sx={{ display: 'table-row' }}>
                        <Box sx={{ 
                          display: 'table-cell', 
                          p: 2, 
                          fontWeight: 'bold',
                          borderBottom: '2px solid #685cfe',
                          color: '#685cfe'
                        }}>
                          Chapitre
                        </Box>
                        <Box sx={{ 
                          display: 'table-cell', 
                          p: 2, 
                          fontWeight: 'bold',
                          borderBottom: '2px solid #685cfe',
                          color: '#685cfe',
                          textAlign: 'right'
                        }}>
                          Score
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'table-row-group' }}>
                      {Object.entries(results).map(([chapter, score]) => (
                        <Box key={chapter} sx={{ 
                          display: 'table-row',
                          '&:hover': { bgcolor: 'rgba(104, 92, 254, 0.05)' }
                        }}>
                          <Box sx={{ 
                            display: 'table-cell', 
                            p: 2,
                            borderBottom: '1px solid rgba(224, 224, 224, 1)'
                          }}>
                            {chapter}
                          </Box>
                          <Box sx={{ 
                            display: 'table-cell', 
                            p: 2,
                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                            fontWeight: 'bold',
                            color: '#685cfe',
                            textAlign: 'right'
                          }}>
                            {score.toFixed(1)}/10
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>

                {Object.entries(chapterComments).filter(([_, comment]) => comment).length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      color: '#685cfe', 
                      borderBottom: '2px solid #685cfe',
                      pb: 1,
                      fontWeight: 'bold'
                    }}>
                      Commentaires:
                    </Typography>
                    <Box>
                      {Object.entries(chapterComments)
                        .filter(([_, comment]) => comment)
                        .map(([chapter, comment]) => (
                          <Box key={chapter} sx={{ mb: 2, p: 2, borderLeft: '3px solid #685cfe', bgcolor: 'rgba(104, 92, 254, 0.05)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#685cfe' }}>
                              {chapter}:
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {comment}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                onClick={resetForm}
                sx={{ 
                  bgcolor: '#685cfe',
                  '&:hover': {
                    bgcolor: '#5348c7'
                  }
                }}
              >
                Nouvelle Évaluation
              </Button>
              <Button 
                variant="outlined" 
                onClick={generatePDF}
                sx={{ 
                  color: '#685cfe',
                  borderColor: '#685cfe',
                  '&:hover': {
                    borderColor: '#5348c7',
                    bgcolor: 'rgba(104, 92, 254, 0.1)'
                  }
                }}
              >
                Télécharger PDF
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Evaluation;