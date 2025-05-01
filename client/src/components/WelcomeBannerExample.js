// src/components/WelcomeBannerExample.js
import React from 'react';
import { Container, Box } from '@mui/material';
import WelcomeBanner from './WelcomeBanner';

const WelcomeBannerExample = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Intégration de la bannière de bienvenue */}
        <WelcomeBanner />
        
        {/* Contenu du tableau de bord */}
        {/* ... */}
      </Box>
    </Container>
  );
};

export default WelcomeBannerExample;
