// server/scripts/testCongeApi.js
const axios = require('axios');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get a random employee
      const employee = await Employee.findOne();
      
      if (!employee) {
        console.log('No employees found in the database');
        process.exit(1);
      }
      
      console.log('Found employee:', employee);
      
      // Test get leave balance
      console.log('\nTesting GET /api/conges/balance/:employeeId');
      try {
        const balanceResponse = await axios.get(`http://localhost:5000/api/conges/balance/${employee._id}`);
        console.log('Leave balance response:', balanceResponse.data);
      } catch (error) {
        console.error('Error getting leave balance:', error.response?.data || error.message);
      }
      
      // Test create leave request
      console.log('\nTesting POST /api/conges');
      try {
        const leaveData = {
          employee: employee._id,
          leaveType: 'Congé payé',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          numberOfDays: 7,
          reason: 'Test leave request',
          isMedical: false
        };
        
        const createResponse = await axios.post('http://localhost:5000/api/conges', leaveData);
        console.log('Create leave response:', createResponse.data);
      } catch (error) {
        console.error('Error creating leave request:', error.response?.data || error.message);
      }
      
      // Test get leave requests
      console.log('\nTesting GET /api/conges?employeeId=:employeeId');
      try {
        const leavesResponse = await axios.get(`http://localhost:5000/api/conges?employeeId=${employee._id}`);
        console.log('Leave requests response:', leavesResponse.data);
      } catch (error) {
        console.error('Error getting leave requests:', error.response?.data || error.message);
      }
      
      console.log('\nTests completed');
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
