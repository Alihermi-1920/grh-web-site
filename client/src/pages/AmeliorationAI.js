import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Divider, Alert, Snackbar, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Grid } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Psychology, Download } from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { AuthContext } from '../context/AuthContext';
import puterService from '../utils/puterService';

/* global puter */

const AmeliorationAI = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [allEvaluations, setAllEvaluations] = useState([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
  const [selectedEvaluationDetails, setSelectedEvaluationDetails] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  // La variable aiStatus a été supprimée

  // Simple function to fetch evaluations
  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      if (!user || !user._id) {
        setError('Utilisateur non identifié. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      console.log('Fetching evaluations for employee:', user._id);

      // Make API call to get evaluations for this employee
      // Use the full URL with http://localhost:5000 prefix

      // Check if user ID is valid MongoDB ObjectId (24 hex characters)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(user._id);
      console.log('Is valid MongoDB ObjectId:', isValidObjectId);

      if (!isValidObjectId) {
        console.error('Invalid MongoDB ObjectId format:', user._id);
        setError('ID utilisateur invalide. Format incorrect.');
        setLoading(false);
        return;
      }

      console.log('API URL:', `http://localhost:5000/api/evaluationresultat/employee/${user._id}`);
      console.log('User ID type:', typeof user._id);

      let evaluationsData = [];

      try {
        const response = await fetch(`http://localhost:5000/api/evaluationresultat/employee/${user._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache'
          }
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        // Try to get the response text first to see what's coming back
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des évaluations: ${response.status}`);
        }

        // Parse the JSON manually after checking the text
        evaluationsData = responseText ? JSON.parse(responseText) : [];
        console.log('Evaluations data:', evaluationsData);
      } catch (apiError) {
        console.error('API call error:', apiError);
        throw new Error(`Erreur API: ${apiError.message}`);
      }

      if (!evaluationsData || evaluationsData.length === 0) {
        console.log('No evaluations found for this employee');
        setSnackbar({
          open: true,
          message: 'Aucune évaluation trouvée pour cet employé. Veuillez attendre que votre chef effectue une évaluation.',
          severity: 'info'
        });

        // Set empty evaluations array instead of creating mock data
        evaluationsData = [];

        console.log('No evaluations available');
      }

      // Process the evaluations data
      const formattedEvaluations = evaluationsData.map(evaluation => {
        // Process chapter scores - this is the key part
        const chapters = [];

        // Check if chapterScores exists and is an object
        if (evaluation.chapterScores && typeof evaluation.chapterScores === 'object') {
          // Convert the Map/Object to an array of chapter objects
          for (const chapterName in evaluation.chapterScores) {
            if (Object.prototype.hasOwnProperty.call(evaluation.chapterScores, chapterName)) {
              // Get the comment for this chapter if it exists
              const comment = evaluation.chapterComments &&
                              typeof evaluation.chapterComments === 'object' &&
                              Object.prototype.hasOwnProperty.call(evaluation.chapterComments, chapterName)
                              ? evaluation.chapterComments[chapterName]
                              : '';

              chapters.push({
                name: chapterName,
                score: parseFloat(evaluation.chapterScores[chapterName]) || 0,
                comment: comment,
                questions: []
              });
            }
          }
        }

        return {
          id: evaluation._id,
          date: new Date(evaluation.date),
          formattedDate: format(new Date(evaluation.date), 'dd MMMM yyyy', { locale: fr }),
          globalScore: evaluation.globalScore || 0,
          chapters: chapters,
          employeeName: evaluation.employeeName || 'Employé',
          employeePosition: user.position || 'Poste non spécifié',
          employeeCIN: user.cin || 'CIN non spécifié',
          employeeDepartment: user.department || 'Département non spécifié'
        };
      });

      // Sort evaluations by date (newest first)
      formattedEvaluations.sort((a, b) => b.date - a.date);

      console.log('Formatted evaluations:', formattedEvaluations);

      // Update state
      setAllEvaluations(formattedEvaluations);

      // Select the most recent evaluation by default
      if (formattedEvaluations.length > 0) {
        setSelectedEvaluationId(formattedEvaluations[0].id);
        setSelectedEvaluationDetails(formattedEvaluations[0]);

        setSnackbar({
          open: true,
          message: `${formattedEvaluations.length} évaluation(s) trouvée(s)`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      setError(`Erreur: ${error.message}`);

      // Don't create mock data, just show an error message
      console.log('Error occurred, no evaluations will be shown');

      // Set empty evaluations array
      setAllEvaluations([]);
      setSelectedEvaluationId(null);
      setSelectedEvaluationDetails(null);

      setSnackbar({
        open: true,
        message: 'Impossible de récupérer les évaluations. Veuillez réessayer plus tard ou contacter votre administrateur.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // La fonction checkAIStatus a été supprimée

  // Fetch evaluations when component mounts
  useEffect(() => {
    fetchEvaluations();
  }, [user]);

  // Handle evaluation selection
  const handleSelectEvaluation = (evaluationId) => {
    const selectedEval = allEvaluations.find(evaluation => evaluation.id === evaluationId);
    setSelectedEvaluationId(evaluationId);
    setSelectedEvaluationDetails(selectedEval);
    setReport(null); // Clear any existing report
  };

  // Handle snackbar close
  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Generate AI report using GPT-4o via puter.js
  const generateAIReport = async () => {
    if (!selectedEvaluationDetails) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner une évaluation',
        severity: 'warning'
      });
      return;
    }

    // La vérification de l'état de l'IA a été supprimée

    try {
      setGenerating(true);
      setError(null);

      // Prepare user data for the AI
      const firstName = user.firstName || user.name?.split(' ')[0] || 'Collaborateur';

      // Helper function to classify comments as positive, negative, or neutral
      const classifyComment = (comment, score) => {
        if (!comment) return 'neutral';

        // Consider the score as a factor (higher scores likely have positive comments)
        const isHighScore = score >= 7;

        // Look for positive keywords
        const positiveKeywords = [
          'bien', 'bon', 'excellent', 'bravo', 'félicitation', 'super', 'parfait',
          'satisfaisant', 'progrès', 'amélioration', 'positif', 'fort', 'compétent',
          'efficace', 'réussi', 'apprécié', 'qualité', 'force'
        ];

        // Look for negative keywords
        const negativeKeywords = [
          'insuffisant', 'faible', 'mauvais', 'problème', 'difficulté', 'manque',
          'effort', 'attention', 'améliorer', 'décevant', 'insatisfaisant', 'erreur',
          'retard', 'absent', 'négligent', 'incorrect', 'inapproprié', 'doit', 'devrait'
        ];

        // Count occurrences of positive and negative keywords
        const lowerComment = comment.toLowerCase();
        const positiveCount = positiveKeywords.filter(word => lowerComment.includes(word)).length;
        const negativeCount = negativeKeywords.filter(word => lowerComment.includes(word)).length;

        // Classify based on keyword counts and score
        if (positiveCount > negativeCount || (positiveCount === negativeCount && isHighScore)) {
          return 'positive';
        } else if (negativeCount > positiveCount || (positiveCount === negativeCount && !isHighScore)) {
          return 'negative';
        } else {
          return 'neutral';
        }
      };

      // Create a direct, raw prompt that passes chapter names and comments with sentiment
      const rawChaptersText = selectedEvaluationDetails.chapters
        .map(chapter => {
          let text = `- ${chapter.name}: ${chapter.score}/10`;
          if (chapter.comment) {
            const sentiment = classifyComment(chapter.comment, chapter.score);
            text += `\n  Commentaire du chef (${sentiment}): "${chapter.comment}"`;
          }
          return text;
        })
        .join('\n');

      // Créer le prompt pour l'IA
      const systemPrompt = `Tu es un assistant IA spécialisé en ressources humaines, conçu pour aider les employés à progresser.

Voici les informations sur ${firstName} et son évaluation :

Informations Collaborateur
Nom : ${firstName} 
Poste : ${user.position || 'Non spécifié'} (Technicien chez Groupe Délice)
Infos additionnelles : ${user.additionalInfo || 'Aucune'}

Détails de l'Évaluation
Date : ${selectedEvaluationDetails.formattedDate}
Score Global : ${selectedEvaluationDetails.globalScore}/20
Chapitres Évalués (Nom, Note/10, Commentaire du Chef) :
${rawChaptersText}

Ta Mission : Rédiger un rapport d'amélioration clair, concis et motivant pour ${firstName}.

Objectif Principal du Rapport :
Expliquer en termes simples les points forts de ${firstName} et les axes d'amélioration clairs, avec des conseils pratiques pour l'aider à s'épanouir professionnellement.

Structure du Rapport (simple et directe) :

1. Titre : Plan de Progression Personnalisé pour ${firstName}

2. Introduction (2-3 phrases max)
Message positif et encourageant basé sur le score global :
Si score ≥ 15/20 : "Félicitations ${firstName} pour tes excellents résultats ! Ce plan t'aidera à aller encore plus loin."
Si score ≥ 10/20 et < 15/20 : "Beau travail ${firstName} ! Voici quelques pistes pour continuer à développer tes compétences."
Si score < 10/20 : "Ce bilan est une bonne base pour progresser, ${firstName}. Ensemble, identifions comment améliorer tes performances."

3. Analyse par Chapitre (pour chaque chapitre évalué)
# Nom du Chapitre : Note/10

Évaluation du Chapitre (1 phrase) : Analyse toi-même si la note est bonne (≥7/10), moyenne (entre 5/10 et 6/10) ou faible (<5/10).

Si la note est bonne (≥7/10) :
Points Forts (1-2 phrases) : Félicite l'employé et souligne ce qui est bien maîtrisé.

Si la note est moyenne ou faible (<7/10) :
Pistes d'Amélioration (1-2 phrases) : Explique clairement ce qui peut être amélioré, en te basant sur la note et le commentaire du chef.
Actions Suggérées (1-2 actions concrètes) : Propose des actions faciles à mettre en œuvre.
Formation Recommandée (si note <5/10) : Suggère une formation ou ressource en ligne gratuite et facile d'accès.

4. Conseils Clés pour Progresser (2-3 points max)
Identifie les chapitres avec les notes les plus faibles et propose des stratégies d'amélioration prioritaires.
Donne un conseil général motivant adapté au profil global de l'employé.

5. Conclusion (2-3 phrases)
Message d'encouragement final personnalisé et inspirant.
Rappel des points forts et du potentiel de progression.

Consignes Très Importantes pour le Rapport :

Langage Simple et Clair : Utilise des mots de tous les jours, des phrases courtes. Évite le jargon.
Concision : Sois bref et va droit au but. Le rapport doit être facile et rapide à lire.
Ton Positif et Constructif : Sois encourageant. Transforme les points faibles en opportunités d'apprentissage.
Pertinence : Concentre-toi sur ce qui est le plus utile pour ${firstName}.
Ressources de Qualité : Si tu proposes un lien, assure-toi qu'il soit pertinent, gratuit et facile à comprendre.
Pas de Suppositions : Base-toi uniquement sur les informations fournies.

Formatage :
Utilise # uniquement pour les titres principaux et ## pour les sous-titres.
N'utilise pas de symboles comme ###, *, <>, - ou autres caractères spéciaux.
Utilise des phrases simples et directes.
Évite tout formatage complexe.

Exemple de Début de Rapport (Obligatoire) :

Plan de Progression Personnalisé pour ${firstName}

Introduction :
[Adapte cette phrase en fonction du score global, comme indiqué ci-dessus.]

Construis maintenant ce rapport pour ${firstName}.`;
        
      // Proprendre les données pour l'API
      const userPayload = {
        employeeName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'Collaborateur'),
        firstName: firstName,
        position: user.position || 'Employé',
        evaluationDate: selectedEvaluationDetails.formattedDate,
        globalScore: selectedEvaluationDetails.globalScore,
        rawChapters: selectedEvaluationDetails.chapters
      };

      // Générer le rapport via l'API
      const reportContent = await puterService.generateCompletion(systemPrompt, userPayload, {
        model: 'gpt-4o',
        temperature: 0.9,
        max_tokens: 3000
      });

      // Mettre à jour l'état avec le rapport généré
      setReport(reportContent);
      setSnackbar({
        open: true,
        message: 'Rapport d\'amélioration généré avec succès',
        severity: 'success'
      });
    } catch (error) {
      setError(`Erreur lors de la génération du rapport: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Télécharger le rapport en PDF
  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Propriétés du document
    doc.setProperties({
      title: 'Rapport d\'Amélioration de Performance',
      subject: 'Évaluation professionnelle',
      author: 'Groupe Délice Centre Laitier Nord',
      keywords: 'évaluation, performance, rapport',
      creator: 'Système GRH'
    });

    // En-tête avec le nom de l'entreprise
    doc.setFillColor('darkblue'); // Couleur bleu foncé
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor('white'); // Texte blanc
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT D\'AMÉLIORATION DE PERFORMANCE', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('GROUPE DÉLICE CENTRE LAITIER NORD', 105, 22, { align: 'center' });

    // Réinitialiser la couleur du texte
    doc.setTextColor('black');

    // Informations sur l'employé
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'évaluation: ${selectedEvaluationDetails.formattedDate}`, 20, 40);
    doc.text(`Collaborateur: ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Collaborateur'}`, 20, 47);
    doc.text(`Poste: ${user.position || 'Employé'}`, 20, 54);
    doc.text(`Score global: ${selectedEvaluationDetails.globalScore}/20`, 20, 61);

    // Ligne horizontale
    doc.setDrawColor('darkblue');
    doc.line(20, 65, 190, 65);

    // Traiter le contenu du rapport
    const lines = report.split('\n');
    let y = 75;
    let currentPage = 1;

    // Fonction pour ajouter une nouvelle page
    const addNewPage = () => {
      doc.addPage();
      currentPage++;

      // Ajouter un en-tête à la nouvelle page
      doc.setFillColor('darkblue');
      doc.rect(0, 0, 210, 15, 'F');

      doc.setTextColor('white');
      doc.setFontSize(12);
      doc.text('RAPPORT D\'AMÉLIORATION DE PERFORMANCE', 105, 10, { align: 'center' });

      doc.setTextColor('black');
      y = 25; // Réinitialiser la position y pour la nouvelle page
    };

    // Traiter chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Vérifier si nous avons besoin d'une nouvelle page
      if (y > 270) {
        addNewPage();
      }

      // Gérer différents types de lignes
      if (line.startsWith('# ')) {
        // Titre principal - déjà traité dans l'en-tête
        continue;
      } else if (line.startsWith('## ')) {
        // Titre de section simplifié
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor('black');
        doc.text(line.substring(3), 20, y);

        // Réinitialiser la couleur du texte
        doc.setTextColor('black');
        y += 10;
      } else if (line.startsWith('- ')) {
        // Puce simplifiée
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Diviser les longues puces
        const bulletText = line.substring(2);
        const splitText = doc.splitTextToSize(bulletText, 160);

        // Texte avec une légère indentation sans puce colorée
        doc.text('•', 20, y);
        doc.text(splitText, 26, y);

        y += 5 * splitText.length; // Ajuster en fonction du nombre de lignes
      } else if (line.trim() === '') {
        // Ligne vide
        y += 3;
      } else {
        // Texte normal
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const plainText = line.replace(/\*\*(.*?)\*\*/g, '$1');
        const splitText = doc.splitTextToSize(plainText, 170);

        doc.text(splitText, 20, y);
        y += 5 * splitText.length;
      }
    }

    // Ajouter un pied de page avec des numéros de page
    const totalPages = currentPage;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor('gray');
      doc.text(`Page ${i} sur ${totalPages} - Groupe Délice Centre Laitier Nord`, 105, 285, { align: 'center' });
    }

    // Enregistrer le PDF
    doc.save(`Rapport_Amelioration_${user.firstName || 'Employe'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Amélioration de Performance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Liste des évaluations */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Mes Évaluations
              </Typography>
              {/* Icône de rafraîchissement supprimée */}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : allEvaluations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Aucune évaluation disponible
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Vous n'avez pas encore été évalué par votre chef.
                  Les évaluations apparaîtront ici une fois qu'elles seront effectuées.
                </Typography>
              </Box>
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
                      <TableRow
                        key={evaluation.id}
                        selected={selectedEvaluationId === evaluation.id}
                        sx={{
                          cursor: 'pointer',
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          }
                        }}
                        onClick={() => handleSelectEvaluation(evaluation.id)}
                      >
                        <TableCell>{evaluation.formattedDate}</TableCell>
                        <TableCell>{evaluation.globalScore}/20</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant={selectedEvaluationId === evaluation.id ? "contained" : "outlined"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvaluation(evaluation.id);
                            }}
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

        {/* Détails de l'évaluation et rapport */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            {selectedEvaluationDetails ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Détails de l'Évaluation du {selectedEvaluationDetails.formattedDate}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Psychology />}
                    onClick={generateAIReport}
                    disabled={generating}
                    title="Générer un rapport d'amélioration personnalisé"
                  >
                    {generating ? 'Génération...' : 'Générer Rapport AI'}
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Score Global:</strong> {selectedEvaluationDetails.globalScore}/20
                  </Typography>

                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    <strong>Chapitres évalués:</strong>
                  </Typography>

                  {selectedEvaluationDetails.chapters && selectedEvaluationDetails.chapters.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Chapitre</strong></TableCell>
                            <TableCell><strong>Score</strong></TableCell>
                            <TableCell><strong>Commentaire du chef</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEvaluationDetails.chapters.map((chapter, index) => (
                            <TableRow 
                              key={index}
                              onClick={() => setSelectedChapter(chapter)}
                              sx={{ 
                                cursor: 'pointer'
                              }}
                            >
                              <TableCell>{chapter.name}</TableCell>
                              <TableCell>{chapter.score}/10</TableCell>
                              <TableCell>
                                {chapter.comment || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Aucun chapitre d'évaluation disponible
                    </Alert>
                  )}
                </Box>

                {report && (
                  <Box sx={{ mt: 4 }}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                            Rapport d'Amélioration de Performance
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">
                            GROUPE DÉLICE CENTRE LAITIER NORD
                          </Typography>
                        </Box>
                        <Box>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Download />}
                            onClick={handleDownloadPDF}
                          >
                            Télécharger PDF
                          </Button>
                        </Box>
                      </Box>

                      <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 1, mb: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Collaborateur:</strong> {selectedEvaluationDetails.employeeName || user.name || 'Non spécifié'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Poste:</strong> {selectedEvaluationDetails.employeePosition || user.position || 'Non spécifié'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Date d'évaluation:</strong> {selectedEvaluationDetails.formattedDate}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Score global:</strong> {selectedEvaluationDetails.globalScore}/20
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      <Box sx={{
                        p: 3,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: 'background.paper',
                        overflow: 'hidden'
                      }}>
                        {/* Contenu du rapport avec style simple */}
                        <Box sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1.6
                        }}>
                          {/* Convertir le texte en paragraphes */}
                          {report.split('\n').map((line, index) => {
                            // Gérer les titres
                            if (line.startsWith('# ')) {
                              return <Typography key={index} variant="h4" sx={{ mb: 2, color: theme.palette.primary.main }}>{line.substring(2)}</Typography>;
                            } else if (line.startsWith('## ')) {
                              return <Typography key={index} variant="h5" sx={{ mt: 3, mb: 2, color: theme.palette.primary.main }}>{line.substring(3)}</Typography>;
                            } else if (line.startsWith('### ')) {
                              // Suppression du formatage spécial pour les titres de niveau 3
                              return <Typography key={index} variant="body1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{line.substring(4)}</Typography>;
                            }
                            // Gérer les puces
                            else if (line.startsWith('- ')) {
                              return (
                                <Typography key={index} variant="body1" sx={{ mb: 1, pl: 2 }}>
                                  {line.substring(2)}
                                </Typography>
                              );
                            }
                            // Gérer les lignes vides
                            else if (line.trim() === '') {
                              return <Box key={index} sx={{ height: '0.5rem' }} />;
                            }
                            // Gérer le texte normal
                            else {
                              return <Typography key={index} variant="body1" sx={{ mb: 1 }}>{line}</Typography>;
                            }
                          })}
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </>
            ) : allEvaluations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Aucune évaluation disponible
                </Alert>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Vous n'avez pas encore été évalué
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '80%', mx: 'auto', mb: 3 }}>
                  Votre chef doit d'abord effectuer une évaluation de vos performances.
                  Une fois l'évaluation complétée, vous pourrez générer un rapport d'amélioration personnalisé.
                </Typography>
                <Box
                  component="img"
                  src="/evaluation-placeholder.svg"
                  alt="Pas d'évaluation"
                  sx={{
                    width: '60%',
                    maxWidth: 250,
                    opacity: 0.7,
                    filter: theme.palette.mode === 'dark' ? 'invert(0.8)' : 'none'
                  }}
                />
              </Box>
            ) : (
              <Alert severity="info">
                Veuillez sélectionner une évaluation pour voir les détails et générer un rapport
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AmeliorationAI;
