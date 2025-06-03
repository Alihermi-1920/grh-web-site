// src/utils/axiosConfig.js
import axios from 'axios';

// Add a request interceptor to automatically add the auth token to all requests
axios.interceptors.request.use(
  config => {
    // Try to get the token from localStorage
    const storedEmployee = localStorage.getItem('employee');
    
    if (storedEmployee) {
      try {
        const employee = JSON.parse(storedEmployee);
        if (employee && employee.token) {
          config.headers.Authorization = `Bearer ${employee.token}`;
        }
      } catch (error) {
        console.error('Error parsing employee from localStorage:', error);
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axios;