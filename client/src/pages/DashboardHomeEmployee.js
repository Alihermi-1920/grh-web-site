import React from "react";
import { Box, Grid, useTheme } from "@mui/material";
import WelcomeBanner from "../components/WelcomeBanner";

// Import our employee dashboard components
import MotivationalLeaderboard from "../components/employee-dashboard/MotivationalLeaderboard";
import PersonalPerformanceCard from "../components/employee-dashboard/PersonalPerformanceCard";
import TaskProgress from "../components/employee-dashboard/TaskProgress";

const DashboardHomeEmployee = ({ setActiveView }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100%',
        p: 3,
        animation: 'fadeIn 0.5s ease-in-out',
        '@keyframes fadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
    >
      {/* Bannière de bienvenue */}
      <WelcomeBanner />

      {/* Personal Performance Card - Full width */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <PersonalPerformanceCard />
      </Box>

      {/* Main dashboard grid */}
      <Grid container spacing={3}>
        {/* Motivational Leaderboard */}
        <Grid
          item
          xs={12}
          md={7}
          lg={8}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.1s both',
          }}
        >
          <MotivationalLeaderboard />
        </Grid>

        {/* Task Progress */}
        <Grid
          item
          xs={12}
          md={5}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.2s both',
          }}
        >
          <TaskProgress setActiveView={setActiveView} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHomeEmployee;
