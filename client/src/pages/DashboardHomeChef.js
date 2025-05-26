// src/pages/DashboardHomeChef.js
import React from "react";
import { Box, Grid, useTheme } from "@mui/material";
import WelcomeBanner from "../components/WelcomeBanner";

// Import our new dashboard components
import EmployeePerformanceChart from "../components/dashboard/EmployeePerformanceChart";
import TeamStatsSummary from "../components/dashboard/TeamStatsSummary";
import EmployeeLeaderboard from "../components/dashboard/EmployeeLeaderboard";

const DashboardHomeChef = () => {
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

      {/* Team Stats Summary - Full width */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <TeamStatsSummary />
      </Box>

      {/* Main dashboard grid */}
      <Grid container spacing={3}>

        {/* Employee Performance Chart */}
        <Grid
          item
          xs={12}
          md={6}
          lg={6}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.1s both',
          }}
        >
          <EmployeePerformanceChart />
        </Grid>

        {/* Employee Leaderboard */}
        <Grid
          item
          xs={12}
          md={6}
          lg={6}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.2s both',
          }}
        >
          <EmployeeLeaderboard />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHomeChef;
