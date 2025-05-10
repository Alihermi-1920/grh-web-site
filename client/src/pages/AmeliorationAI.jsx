import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Divider, Alert, Snackbar, IconButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid'; // Import Grid separately to avoid deprecation warning
import { alpha, useTheme } from '@mui/material/styles';
import { Psychology, Download, Refresh, Star, StarBorder } from '@mui/icons-material';
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
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
              chapters.push({
                name: chapterName,
                score: parseFloat(evaluation.chapterScores[chapterName]) || 0,
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

    try {
      setGenerating(true);
      setError(null);

      // Prepare user data for the AI
      const firstName = user.firstName || user.name?.split(' ')[0] || 'Collaborateur';

      // Create a direct, raw prompt that passes chapter names without processing
      const rawChaptersText = selectedEvaluationDetails.chapters
        .map(chapter => `- ${chapter.name}: ${chapter.score}/5`)
        .join('\n');

      // This prompt is intentionally simple to ensure we're getting raw AI responses
      const systemPrompt = `
Voici les résultats d'évaluation professionnelle de ${firstName}, employé chez Groupe Délice Centre Laitier Nord.

Date: ${selectedEvaluationDetails.formattedDate}
Score global: ${selectedEvaluationDetails.globalScore}/20

Chapitres évalués:
${rawChaptersText}

Génère un rapport d'amélioration de performance personnalisé basé UNIQUEMENT sur ces chapitres.

IMPORTANT:
- Si tu ne comprends pas un nom de chapitre, indique-le clairement dans ton rapport
- Analyse chaque chapitre individuellement, même s'il a un nom inhabituel
- Ne fais pas de suppositions sur le contenu d'un chapitre si son nom n'est pas clair
- Sois honnête si un nom de chapitre te semble inventé ou non standard
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

      // Use a direct API call with minimal parameters to ensure we get raw AI responses
      const result = await puter.ai.chat(systemPrompt, {
        model: 'deepseek-chat',
        temperature: 1.0,  // Maximum temperature for creativity
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
        // Section title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(line.substring(3), 20, y);
        y += 8;
      } else if (line.startsWith('### ')) {
        // Subsection title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(line.substring(4), 20, y);
        y += 7;
      } else if (line.startsWith('- ')) {
        // Bullet point
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Split long bullet points
        const bulletText = line.substring(2);
        const splitText = doc.splitTextToSize(bulletText, 160);

        doc.text('•', 20, y);
        doc.text(splitText, 25, y);

        y += 5 * splitText.length; // Adjust based on number of lines
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered list
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const number = line.match(/^\d+/)[0];
        const listText = line.substring(number.length + 2);
        const splitText = doc.splitTextToSize(listText, 160);

        doc.text(`${number}.`, 20, y);
        doc.text(splitText, 25, y);

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
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Amélioration de Performance AI
      </Typography>

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
                    color="primary"
                    startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <Psychology />}
                    onClick={generateAIReport}
                    disabled={generating}
                  >
                    {generating ? 'Génération en cours...' : 'Générer Rapport AI'}
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
                                  {star <= Math.round(chapter.score) ? (
                                    <Star fontSize="small" />
                                  ) : (
                                    <StarBorder fontSize="small" />
                                  )}
                                </Box>
                              ))}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                ({chapter.score}/5)
                              </Typography>
                            </Box>
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
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Download />}
                          onClick={handleDownloadPDF}
                        >
                          Télécharger PDF
                        </Button>
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
                            color: theme.palette.primary.dark,
                            mt: 4,
                            mb: 2,
                            fontWeight: 600,
                            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            pb: 1
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
                            mb: 1
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
