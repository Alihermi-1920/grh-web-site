// src/components/PrivateRoute.js
import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Apply theme to document body to prevent white flash during transitions
const applyDarkTheme = () => {
  const isDarkMode = localStorage.getItem('themeMode') === 'dark';
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.backgroundColor = 'hsl(220, 30%, 5%)';
  }
};

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Apply dark theme on component mount
  useEffect(() => {
    applyDarkTheme();
  }, []);

  // Si aucun utilisateur n'est trouvé, redirige vers /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si c'est une première connexion, l'utilisateur doit changer son mot de passe
  // On va afficher le composant FirstLoginPasswordChange directement ici
  if (user.firstLogin === true) {
    // Import dynamique pour éviter les problèmes de dépendances circulaires
    const FirstLoginPasswordChange = require('./FirstLoginPasswordChange').default;

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
      }}>
        <FirstLoginPasswordChange
          open={true}
          user={user}
          onSuccess={() => {
            // Update the user object in localStorage
            const updatedUser = { ...user, firstLogin: false };
            localStorage.setItem("employee", JSON.stringify(updatedUser));

            // Force a reload to update the context
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Si l'utilisateur est authentifié et a changé son mot de passe, afficher les enfants
  return children;
};

export default PrivateRoute;
