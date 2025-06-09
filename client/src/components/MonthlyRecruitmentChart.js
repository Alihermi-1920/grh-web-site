// src/components/MonthlyRecruitmentChart.js
// Composant de graphique en barres pour afficher le recrutement mensuel
// Utilise react-chartjs-2 - https://react-chartjs-2.js.org/
// et Chart.js - https://www.chartjs.org/
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Enregistrement des composants ChartJS nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Composant MonthlyRecruitmentChart - Affiche un graphique en barres pour le recrutement mensuel
 * 
 * @param {Array<string>} labels - Les étiquettes pour chaque barre (mois)
 * @param {Array<number>} data - Les valeurs numériques correspondant à chaque barre
 * @param {string} title - Le titre du graphique
 * @param {boolean} darkMode - Mode sombre activé ou non
 */
const MonthlyRecruitmentChart = ({ labels, data, title, darkMode }) => {
  // Configuration des données du graphique
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Nouveaux employés',
        data: data,
        backgroundColor: darkMode 
          ? 'rgba(98, 0, 234, 0.7)'
          : 'rgba(98, 0, 234, 0.5)',
        borderColor: '#6200ea',
        borderWidth: 1,
        hoverBackgroundColor: darkMode
          ? 'rgba(98, 0, 234, 0.9)'
          : 'rgba(98, 0, 234, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  // Options de configuration du graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // Configuration de la légende
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#ffffff' : '#333333',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      // Configuration du titre
      title: {
        display: false,
        text: title,
      },
      // Configuration des infobulles
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#ffffff' : '#333333',
        bodyColor: darkMode ? '#ffffff' : '#333333',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        // Personnalisation du format des infobulles
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} employés recrutés`;
          }
        }
      }
    },
    // Configuration des axes
    scales: {
      // Axe X (horizontal)
      x: {
        grid: {
          display: false,
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: darkMode ? '#e0e0e0' : '#666666',
        }
      },
      // Axe Y (vertical)
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: darkMode ? '#e0e0e0' : '#666666',
          stepSize: 1,
          precision: 0
        },
        beginAtZero: true
      }
    },
    // Configuration de l'animation
    animation: {
      duration: 2000,
    }
  };

  // Vérification si nous avons des données valides
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'
      }}>
        Aucune donnée de recrutement disponible
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
};

export default MonthlyRecruitmentChart;