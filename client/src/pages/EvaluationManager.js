import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider,
  Paper,
  Container,
  Grid,
  Chip,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  CircularProgress,
  Stack,
  Breadcrumbs,
  InputAdornment,
  Menu,
  MenuItem,
  Badge
} from "@mui/material";
import {
  Delete,
  Edit,
  Save,
  Add,
  ExpandMore,
  Search,
  FileDownload,
  Cancel,
  FilterList,
  PictureAsPdf,
  Print,
  Book,
  Help,
  MoreVert,
  PlaylistAdd,
  Close
} from "@mui/icons-material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { alpha } from "@mui/material/styles";
import { Link } from "react-router-dom";

const EvaluationManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editedQuestionText, setEditedQuestionText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [newChapter, setNewChapter] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Fetch questions from API
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/qcm")
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching questions:", error);
        setFeedback({
          type: "error",
          message: "Failed to load questions. Please try again."
        });
        setLoading(false);
      });
  };

  // Filter questions based on search term
  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.chapter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group questions by chapter
  const groupedQuestions = filteredQuestions.reduce((acc, q) => {
    const chapter = q.chapter || "Undefined";
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(q);
    return acc;
  }, {});

  // Check if there are no questions after filtering
  const noQuestionsFound = Object.keys(groupedQuestions).length === 0;

  // Editing functions
  const startEditing = (q) => {
    setEditingQuestionId(q._id);
    setEditedQuestionText(q.question);
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
    setEditedQuestionText("");
  };

  const saveEditing = (id) => {
    const originalQuestion = questions.find((q) => q._id === id);
    const updatedQuestion = {
      chapter: originalQuestion ? originalQuestion.chapter : "",
      question: editedQuestionText,
    };

    fetch(`http://localhost:5000/api/qcm/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        const updatedQuestions = questions.map((q) =>
          q._id === id ? data : q
        );
        setQuestions(updatedQuestions);
        cancelEditing();
        setFeedback({
          type: "success",
          message: "Question updated successfully!"
        });
      })
      .catch((error) => {
        console.error("Error updating question:", error);
        setFeedback({
          type: "error",
          message: "Failed to update question."
        });
      });
  };

  // Delete functions
  const confirmDelete = (id) => {
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const deleteQuestion = (id) => {
    fetch(`http://localhost:5000/api/qcm/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setQuestions(questions.filter((q) => q._id !== id));
          setFeedback({
            type: "success",
            message: "Question deleted successfully!"
          });
        }
      })
      .catch((error) => {
        console.error("Error deleting question:", error);
        setFeedback({
          type: "error",
          message: "Failed to delete question."
        });
      });
  };

  // Add new question
  const addNewQuestion = () => {
    if (newChapter.trim() === "" || newQuestionText.trim() === "") {
      setFeedback({
        type: "error",
        message: "Please fill in both chapter and question text fields."
      });
      return;
    }

    const newQuestion = {
      chapter: newChapter,
      question: newQuestionText,
    };

    fetch("http://localhost:5000/api/qcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        setQuestions([...questions, data]);
        setNewChapter("");
        setNewQuestionText("");
        setFeedback({
          type: "success",
          message: "New question added successfully!"
        });
      })
      .catch((error) => {
        console.error("Error adding question:", error);
        setFeedback({
          type: "error",
          message: "Failed to add new question."
        });
      });
  };

  // Handle pre-filling chapter field
  const handleAddInChapter = (chapterName) => {
    setNewChapter(chapterName);
    document.getElementById("addQuestionSection").scrollIntoView({ behavior: "smooth" });
  };

  // Accordion management
  const handleAccordionChange = (chapter) => (event, isExpanded) => {
    setExpandedChapter(isExpanded ? chapter : null);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    // Add company logo or header
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("HRMS - Evaluation Questions", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Table data
    const tableColumn = ["#", "Chapter", "Question", "Options", "Max Score"];
    
    let yPos = 40;
    
    // Group by chapter in PDF
    Object.entries(groupedQuestions).forEach(([chapter, chapterQuestions]) => {
      // Add chapter heading
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 255);
      yPos += 10;
      doc.text(`Chapter: ${chapter}`, 14, yPos);
      yPos += 5;
      
      // Create table for this chapter
      const tableRows = chapterQuestions.map((q, index) => {
        const optionsText = (q.options || [])
          .map((opt) => `${opt.text} (${opt.note})`)
          .join(", ");
        const maxNote = 5; // Maximum possible score
        return [index + 1, chapter, q.question, optionsText, maxNote];
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 166] },
        margin: { top: 10 },
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    });
    
    doc.save("evaluation_questions.pdf");

    setFeedback({
      type: "success",
      message: "PDF exported successfully!"
    });
  };

  // Menu control
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle printing
  const handlePrint = () => {
    handleMenuClose();
    window.print();
  };

  // Clear all fields in the form
  const clearForm = () => {
    setNewChapter("");
    setNewQuestionText("");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs navigation */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, 
          mb: 3, 
          background: "transparent", 
          display: "flex",
          alignItems: "center"
        }}
      >
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography color="text.primary">Dashboard</Typography>
          </Link>
          <Link to="/evaluations" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography color="text.primary">Evaluations</Typography>
          </Link>
          <Typography color="primary">Question Manager</Typography>
        </Breadcrumbs>
      </Paper>

      {/* Main content */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to right, #ffffff, #f8f9fa)'
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="500" gutterBottom color="primary">
              Evaluation Questions Manager
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage, edit, and organize evaluation questions for employee assessments
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<MoreVert />}
              onClick={handleMenuOpen}
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleExportPDF}>
                <PictureAsPdf sx={{ mr: 2 }} /> Export to PDF
              </MenuItem>
              <MenuItem onClick={handlePrint}>
                <Print sx={{ mr: 2 }} /> Print
              </MenuItem>
              <Divider />
              <MenuItem onClick={fetchQuestions}>
                <PlaylistAdd sx={{ mr: 2 }} /> Refresh Data
              </MenuItem>
            </Menu>
          </Stack>
        </Box>

        {/* Feedback alert */}
        {feedback && (
          <Snackbar 
            open={feedback !== null} 
            autoHideDuration={6000} 
            onClose={() => setFeedback(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert 
              onClose={() => setFeedback(null)} 
              severity={feedback.type} 
              sx={{ width: '100%' }}
              action={
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => setFeedback(null)}
                >
                  <Close fontSize="small" />
                </IconButton>
              }
            >
              {feedback.message}
            </Alert>
          </Snackbar>
        )}

        {/* Search and filter section */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 4, 
            display: "flex", 
            alignItems: "center",
            borderRadius: 2,
            bgcolor: alpha('#f5f5f5', 0.8)
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search by question or chapter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Cancel fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ 
              backgroundColor: "#ffffff",
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.light',
                },
              },
            }}
          />
          
          <Box ml={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" mr={1}>
              {filteredQuestions.length} questions
            </Typography>
          </Box>
        </Paper>

        {/* Questions content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : noQuestionsFound ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: '#f9f9f9',
              borderRadius: 2,
              border: '1px dashed #ccc'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No questions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? "Try adjusting your search query" : "Start by adding new questions below"}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ mb: 4 }}>
            {Object.entries(groupedQuestions).map(([chapter, chapterQuestions]) => (
              <Accordion 
                key={chapter} 
                expanded={expandedChapter === chapter}
                onChange={handleAccordionChange(chapter)}
                sx={{ 
                  mb: 2, 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                  borderRadius: '8px !important',
                  '&:before': {
                    display: 'none',
                  },
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    backgroundColor: alpha('#e3f2fd', 0.5),
                    borderBottom: expandedChapter === chapter ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Book color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" color="primary">
                        {chapter}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={`${chapterQuestions.length} questions`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mr: 2 }}
                      />
                      <Button
                        size="small"
                        startIcon={<Add />}
                        variant="text"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddInChapter(chapter);
                        }}
                      >
                        Add Question
                      </Button>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {chapterQuestions.map((q) => (
                        <Grid item xs={12} key={q._id}>
                          <Card 
                            sx={{ 
                              borderRadius: 2,
                              transition: 'all 0.3s',
                              '&:hover': {
                                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                              }
                            }}
                          >
                            <CardContent>
                              {editingQuestionId === q._id ? (
                                <TextField
                                  fullWidth
                                  label="Question"
                                  value={editedQuestionText}
                                  onChange={(e) => setEditedQuestionText(e.target.value)}
                                  multiline
                                  rows={2}
                                  sx={{ mb: 2 }}
                                  variant="outlined"
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <Typography variant="body1" sx={{ mb: 1 }}>
                                    {q.question}
                                  </Typography>
                                  <Stack direction="row" spacing={1} mt={1}>
                                    {(q.options || []).map((opt, index) => (
                                      <Chip
                                        key={index}
                                        label={`${opt.text} (${opt.note})`}
                                        size="small"
                                        variant="outlined"
                                        color={opt.note > 0 ? "success" : "error"}
                                        sx={{ borderRadius: 1 }}
                                      />
                                    ))}
                                    {(!q.options || q.options.length === 0) && (
                                      <Typography variant="caption" color="text.secondary">
                                        Options will be generated automatically
                                      </Typography>
                                    )}
                                  </Stack>
                                </>
                              )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', p: 1, bgcolor: alpha('#f5f5f5', 0.5) }}>
                              {editingQuestionId === q._id ? (
                                <>
                                  <Button 
                                    startIcon={<Save />} 
                                    onClick={() => saveEditing(q._id)} 
                                    color="primary"
                                    variant="contained"
                                    size="small"
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    startIcon={<Cancel />} 
                                    onClick={cancelEditing} 
                                    color="inherit"
                                    variant="outlined"
                                    size="small"
                                    sx={{ ml: 1 }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Edit Question">
                                    <IconButton onClick={() => startEditing(q)} color="primary" size="small">
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Question">
                                    <IconButton
                                      onClick={() => confirmDelete(q._id)}
                                      color="error"
                                      size="small"
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Add new question section */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            mt: 4,
            bgcolor: alpha('#e3f2fd', 0.3),
            border: '1px solid #e3f2fd'
          }}
          id="addQuestionSection"
        >
          <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Add sx={{ mr: 1 }} />
            Add New Question
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Chapter"
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
                variant="outlined"
                placeholder="E.g., HR Policies, Performance Management"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Book fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Question Text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                variant="outlined"
                multiline
                rows={2}
                placeholder="Enter your question here..."
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined"
                  onClick={clearForm}
                  startIcon={<Cancel />}
                >
                  Clear
                </Button>
                <Button 
                  variant="contained" 
                  onClick={addNewQuestion}
                  startIcon={<Add />}
                  color="primary"
                  disabled={newChapter.trim() === "" || newQuestionText.trim() === ""}
                >
                  Add Question
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Note: Options will be automatically generated based on the question text
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Question Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this question? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EvaluationManager;