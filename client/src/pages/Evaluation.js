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

        setEmployees(employeesData);

        if (periode) {
          try {
            let url = `http://localhost:5000/api/evaluationresultat/evaluated-employees?periode=${periode}`;

            if (isChef && chefId) {
              url += `&chefId=${chefId}`;
            }

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

            if (!Array.isArray(evaluatedIds)) {
              setEvaluatedEmployeeIds([]);
              setFilteredEmployees(employeesData);
            } else {
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
      setError("Please select an evaluation period");
      return;
    }

    if (!selectedEmployee) {
      setError("Please select an employee");
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
    doc.text("Employee Evaluation Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Employee: ${selectedEmp.firstName} ${selectedEmp.lastName}`, 20, 40);
    doc.text(`Period: ${periode}`, 20, 50);
    doc.text(`Overall Score: ${globalScore}/20`, 20, 60);

    // Add table using autoTable plugin: https://github.com/simonbengtsson/jsPDF-AutoTable
    autoTable(doc, {
      startY: 70,
      head: [['Chapter', 'Score', 'Max Points']],
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

    if (periode) {
      const newPeriode = periode;
      setPeriode("");
      setTimeout(() => {
        setPeriode(newPeriode);
      }, 50);
    }
  };

  const selectedEmployeeData = employees.find(emp => emp._id === selectedEmployee);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Simple Paper component from: https://mui.com/material-ui/react-paper/ */}
      <Paper sx={{ p: 3 }}>
        {/* Basic Typography from: https://mui.com/material-ui/react-typography/ */}
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
          Employee Evaluation
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
                  <FormHelperText>Select year and month</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Employee</InputLabel>
                  {/* Basic Select from: https://mui.com/material-ui/react-select/ */}
                  <Select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    label="Select Employee"
                  >
                    {filteredEmployees.map((emp) => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} {emp.department && `- ${emp.department}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {filteredEmployees.length === 0 ? 
                      "All employees evaluated for this period" : 
                      `${filteredEmployees.length} employees available`}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            {/* Questions Section */}
            {selectedEmployee && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Evaluating: {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
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
                                  sx={{ minWidth: '40px' }}
                                >
                                  {value}
                                </Button>
                              ))}
                            </Box>
                          </FormControl>
                        </Box>
                      ))}

                      <TextField
                        label={`Comments for ${chapter}`}
                        multiline
                        rows={3}
                        fullWidth
                        value={chapterComments[chapter] || ''}
                        onChange={(e) => handleCommentChange(chapter, e.target.value)}
                        sx={{ mt: 2 }}
                      />

                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Chapter Score: {calculateCurrentChapterScore(chapter).toFixed(2)}/10
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Submit Evaluation"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          /* Results Section */
          <Box>
            <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
              Evaluation Complete
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
                </Typography>

                <Typography variant="h6" sx={{ mb: 2 }}>
                  Period: {periode}
                </Typography>

                <Typography variant="h6" sx={{ mb: 3 }}>
                  Global Score: {globalScore}/20
                </Typography>

                <Typography variant="h6" sx={{ mb: 2 }}>
                  Results by Chapter:
                </Typography>

                {Object.entries(results).map(([chapter, score]) => (
                  <Box key={chapter} sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      {chapter}: {score.toFixed(2)}/10
                    </Typography>
                  </Box>
                ))}

                {Object.entries(chapterComments).filter(([_, comment]) => comment).length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Comments:
                    </Typography>
                    {Object.entries(chapterComments)
                      .filter(([_, comment]) => comment)
                      .map(([chapter, comment]) => (
                        <Box key={chapter} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1">{chapter}:</Typography>
                          <Typography variant="body2">{comment}</Typography>
                        </Box>
                      ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={resetForm}>
                New Evaluation
              </Button>
              <Button variant="outlined" onClick={generatePDF}>
                Download PDF
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Evaluation;