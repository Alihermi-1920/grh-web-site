// src/App.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css"; // Styles propres à App (optionnel)

const App = () => {
  // On ne se sert pas du "user" pour l’instant, mais on l’enregistre dans l’état
  const [, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Si aucun token, on redirige vers la page de login
    if (!token) {
      navigate("/login");
    } else {
      // Sinon, on peut stocker un utilisateur fictif
      setUser("Utilisateur connecté");
    }
  }, [navigate]);

  return (
    <div className="app-container">
      <h1>Bienvenue dans l'application GRH</h1>
      <p>Ceci est la page d'accueil.</p>
    </div>
  );
};

export default App;
