// src/components/PrivateRoute.js
import React, { useContext, useEffect, useState } from "react";
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
  const { user, setUser, loading: contextLoading } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  // Apply dark theme on component mount
  useEffect(() => {
    applyDarkTheme();
  }, []);

  // Afficher le message de chargement seulement après un délai pour éviter le clignotement
  useEffect(() => {
    // Si le chargement prend plus de 300ms, on affiche le message
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowLoadingMessage(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Check authentication on mount
  useEffect(() => {
    // Si le contexte est encore en chargement, on attend
    if (contextLoading) {
      return;
    }

    // Try to get user from localStorage if not in context
    if (!user) {
      const storedEmployee = localStorage.getItem("employee");
      if (storedEmployee) {
        try {
          const parsedEmployee = JSON.parse(storedEmployee);
          setUser(parsedEmployee);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error parsing employee from localStorage:", error);
        }
      }
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [user, setUser, contextLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        opacity: showLoadingMessage ? 1 : 0, 
        transition: 'opacity 0.3s ease-in-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  // Si aucun utilisateur n'est trouvé, redirige vers /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si c'est une première connexion, l'utilisateur doit changer son mot de passe
  // On va afficher le composant FirstLoginPasswordChange directement ici
  if (user && user.firstLogin === true) {
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

  // Si tout est bon, afficher le contenu protégé
  return children;
};

export default PrivateRoute;
