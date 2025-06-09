import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Divider, Alert, Snackbar, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Grid } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Psychology, Download } from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { AuthContext } from '../context/AuthContext';
import puterService from '../utils/puterService';

const AmeliorationAI = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { firstName } = useContext(AuthContext);


  const [allEvaluations, setAllEvaluations] = useState([]);
  const [selectedEvaluationDetails, setSelectedEvaluationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch evaluations from server
  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/evaluationresultat/employee/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const evaluationsData = await response.json();

      // Format evaluations data
      const formattedEvaluations = evaluationsData.map(evaluation => {
        const chapters = [];
        
        if (evaluation.chapterScores) {
          for (const chapterName in evaluation.chapterScores) {
            const comment = evaluation.chapterComments ? evaluation.chapterComments[chapterName] : '';
            
            chapters.push({
              name: chapterName,
              score: evaluation.chapterScores[chapterName],
              comment: comment
            });
          }
        }

        return {
          id: evaluation._id,
          date: new Date(evaluation.date),
          formattedDate: format(new Date(evaluation.date), 'dd MMMM yyyy', { locale: fr }),
          globalScore: evaluation.globalScore,
          chapters: chapters,
          employeeName: evaluation.employeeName || user.name
        };
      });

      setAllEvaluations(formattedEvaluations);
      
      if (formattedEvaluations.length > 0) {
        setSelectedEvaluationDetails(formattedEvaluations[0]);
      }
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des évaluations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [user]);

  // Select evaluation
  const handleSelectEvaluation = (evaluationId) => {
    const selectedEval = allEvaluations.find(evaluation => evaluation.id === evaluationId);
    setSelectedEvaluationDetails(selectedEval);
    setReport(null);
  };

  // Generate AI report
  const generateAIReport = async () => {
    if (!selectedEvaluationDetails) return;

    try {
      setGenerating(true);
      
      const firstName = user.firstName || user.name?.split(' ')[0] || 'Collaborateur';

      // Prepare chapters text for AI
      const chaptersText = selectedEvaluationDetails.chapters
        .map(chapter => {
          let text = `- ${chapter.name}: ${chapter.score}/10`;
          if (chapter.comment) {
            text += `\n  Commentaire du chef: "${chapter.comment}"`;
          }
          return text;
        })
        .join('\n');

      // Create AI prompt
const systemPrompt = `Tu es un expert en développement professionnel avec une intelligence exceptionnelle pour analyser les situations individuelles. Tu crées des plans personnalisés qui s'adaptent parfaitement à chaque personne.

MISSION: Analyser complètement la situation de ${firstName} et créer un plan d'amélioration sur mesure qui le rendra heureux et confiant.

DONNEES A ANALYSER:
Employé: ${firstName}
Poste: ${user.position || 'Employé'}
Date: ${selectedEvaluationDetails.formattedDate}
Score global: ${selectedEvaluationDetails.globalScore}/20

Détails de l'évaluation:
${chaptersText}

INTELLIGENCE ADAPTATIVE REQUISE:

1. DIAGNOSTIC INTELLIGENT:
- Évalue le niveau réel de difficulté de chaque problème
- Détermine combien de temps il faut VRAIMENT pour s'améliorer
- Identifie les priorités selon l'urgence et l'impact
- Comprends le contexte professionnel de ${firstName}

2. ANALYSE CONTEXTUELLE:
- Utilise TOUS les indices disponibles (noms des chapitres, commentaires, score global, poste)
- Déduis le type de travail et les outils utilisés
- Identifie les connexions entre les différents problèmes
- Comprends les forces existantes pour construire dessus

3. PERSONNALISATION TOTALE:
- Adapte le niveau de détail selon la complexité du problème
- Détermine la durée réaliste pour chaque amélioration (peut être 2 semaines, 6 mois, 1 an)
- Choisis les méthodes d'apprentissage qui conviennent le mieux
- Ajuste le ton selon le score (encourageant si très faible, challengeant si bon)

4. INTELLIGENCE EMOTIONNELLE:
- Commence par rassurer et encourager ${firstName}
- Montre que ses difficultés sont normales et surmontables
- Utilise un ton chaleureux et bienveillant
- Termine par une vision positive de son avenir professionnel

LIBERTE CREATIVE TOTALE:

Tu peux:
- Créer des plans de 1 semaine à 2 ans selon les besoins
- Proposer 1 action par jour ou 1 action par mois selon la complexité
- Recommander des ressources gratuites ou payantes selon la valeur
- Suggérer des formations courtes ou longues selon les objectifs
- Adapter complètement la structure selon les besoins de ${firstName}

EXEMPLES D'INTELLIGENCE ADAPTATIVE:

Si Excel score 3/10 ET commentaire "formules complexes difficiles":
- Diagnostic: Problème avancé, besoin formation structurée
- Durée: 4-6 mois pour maîtrise solide
- Approche: Formation progressive avec pratique intensive

Si Excel score 6/10 ET commentaire "quelques erreurs de calcul":
- Diagnostic: Bases acquises, besoin de précision
- Durée: 3-4 semaines pour correction
- Approche: Révision ciblée et méthodes de vérification

Si "Logiciel" score faible MAIS autres indices montrent travail comptable:
- Diagnostic: Probablement logiciel de comptabilité
- Recherche des formations spécifiques comptabilité
- Durée selon complexité du logiciel

STRUCTURE LIBRE:
Crée la structure qui convient le mieux à ${firstName}. Tu peux organiser par:
- Priorités (urgent vs important)
- Chronologie (court terme vs long terme)  
- Domaines (technique vs relationnel)
- Ou toute autre logique qui aide ${firstName}

OBJECTIF SUPREME: 
${firstName} doit fermer ce rapport en se disant "Wow, cette personne me comprend vraiment et je sais exactement quoi faire. Je me sens capable de réussir !"

CONTRAINTES:
- Utilise un français simple et chaleureux
- Sois précis sans être technique
- Reste positif et encourageant
- Donne des conseils qu'il peut vraiment suivre
- Fais-le se sentir valorisé et capable

Maintenant, utilise toute ton intelligence pour créer le plan parfait pour ${firstName}.`;
      // Generate report using AI
      const reportContent = await puterService.generateCompletion(systemPrompt, {
        employeeName: firstName,
        globalScore: selectedEvaluationDetails.globalScore,
        chapters: selectedEvaluationDetails.chapters
      }, {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000
      });

      setReport(reportContent);
      setSnackbar({
        open: true,
        message: 'Rapport généré avec succès',
        severity: 'success'
      });
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la génération du rapport',
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Download PDF report
  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 0, 139);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('RAPPORT D\'AMÉLIORATION', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('GROUPE DÉLICE', 105, 22, { align: 'center' });

    // Employee info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Employé: ${selectedEvaluationDetails.employeeName}`, 20, 40);
    doc.text(`Date: ${selectedEvaluationDetails.formattedDate}`, 20, 47);
    doc.text(`Score: ${selectedEvaluationDetails.globalScore}/20`, 20, 54);

    // Report content
    const lines = report.split('\n');
    let y = 65;

    lines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (line.startsWith('# ')) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(line.substring(2), 20, y);
        y += 8;
      } else if (line.trim() !== '') {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(line, 170);
        doc.text(splitText, 20, y);
        y += 5 * splitText.length;
      } else {
        y += 3;
      }
    });

    doc.save(`Rapport_${firstName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Amélioration de Performance
      </Typography>

      <Grid container spacing={3}>
        {/* Evaluations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mes Évaluations
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allEvaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>{evaluation.formattedDate}</TableCell>
                        <TableCell>{evaluation.globalScore}/20</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSelectEvaluation(evaluation.id)}
                          >
                            Sélectionner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Evaluation Details and Report */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            {selectedEvaluationDetails ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Évaluation du {selectedEvaluationDetails.formattedDate}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Psychology />}
                    onClick={generateAIReport}
                    disabled={generating}
                  >
                    {generating ? 'Génération...' : 'Générer Rapport AI'}
                  </Button>
                </Box>

                <Typography variant="body1" gutterBottom>
                  <strong>Score Global:</strong> {selectedEvaluationDetails.globalScore}/20
                </Typography>

                {/* Chapters Table */}
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Chapitre</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Commentaire</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEvaluationDetails.chapters.map((chapter, index) => (
                        <TableRow key={index}>
                          <TableCell>{chapter.name}</TableCell>
                          <TableCell>{chapter.score}/10</TableCell>
                          <TableCell>{chapter.comment || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* AI Report */}
                {report && (
                  <Box sx={{ mt: 3 }}>
                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h5" color="primary">
                          Rapport d'Amélioration
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={handleDownloadPDF}
                        >
                          Télécharger PDF
                        </Button>
                      </Box>

                      <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {report.split('\n').map((line, index) => {
                          if (line.startsWith('# ')) {
                            return <Typography key={index} variant="h4" sx={{ mb: 2, color: 'primary.main' }}>{line.substring(2)}</Typography>;
                          } else if (line.startsWith('## ')) {
                            return <Typography key={index} variant="h5" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>{line.substring(3)}</Typography>;
                          } else if (line.trim() === '') {
                            return <Box key={index} sx={{ height: '0.5rem' }} />;
                          } else {
                            return <Typography key={index} variant="body1" sx={{ mb: 1 }}>{line}</Typography>;
                          }
                        })}
                      </Box>
                    </Paper>
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">
                Sélectionnez une évaluation pour voir les détails
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AmeliorationAI;