// src/components/PieChart.js
// Composant de graphique en camembert pour afficher la répartition des employés par département
// Utilise react-chartjs-2 - https://react-chartjs-2.js.org/
// et Chart.js - https://www.chartjs.org/
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Enregistrement des composants ChartJS nécessaires
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Composant PieChart - Affiche un graphique en camembert pour la répartition des données
 * 
 * @param {Array<string>} labels - Les étiquettes pour chaque section du camembert
 * @param {Array<number>} data - Les valeurs numériques correspondant à chaque section
 * @param {string} title - Le titre du graphique
 * @param {boolean} darkMode - Mode sombre activé ou non
 */
const PieChart = ({ labels, data, title, darkMode }) => {
  // Génération de couleurs dynamique basée sur le nombre de départements
  const generateColors = (count) => {
    // Palette de couleurs de base pour les sections du graphique
    const baseColors = [
      { bg: 'rgba(98, 0, 234, 0.7)', border: '#6200ea' }, // Violet principal
      { bg: 'rgba(3, 218, 198, 0.7)', border: '#03dac6' }, // Turquoise
      { bg: 'rgba(255, 214, 0, 0.7)', border: '#ffd600' }, // Jaune
      { bg: 'rgba(207, 102, 121, 0.7)', border: '#CF6679' }, // Rose
      { bg: 'rgba(33, 150, 243, 0.7)', border: '#2196f3' }, // Bleu
      { bg: 'rgba(0, 200, 83, 0.7)', border: '#00c853' }, // Vert
      { bg: 'rgba(233, 30, 99, 0.7)', border: '#e91e63' }, // Rose foncé
      { bg: 'rgba(156, 39, 176, 0.7)', border: '#9c27b0' }, // Violet
      { bg: 'rgba(255, 87, 34, 0.7)', border: '#ff5722' }, // Orange
      { bg: 'rgba(121, 85, 72, 0.7)', border: '#795548' }, // Marron
    ];

    // Si nous avons besoin de plus de couleurs que dans notre tableau de base, nous les répétons
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(baseColors[i % baseColors.length]);
    }

    return result;
  };

  // Vérification si nous avons des données valides
  const hasValidData = labels && labels.length > 0 && data && data.length > 0;

  // Génération des couleurs basée sur le nombre de départements
  const colors = hasValidData ? generateColors(labels.length) : [];

  // Configuration des données du graphique
  const chartData = {
    labels: labels || [],
    datasets: [
      {
        label: title,
        data: data || [],
        backgroundColor: colors.map(c => c.bg),
        borderColor: colors.map(c => c.border),
        borderWidth: 1,
        hoverOffset: 15,
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
        position: 'right',
        labels: {
          color: darkMode ? '#ffffff' : '#333333',
          font: {
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        }
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
        displayColors: true,
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
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = Math.round((value * 100) / total) + '%';
            return `${label}: ${value} employés (${percentage})`;
          }
        }
      }
    },
    layout: {
      padding: 20
    },
    cutout: '40%', // Taille du trou central (style donut)
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
    }
  };

  // Si aucune donnée valide n'est disponible, afficher un message
  if (!hasValidData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'
      }}>
        Aucune donnée disponible pour afficher le graphique
      </div>
    );
  }

  return <Pie data={chartData} options={options} />;
};

export default PieChart;