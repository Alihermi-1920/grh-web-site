// src/components/GlobalStyles.js
import React from 'react';
import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => {
  return (
    <MuiGlobalStyles
      styles={{
        '*': {
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          margin: 0,
          padding: 0,
          fontFamily: 'Inter, sans-serif',
        },
        a: {
          textDecoration: 'none',
        },
        'button, input, textarea, select': {
          fontFamily: 'Inter, sans-serif',
        },
      }}
    />
  );
};

export default GlobalStyles;
