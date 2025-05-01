// src/theme/index.js
import { createTheme } from "@mui/material/styles";
import { alpha } from "@mui/material";

// Get the theme mode from localStorage or default to light
const getThemeMode = () => {
  return localStorage.getItem("themeMode") || "light";
};

// Create a theme instance with the specified mode
export const createAppTheme = (mode = getThemeMode()) => {
  return createTheme({
    typography: {
      fontFamily: 'Inter, sans-serif',
    },
    palette: {
      mode: mode,
      primary: {
        main: "#1976d2",
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : 'hsl(220, 30%, 5%)',
      }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInput-underline:before': {
              borderBottomColor: mode === 'light' ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
              borderBottomColor: mode === 'light' ? '#000' : '#fff',
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: "#1976d2",
            },
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            ...(mode === 'dark' && {
              backgroundColor: 'hsl(220, 30%, 5%)',
            }),
          },
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...(mode === 'dark' && {
              background: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
            }),
            ...(mode === 'light' && {
              background: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
            }),
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            ...(mode === 'dark' && {
              background: 'hsl(220, 30%, 5%)',
            }),
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(25, 118, 210, 0.1)',
            }
          }
        }
      }
    }
  });
};

// Export a default theme
export default createAppTheme();
