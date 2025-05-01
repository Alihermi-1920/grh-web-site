// server/scripts/createDefaultLeaveBalances.js
const mongoose = require('mongoose');
const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');
require('dotenv').config();

// Default annual leave days
const DEFAULT_ANNUAL_LEAVE_DAYS = 30;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all users
      const users = await User.find();
      console.log(`Found ${users.length} users`);
      
      // Create default leave balances for users who don't have one
      let created = 0;
      
      for (const user of users) {
        // Check if user already has a leave balance
        const existingBalance = await LeaveBalance.findOne({ employee: user._id });
        
        if (!existingBalance) {
          // Create new leave balance
          const leaveBalance = new LeaveBalance({
            employee: user._id,
            totalDays: DEFAULT_ANNUAL_LEAVE_DAYS,
            usedDays: 0,
            remainingDays: DEFAULT_ANNUAL_LEAVE_DAYS,
            medicalDays: 0,
            year: new Date().getFullYear()
          });
          
          await leaveBalance.save();
          created++;
          console.log(`Created leave balance for ${user.firstName} ${user.lastName}`);
        }
      }
      
      console.log(`Created ${created} new leave balances`);
      console.log('Done!');
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
