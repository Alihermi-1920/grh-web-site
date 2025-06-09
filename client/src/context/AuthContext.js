// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // Clear localStorage on application startup to ensure users always start at login page
        // This prevents the issue where the app sometimes opens directly to a chef account
        if (window.location.pathname === '/' || window.location.pathname === '') {
          localStorage.removeItem("employee");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Essayer de récupérer l'employé d'abord
        const storedEmployee = localStorage.getItem("employee");
        if (storedEmployee) {
          setUser(JSON.parse(storedEmployee));
          return;
        }

        // Si pas d'employé, essayer de récupérer l'utilisateur
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          return;
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur depuis localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Effet pour gérer la navigation arrière après déconnexion et login
  useEffect(() => {
    // Fonction pour vérifier si l'utilisateur est authentifié
    const checkAuth = () => {
      const storedEmployee = localStorage.getItem("employee");
      const storedUser = localStorage.getItem("user");
      return !!(storedEmployee || storedUser);
    };

    // Vérifier immédiatement au montage du composant
    if (checkAuth() && window.location.pathname.includes('/login')) {
      // Rediriger vers la page appropriée en fonction du rôle
      const storedEmployee = localStorage.getItem("employee");
      if (storedEmployee) {
        const userData = JSON.parse(storedEmployee);
        const role = userData.role.trim().toLowerCase();
        
        if (role === "admin") {
          window.location.replace("/dashboard");
        } else if (role === "chef") {
          window.location.replace("/chef-dashboard");
        } else {
          console.log("Redirecting employee from login to dashboard");
          window.location.replace("/employee-dashboard");
        }
        return;
      }
    }

    // Fonction pour gérer l'événement popstate (bouton retour du navigateur)
    const handlePopState = (event) => {
      // Si l'utilisateur est authentifié et tente de revenir à la page de login
      if (checkAuth() && window.location.pathname.includes('/login')) {
        // Rediriger vers la page appropriée en fonction du rôle
        const storedEmployee = localStorage.getItem("employee");
        if (storedEmployee) {
          const userData = JSON.parse(storedEmployee);
          const role = userData.role.trim().toLowerCase();
          
          if (role === "admin") {
            window.location.replace("/dashboard");
          } else if (role === "chef") {
            window.location.replace("/chef-dashboard");
          } else {
            console.log("Redirecting employee from login to dashboard");
            window.location.replace("/employee-dashboard");
          }
          return;
        }
      }
      
      // Si l'utilisateur n'est pas authentifié et tente d'accéder à une page protégée
      if (!checkAuth() && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        // Rediriger vers la page de connexion
        window.location.replace("/login");
      }
    };

    // Ajouter un écouteur d'événement pour popstate
    window.addEventListener('popstate', handlePopState);

    // Nettoyer l'écouteur d'événement lors du démontage du composant
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fonction pour déconnecter l'utilisateur
  const logout = () => {
    // Supprimer les données d'authentification du localStorage
    localStorage.removeItem("employee");
    localStorage.removeItem("user");
    
    // Effacer l'utilisateur du contexte
    setUser(null);
    
    // Ajouter un timestamp à l'historique pour empêcher la navigation arrière
    const logoutTime = new Date().getTime();
    sessionStorage.setItem('logoutTime', logoutTime);
    
    // Désactiver le cache pour empêcher l'accès aux pages précédentes
    // Ces en-têtes sont appliqués via meta tags
    document.querySelector('meta[http-equiv="Cache-Control"]')?.remove();
    const metaCacheControl = document.createElement('meta');
    metaCacheControl.setAttribute('http-equiv', 'Cache-Control');
    metaCacheControl.setAttribute('content', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    document.head.appendChild(metaCacheControl);
    
    document.querySelector('meta[http-equiv="Pragma"]')?.remove();
    const metaPragma = document.createElement('meta');
    metaPragma.setAttribute('http-equiv', 'Pragma');
    metaPragma.setAttribute('content', 'no-cache');
    document.head.appendChild(metaPragma);
    
    document.querySelector('meta[http-equiv="Expires"]')?.remove();
    const metaExpires = document.createElement('meta');
    metaExpires.setAttribute('http-equiv', 'Expires');
    metaExpires.setAttribute('content', '0');
    document.head.appendChild(metaExpires);
    
    // Forcer une redirection vers la page de connexion
    window.location.replace("/login");
  };

  // Effet pour vérifier l'état de l'authentification à chaque changement de page
  useEffect(() => {
    // Fonction pour vérifier si l'utilisateur est authentifié
    const checkAuthState = () => {
      const storedEmployee = localStorage.getItem("employee");
      const storedUser = localStorage.getItem("user");
      const isAuthenticated = !!(storedEmployee || storedUser);
      const logoutTime = sessionStorage.getItem('logoutTime');
      
      // Si l'utilisateur n'est pas authentifié mais tente d'accéder à une page protégée
      if (!isAuthenticated && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        // Rediriger vers la page de connexion
        window.location.replace("/login");
        return;
      }
      
      // Si l'utilisateur est authentifié, vérifier qu'il accède au bon dashboard
      if (isAuthenticated && storedEmployee) {
        const userData = JSON.parse(storedEmployee);
        const role = userData.role.trim().toLowerCase();
        const currentPath = window.location.pathname;
        
        // Vérifier si l'utilisateur tente d'accéder à un dashboard qui ne correspond pas à son rôle
        if ((role === "admin" && (currentPath.includes('/chef-dashboard') || currentPath.includes('/employee-dashboard'))) ||
            (role === "chef" && (currentPath.includes('/dashboard') || currentPath.includes('/employee-dashboard'))) ||
            (role !== "admin" && role !== "chef" && (currentPath.includes('/dashboard') || currentPath.includes('/chef-dashboard')))) {
          
          // Rediriger vers le dashboard approprié
          if (role === "admin") {
            window.location.replace("/dashboard");
          } else if (role === "chef") {
            window.location.replace("/chef-dashboard");
          } else {
            window.location.replace("/employee-dashboard");
          }
        }
      }
    };
    
    // Vérifier l'état d'authentification au chargement de la page
    checkAuthState();
    
    // Ajouter un écouteur d'événement pour les changements d'historique
    const handleHistoryChange = () => {
      checkAuthState();
    };
    
    window.addEventListener('popstate', handleHistoryChange);
    
    return () => {
      window.removeEventListener('popstate', handleHistoryChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
