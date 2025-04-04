// src/pages/EvaluationManager.js
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
} from "@mui/material";
import { Delete, Edit, Save, Add } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EvaluationManager = () => {
  // Stocke la liste des questions récupérées du backend
  const [questions, setQuestions] = useState([]);

  // États pour l'édition d'une question existante
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editedQuestionText, setEditedQuestionText] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);

  // États pour l'ajout d'une nouvelle question
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptionsText, setNewOptionsText] = useState("");

  // Récupération des questions lors du montage du composant
  useEffect(() => {
    fetch("http://localhost:5000/api/qcm")
      .then((response) => response.json())
      .then((data) => setQuestions(data))
      .catch((error) =>
        console.error("Erreur lors de la récupération des questions :", error)
      );
  }, []);

  // Déclenche le mode édition pour la question sélectionnée
  const startEditing = (q) => {
    // Utilisation de _id car Mongoose retourne habituellement _id
    setEditingQuestionId(q._id);
    setEditedQuestionText(q.question);
    setEditedOptions(q.options || []);
  };

  // Annule l'édition
  const cancelEditing = () => {
    setEditingQuestionId(null);
    setEditedQuestionText("");
    setEditedOptions([]);
  };

  // Sauvegarde les modifications apportées à la question
  const saveEditing = (id) => {
    const updatedQuestion = {
      question: editedQuestionText,
      options: editedOptions,
    };

    fetch(`http://localhost:5000/api/qcm/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        // Remplace la question modifiée dans le state
        const updatedQuestions = questions.map((q) => {
          // On compare avec _id puisque le backend retourne _id
          if (q._id === id) return data;
          return q;
        });
        setQuestions(updatedQuestions);
        cancelEditing();
      })
      .catch((error) =>
        console.error("Erreur lors de la mise à jour de la question :", error)
      );
  };

  // Supprime une question
  const deleteQuestion = (id) => {
    fetch(`http://localhost:5000/api/qcm/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          // On filtre en se basant sur _id
          setQuestions(questions.filter((q) => q._id !== id));
        }
      })
      .catch((error) =>
        console.error("Erreur lors de la suppression de la question :", error)
      );
  };

  // Ajoute une nouvelle question
  const addNewQuestion = () => {
    if (newQuestionText.trim() === "" || newOptionsText.trim() === "") {
      alert("Veuillez remplir le texte de la question et les options.");
      return;
    }
    // Transformation des options depuis une chaîne séparée par des virgules
    const options = newOptionsText
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt !== "");
    if (options.length === 0) {
      alert("Veuillez fournir au moins une option valide.");
      return;
    }
    const newQuestion = {
      question: newQuestionText,
      options,
    };

    fetch("http://localhost:5000/api/qcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        // Ajoute la nouvelle question dans le state
        setQuestions([...questions, data]);
        setNewQuestionText("");
        setNewOptionsText("");
      })
      .catch((error) =>
        console.error("Erreur lors de l'ajout de la question :", error)
      );
  };

  // Fonction pour exporter les questions et options en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Données du QCM", 14, 20);

    // Préparer les colonnes : Numéro, Question, Options
    const tableColumn = ["N°", "Question", "Options"];
    const tableRows = questions.map((q, index) => {
      const optionsText = (q.options || []).join(", ");
      return [index + 1, q.question, optionsText];
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
    <Box sx={{ p: 3, background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Gestion des questions du QCM
        </Typography>
        <Button variant="contained" color="primary" onClick={handleExportPDF}>
          Exporter en PDF
        </Button>
      </Box>
      {questions.map((q) => (
        <Card key={q._id} sx={{ mb: 2 }}>
          <CardContent>
            {editingQuestionId === q._id ? (
              <>
                <TextField
                  fullWidth
                  label="Question"
                  value={editedQuestionText}
                  onChange={(e) => setEditedQuestionText(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Options (séparées par une virgule)"
                  value={(editedOptions || []).join(", ")}
                  onChange={(e) =>
                    setEditedOptions(
                      e.target.value.split(",").map((opt) => opt.trim())
                    )
                  }
                />
              </>
            ) : (
              <>
                <Typography variant="h6">{q.question}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Options: {(q.options || []).join(", ")}
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
                <IconButton onClick={() => deleteQuestion(q._id)} color="secondary">
                  <Delete />
                </IconButton>
              </>
            )}
          </CardActions>
        </Card>
      ))}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Ajouter une nouvelle question
        </Typography>
        <TextField
          fullWidth
          label="Texte de la question"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Options (séparées par une virgule)"
          value={newOptionsText}
          onChange={(e) => setNewOptionsText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" startIcon={<Add />} onClick={addNewQuestion}>
          Ajouter la question
        </Button>
      </Box>
    </Box>
  );
};

export default EvaluationManager;
