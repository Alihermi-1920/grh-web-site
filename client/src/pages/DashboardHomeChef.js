import React from 'react';
import { Box, Grid, Container } from '@mui/material';
import WelcomeBanner from '../components/WelcomeBanner';
import TeamStatsSummary from '../components/dashboard/TeamStatsSummary';
import EmployeeLeaderboard from '../components/dashboard/EmployeeLeaderboard';

const DashboardHomeChef = () => {
  return (
    <Box sx={{ flexGrow: 1, py: 4, px: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Bannière de bienvenue */}
          <Grid item xs={12}>
            <WelcomeBanner />
          </Grid>
          
          {/* Statistiques de l'équipe */}
          <Grid item xs={12}>
            <TeamStatsSummary />
          </Grid>
          
          {/* Classement des employés */}
          <Grid item xs={12} md={8} sx={{ mx: 'auto' }}>
            <EmployeeLeaderboard />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardHomeChef;
