// src/components/EmployeeLineChart.js
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Typography } from "@mui/material";

// Enregistrement des composants Chart.js (à faire une seule fois dans votre appli)
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
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
        // Regrouper les évaluations par employé
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

        // Rassembler l'ensemble des dates de toutes les évaluations
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

        // Pour chaque employé, constituer un tableau de scores correspondant aux dates
        const datasets = [];
        Object.values(employees).forEach((emp) => {
          // Tri des évaluations par date
          const sortedEvals = emp.evaluations.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          // Construction d'une map date -> score global
          const scoreMap = {};
          sortedEvals.forEach((ev) => {
            const dateLabel = new Date(ev.date).toLocaleDateString();
            scoreMap[dateLabel] = parseFloat(ev.globalScore);
          });
          // Création d'un tableau des scores en alignant par date (null si aucune évaluation)
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

  if (error) return <div>{error}</div>;
  if (!chartData) return <div>Chargement...</div>;

  return (
    <div>
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
    </div>
  );
};

export default EmployeeLineChart;
