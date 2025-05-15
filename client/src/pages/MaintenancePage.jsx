// src/pages/MaintenancePage.jsx
import React from 'react';
import { Box, Typography, Container, Paper, useTheme } from '@mui/material';
import { Construction } from '@mui/icons-material';

const MaintenancePage = ({ message = 'Le système est actuellement en maintenance. Veuillez réessayer plus tard.' }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        padding: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          right: '-50%',
          bottom: '-50%',
          background: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'smallGrid\' width=\'8\' height=\'8\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 8 0 L 0 0 0 8\' fill=\'none\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'0.5\'/%3E%3C/pattern%3E%3Cpattern id=\'grid\' width=\'80\' height=\'80\' patternUnits=\'userSpaceOnUse\'%3E%3Crect width=\'80\' height=\'80\' fill=\'url(%23smallGrid)\'/%3E%3Cpath d=\'M 80 0 L 0 0 0 80\' fill=\'none\' stroke=\'rgba(255,255,255,0.08)\' stroke-width=\'1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23grid)\' /%3E%3C/svg%3E")',
          opacity: 0.3,
          animation: 'rotate 120s linear infinite',
          zIndex: 0
        },
        '@keyframes rotate': {
          '0%': {
            transform: 'rotate(0deg)'
          },
          '100%': {
            transform: 'rotate(360deg)'
          }
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, hsl(220, 30%, 10%), hsl(220, 40%, 5%))'
              : 'linear-gradient(135deg, #fff, #f5f5f5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #4a8cff, #2563eb)',
            }}
          />

          <Construction
            sx={{
              fontSize: 80,
              color: theme.palette.primary.main,
              marginBottom: 2,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)'
                },
                '50%': {
                  transform: 'scale(1.05)'
                },
                '100%': {
                  transform: 'scale(1)'
                }
              }
            }}
          />

          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Maintenance en cours
          </Typography>

          <Typography variant="body1" paragraph>
            {message}
          </Typography>

          <Box
            sx={{
              width: '100%',
              height: 4,
              marginTop: 3,
              background: 'linear-gradient(90deg, #f0f0f0 0%, #f0f0f0 100%)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '30%',
                background: 'linear-gradient(90deg, #4a8cff 0%, #2563eb 100%)',
                animation: 'progress 1.5s ease-in-out infinite',
                '@keyframes progress': {
                  '0%': {
                    left: '-30%',
                  },
                  '100%': {
                    left: '100%',
                  },
                },
              }}
            />
          </Box>

          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'radial-gradient(ellipse at 50% 100%, rgba(37, 99, 235, 0.1), transparent)',
              pointerEvents: 'none'
            }}
          />
        </Paper>
      </Container>

      {/* Animated particles */}
      {[...Array(20)].map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: Math.random() * 5 + 2,
            height: Math.random() * 5 + 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            '@keyframes float': {
              '0%': {
                transform: 'translateY(0) rotate(0deg)',
                opacity: 0
              },
              '50%': {
                opacity: 0.5
              },
              '100%': {
                transform: 'translateY(-100vh) rotate(360deg)',
                opacity: 0
              }
            }
          }}
        />
      ))}
    </Box>
  );
};

export default MaintenancePage;
