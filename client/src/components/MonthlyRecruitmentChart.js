// src/components/MonthlyRecruitmentChart.js
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
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyRecruitmentChart = ({ labels, data, title }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Recrutement',
        data,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        // Vous pouvez ajuster borderColor si vous le souhaitez
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: title },
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MonthlyRecruitmentChart;
