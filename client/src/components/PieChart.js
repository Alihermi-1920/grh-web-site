// src/components/PieChart.js
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ labels, data, title, darkMode }) => {
  // Generate colors dynamically based on the number of departments
  const generateColors = (count) => {
    const baseColors = [
      { bg: 'rgba(98, 0, 234, 0.7)', border: '#6200ea' },
      { bg: 'rgba(3, 218, 198, 0.7)', border: '#03dac6' },
      { bg: 'rgba(255, 214, 0, 0.7)', border: '#ffd600' },
      { bg: 'rgba(207, 102, 121, 0.7)', border: '#CF6679' },
      { bg: 'rgba(33, 150, 243, 0.7)', border: '#2196f3' },
      { bg: 'rgba(0, 200, 83, 0.7)', border: '#00c853' },
      { bg: 'rgba(233, 30, 99, 0.7)', border: '#e91e63' },
      { bg: 'rgba(156, 39, 176, 0.7)', border: '#9c27b0' },
      { bg: 'rgba(255, 87, 34, 0.7)', border: '#ff5722' },
      { bg: 'rgba(121, 85, 72, 0.7)', border: '#795548' },
    ];

    // If we need more colors than we have in our base array, we'll repeat them
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(baseColors[i % baseColors.length]);
    }

    return result;
  };

  // Check if we have valid data
  const hasValidData = labels && labels.length > 0 && data && data.length > 0;

  // Generate colors based on the number of departments
  const colors = hasValidData ? generateColors(labels.length) : [];

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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
    cutout: '40%',
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
    }
  };

  // If there's no valid data, show a message
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