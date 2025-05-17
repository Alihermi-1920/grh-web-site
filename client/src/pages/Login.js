// src/pages/Login.js
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Box,
  CssBaseline,
  FormControl,
  Stack,
  IconButton,
  styled,
  ThemeProvider,
  Divider,
  Link
} from "@mui/material";
import MuiCard from '@mui/material/Card';
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LockResetIcon from "@mui/icons-material/LockReset";
import { AuthContext } from "../context/AuthContext";
import { createAppTheme } from "../theme";
import PasswordChangeDialog from "../components/PasswordChangeDialog";

// Admin credentials moved to server side for security

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  maxWidth: '450px',
  boxShadow: 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  background: theme.palette.mode === 'light' ? '#ffffff' : 'hsl(220, 30%, 5%)',
  borderRadius: '12px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  padding: theme.spacing(2),
  background: theme.palette.mode === 'light'
    ? 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))'
    : 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
}));

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [mode, setMode] = useState(localStorage.getItem("themeMode") || "light");
  const [passwordChangeDialogOpen, setPasswordChangeDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const theme = createAppTheme(mode);

  // Apply theme to document body to prevent white flash during transitions
  const applyThemeToBody = (mode) => {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = 'hsl(220, 30%, 5%)';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.body.style.backgroundColor = '';
    }
  };

  // Apply theme to body on component mount
  useEffect(() => {
    applyThemeToBody(mode);
  }, [mode]);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
    applyThemeToBody(newMode);
  };

  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateInputs()) return;

    try {
      // Connexion pour tous les utilisateurs (y compris admin)
      const res = await axios.post("http://localhost:5000/api/employees/login", {
        email,
        password,
      });

      // Stocker l'objet utilisateur sous la clé "employee"
      localStorage.setItem("employee", JSON.stringify(res.data));
      setUser(res.data);

      // Check if this is a first login
      if (res.data.firstLogin === true) {
        console.log("First login detected, user will be prompted to change password");
        // We'll still navigate to the dashboard, but the PrivateRoute will prevent access
        // until the user changes their password
      }

      // Rediriger en fonction du rôle
      const role = res.data.role.trim().toLowerCase();
      if (role === "admin") {
        navigate("/dashboard");
      } else if (role === "chef") {
        navigate("/chef-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (error) {
      alert("Erreur : " + (error.response?.data?.message || "Erreur lors de la connexion"));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SignInContainer direction="column" justifyContent="center">
        <IconButton
          onClick={toggleTheme}
          sx={{ position: 'fixed', top: '1rem', right: '1rem' }}
          color="inherit"
        >
          {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>

        <Card variant="outlined">
          <Box display="flex" flexDirection="column" alignItems="flex-start" mb={4}>
            <img
              src="/logo.png"
              alt="GRH Logo"
              style={{
                width: 80,
                marginBottom: 16,
              }}
            />
            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontSize: 'clamp(2rem, 10vw, 2.15rem)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                color: theme.palette.text.primary
              }}
            >
              Log in
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                variant="standard"
                label="Email"
                error={emailError}
                helperText={emailErrorMessage}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                fullWidth
                InputLabelProps={{
                  sx: { color: theme.palette.text.secondary }
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.42)',
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: theme.palette.primary.main,
                  },
                  // Fix for autocomplete background
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0 1000px #121212 inset !important' : 'none',
                    WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : 'inherit',
                    caretColor: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                    borderRadius: 'inherit',
                  },
                }}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                variant="standard"
                label="Password"
                error={passwordError}
                helperText={passwordErrorMessage}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                fullWidth
                InputLabelProps={{
                  sx: { color: theme.palette.text.secondary }
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.42)',
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)',
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: theme.palette.primary.main,
                  },
                  // Fix for autocomplete background
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0 1000px #121212 inset !important' : 'none',
                    WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : 'inherit',
                    caretColor: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                    borderRadius: 'inherit',
                  },
                }}
              />
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mb: 2,
                backgroundColor: '#000',
                color: '#fff',
                '&:hover': { backgroundColor: '#333' }
              }}
            >
              Log in
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ou
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="medium"
              startIcon={<LockResetIcon />}
              onClick={() => setPasswordChangeDialogOpen(true)}
              sx={{
                borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.23)' : 'rgba(255,255,255,0.23)',
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                }
              }}
            >
              Changer votre mot de passe
            </Button>
          </Box>
        </Card>

        {/* Password Change Dialog */}
        <PasswordChangeDialog
          open={passwordChangeDialogOpen}
          onClose={() => setPasswordChangeDialogOpen(false)}
        />
      </SignInContainer>
    </ThemeProvider>
  );
};

export default Login;
