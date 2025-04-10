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
  Divider
} from "@mui/material";
import { Delete, Edit, Save } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EvaluationManager = () => {
  const [questions, setQuestions] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editedQuestionText, setEditedQuestionText] = useState("");

  const [newChapter, setNewChapter] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/qcm")
      .then((response) => response.json())
      .then((data) => setQuestions(data))
      .catch((error) =>
        console.error("Erreur lors de la récupération des questions :", error)
      );
  }, []);

  // Regrouper les questions par chapitre
  const groupedQuestions = questions.reduce((acc, q) => {
    const chapter = q.chapter || "Non défini";
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(q);
    return acc;
  }, {});

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
      })
      .catch((error) =>
        console.error("Erreur lors de la mise à jour de la question :", error)
      );
  };

  const deleteQuestion = (id) => {
    fetch(`http://localhost:5000/api/qcm/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setQuestions(questions.filter((q) => q._id !== id));
        }
      })
      .catch((error) =>
        console.error("Erreur lors de la suppression de la question :", error)
      );
  };

  // Fonction d'ajout d'une nouvelle question
  const addNewQuestion = () => {
    if (newChapter.trim() === "" || newQuestionText.trim() === "") {
      alert("Veuillez remplir le chapitre et le texte de la question.");
      return;
    }

    const newQuestion = {
      chapter: newChapter,
      question: newQuestionText,
      // Les options seront générées automatiquement côté serveur
    };

    fetch("http://localhost:5000/api/qcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        setQuestions([...questions, data]);
        // Réinitialise les champs pour l'ajout
        setNewChapter("");
        setNewQuestionText("");
        setFeedback({
          type: "success",
          message: "Nouvelle question ajoutée !",
        });
      })
      .catch((error) =>
        console.error("Erreur lors de l'ajout de la question :", error)
      );
  };

  // Action : Préremplir le champ "Chapitre" et défiler jusqu'au formulaire
  const handleAddInChapter = (chapterName) => {
    setNewChapter(chapterName);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  // Exporter en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Données du QCM", 14, 20);
    const tableColumn = ["N°", "Chapitre", "Question", "Options", "Note max"];
    const tableRows = questions.map((q, index) => {
      const optionsText = (q.options || [])
        .map((opt) => `${opt.text} (${opt.note})`)
        .join(", ");
      // Note max : pour cette configuration, il s'agit de 5
      const maxNote = 5;
      return [index + 1, q.chapter, q.question, optionsText, maxNote];
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10 },
    });
    doc.save("qcm_data.pdf");
  };

  return (
    <Box
      sx={{
        p: 3,
        background: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Gestion des questions du QCM
        </Typography>
        <Button variant="contained" color="primary" onClick={handleExportPDF}>
          Exporter en PDF
        </Button>
      </Box>
      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      {Object.entries(groupedQuestions).map(([chapter, chapterQuestions]) => (
        <Box key={chapter} sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Chapitre: {chapter}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleAddInChapter(chapter)}
            >
              Ajouter une question dans ce chapitre
            </Button>
          </Box>
          {chapterQuestions.map((q) => (
            <Card key={q._id} sx={{ mb: 2 }}>
              <CardContent>
                {editingQuestionId === q._id ? (
                  <TextField
                    fullWidth
                    label="Question"
                    value={editedQuestionText}
                    onChange={(e) => setEditedQuestionText(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <>
                    <Typography variant="body1">{q.question}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Options: {(q.options || [])
                        .map((opt) => `${opt.text} (${opt.note})`)
                        .join(", ")}
                    </Typography>
                  </>
                )}
              </CardContent>
              <CardActions>
                {editingQuestionId === q._id ? (
                  <>
                    <IconButton onClick={() => saveEditing(q._id)} color="primary">
                      <Save />
                    </IconButton>
                    <IconButton onClick={cancelEditing} color="secondary">
                      <Delete />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton onClick={() => startEditing(q)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => deleteQuestion(q._id)}
                      color="secondary"
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </CardActions>
              <Divider />
            </Card>
          ))}
        </Box>
      ))}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Ajouter une nouvelle question
        </Typography>
        <TextField
          fullWidth
          label="Chapitre"
          value={newChapter}
          onChange={(e) => setNewChapter(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Texte de la question"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={addNewQuestion}>
          Ajouter la question
        </Button>
      </Box>
    </Box>
  );
};

export default EvaluationManager;
