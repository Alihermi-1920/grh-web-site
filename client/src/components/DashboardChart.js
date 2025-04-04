import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DashboardChart = ({ employeeCount, projectCount, departmentCount }) => {
  const data = {
    labels: ['Employés', 'Projets', 'Départements'],
    datasets: [
      {
        label: 'Nombre',
        data: [employeeCount, projectCount, departmentCount],
        backgroundColor: [
          'rgba(75,192,192,0.6)',
          'rgba(153,102,255,0.6)',
          'rgba(255,159,64,0.6)'
        ],
        borderColor: [
          'rgba(75,192,192,1)',
          'rgba(153,102,255,1)',
          'rgba(255,159,64,1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default DashboardChart;
