// src/pages/Evaluation.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material";

const Evaluation = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // Stocke les réponses pour chaque question
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null); // Note calculée en pourcentage

  // Mapping pour convertir les réponses qualitatives en valeurs numériques
  const ratingMapping = {
    bas: 1,
    moyen: 2,
    haute: 3,
  };

  // Récupération de la liste des employés
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((response) => response.json())
      .then((data) => setEmployees(data))
      .catch((error) =>
        console.error("Erreur lors de la récupération des employés :", error)
      );
  }, []);

  // Récupération des questions du QCM
  useEffect(() => {
    fetch("http://localhost:5000/api/qcm")
      .then((response) => response.json())
      .then((data) => setQuestions(data))
      .catch((error) =>
        console.error("Erreur lors de la récupération des questions :", error)
      );
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // Calculer la note en fonction de la participation
    // Pour chaque question, on suppose que les options proposées sont "bas", "moyen" et "haute"
    let totalPoints = 0;
    let maxPoints = 0;
    questions.forEach((q) => {
      // Récupérer la réponse et la convertir en minuscule pour correspondre au mapping
      const answer = answers[q._id]?.toLowerCase();
      if (answer && ratingMapping[answer] !== undefined) {
        totalPoints += ratingMapping[answer];
      }
      // Chaque question a un score maximal de 3 (pour "haute")
      maxPoints += 3;
    });
    // Calculer le pourcentage
    const computedScore = (totalPoints / maxPoints) * 100;
    setScore(computedScore);
    setSubmitted(true);
    console.log("Employé sélectionné :", selectedEmployee);
    console.log("Réponses soumises :", answers);
    console.log("Note calculée :", computedScore);
    // Vous pouvez ensuite envoyer ces données à votre API si besoin
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
      <Typography variant="h5" gutterBottom>
        Évaluation du QCM
      </Typography>

      {submitted ? (
        <>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Vos réponses ont été soumises pour {selectedEmployee?.firstName}{" "}
            {selectedEmployee?.lastName}.
          </Typography>
          <Typography variant="h6" color="secondary">
            Votre note est : {score.toFixed(2)}%
          </Typography>
        </>
      ) : (
        <>
          {/* Étape de sélection de l'employé */}
          {!selectedEmployee ? (
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) =>
                  `${option.firstName} ${option.lastName}`
                }
                onChange={(event, newValue) => setSelectedEmployee(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Sélectionnez un employé" variant="outlined" />
                )}
              />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Vous évaluez : {selectedEmployee.firstName} {selectedEmployee.lastName}
              </Typography>
              {questions.map((q) => (
                <Box key={q._id} sx={{ mb: 3 }}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {q.question}
                    </FormLabel>
                    <RadioGroup
                      name={`question-${q._id}`}
                      value={answers[q._id] || ""}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                    >
                      {["Bas", "Moyen", "Haute"].map((opt, index) => (
                        <FormControlLabel
                          key={index}
                          value={opt}
                          control={<Radio />}
                          label={opt}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              ))}
              {questions.length > 0 && (
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                  Soumettre mes réponses
                </Button>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default Evaluation;
