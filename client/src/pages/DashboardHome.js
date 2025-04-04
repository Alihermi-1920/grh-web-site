// src/pages/DashboardHome.js
import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import DashboardChart from '../components/DashboardChart';

const DashboardHome = ({ employeeCount, projectCount, departmentCount }) => {
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
      <Box sx={{ mt: 4 }}>
        <DashboardChart
          employeeCount={employeeCount}
          projectCount={projectCount}
          departmentCount={departmentCount}
        />
      </Box>
    </Box>
  );
};

export default DashboardHome;
