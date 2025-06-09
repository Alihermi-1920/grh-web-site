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
          message: "Question mise à jour avec succès!"
        });
      })
      .catch((error) => {
        console.error("Error updating question:", error);
        setFeedback({
          type: "error",
          message: "Échec de la mise à jour de la question."
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
            message: "Question supprimée avec succès!"
          });
        }
      })
      .catch((error) => {
        console.error("Error deleting question:", error);
        setFeedback({
          type: "error",
          message: "Échec de la suppression de la question."
        });
      });
  };

  // Add new question
  const addNewQuestion = () => {
    if (newChapter.trim() === "" || newQuestionText.trim() === "") {
      setFeedback({
        type: "error",
        message: "Veuillez fournir à la fois le chapitre et le texte de la question"
      });
      return;
    }

    const newQuestion = {
      chapter: newChapter,
      question: newQuestionText,
    };

    // Save the current chapter name to keep it after adding
    const currentChapter = newChapter;

    fetch("http://localhost:5000/api/qcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        setQuestions([...questions, data]);
        // Keep the chapter name but clear the question text
        setNewQuestionText("");
        setFeedback({
          type: "success",
          message: "Question ajoutée avec succès!"
        });

        // Expand the chapter accordion to show the new question
        setExpandedChapter(currentChapter);
      })
      .catch((error) => {
        console.error("Error adding question:", error);
        setFeedback({
          type: "error",
          message: "Échec de l'ajout de la question."
        });
      });
  };

  // Delete entire chapter with all questions
  const [deleteChapterDialogOpen, setDeleteChapterDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);

  const deleteChapter = (chapterName) => {
    setChapterToDelete(chapterName);
    setDeleteChapterDialogOpen(true);
  };

  const handleDeleteChapterConfirm = () => {
    if (!chapterToDelete) return;
    
    fetch(`http://localhost:5000/api/qcm/chapter/${encodeURIComponent(chapterToDelete)}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete chapter");
        }
        return response.json();
      })
      .then((data) => {
        // Remove all questions from this chapter
        setQuestions(questions.filter(q => q.chapter !== chapterToDelete));
        setFeedback({
          type: "success",
          message: `Chapitre "${chapterToDelete}" supprimé avec succès! ${data.deletedCount} questions supprimées.`
        });
        setDeleteChapterDialogOpen(false);
        setChapterToDelete(null);
      })
      .catch((error) => {
        console.error("Error deleting chapter:", error);
        setFeedback({
          type: "error",
          message: `Échec de la suppression du chapitre: ${error.message}`
        });
        setDeleteChapterDialogOpen(false);
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
    
    // Add banner with company name
    doc.setFillColor(50, 40, 180); // Darker blue color
    doc.rect(0, 0, 210, 25, 'F');
    
    // Add company logo or header
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // White text on banner
    doc.text("GroupeDelice Centre Laitier Nord", 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(50, 40, 180); // Darker blue color
    doc.text("Questions d'Évaluation", 105, 35, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 14, 45);

    // Table data
    const tableColumn = ["#", "Chapitre", "Question", "Score Max"];

    let yPos = 55; // Adjusted for the banner

    // Group by chapter in PDF
    Object.entries(groupedQuestions).forEach(([chapter, chapterQuestions]) => {
      // Add chapter heading
      doc.setFontSize(12);
      doc.setTextColor(50, 40, 180); // Darker blue color
      yPos += 10;
      doc.text(`Chapitre: ${chapter}`, 14, yPos);
      yPos += 5;

      // Create table for this chapter
      const tableRows = chapterQuestions.map((q, index) => {
        const maxNote = 10; // Maximum possible score changed to 10
        return [index + 1, chapter, q.question, maxNote];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [50, 40, 180] }, // Darker blue color
        margin: { top: 10 },
      });

      yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`HRMS_Questions_Evaluation_${new Date().toISOString().split('T')[0]}.pdf`);

    setFeedback({
      type: "success",
      message: "PDF exporté avec succès!"
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
      {/* Main content header space */}
      <Box sx={{ mb: 3 }} />

      {/* Main content */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          background: localStorage.getItem("themeMode") === "dark"
            ? 'linear-gradient(135deg, rgba(50, 40, 180, 0.15), rgba(30, 30, 30, 0.95))'
            : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
          color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit'
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
            <Typography variant="h4" fontWeight="500" gutterBottom sx={{ color: '#32288B' }}>
              Gestionnaire d'Évaluation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gérer, modifier et organiser les questions d'évaluation pour les employés
            </Typography>
          </Box>

          <Button
            variant="contained"
            sx={{ 
              backgroundColor: '#32288B', // Darker blue color
              '&:hover': {
                backgroundColor: '#272070'
              }
            }}
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
          >
            Exporter PDF
          </Button>
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
            bgcolor: localStorage.getItem("themeMode") === "dark"
              ? 'rgba(50, 40, 139, 0.08)'
              : alpha('#f5f5f5', 0.8),
            border: `1px solid ${localStorage.getItem("themeMode") === "dark"
              ? 'rgba(50, 40, 139, 0.2)'
              : 'rgba(50, 40, 139, 0.1)'}`
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Rechercher par question ou chapitre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#32288B' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Cancel fontSize="small" sx={{ color: '#32288B' }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              backgroundColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(30, 30, 30, 0.9)' : "#ffffff",
              borderRadius: 1,
              color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.3)' : 'rgba(50, 40, 139, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.5)' : 'rgba(50, 40, 139, 0.4)',
                },
                '&:focus-within fieldset': {
                  borderColor: '#32288B !important',
                },
                '& .MuiInputBase-input': {
                  color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
                },
                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                  color: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.7)' : '#32288B',
                }
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
              bgcolor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.05)' : '#f9f9f9',
              borderRadius: 2,
              border: `1px dashed ${localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.3)' : 'rgba(50, 40, 139, 0.2)'}`,
              color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit'
            }}
          >
            <Typography variant="h6" sx={{ color: '#32288B' }} gutterBottom>
              Aucune question trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? "Essayez d'ajuster votre recherche" : "Commencez par ajouter de nouvelles questions ci-dessous"}
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
                  bgcolor: localStorage.getItem("themeMode") === "dark" ? 'rgba(66, 66, 66, 0.9)' : 'white',
                  color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
                  '&:before': {
                    display: 'none',
                  },
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{
                    color: '#32288B'
                  }} />}
                  sx={{
                    backgroundColor: localStorage.getItem("themeMode") === "dark"
                      ? 'rgba(50, 40, 139, 0.1)'
                      : alpha('#e3f2fd', 0.5),
                    borderBottom: expandedChapter === chapter
                      ? `1px solid ${localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.3)' : 'rgba(50, 40, 139, 0.2)'}`
                      : 'none',
                    color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Book sx={{ mr: 1, color: '#32288B' }} />
                      <Typography variant="h6" sx={{ color: '#32288B' }}>
                        {chapter}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={`${chapterQuestions.length} questions`}
                        size="small"
                        sx={{ 
                          mr: 2, 
                          borderColor: '#32288B',
                          color: '#32288B'
                        }}
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        startIcon={<Add />}
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddInChapter(chapter);
                        }}
                        sx={{ 
                          mr: 1,
                          color: '#32288B',
                          '&:hover': {
                            backgroundColor: 'rgba(50, 40, 139, 0.08)'
                          }
                        }}
                      >
                        Ajouter Question
                      </Button>
                      <Tooltip title="Supprimer Chapitre">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChapter(chapter);
                          }}
                          sx={{
                            color: '#d32f2f',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.08)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                              bgcolor: localStorage.getItem("themeMode") === "dark" ? 'rgba(55, 55, 55, 0.7)' : 'white',
                              color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
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
                                  {/* Options section removed as requested */}
                                </>
                              )}
                            </CardContent>
                            <CardActions sx={{
                              justifyContent: 'flex-end',
                              p: 1,
                              bgcolor: localStorage.getItem("themeMode") === "dark"
                                ? 'rgba(45, 45, 45, 0.7)'
                                : alpha('#f5f5f5', 0.5)
                            }}>
                              {editingQuestionId === q._id ? (
                                <>
                                  <Button
                                    startIcon={<Save />}
                                    onClick={() => saveEditing(q._id)}
                                    variant="contained"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#32288B',
                                      '&:hover': {
                                        backgroundColor: '#272070'
                                      }
                                    }}
                                  >
                                    Enregistrer
                                  </Button>
                                  <Button
                                    startIcon={<Cancel />}
                                    onClick={cancelEditing}
                                    color="inherit"
                                    variant="outlined"
                                    size="small"
                                    sx={{ ml: 1 }}
                                  >
                                    Annuler
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Modifier Question">
                                    <IconButton 
                                      onClick={() => startEditing(q)} 
                                      size="small"
                                      sx={{ color: '#32288B' }}
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Supprimer Question">
                                    <IconButton 
                                      onClick={() => confirmDelete(q._id)} 
                                      size="small"
                                      sx={{ 
                                        color: '#d32f2f',
                                        '&:hover': {
                                          backgroundColor: 'rgba(244, 67, 54, 0.08)'
                                        }
                                      }}
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
            bgcolor: localStorage.getItem("themeMode") === "dark"
              ? 'rgba(50, 40, 139, 0.15)'
              : alpha('#e3f2fd', 0.3),
            border: `1px solid ${localStorage.getItem("themeMode") === "dark"
              ? 'rgba(50, 40, 139, 0.3)'
              : '#e3f2fd'}`,
            color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit'
          }}
          id="addQuestionSection"
        >
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#32288B' }}>
            <Add sx={{ mr: 1 }} />
            Ajouter Nouvelle Question
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Chapitre"
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
                variant="outlined"
                placeholder="Nom Du Chapitre "
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Book fontSize="small" sx={{
                        color: '#32288B'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.3)' : 'rgba(50, 40, 139, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.5)' : 'rgba(50, 40, 139, 0.4)',
                  },
                  '&:focus-within fieldset': {
                    borderColor: '#32288B !important',
                  },
                    '& .MuiInputBase-input': {
                      color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Texte de la Question"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                variant="outlined"
                multiline
                rows={2}
                placeholder="Entrez votre question ici..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.3)' : 'rgba(50, 40, 139, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: localStorage.getItem("themeMode") === "dark" ? 'rgba(50, 40, 139, 0.5)' : 'rgba(50, 40, 139, 0.4)',
                  },
                  '&:focus-within fieldset': {
                    borderColor: '#32288B !important',
                  },
                    '& .MuiInputBase-input': {
                      color: localStorage.getItem("themeMode") === "dark" ? 'white' : undefined,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                variant="outlined"
                onClick={clearForm}
                startIcon={<Cancel />}
                sx={{
                  borderColor: '#32288B',
                  color: localStorage.getItem("themeMode") === "dark" ? '#32288B' : '#32288B',
                  '&:hover': {
                    borderColor: '#272070',
                    backgroundColor: 'rgba(50, 40, 139, 0.05)'
                  }
                }}
              >
                Effacer
              </Button>
              <Button
                variant="contained"
                onClick={addNewQuestion}
                startIcon={<Add />}
                disabled={newChapter.trim() === "" || newQuestionText.trim() === ""}
                sx={{
                  backgroundColor: '#32288B',
                  '&:hover': {
                    backgroundColor: '#272070'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(50, 40, 139, 0.3)',
                    color: localStorage.getItem("themeMode") === "dark" ? 'rgba(255, 255, 255, 0.3)' : undefined
                  }
                }}
              >
                Ajouter Question
              </Button>
              </Box>
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
        PaperProps={{
          sx: {
            bgcolor: localStorage.getItem("themeMode") === "dark" ? 'rgba(30, 30, 30, 0.95)' : 'white',
            color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
            borderRadius: 2,
            borderTop: '3px solid #32288B'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: '#32288B' }}>
          {"Confirmer la Suppression"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer cette question? Cette action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#32288B'
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            autoFocus
            sx={{
              color: '#d32f2f'
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chapter Delete confirmation dialog */}
      <Dialog
        open={deleteChapterDialogOpen}
        onClose={() => setDeleteChapterDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            bgcolor: localStorage.getItem("themeMode") === "dark" ? 'rgba(30, 30, 30, 0.95)' : 'white',
            color: localStorage.getItem("themeMode") === "dark" ? 'white' : 'inherit',
            borderRadius: 2,
            borderTop: '3px solid #685cfe'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: '#685cfe' }}>
          {"Confirmer la Suppression du Chapitre"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer ce chapitre? Cela supprimera toutes les questions de ce chapitre. Cette action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteChapterDialogOpen(false)}
            sx={{
              color: '#685cfe'
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteChapterConfirm}
            autoFocus
            sx={{
              color: '#d32f2f'
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EvaluationManager;