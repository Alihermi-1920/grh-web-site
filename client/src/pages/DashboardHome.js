// src/pages/DashboardHome.js
// Composant principal du tableau de bord administrateur
// Utilise Material UI pour la mise en page et les composants - https://mui.com/
import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { PeopleAlt, Business } from '@mui/icons-material';

// Composants personnalisés pour les graphiques
import PieChart from '../components/PieChart'; // Graphique en camembert pour la répartition des employés
import MonthlyRecruitmentChart from '../components/MonthlyRecruitmentChart'; // Graphique en barres pour le recrutement mensuel
import WelcomeBanner from '../components/WelcomeBanner'; // Bannière de bienvenue personnalisée

/**
 * Composant DashboardHome - Affiche les indicateurs clés et les graphiques du tableau de bord
 * 
 * @param {number} employeeCount - Nombre total d'employés
 * @param {number} departmentCount - Nombre total de départements
 * @param {Array<string>} departmentLabels - Noms des départements pour le graphique en camembert
 * @param {Array<number>} departmentDistribution - Nombre d'employés par département pour le graphique en camembert
 * @param {Array<string>} monthLabels - Noms des mois pour le graphique de recrutement
 * @param {Array<number>} recruitmentData - Nombre d'employés recrutés par mois
 * @param {boolean} darkMode - Mode sombre activé ou non
 */
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

      {/* Titre du tableau de bord */}
      <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mt: 4, mb: 2 }}>
        Espace de Travail Delice
      </Typography>

      {/* Section des indicateurs clés */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Indicateur du nombre total d'employés */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 4,
              height: '100%',
              background: darkMode
                ? 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
                : 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
              color: 'white',
              boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)'
              }
            }}
          >
            <PeopleAlt sx={{ fontSize: 36, opacity: 0.9, mb: 0.5 }} />
            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 500 }}>Total des Employés</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {employeeCount}
            </Typography>
          </Paper>
        </Grid>

        {/* Indicateur du nombre total de départements */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: 4,
              height: '100%',
              background: darkMode
                ? 'linear-gradient(135deg, #C62828 0%, #D32F2F 100%)'
                : 'linear-gradient(135deg, #D32F2F 0%, #EF5350 100%)',
              color: 'white',
              boxShadow: '0 8px 16px rgba(211, 47, 47, 0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)'
              }
            }}
          >
            <Business sx={{ fontSize: 36, opacity: 0.9, mb: 0.5 }} />
            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 500 }}>Départements</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {departmentCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Section des graphiques */}
      <Grid container spacing={4}>
        {/* Graphique de répartition des employés par département */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
              height: '100%',
              background: darkMode ? '#1E2A3A' : '#ffffff',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.01)'
              }
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom color={darkMode ? '#e0e0e0' : '#1565C0'}>
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

        {/* Graphique de recrutement mensuel */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 4,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
              height: '100%',
              background: darkMode ? '#1E2A3A' : '#ffffff',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.01)'
              }
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom color={darkMode ? '#e0e0e0' : '#1565C0'}>
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