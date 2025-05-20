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
      // Reduce base font size to 90% of default
      fontSize: 14, // Default MUI is 16px, so this is ~90%
      htmlFontSize: 16 * 0.9, // Adjust for rem calculations
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
            // Fix for autocomplete background in dark mode
            '& input:-webkit-autofill': {
              WebkitBoxShadow: mode === 'dark' ? '0 0 0 1000px #121212 inset !important' : 'none',
              WebkitTextFillColor: mode === 'dark' ? '#fff !important' : 'inherit',
              caretColor: mode === 'dark' ? '#fff' : 'inherit',
              borderRadius: 'inherit',
              transition: 'background-color 5000s ease-in-out 0s',
            },
            '& .MuiInputBase-input': {
              color: mode === 'dark' ? '#fff' : 'inherit',
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
              backgroundColor: '#685cfe',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#685cfe',
                color: '#ffffff'
              }
            },
            '&:hover': {
              backgroundColor: '#685cfe',
              color: '#ffffff'
            },
            transition: 'all 0.2s ease'
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: 'inherit',
            minWidth: 40,
            '.MuiListItemButton-root.Mui-selected &': {
              color: '#ffffff'
            },
            '.MuiListItemButton-root:hover &': {
              color: '#ffffff'
            },
            transition: 'all 0.2s ease'
          }
        }
      }
    }
  });
};

// Export a default theme
export default createAppTheme();
