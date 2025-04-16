// src/components/MonthlyRecruitmentChart.js
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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyRecruitmentChart = ({ labels, data, title, darkMode }) => {
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
      title: {
        display: false,
        text: title,
      },
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
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} employés recrutés`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: darkMode ? '#e0e0e0' : '#666666',
        }
      },
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
    animation: {
      duration: 2000,
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default MonthlyRecruitmentChart;