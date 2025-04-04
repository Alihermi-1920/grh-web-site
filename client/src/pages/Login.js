// src/pages/Login.js
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const ADMIN_CREDENTIALS = {
  email: "admin@grh.com",
  password: "admin123",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState(localStorage.getItem("themeMode") || "light");

  const theme = createTheme({
    palette: {
      mode: mode,
    },
  });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Vérification des identifiants de l'administrateur
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem("admin", "true");
      navigate("/dashboard");
      return;
    }

    // Authentification du chef ou de l'employé via l'endpoint /api/employees/login
    try {
      const res = await axios.post("http://localhost:5000/api/employees/login", { email, password });
      // En cas de succès, sauvegarder les données de l'employé (ou un token) dans le localStorage
      localStorage.setItem("employee", JSON.stringify(res.data));
      
      // Redirection selon le rôle
      if (res.data.role.trim().toLowerCase() === "chef") {
        navigate("/chef-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
      
    } catch (error) {
      alert("Erreur : " + (error.response?.data?.message || "Erreur lors de la connexion"));
    }
  };

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
          <img src="/logo.png" alt="Logo GRH" style={{ width: 100, height: "auto" }} />
          <Button variant="outlined" onClick={toggleTheme}>
            {mode === "light" ? "Dark Mode" : "Light Mode"}
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 2,
            boxShadow: 3,
            mt: 3,
          }}
        >
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            <b>Connexion</b>
          </Typography>
          <form onSubmit={handleLogin} style={{ width: "100%" }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>
              Se connecter
            </Button>
          </form>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
