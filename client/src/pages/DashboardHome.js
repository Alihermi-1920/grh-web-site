// src/pages/DashboardHome.js
import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { PeopleAlt, Assignment, Business } from '@mui/icons-material';

import PieChart from '../components/PieChart';
import MonthlyRecruitmentChart from '../components/MonthlyRecruitmentChart';
import WelcomeBanner from '../components/WelcomeBanner';

const DashboardHome = ({
  employeeCount,
  departmentCount,
  departmentLabels,
  departmentDistribution,
  monthLabels,
  recruitmentData,
  darkMode
}) => {
  const theme = useTheme();

  return (
    <Box>
      {/* Bannière de bienvenue */}
      <WelcomeBanner />

      <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mt: 4, mb: 2 }}>
        Espace de Travail Delice
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 4,
              height: '100%',
              background: darkMode
                ? `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              color: 'white',
              boxShadow: darkMode
                ? '0 8px 16px rgba(0,0,0,0.3)'
                : '0 8px 16px rgba(98,0,234,0.2)'
            }}
          >
            <PeopleAlt sx={{ fontSize: 36, opacity: 0.8, mb: 0.5 }} />
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Total des Employés</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {employeeCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 4,
              height: '100%',
              background: darkMode
                ? 'linear-gradient(45deg, #00695c 0%, #00897b 100%)'
                : 'linear-gradient(45deg, #00897b 30%, #4db6ac 90%)',
              color: 'white',
              boxShadow: darkMode
                ? '0 8px 16px rgba(0,0,0,0.3)'
                : '0 8px 16px rgba(0,137,123,0.2)'
            }}
          >
            <Business sx={{ fontSize: 36, opacity: 0.8, mb: 0.5 }} />
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Départements</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {departmentCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              boxShadow: darkMode
                ? '0 8px 24px rgba(0,0,0,0.2)'
                : '0 8px 24px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Répartition des employés par département
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <PieChart
                labels={departmentLabels}
                data={departmentDistribution}
                title="Départements"
                darkMode={darkMode}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              boxShadow: darkMode
                ? '0 8px 24px rgba(0,0,0,0.2)'
                : '0 8px 24px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Recrutement Mensuel
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <MonthlyRecruitmentChart
                labels={monthLabels}
                data={recruitmentData}
                title="Recrutement Mensuel"
                darkMode={darkMode}
              />
            </Box>
          </Paper>
        </Grid>


      </Grid>
    </Box>
  );
};

export default DashboardHome;