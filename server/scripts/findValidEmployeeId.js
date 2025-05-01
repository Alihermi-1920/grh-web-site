// server/scripts/findValidEmployeeId.js
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find all employees
      const employees = await Employee.find().limit(5);
      
      if (employees.length === 0) {
        console.log('No employees found in the database');
      } else {
        console.log(`Found ${employees.length} employees:`);
        employees.forEach(employee => {
          console.log(`ID: ${employee._id}, Name: ${employee.firstName} ${employee.lastName}`);
        });
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
