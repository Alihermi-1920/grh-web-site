// src/components/WelcomeBanner.js
// Composant de bannière de bienvenue utilisant Material UI
// Documentation Material UI Paper: https://mui.com/material-ui/react-paper/
// Documentation Material UI Typography: https://mui.com/material-ui/react-typography/
import React, { useContext } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { WavingHand } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const WelcomeBanner = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  // Salutation simple et neutre en français
  const getGreeting = () => {
    return "Salut";
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

  // Obtenir la date du jour formatée
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          component="h1"
          fontWeight="600"
          sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}
        >
          {getRole()
            ? `${getGreeting()}, ${getRole()} ${getFirstName()}`
            : `${getGreeting()}, ${getFirstName()}`}
          <WavingHand sx={{ ml: 1, color: '#FFC107', fontSize: 24 }} />
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {getFormattedDate()}
        </Typography>

        {getMotivationalQuote() && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              "{getMotivationalQuote()}"
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WelcomeBanner;
