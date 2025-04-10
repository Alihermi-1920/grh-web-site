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
  Alert,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Evaluation = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [globalScore, setGlobalScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("");
  const [chapterComments, setChapterComments] = useState({});

  // Récupération de la liste des employés
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des employés");
      });
  }, []);

  // Récupération des questions du QCM
  useEffect(() => {
    fetch("http://localhost:5000/api/qcm")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des questions");
      });
  }, []);

  // Regroupement des questions par chapitre
  const groupedQuestions = questions.reduce((acc, q) => {
    const chap = q.chapter || "Non défini";
    if (!acc[chap]) acc[chap] = [];
    acc[chap].push(q);
    return acc;
  }, {});

  // Nombre total de chapitres
  const numChapters = Object.keys(groupedQuestions).length;
  
  // Points par chapitre (total de 20 points répartis équitablement)
  const pointsPerChapter = numChapters > 0 ? 20 / numChapters : 0;

  // Gestion du changement de réponse pour une question
  const handleAnswerChange = (chapter, questionId, noteValue) => {
    setAnswers((prev) => ({
      ...prev,
      [chapter]: { ...prev[chapter], [questionId]: noteValue },
    }));
  };

  // Gestion des commentaires par chapitre
  const handleCommentChange = (chapter, comment) => {
    setChapterComments((prev) => ({
      ...prev,
      [chapter]: comment,
    }));
  };

  // Calcul du score actuel pour un chapitre spécifique
  const calculateCurrentChapterScore = (chapter) => {
    const chapterQuestions = groupedQuestions[chapter] || [];
    const chapterAnswers = answers[chapter] || {};
    
    // Total des points obtenus pour ce chapitre
    const obtainedPoints = chapterQuestions.reduce(
      (sum, q) => sum + (chapterAnswers[q._id] || 0),
      0
    );
    
    // Total des points possibles pour ce chapitre
    const totalPossiblePoints = chapterQuestions.length * 5;
    
    // Conversion sur le barème du chapitre (pointsPerChapter)
    return totalPossiblePoints > 0
      ? (obtainedPoints / totalPossiblePoints) * pointsPerChapter
      : 0;
  };

  // Calcul des scores et envoi des résultats via l'API
  const handleSubmit = async () => {
    setError("");
    
    // Vérifier que la période d'évaluation a été renseignée
    if (!periode.trim()) {
      setError("Veuillez renseigner la période d'évaluation (ex: 2025-04).");
      return;
    }

    // Vérifier que toutes les questions ont été répondues
    let allQuestionsAnswered = true;
    Object.entries(groupedQuestions).forEach(([chapter, qs]) => {
      qs.forEach((q) => {
        if (answers[chapter]?.[q._id] === undefined) {
          allQuestionsAnswered = false;
        }
      });
    });

    if (!allQuestionsAnswered) {
      setError("Veuillez répondre à toutes les questions avant de soumettre l'évaluation.");
      return;
    }

    const computedResults = {};
    let globalObtained = 0;

    // Pour chaque chapitre, calculer le score en fonction des réponses
    Object.entries(groupedQuestions).forEach(([chapter, qs]) => {
      let totalObtained = 0;
      let chapterTotalPossible = qs.length * 5; // Chaque question vaut 5 points maximum

      qs.forEach((q) => {
        totalObtained += answers[chapter]?.[q._id] || 0;
      });

      // Conversion du score du chapitre sur la pondération attribuée (pointsPerChapter)
      const chapterScore =
        chapterTotalPossible > 0
          ? (totalObtained / chapterTotalPossible) * pointsPerChapter
          : 0;
          
      computedResults[chapter] = parseFloat(chapterScore.toFixed(2));
      globalObtained += chapterScore;
    });

    const overall = parseFloat(globalObtained.toFixed(2)); // Score global sur 20

    setResults(computedResults);
    setGlobalScore(overall);
    setSubmitted(true);

    // Préparation du payload incluant la période d'évaluation et les commentaires
    const payload = {
      employeeId: selectedEmployee._id,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      periode,
      chapterScores: computedResults,
      globalScore: overall,
      chapterComments: chapterComments,
    };

    // Envoi du payload vers la route POST /api/evaluationresultat
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/evaluationresultat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur serveur");
      }
    } catch (err) {
      console.error("Erreur enregistrement :", err);
      setError(err.message || "Une erreur s'est produite lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  // Fonction de génération du rapport PDF détaillé
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Titre et informations générales
    doc.setFontSize(20);
    doc.text("Rapport d'Évaluation", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Employé : ${selectedEmployee.firstName} ${selectedEmployee.lastName}`, 20, 35);
    doc.text(`Période : ${periode}`, 20, 45);
    doc.text(`Note Globale : ${globalScore} / 20 points`, 20, 55);

    // Ajout d'une ligne de séparation
    doc.line(20, 60, 190, 60);
    
    // Préparation d'un tableau pour le détail par chapitre
    const tableColumns = ["Chapitre", "Score obtenu", "Score max"];
    const tableRows = Object.entries(results).map(([chap, score]) => {
      return [chap, score.toString(), pointsPerChapter.toFixed(2)];
    });

    // Ajout du tableau des scores
    autoTable(doc, {
      startY: 70,
      head: [tableColumns],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    });

    // Position Y après le tableau des scores
    let yPosition = doc.lastAutoTable.finalY + 20;
    
    // Ajout des commentaires par chapitre
    doc.setFontSize(14);
    doc.text("Commentaires par chapitre", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    Object.entries(chapterComments).forEach(([chapter, comment]) => {
      if (comment && comment.trim() !== "") {
        // Vérifier si on a assez d'espace sur la page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text(`${chapter}:`, 20, yPosition);
        yPosition += 6;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Fractionner le commentaire en lignes pour éviter le débordement
        const splitText = doc.splitTextToSize(comment, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += (splitText.length * 5) + 10;
      }
    });

    // Pied de page avec date d'évaluation
    const date = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Document généré le ${date}`, 105, 280, { align: "center" });

    // Envoi du rapport
    doc.save(`evaluation_${selectedEmployee.lastName}_${periode}.pdf`);
  };

  const handleNewEvaluation = () => {
    setSelectedEmployee(null);
    setAnswers({});
    setResults({});
    setGlobalScore(null);
    setSubmitted(false);
    setError("");
    setPeriode("");
    setChapterComments({});
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: "#1976d2", fontWeight: 500 }}>
        Évaluation des Compétences
      </Typography>

      {!selectedEmployee ? (
        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Sélection de l'employé
            </Typography>
            <Autocomplete
              options={employees}
              getOptionLabel={(opt) => `${opt.firstName} ${opt.lastName}`}
              onChange={(_, v) => setSelectedEmployee(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sélectionnez un employé"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            icon={false}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Évaluation de : {selectedEmployee.firstName} {selectedEmployee.lastName}
            </Typography>
          </Alert>

          {!submitted && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Barème : {numChapters > 0 ? 
                  `Chaque chapitre vaut ${pointsPerChapter.toFixed(2)} points (total: 20 points)` :
                  "Chargement du barème..."}
              </Typography>
              
              <TextField
                fullWidth
                label="Période d'évaluation"
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                sx={{ mb: 3, mt: 1 }}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>
          )}
        </>
      )}

      {selectedEmployee && !submitted && (
        <>
          {Object.entries(groupedQuestions).map(([chapter, qs]) => {
            // Calcul du score actuel du chapitre
            const rawChapterScore = qs.reduce(
              (acc, q) => acc + (answers[chapter]?.[q._id] || 0),
              0
            );
            const chapterTotalPossible = qs.length * 5;
            
            // Score convertit sur la partie du chapitre des 20 points
            const adjustedScore = calculateCurrentChapterScore(chapter);
            
            // Pourcentage pour la barre de progression
            const progressPercent = (rawChapterScore / chapterTotalPossible) * 100;

            return (
              <Card 
                key={chapter} 
                sx={{ 
                  mb: 4, 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #e0e0e0"
                }}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" color="primary">
                        {chapter}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progressPercent} 
                          sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                          {adjustedScore.toFixed(2)} / {pointsPerChapter.toFixed(2)} points
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />

                  {qs.map((q, index) => (
                    <Box 
                      key={q._id} 
                      sx={{ 
                        mb: 3, 
                        p: 2, 
                        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "transparent",
                        borderRadius: 1 
                      }}
                    >
                      <FormControl component="fieldset" fullWidth>
                        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                          {q.question}
                        </FormLabel>
                        <RadioGroup
                          row
                          value={answers[chapter]?.[q._id] ?? ""}
                          onChange={(e) => handleAnswerChange(chapter, q._id, Number(e.target.value))}
                        >
                          {q.options.map((opt, i) => (
                            <FormControlLabel
                              key={i}
                              value={opt.note}
                              control={<Radio color="primary" />}
                              label={`${opt.text} (${opt.note} pts)`}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Box>
                  ))}
                  
                  {/* Zone de commentaire pour chaque chapitre */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed #e0e0e0" }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: "#555" }}>
                      Commentaire du responsable pour ce chapitre:
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      placeholder="Saisissez votre commentaire ou vos observations concernant ce chapitre..."
                      value={chapterComments[chapter] || ""}
                      onChange={(e) => handleCommentChange(chapter, e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleSubmit} 
            disabled={loading}
            sx={{ px: 4, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : "Soumettre l'évaluation"}
          </Button>
        </>
      )}

      {submitted && (
        <Box sx={{ mt: 4 }}>
          <Alert 
            severity="success" 
            sx={{ mb: 4, p: 2 }}
          >
            <Typography variant="subtitle1">
              Évaluation soumise et enregistrée avec succès !
            </Typography>
          </Alert>
          
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: "#1976d2" }}>
                Résultats de l'évaluation
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={3}>
                {Object.entries(results).map(([chap, score]) => (
                  <Grid item xs={12} md={6} key={chap}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {chap}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(score / pointsPerChapter) * 100} 
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {score} / {pointsPerChapter.toFixed(2)} pts
                        </Typography>
                      </Box>
                      
                      {chapterComments[chap] && (
                        <Box sx={{ mt: 1, p: 1.5, bgcolor: "#f8f8f8", borderRadius: 1, fontSize: "0.9rem" }}>
                          <Typography variant="caption" color="text.secondary">
                            Commentaire:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {chapterComments[chap]}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Note Globale: {globalScore} / 20
                </Typography>
                <Typography variant="subtitle1">
                  Période d'évaluation: {periode}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "space-between" }}>
            <Button variant="outlined" onClick={handleNewEvaluation} size="large">
              Nouvelle évaluation
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleExportPDF}
              size="large"
              sx={{ px: 3 }}
            >
              Exporter le rapport PDF
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Evaluation;