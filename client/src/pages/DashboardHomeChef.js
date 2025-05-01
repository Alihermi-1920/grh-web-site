// src/pages/DashboardHomeChef.js
import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Alert, Tabs, Tab } from "@mui/material";
import { Bar, Line } from "react-chartjs-2";
import WelcomeBanner from "../components/WelcomeBanner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Enregistrement des composants Chart.js (une seule fois dans l'appli)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const EmployeeLineChart = () => {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/evaluationresultat")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors de la récupération des évaluations");
        }
        return res.json();
      })
      .then((data) => {
        // Regroupement des évaluations par employé
        const employees = {};
        data.forEach((evaluation) => {
          const empId = evaluation.employeeId;
          if (!employees[empId]) {
            employees[empId] = {
              employeeName: evaluation.employeeName,
              evaluations: [],
            };
          }
          employees[empId].evaluations.push(evaluation);
        });

        // Construction d'un ensemble de dates (axis des X)
        const dateSet = new Set();
        Object.values(employees).forEach((emp) => {
          emp.evaluations.forEach((ev) => {
            const dateLabel = new Date(ev.date).toLocaleDateString();
            dateSet.add(dateLabel);
          });
        });
        const labels = Array.from(dateSet).sort(
          (a, b) => new Date(a) - new Date(b)
        );

        // Création des datasets pour chaque employé
        const datasets = [];
        Object.values(employees).forEach((emp) => {
          // Tri des évaluations par date
          const sortedEvals = emp.evaluations.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          // Création d'une map date -> score global
          const scoreMap = {};
          sortedEvals.forEach((ev) => {
            const dateLabel = new Date(ev.date).toLocaleDateString();
            scoreMap[dateLabel] = parseFloat(ev.globalScore);
          });
          // Pour chaque date de l'axe X, récupérer le score ou null
          const scores = labels.map((date) =>
            scoreMap[date] !== undefined ? scoreMap[date] : null
          );

          datasets.push({
            label: emp.employeeName,
            data: scores,
            fill: false,
            borderColor:
              "#" + Math.floor(Math.random() * 16777215).toString(16),
            tension: 0.1,
          });
        });

        setChartData({
          labels: labels,
          datasets: datasets,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger les évaluations.");
      });
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!chartData) return <Typography>Chargement...</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Évolution des scores globaux par employé
      </Typography>
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Évolution des scores globaux",
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Dates",
              },
            },
            y: {
              title: {
                display: true,
                text: "Score global (%)",
              },
              min: 0,
              max: 100,
            },
          },
        }}
      />
    </Box>
  );
};

const DashboardHomeChef = () => {
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [error, setError] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    fetch("http://localhost:5000/api/evaluationresultat")
      .then((res) => res.json())
      .then((data) => setEvaluationResults(data))
      .catch((err) => {
        console.error("Erreur récupération résultats d'évaluation :", err);
        setError("Erreur lors de la récupération des données");
      });
  }, []);

  // Préparation des données pour le graphique en barres
  const globalLabels = evaluationResults.map((r) => r.employeeName);
  const globalScores = evaluationResults.map((r) => r.globalScore);

  const barData = {
    labels: globalLabels,
    datasets: [
      {
        label: "Score Global (%)",
        data: globalScores,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Scores Globaux par Employé" },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box>
      {/* Bannière de bienvenue */}
      <WelcomeBanner />

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Résultats des Évaluations
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Graphique en Barres" />
          <Tab label="Graphique en Lignes" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {tabIndex === 0 && (
            <Box sx={{ position: "relative", height: 400 }}>
              <Bar data={barData} options={barOptions} />
            </Box>
          )}
          {tabIndex === 1 && (
            <Box>
              <EmployeeLineChart />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DashboardHomeChef;
