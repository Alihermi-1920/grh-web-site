// src/components/PieChart.js
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ labels, data, title, darkMode }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title,
        data: data,
        backgroundColor: [
          'rgba(98, 0, 234, 0.7)',
          'rgba(3, 218, 198, 0.7)',
          'rgba(255, 214, 0, 0.7)',
          'rgba(207, 102, 121, 0.7)',
          'rgba(33, 150, 243, 0.7)',
          'rgba(0, 200, 83, 0.7)',
        ],
        borderColor: [
          '#6200ea',
          '#03dac6',
          '#ffd600',
          '#CF6679',
          '#2196f3',
          '#00c853',
        ],
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

  return <Pie data={chartData} options={options} />;
};

export default PieChart;