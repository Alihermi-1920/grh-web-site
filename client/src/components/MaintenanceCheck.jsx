// src/components/MaintenanceCheck.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { CircularProgress, Box } from '@mui/material';
import MaintenancePage from '../pages/MaintenancePage';
import { AuthContext } from '../context/AuthContext';

// Apply theme to document body to prevent white flash during transitions
const applyDarkTheme = () => {
  const isDarkMode = localStorage.getItem('themeMode') === 'dark';
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.backgroundColor = 'hsl(220, 30%, 5%)';
  }
};

const API_URL = 'http://localhost:5000';

const MaintenanceCheck = ({ children }) => {
  // Start with initialLoading=true to prevent showing content before maintenance check
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Extract the current page path from the URL
  const getPagePath = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    return path;
  };

  // Check if the current page is under maintenance
  useEffect(() => {
    // Skip maintenance check if user is not yet loaded or on login page
    if (!user && location.pathname !== '/login') {
      return;
    }

    // If we're on the login page, don't show loading or maintenance
    if (location.pathname === '/login' || location.pathname === '/signup') {
      setLoading(false);
      setIsUnderMaintenance(false);
      setInitialLoading(false);
      return;
    }

    // If user is admin, always show content regardless of maintenance status
    if (user?.role === 'admin') {
      setLoading(false);
      setIsUnderMaintenance(false);
      setInitialLoading(false);
      return;
    }

    const checkMaintenance = async () => {
      setLoading(true);
      try {
        // First check global maintenance status
        const response = await axios.get(`${API_URL}/api/maintenance/status`);

        if (response.data.success) {
          const { isGlobalMaintenance, globalMessage, pageSettings } = response.data;

          // If global maintenance is active and user is not admin
          if (isGlobalMaintenance) {
            // Show maintenance page
            setIsUnderMaintenance(true);
            setMaintenanceMessage(globalMessage || 'Le système est actuellement en maintenance. Veuillez réessayer plus tard.');
          }
          // If no global maintenance, check page-specific maintenance
          else {
            const pagePath = getPagePath();
            const pageUnderMaintenance = pageSettings?.find(
              page => page.pagePath === pagePath && page.isUnderMaintenance
            );

            if (pageUnderMaintenance) {
              // Show maintenance page for non-admin users
              setIsUnderMaintenance(true);
              setMaintenanceMessage(pageUnderMaintenance.maintenanceMessage || `La page ${pagePath} est en cours de maintenance.`);
            } else {
              // If page is not under maintenance, show content
              setIsUnderMaintenance(false);
            }
          }
        } else {
          // If API call fails, assume no maintenance
          setIsUnderMaintenance(false);
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error);
        // If error occurs, assume no maintenance
        setIsUnderMaintenance(false);
      } finally {
        setLoading(false);
        // Always set initialLoading to false after the check is complete
        setInitialLoading(false);
      }
    };

    checkMaintenance();
  }, [location.pathname, user]);

  // Only show loading if we've been loading for more than a brief moment
  // This prevents the loading flash on quick checks
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      // Only show loading indicator after 300ms of loading
      timer = setTimeout(() => setShowLoading(true), 300);
    } else {
      setShowLoading(false);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  // Apply dark theme on component mount
  useEffect(() => {
    applyDarkTheme();
  }, []);

  // Show loading spinner during initial loading or when explicitly loading
  if (initialLoading || (loading && showLoading)) {
    // Apply dark theme again to ensure it's applied during loading
    applyDarkTheme();

    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: 'radial-gradient(ellipse at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
          opacity: 0,
          animation: 'fadeIn 0.3s ease-in-out forwards',
          '@keyframes fadeIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 }
          }
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show maintenance page if under maintenance
  if (isUnderMaintenance) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  // Only show children after we've confirmed it's not under maintenance
  return children;
};

export default MaintenanceCheck;
