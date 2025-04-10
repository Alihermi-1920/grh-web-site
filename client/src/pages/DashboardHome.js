// src/pages/DashboardHome.js
import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import DashboardChart from '../components/DashboardChart';
import PieChart from '../components/PieChart';
import MonthlyRecruitmentChart from '../components/MonthlyRecruitmentChart';

const DashboardHome = ({
  employeeCount,
  projectCount,
  departmentCount,
  departmentLabels,
  departmentData,
  recruitmentLabels,
  recruitmentData
}) => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Vue d'ensemble
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Employés</Typography>
            <Typography variant="h4">{employeeCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Projets</Typography>
            <Typography variant="h4">{projectCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Départements</Typography>
            <Typography variant="h4">{departmentCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, height: '300px' }}>
        <DashboardChart
          employeeCount={employeeCount}
          projectCount={projectCount}
          departmentCount={departmentCount}
        />
      </Box>

      <Box sx={{ mt: 4, height: '300px' }}>
        <Typography variant="h6" gutterBottom>
          Répartition des employés par département
        </Typography>
        <PieChart
          labels={departmentLabels}
          data={departmentData}
          title="Départements"
        />
      </Box>

      <Box sx={{ mt: 4, height: '300px' }}>
        <Typography variant="h6" gutterBottom>
          Recrutement Mensuel
        </Typography>
        <MonthlyRecruitmentChart
          labels={recruitmentLabels}
          data={recruitmentData}
          title="Recrutement Mensuel"
        />
      </Box>
    </Box>
  );
};

export default DashboardHome;
