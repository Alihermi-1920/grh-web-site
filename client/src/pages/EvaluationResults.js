// src/pages/EvaluationResults.js
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
// Source: https://mui.com/material-ui/react-box/
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
// Source: https://mui.com/material-ui/material-icons/
import {
  Assessment,
  Search,
  Person,
  PictureAsPdf
} from "@mui/icons-material";
import { format } from 'date-fns';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EvaluationResults = () => {
  const { user } = useContext(AuthContext);

  // Générer dynamiquement les années pour le filtre (année courante et 4 années précédentes)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Ajouter l'année courante et les 4 années précédentes
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    
    return years;
  };

  // Générer les années pour le filtre
  const yearOptions = generateYearOptions();

  // Variables d'état simples
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Liste des mois en français
  const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" }
  ];

  // Fonction simple pour obtenir la couleur selon le score
  const getScoreColor = (score) => {
    if (score >= 16) return "green";
    if (score >= 12) return "blue";
    if (score >= 8) return "orange";
    return "red";
  };

  // Fonction simple pour obtenir la performance
  const getPerformanceText = (score) => {
    if (score >= 16) return "Excellent";
    if (score >= 12) return "Bon";
    if (score >= 8) return "Moyen";
    return "À améliorer";
  };

  // Fonction pour récupérer le CIN de l'employé à partir de la base de données
  const getCINFromEmployeeDatabase = async (employeeId) => {
    try {
      if (!employeeId) {
        console.warn("getCINFromEmployeeDatabase: ID employé non fourni");
        return null;
      }

      // Vérifier si l'employeeId est un objet avec _id
      const actualEmployeeId = typeof employeeId === 'object' && employeeId._id ? employeeId._id : employeeId;
      
      console.log(`Récupération du CIN pour l'employé ID: ${actualEmployeeId}`);
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/employees/${actualEmployeeId}`);
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        throw new Error(`Erreur lors de la récupération des données de l'employé: ${response.statusText}`);
      }
      
      const employeeData = await response.json();
      console.log("Données employé reçues:", employeeData);
      
      // Vérifier si les données contiennent un CIN
      if (employeeData) {
        // Chercher le CIN dans différentes propriétés possibles
        const cin = employeeData.cin || employeeData.CIN || 
                   (employeeData.employee && (employeeData.employee.cin || employeeData.employee.CIN));
        
        if (cin) {
          console.log(`CIN trouvé dans la base de données: ${cin}`);
          return cin;
        } else {
          console.warn("Aucun CIN trouvé dans les données de l'employé:", employeeData);
        }
      } else {
        console.warn("Aucune donnée d'employé reçue");
      }
      
      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération du CIN depuis la base de données:", error);
      return null;
    }
  };

  // Fonction simple pour obtenir le CIN
  // Helper function to extract CIN from employee data
  const extractCIN = (evaluation) => {
    // Check all possible locations where CIN might be stored
    if (evaluation.employeeId?.cin) return evaluation.employeeId.cin;
    if (evaluation.employeeId?.CIN) return evaluation.employeeId.CIN;
    if (evaluation.CIN) return evaluation.CIN;
    if (evaluation.cin) return evaluation.cin;
  
    // If employeeId is populated with employee data
    if (evaluations && evaluations.length > 0) {
      const employee = evaluations.find(emp => emp._id === (evaluation.employeeId?._id || evaluation.employeeId));
      if (employee?.cin) return employee.cin;
      if (employee?.CIN) return employee.CIN;
    }
  
    // If we still don't have a CIN, check if there's a numeric ID that looks like a CIN
    if (typeof evaluation.employeeId === 'object') {
      for (const key in evaluation.employeeId) {
        const value = evaluation.employeeId[key];
        if (typeof value === 'string' && /^\d{8}$/.test(value)) {
          return value;
        }
      }
    }
    
    return "Non disponible";
  };

  // Fonction pour obtenir le CIN avec possibilité de récupération depuis la base de données
  const getCIN = async (evaluation) => {
    if (!evaluation) {
      console.warn("getCIN: Aucune évaluation fournie");
      return "Non disponible";
    }
  
    // D'abord essayer d'extraire le CIN des données d'évaluation
    const localCIN = extractCIN(evaluation);
    console.log("CIN local extrait:", localCIN);
    
    // Si le CIN n'est pas disponible localement, essayer de le récupérer depuis la base de données
    if (localCIN === "Non disponible") {
      const employeeId = evaluation.employeeId?._id || evaluation.employeeId;
      console.log("EmployeeId pour récupération du CIN:", employeeId);
      
      if (employeeId) {
        try {
          const databaseCIN = await getCINFromEmployeeDatabase(employeeId);
          console.log("CIN récupéré de la base de données:", databaseCIN);
          if (databaseCIN) {
            return databaseCIN;
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du CIN depuis la base de données:", error);
        }
      }
    } else {
      return localCIN;
    }
    
    // Si aucun CIN n'a été trouvé, retourner "Non disponible"
    return "Non disponible";
  };

  // Composant pour afficher le CIN
const CINDisplay = ({ evaluation }) => {
  const [cin, setCin] = useState("");
  
  useEffect(() => {
    const fetchCIN = async () => {
      if (!evaluation) {
        setCin("Non disponible");
        return;
      }
      
      const cinValue = await getCIN(evaluation);
      setCin(cinValue);
    };
    
    fetchCIN();
  }, [evaluation]);
  
  return <Typography variant="body2">CIN: {cin }</Typography>;
};

// Fonction pour récupérer les évaluations
const fetchEvaluations = async () => {
  setLoading(true);
  setError("");

  try {
    let queryParams = new URLSearchParams();
    if (selectedYear) queryParams.append("year", selectedYear);
    if (selectedMonth) queryParams.append("month", selectedMonth);

    if (user && user.role === "Chef") {
      queryParams.append("userRole", "Chef");
      queryParams.append("chefId", user._id);
    }

    // Ajouter un paramètre pour demander l'inclusion des données complètes des employés
    queryParams.append("includeEmployeeData", "true");

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log(`Récupération des évaluations avec les paramètres: ${queryParams.toString()}`);
    const response = await fetch(`${API_URL}/api/evaluationresultat?${queryParams}`);

    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      throw new Error("Erreur lors du chargement des évaluations");
    }

    const data = await response.json();
    console.log("Données d'évaluation reçues:", data);
    setEvaluations(data);

    // Sélectionner le premier employé automatiquement
    if (data.length > 0 && !selectedEmployeeId) {
      const firstEmployeeId = data[0].employeeId?._id || data[0].employeeId;
      setSelectedEmployeeId(firstEmployeeId);
      setSelectedEvaluation(data[0]);
    }

    setLoading(false);
  } catch (error) {
    console.error("Erreur:", error);
    setError("Erreur lors du chargement des évaluations");
    setLoading(false);
  }
};

  // Fonction simple de recherche
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Fonction pour filtrer les évaluations selon la recherche
  const filterEvaluations = async () => {
    if (!searchQuery) return evaluations;
    
    const filtered = [];
    for (const evaluation of evaluations) {
      const cin = await getCIN(evaluation);
      if (evaluation.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cin.toLowerCase().includes(searchQuery.toLowerCase())) {
        filtered.push(evaluation);
      }
    }
    
    return filtered;
  };

  // Fonction pour sélectionner un employé
  const selectEmployee = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    const evaluation = evaluations.find(evaluationItem => (evaluationItem.employeeId?._id || evaluationItem.employeeId) === employeeId);
    if (evaluation) {
      setSelectedEvaluation(evaluation);
    }
  };

  // Fonction pour changer le mois
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  // Fonction pour changer l'année
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Fonction simple pour générer le PDF
  const generatePDF = async (evaluation) => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text("Rapport d'Évaluation", 20, 20);
    
    // Informations de l'employé
    const cin = await getCIN(evaluation);
    doc.setFontSize(12);
    doc.text(`Employé: ${evaluation.employeeName}`, 20, 40);
    doc.text(`CIN: ${cin}`, 20, 50);
    doc.text(`Score Global: ${evaluation.globalScore}/20`, 20, 60);
    
    // Tableau des scores
    const tableData = Object.entries(evaluation.chapterScores).map(([chapter, score]) => [
      chapter,
      `${score}/10`,
      getPerformanceText(score)
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Chapitre', 'Score', 'Performance']],
      body: tableData
    });

    doc.save(`evaluation_${evaluation.employeeName}.pdf`);
  };

  // Charger les données au démarrage
  useEffect(() => {
    fetchEvaluations();
  }, [selectedYear, selectedMonth]);

  // Filtrer les évaluations selon la recherche
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  
  useEffect(() => {
    const applyFilters = async () => {
      if (!searchQuery) {
        setFilteredEvaluations(evaluations);
      } else {
        const filtered = await filterEvaluations();
        setFilteredEvaluations(filtered);
      }
    };
    
    applyFilters();
  }, [searchQuery, evaluations]);

  // Grouper les évaluations par employé
  const groupedEvaluations = {};
  filteredEvaluations.forEach(evaluation => {
    const employeeId = evaluation.employeeId?._id || evaluation.employeeId;
    if (!groupedEvaluations[employeeId]) {
      groupedEvaluations[employeeId] = {
        id: employeeId,
        name: evaluation.employeeName,
        evaluations: []
      };
    }
    groupedEvaluations[employeeId].evaluations.push(evaluation);
  });

  return (
    // Source: https://mui.com/material-ui/react-container/
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Titre de la page */}
      <Box sx={{ mb: 3 }}>
        {/* Source: https://mui.com/material-ui/react-typography/ */}
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          Résultats d'Évaluation
        </Typography>
      </Box>

      {/* Source: https://mui.com/material-ui/react-grid/ */}
      <Grid container spacing={3}>
        {/* Section de gauche - Liste des employés */}
        <Grid item xs={12} md={4}>
          {/* Source: https://mui.com/material-ui/react-paper/ */}
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filtres
            </Typography>

            {/* Filtres */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                {/* Source: https://mui.com/material-ui/react-select/ */}
                <FormControl fullWidth size="small">
                  <InputLabel>Mois</InputLabel>
                  <Select value={selectedMonth} onChange={handleMonthChange} label="Mois">
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Année</InputLabel>
                  <Select value={selectedYear} onChange={handleYearChange} label="Année">
                    {yearOptions.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                {/* Source: https://mui.com/material-ui/react-text-field/ */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Rechercher par nom ou CIN..."
                  value={searchQuery}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1 }} />
                  }}
                />
              </Grid>
            </Grid>

            {/* Liste des employés */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography variant="body1">Chargement des évaluations...</Typography>
              </Box>
            ) : (
              /* Source: https://mui.com/material-ui/react-list/ */
              <List>
                {Object.values(groupedEvaluations).map(employee => {
                  const latestEval = employee.evaluations[0];
                  return (
                    <ListItem
                      key={employee.id}
                      button
                      selected={selectedEmployeeId === employee.id}
                      onClick={() => selectEmployee(employee.id)}
                      sx={{
                        border: '1px solid #ddd',
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: selectedEmployeeId === employee.id ? '#f0f0f0' : 'white'
                      }}
                    >
                      <ListItemText
                        primary={employee.name}
                        secondary={
                          <Box>
                            <CINDisplay evaluation={latestEval} />
                            <Typography
                              variant="h6"
                              sx={{ color: getScoreColor(latestEval.globalScore) }}
                            >
                              Score: {latestEval.globalScore}/20
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}

            {Object.keys(groupedEvaluations).length === 0 && !loading && (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                Aucune évaluation trouvée
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Section de droite - Détails de l'évaluation */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '600px', overflow: 'auto' }}>
            {selectedEvaluation ? (
              <>
                {/* En-tête */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5">
                      {selectedEvaluation.employeeName}
                    </Typography>
                    <CINDisplay evaluation={selectedEvaluation} />
                    <Typography variant="body2" color="text.secondary">
                      Période: {selectedEvaluation.periode || format(new Date(selectedEvaluation.date), 'yyyy-MM')}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{ color: getScoreColor(selectedEvaluation.globalScore) }}
                    >
                      {selectedEvaluation.globalScore}/20
                    </Typography>
                    <Typography variant="body2">Score Global</Typography>
                    
                    {/* Source: https://mui.com/material-ui/react-button/ */}
                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      onClick={() => generatePDF(selectedEvaluation)}
                      sx={{ mt: 2 }}
                    >
                      Exporter PDF
                    </Button>
                  </Box>
                </Box>

                {/* Tableau des scores par chapitre */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Scores par Chapitre
                </Typography>

                {/* Source: https://mui.com/material-ui/react-table/ */}
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell >Chapitre</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell align="center">Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(selectedEvaluation.chapterScores).map(([chapter, score]) => (
                        <TableRow key={chapter}>
                          <TableCell>{chapter}</TableCell>
                          <TableCell align="center">{score}/10</TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                px: 2,
                                py: 0.5,
                                backgroundColor: '#f0f0f0',
                                borderRadius: 1,
                                display: 'inline-block'
                              }}
                            >
                              {getPerformanceText(score)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Section des commentaires */}
                {selectedEvaluation.chapterComments && Object.keys(selectedEvaluation.chapterComments).length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Commentaires
                    </Typography>

                    {Object.entries(selectedEvaluation.chapterComments)
                      .filter(([_, comment]) => comment && comment.trim())
                      .map(([chapter, comment]) => (
                        /* Source: https://mui.com/material-ui/react-card/ */
                        <Card key={chapter} sx={{ mb: 2, border: '1px solid #ddd' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {chapter}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {comment}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <Assessment sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                <Typography variant="h6">
                  Détails de l'Évaluation
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sélectionnez un employé pour voir les détails de son évaluation.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EvaluationResults;