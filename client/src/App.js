// src/App.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const App = () => {
  const navigate = useNavigate();

  // Redirect to login page immediately and clear any stored authentication
  useEffect(() => {
    // Clear any stored authentication data to ensure fresh login
    localStorage.removeItem("employee");
    localStorage.removeItem("user");
    
    // Always redirect to login page
    navigate("/login", { replace: true });
  }, [navigate]);

  // This return statement won't be visible as we're redirecting
  return null;
};

export default App;
