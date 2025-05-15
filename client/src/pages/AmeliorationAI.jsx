import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Divider, Alert, Snackbar, IconButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Tooltip, Grid } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Psychology, Download, Refresh, Star, StarBorder, CheckCircle, Error, HourglassEmpty, Assignment } from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import { AuthContext } from '../context/AuthContext';

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
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [aiStatus, setAiStatus] = useState({
    online: false,
    checking: true
  });

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

  // Check if DeepSeek AI is available
  const checkAIStatus = async () => {
    try {
      setAiStatus(prev => ({ ...prev, checking: true }));

      // Check if puter.js is loaded
      if (typeof puter === 'undefined') {
        setAiStatus({ online: false, checking: false });
        return;
      }

      // Check if DeepSeek AI is available
      if (!puter.ai || !puter.ai.chat) {
        setAiStatus({ online: false, checking: false });
        return;
      }

      // Try a simple test call to verify the API is responsive
      try {
        const testResult = await puter.ai.chat("Test connection", {
          model: 'deepseek-chat',
          temperature: 0.1,
          max_tokens: 10
        });

        // If we get a response, the AI is online
        setAiStatus({ online: true, checking: false });
      } catch (error) {
        console.error("Error testing AI connection:", error);
        setAiStatus({ online: false, checking: false });
      }
    } catch (error) {
      console.error("Error checking AI status:", error);
      setAiStatus({ online: false, checking: false });
    }
  };

  // Fetch evaluations and check AI status when component mounts
  useEffect(() => {
    fetchEvaluations();
    checkAIStatus();
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

  // Generate AI report using DeepSeek - DIRECT APPROACH
  const generateAIReport = async () => {
    if (!selectedEvaluationDetails) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner une évaluation',
        severity: 'warning'
      });
      return;
    }

    // Check if AI is available
    if (!aiStatus.online && !aiStatus.checking) {
      // Try to check AI status again
      await checkAIStatus();

      // If still not online, show error
      if (!aiStatus.online) {
        setSnackbar({
          open: true,
          message: 'DeepSeek AI n\'est pas disponible actuellement. Veuillez réessayer plus tard.',
          severity: 'error'
        });
        return;
      }
    }

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

      // Enhanced prompt with personalization, supportive tone, and simpler language
      const systemPrompt = `
Voici les résultats d'évaluation professionnelle de ${firstName}, employé chez Groupe Délice Centre Laitier Nord.

Date: ${selectedEvaluationDetails.formattedDate}
Score global: ${selectedEvaluationDetails.globalScore}/20

Chapitres évalués (chaque chapitre est noté sur 10 points):
${rawChaptersText}

Prends en compte les commentaires du chef pour chaque chapitre. J'ai classifié chaque commentaire comme "positive", "negative", ou "neutral" pour t'aider. Suis ces règles importantes:

1. Pour les commentaires marqués "positive":
   - Tu PEUX les citer directement en les introduisant par "Comme l'a souligné votre chef..." ou une formule similaire.
   - Utilise-les pour renforcer la confiance de l'employé.

2. Pour les commentaires marqués "negative":
   - Ne les cite JAMAIS directement.
   - Reformule-les de manière constructive et positive.
   - Transforme-les en opportunités d'amélioration avec une formulation encourageante.
   - Évite tout langage qui pourrait être perçu comme une critique.

3. Pour les commentaires marqués "neutral":
   - Utilise ton jugement pour les reformuler de manière positive si nécessaire.

4. Pour tous les commentaires:
   - Concentre-toi sur les solutions et les actions concrètes plutôt que sur les problèmes.
   - Propose des conseils pratiques et réalisables.

Génère un rapport d'amélioration de performance personnalisé qui soit motivant et constructif, tout en abordant les points d'amélioration de manière délicate et encourageante.

IMPORTANT:
- Utilise un langage simple et facile à comprendre. Évite les mots compliqués, le jargon technique ou les expressions sophistiquées. Préfère des phrases courtes et directes.

- Formate clairement les titres des chapitres en utilisant le format markdown "## Nom du Chapitre: Score/5" pour qu'ils apparaissent en gras et soient bien visibles.

- Commence par une introduction personnalisée et encourageante qui s'adapte au niveau de performance:
  * Si le score global est élevé (≥ 16/20): Félicite chaleureusement ${firstName} pour son excellence, souligne ses forces exceptionnelles et encourage à maintenir ce niveau tout en visant encore plus haut
  * Si le score global est bon (≥ 14/20 et < 16/20): Félicite ${firstName} pour sa bonne performance, souligne ses points forts et encourage à continuer sur cette voie
  * Si le score global est moyen (≥ 10/20 et < 14/20): Adopte un ton positif et constructif, souligne les points forts tout en présentant les axes d'amélioration comme des opportunités de développement
  * Si le score global est faible (< 10/20): Reste encourageant et bienveillant, évite tout ton négatif ou accusateur, présente les difficultés comme des défis à relever ensemble et mentionne les points positifs même minimes

- Pour chaque chapitre:
  * Commence par les points positifs avant d'aborder les axes d'amélioration
  * Propose des recommandations concrètes, réalisables et personnalisées en utilisant des mots simples
  * Utilise un ton constructif et motivant, jamais critique ou négatif
  * Adapte le ton à la note du chapitre (félicitations pour les notes élevées, encouragement pour les notes faibles)
  * Limite chaque analyse de chapitre à 3-4 phrases maximum pour rester concis et clair

- Termine par un message d'encouragement personnalisé qui renforce la confiance de ${firstName} et sa capacité à progresser

- Si tu ne comprends pas un nom de chapitre, indique-le clairement dans ton rapport
- Analyse chaque chapitre individuellement, même s'il a un nom inhabituel
- Ne fais pas de suppositions sur le contenu d'un chapitre si son nom n'est pas clair
`;

      // Create a simple user payload with raw chapter data
      const userPayload = {
        employeeName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'Collaborateur'),
        firstName: firstName,
        position: user.position || 'Employé',
        evaluationDate: selectedEvaluationDetails.formattedDate,
        globalScore: selectedEvaluationDetails.globalScore,

        // Pass the raw chapters data without any processing
        rawChapters: selectedEvaluationDetails.chapters
      };

      console.log('Preparing AI request with payload:', userPayload);

      // Check if puter.js is loaded
      if (typeof puter === 'undefined') {
        setError('Puter.js n\'est pas disponible. Veuillez rafraîchir la page ou contacter le support.');
        setGenerating(false);
        return;
      }

      // Check if DeepSeek AI is available
      if (!puter.ai || !puter.ai.chat) {
        setError('DeepSeek AI n\'est pas disponible. Veuillez rafraîchir la page ou contacter le support.');
        setGenerating(false);
        return;
      }

      console.log('Calling DeepSeek AI...');

      // Call DeepSeek AI directly with raw chapter names
      console.log('Sending RAW chapter names to DeepSeek AI:', selectedEvaluationDetails.chapters.map(c => c.name));

      // Use a direct API call with optimized parameters for personalized responses
      const result = await puter.ai.chat(systemPrompt, {
        model: 'deepseek-chat',
        temperature: 0.9,  // High temperature for creativity while maintaining coherence
        max_tokens: 3000,
        user: JSON.stringify(userPayload)
      });

      console.log('DeepSeek AI response:', result);

      if (result && result.message && result.message.content) {
        // Use the AI response directly without any modifications
        setReport(result.message.content);
        setSnackbar({
          open: true,
          message: 'Rapport d\'amélioration généré avec succès',
          severity: 'success'
        });
      } else {
        throw new Error('Format de réponse AI invalide');
      }
    } catch (error) {
      console.error('Error generating AI report:', error);
      setError(`Erreur lors de la génération du rapport: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Generate Action Plan using DeepSeek AI
  const generateActionPlan = async () => {
    if (!selectedEvaluationDetails) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner une évaluation',
        severity: 'warning'
      });
      return;
    }

    // Check if AI is available
    if (!aiStatus.online && !aiStatus.checking) {
      // Try to check AI status again
      await checkAIStatus();

      // If still not online, show error
      if (!aiStatus.online) {
        setSnackbar({
          open: true,
          message: 'DeepSeek AI n\'est pas disponible actuellement. Veuillez réessayer plus tard.',
          severity: 'error'
        });
        return;
      }
    }

    try {
      setGeneratingPlan(true);
      setError(null);

      // Prepare user data for the AI
      const firstName = user.firstName || user.name?.split(' ')[0] || 'Collaborateur';
      const department = user.department || selectedEvaluationDetails.employeeDepartment || 'Non spécifié';
      const position = user.position || selectedEvaluationDetails.employeePosition || 'Employé';

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

      // Specialized prompt for action plan
      const actionPlanPrompt = `
Voici les résultats d'évaluation professionnelle de ${firstName}, employé chez Groupe Délice Centre Laitier Nord.

Date: ${selectedEvaluationDetails.formattedDate}
Score global: ${selectedEvaluationDetails.globalScore}/20
Département: ${department}
Poste: ${position}

Chapitres évalués (chaque chapitre est noté sur 10 points):
${rawChaptersText}

Je veux que tu génères un PLAN D'ACTION DÉTAILLÉ et STRUCTURÉ pour aider ${firstName} à améliorer ses compétences professionnelles. Ce plan doit être TRÈS CONCRET avec des étapes précises et des ressources spécifiques.

STRUCTURE DU PLAN D'ACTION:

1. INTRODUCTION
   - Résume brièvement la situation actuelle de ${firstName} en te basant sur son évaluation
   - Présente l'objectif du plan d'action de manière motivante
   - Explique comment ce plan va l'aider à progresser

2. PLAN D'ACTION PAR CHAPITRE
   Pour chaque chapitre ayant un score inférieur à 8/10, crée une section détaillée avec:

   a) DIAGNOSTIC
      - Identifie précisément les compétences à améliorer (basé sur les commentaires du chef)
      - Explique pourquoi ces compétences sont importantes pour son poste

   b) OBJECTIFS SMART
      - Définis 2-3 objectifs spécifiques, mesurables, atteignables, pertinents et temporels

   c) PLAN DE DÉVELOPPEMENT HEBDOMADAIRE (sur 4 semaines)
      - Semaine 1: Actions précises à réaliser (3-5 tâches concrètes)
      - Semaine 2: Actions précises à réaliser (3-5 tâches concrètes)
      - Semaine 3: Actions précises à réaliser (3-5 tâches concrètes)
      - Semaine 4: Actions précises à réaliser (3-5 tâches concrètes)

   d) RESSOURCES SPÉCIFIQUES
      - Cours en ligne GRATUITS (liens précis vers OpenClassrooms, Coursera, edX, YouTube)
      - Livres ou articles (avec titres exacts et auteurs)
      - Outils ou logiciels à maîtriser (avec liens vers tutoriels gratuits)
      - Exercices pratiques à réaliser

3. SUIVI ET ÉVALUATION
   - Propose un système d'auto-évaluation hebdomadaire
   - Suggère des points de contrôle avec le chef
   - Inclus une checklist pour suivre les progrès

CONSIGNES IMPORTANTES:
- Sois ULTRA-SPÉCIFIQUE dans tes recommandations (pas de généralités)
- Adapte le plan au secteur laitier/agroalimentaire quand c'est pertinent
- Pour les compétences techniques mentionnées dans les commentaires (ex: "ne maîtrise pas Excel"), fournis un plan d'apprentissage DÉTAILLÉ

CONCERNANT LES RESSOURCES:

IMPORTANT: NE METS AUCUN LIEN HYPERTEXTE DANS LE DOCUMENT. N'utilise pas d'URLs.

À la place:
- Pour les vidéos: Indique simplement "Rechercher sur YouTube: [titre de la vidéo]"
- Pour les cours: Indique simplement "Rechercher sur Google: [nom du cours]"
- Pour les livres: Mentionne le titre et l'auteur
- Pour les articles: Indique la source et le titre

GARDE LES CHOSES SIMPLES. Ne donne pas de liens ou d'URLs complexes.

- Propose un calendrier réaliste qui tient compte de la charge de travail normale
- Utilise un ton encourageant et positif, jamais condescendant
- Formate le document de manière professionnelle avec des titres, sous-titres et listes à puces

IMPORTANT: Ce plan d'action sera converti en PDF professionnel, alors assure-toi qu'il soit bien structuré, facile à lire et à suivre.
`;

      console.log('Preparing Action Plan AI request...');

      // Check if puter.js is loaded
      if (typeof puter === 'undefined') {
        setError('Puter.js n\'est pas disponible. Veuillez rafraîchir la page ou contacter le support.');
        setGenerating(false);
        return;
      }

      // Check if DeepSeek AI is available
      if (!puter.ai || !puter.ai.chat) {
        setError('DeepSeek AI n\'est pas disponible. Veuillez rafraîchir la page ou contacter le support.');
        setGenerating(false);
        return;
      }

      console.log('Calling DeepSeek AI for Action Plan...');

      // Use a direct API call with optimized parameters for detailed action plan
      const result = await puter.ai.chat(actionPlanPrompt, {
        model: 'deepseek-chat',
        temperature: 0.7,  // Balanced temperature for creativity and precision
        max_tokens: 4000,  // Larger token limit for detailed plan
      });

      console.log('DeepSeek AI Action Plan response received');

      if (result && result.message && result.message.content) {
        // Generate and download the action plan PDF directly
        generateActionPlanPDF(result.message.content);

        setSnackbar({
          open: true,
          message: 'Plan d\'action généré et téléchargé avec succès',
          severity: 'success'
        });
      } else {
        throw new Error('Format de réponse AI invalide');
      }
    } catch (error) {
      console.error('Error generating action plan:', error);
      setError(`Erreur lors de la génération du plan d'action: ${error.message}`);

      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Generate and download the action plan PDF
  const generateActionPlanPDF = (actionPlanContent) => {
    if (!actionPlanContent) return;

    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: 'Plan d\'Action Personnalisé',
      subject: 'Plan d\'amélioration professionnelle',
      author: 'Groupe Délice Centre Laitier Nord',
      keywords: 'plan d\'action, amélioration, performance',
      creator: 'Système GRH'
    });

    // Add header with company name and title
    doc.setFillColor(0, 51, 153); // Dark blue color
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PLAN D\'ACTION PERSONNALISÉ', 105, 15, { align: 'center' });

    doc.setFontSize(14);
    doc.text('GROUPE DÉLICE CENTRE LAITIER NORD', 105, 25, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add employee info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'élaboration: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 20, 45);
    doc.text(`Collaborateur: ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Collaborateur'}`, 20, 52);
    doc.text(`CIN: ${user.cin || selectedEvaluationDetails.employeeCIN || 'Non spécifié'}`, 20, 59);
    doc.text(`Poste: ${user.position || 'Employé'}`, 20, 66);
    doc.text(`Département: ${user.department || selectedEvaluationDetails.employeeDepartment || 'Non spécifié'}`, 20, 73);
    doc.text(`Basé sur l'évaluation du: ${selectedEvaluationDetails.formattedDate}`, 20, 80);
    doc.text(`Score global: ${selectedEvaluationDetails.globalScore}/20`, 20, 87);

    // Add decorative element
    doc.setDrawColor(0, 51, 153);
    doc.setLineWidth(0.5);
    doc.line(20, 95, 190, 95);

    // Process the action plan content
    const lines = actionPlanContent.split('\n');
    let y = 105; // Starting y position
    let currentPage = 1;

    // Function to add a new page
    const addNewPage = () => {
      doc.addPage();
      currentPage++;

      // Add small header to new page
      doc.setFillColor(0, 51, 153);
      doc.rect(0, 0, 210, 15, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN D\'ACTION PERSONNALISÉ', 105, 10, { align: 'center' });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Reset y position for new page
      y = 25;
    };

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if we need a new page
      if (y > 270) {
        addNewPage();
      }

      // Handle different line types
      if (line.startsWith('# ')) {
        // Main heading
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 153);

        const text = line.substring(2);
        const splitText = doc.splitTextToSize(text, 170);

        doc.text(splitText, 20, y);
        y += 8 * splitText.length;

        // Add underline
        doc.setDrawColor(0, 51, 153);
        doc.line(20, y - 2, 190, y - 2);
        y += 5;
      } else if (line.startsWith('## ')) {
        // Subheading
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 153);

        const text = line.substring(3);
        const splitText = doc.splitTextToSize(text, 170);

        doc.text(splitText, 20, y);
        y += 7 * splitText.length;
      } else if (line.startsWith('### ')) {
        // Sub-subheading
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(70, 70, 70);

        const text = line.substring(4);
        const splitText = doc.splitTextToSize(text, 170);

        doc.text(splitText, 20, y);
        y += 6 * splitText.length;
      } else if (line.startsWith('- ')) {
        // Bullet point
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const text = line.substring(2);
        const splitText = doc.splitTextToSize(text, 160);

        doc.text('•', 20, y);
        doc.text(splitText, 25, y);
        y += 5 * splitText.length;
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered list
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const number = line.match(/^\d+/)[0];
        const text = line.substring(number.length + 2);
        const splitText = doc.splitTextToSize(text, 160);

        doc.text(`${number}.`, 20, y);
        doc.text(splitText, 25, y);
        y += 5 * splitText.length;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const text = line.substring(2, line.length - 2);
        const splitText = doc.splitTextToSize(text, 170);

        doc.text(splitText, 20, y);
        y += 5 * splitText.length;
      } else if (line === '---') {
        // Horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 5;
      } else if (line.trim() === '') {
        // Empty line
        y += 3;
      } else {
        // Regular text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Remove any URLs from the text to avoid issues
        const plainText = line.replace(/\*\*(.*?)\*\*/g, '$1')
                              .replace(/(https?:\/\/[^\s]+)/g, '[lien]');

        const splitText = doc.splitTextToSize(plainText, 170);
        doc.text(splitText, 20, y);
        y += 5 * splitText.length;
      }
    }

    // Add footer with page numbers
    const totalPages = currentPage;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} sur ${totalPages} - Groupe Délice Centre Laitier Nord`, 105, 285, { align: 'center' });
    }

    // Save the PDF
    doc.save(`Plan_Action_${user.firstName || 'Employe'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Download report as PDF with improved formatting
  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: 'Rapport d\'Amélioration de Performance',
      subject: 'Évaluation professionnelle',
      author: 'Groupe Délice Centre Laitier Nord',
      keywords: 'évaluation, performance, rapport',
      creator: 'Système GRH'
    });

    // Add header with company name
    doc.setFillColor(0, 51, 102); // Dark blue color
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT D\'AMÉLIORATION DE PERFORMANCE', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('GROUPE DÉLICE CENTRE LAITIER NORD', 105, 22, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add employee info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'évaluation: ${selectedEvaluationDetails.formattedDate}`, 20, 40);
    doc.text(`Collaborateur: ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Collaborateur'}`, 20, 47);
    doc.text(`CIN: ${user.cin || selectedEvaluationDetails.employeeCIN || 'Non spécifié'}`, 20, 54);
    doc.text(`Poste: ${user.position || 'Employé'}`, 20, 61);
    doc.text(`Score global: ${selectedEvaluationDetails.globalScore}/20`, 20, 68);

    // Add horizontal line
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 72, 190, 72);

    // Process the report content
    const lines = report.split('\n');
    let y = 82; // Starting y position (adjusted for the added CIN line)
    let currentPage = 1;

    // Function to add a new page
    const addNewPage = () => {
      doc.addPage();
      currentPage++;

      // Add header to new page
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('RAPPORT D\'AMÉLIORATION DE PERFORMANCE', 105, 10, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      y = 25; // Reset y position for new page
    };

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if we need a new page
      if (y > 270) {
        addNewPage();
      }

      // Handle different line types
      if (line.startsWith('# ')) {
        // Main title - already handled in header
        continue;
      } else if (line.startsWith('## ')) {
        // Section title with improved styling
        // Add background color
        doc.setFillColor(230, 240, 255); // Light blue background
        doc.rect(15, y - 6, 180, 10, 'F');

        // Add border
        doc.setDrawColor(0, 51, 102); // Dark blue border
        doc.setLineWidth(0.5);
        doc.line(15, y + 3, 195, y + 3);

        // Add title text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102); // Dark blue text
        doc.text(line.substring(3), 20, y);

        // Reset text color
        doc.setTextColor(0, 0, 0);
        y += 10;
      } else if (line.startsWith('### ')) {
        // Subsection title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(line.substring(4), 20, y);
        y += 7;
      } else if (line.startsWith('- ')) {
        // Bullet point with improved styling
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Split long bullet points
        const bulletText = line.substring(2);
        const splitText = doc.splitTextToSize(bulletText, 160);

        // Draw a colored bullet point
        doc.setFillColor(0, 102, 204); // Blue bullet
        doc.circle(22, y - 1.5, 1.5, 'F');

        // Add the text with slight indent
        doc.text(splitText, 26, y);

        y += 5 * splitText.length; // Adjust based on number of lines
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered list with improved styling
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const number = line.match(/^\d+/)[0];
        const listText = line.substring(number.length + 2);
        const splitText = doc.splitTextToSize(listText, 160);

        // Draw a colored circle for the number
        doc.setFillColor(0, 51, 102); // Dark blue background
        doc.circle(20, y - 1.5, 6, 'F');

        // Add the number in white
        doc.setTextColor(255, 255, 255); // White text
        doc.setFont('helvetica', 'bold');
        doc.text(`${number}`, 20, y, { align: 'center' });

        // Reset text color and font for the content
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, 28, y);

        y += 5 * splitText.length;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);

        const boldText = line.substring(2, line.length - 2);
        const splitText = doc.splitTextToSize(boldText, 170);

        doc.text(splitText, 20, y);
        y += 5 * splitText.length;
      } else if (line === '---') {
        // Horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 5;
      } else if (line.trim() === '') {
        // Empty line
        y += 3;
      } else {
        // Regular text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Handle inline bold text (not perfect but basic)
        const plainText = line.replace(/\*\*(.*?)\*\*/g, '$1');
        const splitText = doc.splitTextToSize(plainText, 170);

        doc.text(splitText, 20, y);
        y += 5 * splitText.length;
      }
    }

    // Add footer with page numbers
    const totalPages = currentPage;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} sur ${totalPages} - Groupe Délice Centre Laitier Nord`, 105, 285, { align: 'center' });
    }

    // Save the PDF
    doc.save(`Rapport_Amelioration_${user.firstName || 'Employe'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Amélioration de Performance AI
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            DeepSeek AI:
          </Typography>
          {aiStatus.checking ? (
            <Tooltip title="Vérification de la connexion...">
              <HourglassEmpty fontSize="small" color="action" />
            </Tooltip>
          ) : aiStatus.online ? (
            <Tooltip title="DeepSeek AI est connecté et prêt">
              <CheckCircle fontSize="small" color="success" />
            </Tooltip>
          ) : (
            <Tooltip title="DeepSeek AI n'est pas disponible">
              <Error fontSize="small" color="error" />
            </Tooltip>
          )}
          <Tooltip title="Vérifier la connexion à l'IA">
            <IconButton size="small" onClick={checkAIStatus} sx={{ ml: 1 }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Evaluations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Mes Évaluations
              </Typography>
              <Tooltip title="Rafraîchir les évaluations">
                <IconButton
                  size="small"
                  onClick={fetchEvaluations}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
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

        {/* Evaluation Details and Report */}
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
                    color={aiStatus.online ? "primary" : "warning"}
                    startIcon={
                      generating ? <CircularProgress size={20} color="inherit" /> :
                      aiStatus.checking ? <HourglassEmpty /> :
                      aiStatus.online ? <Psychology /> :
                      <Error />
                    }
                    onClick={generateAIReport}
                    disabled={generating || (!aiStatus.online && !aiStatus.checking)}
                    title={
                      !aiStatus.online && !aiStatus.checking ?
                      "DeepSeek AI n'est pas disponible actuellement" :
                      "Générer un rapport d'amélioration personnalisé"
                    }
                  >
                    {generating ? 'Génération en cours...' :
                     aiStatus.checking ? 'Vérification de l\'IA...' :
                     aiStatus.online ? 'Générer Rapport AI' :
                     'IA non disponible'}
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {selectedEvaluationDetails.chapters.map((chapter, index) => (
                        <Card
                          key={index}
                          variant="outlined"
                          sx={{
                            minWidth: 200,
                            cursor: 'pointer',
                            bgcolor: selectedChapter && selectedChapter.name === chapter.name
                              ? alpha(theme.palette.primary.main, 0.1)
                              : 'transparent'
                          }}
                          onClick={() => setSelectedChapter(chapter)}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              {chapter.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Box key={star} sx={{ color: theme.palette.warning.main }}>
                                  {star <= Math.round(chapter.score / 2) ? (
                                    <Star fontSize="small" />
                                  ) : (
                                    <StarBorder fontSize="small" />
                                  )}
                                </Box>
                              ))}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                ({chapter.score}/10)
                              </Typography>
                            </Box>
                            {chapter.comment && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}` }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                  Commentaire du chef:
                                </Typography>
                                <Typography variant="body2" sx={{
                                  fontStyle: 'italic',
                                  fontSize: '0.85rem',
                                  color: alpha(theme.palette.text.primary, 0.8),
                                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                                  p: 1,
                                  borderRadius: 1,
                                  maxHeight: '80px',
                                  overflow: 'auto'
                                }}>
                                  {chapter.comment}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
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
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={generatingPlan ? <CircularProgress size={20} color="inherit" /> : <Assignment />}
                            onClick={generateActionPlan}
                            disabled={generating || generatingPlan || (!aiStatus.online && !aiStatus.checking)}
                            title={
                              !aiStatus.online && !aiStatus.checking ?
                              "DeepSeek AI n'est pas disponible actuellement" :
                              "Générer un plan d'action détaillé"
                            }
                          >
                            {generatingPlan ? 'Génération en cours...' : 'Plan d\'Action'}
                          </Button>
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
                              <strong>CIN:</strong> {selectedEvaluationDetails.employeeCIN || user.cin || 'Non spécifié'}
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
                            <Typography variant="body2">
                              <strong>Département:</strong> {selectedEvaluationDetails.employeeDepartment || user.department || 'Non spécifié'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      <Box sx={{
                        p: 0,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: 'background.paper',
                        overflow: 'hidden'
                      }}>
                        {/* Report content with improved styling */}
                        <Box sx={{
                          p: 3,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1.6,
                          '& h1': {
                            fontSize: '1.8rem',
                            color: theme.palette.primary.main,
                            mb: 2,
                            fontWeight: 700
                          },
                          '& h2': {
                            fontSize: '1.4rem',
                            color: theme.palette.primary.main,
                            mt: 4,
                            mb: 2,
                            fontWeight: 700,
                            borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                            pb: 1,
                            borderRadius: '0 0 4px 0',
                            paddingLeft: '8px',
                            background: alpha(theme.palette.primary.main, 0.05)
                          },
                          '& h3': {
                            fontSize: '1.2rem',
                            color: theme.palette.text.primary,
                            mt: 3,
                            mb: 2,
                            fontWeight: 600
                          },
                          '& p': {
                            mb: 2
                          },
                          '& strong': {
                            color: theme.palette.primary.dark,
                            fontWeight: 600
                          },
                          '& ul, & ol': {
                            pl: 3,
                            mb: 2
                          },
                          '& li': {
                            mb: 1.5,
                            position: 'relative',
                            paddingLeft: '5px'
                          },
                          '& ul li::before': {
                            content: '""',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.main,
                            position: 'absolute',
                            left: '-15px',
                            top: '8px'
                          },
                          '& hr': {
                            my: 3,
                            border: 'none',
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                          }
                        }}>
                          {/* Convert markdown to formatted HTML */}
                          {report.split('\n').map((line, index) => {
                            // Handle headings
                            if (line.startsWith('# ')) {
                              return <Typography key={index} variant="h1">{line.substring(2)}</Typography>;
                            } else if (line.startsWith('## ')) {
                              return <Typography key={index} variant="h2">{line.substring(3)}</Typography>;
                            } else if (line.startsWith('### ')) {
                              return <Typography key={index} variant="h3">{line.substring(4)}</Typography>;
                            }
                            // Handle bold text
                            else if (line.startsWith('**') && line.endsWith('**')) {
                              return <Typography key={index} variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>{line.substring(2, line.length - 2)}</Typography>;
                            }
                            // Handle list items
                            else if (line.startsWith('- ')) {
                              return (
                                <Box key={index} sx={{ display: 'flex', mb: 1, pl: 2 }}>
                                  <Box sx={{ mr: 1 }}>•</Box>
                                  <Typography variant="body1">{line.substring(2)}</Typography>
                                </Box>
                              );
                            }
                            // Handle numbered list items
                            else if (/^\d+\.\s/.test(line)) {
                              const number = line.match(/^\d+/)[0];
                              return (
                                <Box key={index} sx={{ display: 'flex', mb: 1, pl: 2 }}>
                                  <Box sx={{ mr: 1, minWidth: '20px' }}>{number}.</Box>
                                  <Typography variant="body1">{line.substring(number.length + 2)}</Typography>
                                </Box>
                              );
                            }
                            // Handle horizontal rule
                            else if (line === '---') {
                              return <Divider key={index} sx={{ my: 2 }} />;
                            }
                            // Handle empty lines
                            else if (line.trim() === '') {
                              return <Box key={index} sx={{ height: '1rem' }} />;
                            }
                            // Handle regular text
                            else {
                              // Process inline bold text
                              let processedLine = line;
                              const boldMatches = [...processedLine.matchAll(/\*\*(.*?)\*\*/g)];

                              if (boldMatches.length > 0) {
                                return (
                                  <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                                    {processedLine.split(/\*\*(.*?)\*\*/g).map((part, i) => {
                                      // Every odd index is bold text
                                      return i % 2 === 1 ? <strong key={i}>{part}</strong> : part;
                                    })}
                                  </Typography>
                                );
                              }

                              return <Typography key={index} variant="body1" sx={{ mb: 1 }}>{processedLine}</Typography>;
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
