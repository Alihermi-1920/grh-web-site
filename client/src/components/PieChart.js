// src/components/PieChart.js
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PieChart = ({ labels, data, title }) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          'rgba(75,192,192,0.6)',
          'rgba(153,102,255,0.6)',
          'rgba(255,159,64,0.6)',
          'rgba(255,99,132,0.6)',
          'rgba(54,162,235,0.6)',
        ],
        borderColor: [
          'rgba(75,192,192,1)',
          'rgba(153,102,255,1)',
          'rgba(255,159,64,1)',
          'rgba(255,99,132,1)',
          'rgba(54,162,235,1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: title },
      legend: { position: 'bottom' },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
