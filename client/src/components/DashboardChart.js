// src/components/DashboardChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardChart = ({ employeeCount, projectCount, departmentCount, darkMode }) => {
  // Sample data for the last 12 months
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  // Sample data progression - in a real app this would come from your API
  const employeeGrowth = [
    Math.max(0, employeeCount - 11),
    Math.max(0, employeeCount - 10),
    Math.max(0, employeeCount - 8),
    Math.max(0, employeeCount - 7),
    Math.max(0, employeeCount - 6),
    Math.max(0, employeeCount - 5),
    Math.max(0, employeeCount - 4), 
    Math.max(0, employeeCount - 3),
    Math.max(0, employeeCount - 2),
    Math.max(0, employeeCount - 1),
    employeeCount,
    employeeCount
  ];
  
  const projectGrowth = [
    Math.max(0, projectCount - 5),
    Math.max(0, projectCount - 5),
    Math.max(0, projectCount - 4),
    Math.max(0, projectCount - 4),
    Math.max(0, projectCount - 3),
    Math.max(0, projectCount - 3),
    Math.max(0, projectCount - 2),
    Math.max(0, projectCount - 2),
    Math.max(0, projectCount - 1),
    Math.max(0, projectCount - 1),
    projectCount,
    projectCount
  ];
  
  const departmentGrowth = Array(12).fill(departmentCount);

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Employés',
        data: employeeGrowth,
        borderColor: '#6200ea',
        backgroundColor: 'rgba(98, 0, 234, 0.1)',
        pointBackgroundColor: '#6200ea',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6200ea',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Projets',
        data: projectGrowth,
        borderColor: '#03dac6',
        backgroundColor: 'rgba(3, 218, 198, 0.1)',
        pointBackgroundColor: '#03dac6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#03dac6',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Départements',
        data: departmentGrowth,
        borderColor: '#ffd600',
        backgroundColor: 'rgba(255, 214, 0, 0.1)',
        pointBackgroundColor: '#ffd600',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ffd600',
        tension: 0.4,
        fill: true,
      }
    ]
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
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#ffffff' : '#333333',
        bodyColor: darkMode ? '#ffffff' : '#333333',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
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
          stepSize: 5,
        },
        beginAtZero: true
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 2000,
    }
  };

  return <Line data={data} options={options} />;
};

export default DashboardChart;