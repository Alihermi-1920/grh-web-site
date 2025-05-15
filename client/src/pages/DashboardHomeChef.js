// src/pages/DashboardHomeChef.js
import React from "react";
import { Box, Grid, useTheme } from "@mui/material";
import WelcomeBanner from "../components/WelcomeBanner";

// Import our new dashboard components
import TaskStatusChart from "../components/dashboard/TaskStatusChart";
import ProjectProgressChart from "../components/dashboard/ProjectProgressChart";
import EmployeePerformanceChart from "../components/dashboard/EmployeePerformanceChart";
import DeadlineTracker from "../components/dashboard/DeadlineTracker";
import TeamStatsSummary from "../components/dashboard/TeamStatsSummary";
import RecentActivities from "../components/dashboard/RecentActivities";
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
        {/* Task Status Distribution Chart */}
        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.1s both',
          }}
        >
          <TaskStatusChart />
        </Grid>

        {/* Project Progress Chart */}
        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.2s both',
          }}
        >
          <ProjectProgressChart />
        </Grid>

        {/* Deadline Tracker */}
        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.3s both',
          }}
        >
          <DeadlineTracker />
        </Grid>

        {/* Employee Performance Chart */}
        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.4s both',
          }}
        >
          <EmployeePerformanceChart />
        </Grid>

        {/* Employee Leaderboard */}
        <Grid
          item
          xs={12}
          md={6}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.5s both',
          }}
        >
          <EmployeeLeaderboard />
        </Grid>

        {/* Recent Activities */}
        <Grid
          item
          xs={12}
          md={12}
          lg={4}
          sx={{
            animation: 'fadeIn 0.5s ease-in-out 0.6s both',
          }}
        >
          <RecentActivities />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHomeChef;
