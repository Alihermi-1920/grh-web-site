// src/components/WelcomeBanner.js
import React, { useContext } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const WelcomeBanner = () => {
  const { user } = useContext(AuthContext);

  // Déterminer le moment de la journée
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Obtenir le prénom de l'utilisateur
  const getFirstName = () => {
    return user?.firstName || "Utilisateur";
  };

  // Obtenir le rôle de l'utilisateur en français (uniquement pour le chef)
  const getRole = () => {
    if (!user?.role) return "";

    // Pour l'admin et l'employé, ne pas afficher le rôle
    if (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'employee') {
      return "";
    }

    // Pour le chef, afficher "Chef"
    if (user.role.toLowerCase() === 'chef') {
      return "Chef";
    }

    return "";
  };

  // Citation motivante pour les employés
  const getMotivationalQuote = () => {
    if (user?.role?.toLowerCase() === 'employee') {
      return "Chaque effort compte vers le succès.";
    }
    return "";
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight="600"
          sx={{ mb: 0.5 }}
        >
          {getRole()
            ? `${getGreeting()}, ${getRole()} ${getFirstName()} 👋`
            : `${getGreeting()}, ${getFirstName()} 👋`}
        </Typography>

        {getMotivationalQuote() && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, fontStyle: 'italic' }}
          >
            "{getMotivationalQuote()}"
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default WelcomeBanner;
