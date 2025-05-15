// src/App.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const App = () => {
  const navigate = useNavigate();

  // Redirect to login page immediately
  useEffect(() => {
    // Always redirect to login page
    navigate("/login");
  }, [navigate]);

  // This return statement won't be visible as we're redirecting
  return null;
};

export default App;
