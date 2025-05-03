// src/pages/EmployeeProjects.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeProjects = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to employee dashboard with projects tab
    navigate('/employee-dashboard');
  }, [navigate]);

  return (
    <div>
      Redirection vers le tableau de bord...
    </div>
  );
};

export default EmployeeProjects;
