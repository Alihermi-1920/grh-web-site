// Test script for leave system
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = 5002; // Use a different port

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../client/public/uploads/test');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'test-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Define MongoDB schemas
const employeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  chefId: mongoose.Schema.Types.ObjectId
});

const congeSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestEmployee',
    required: true
  },
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestEmployee'
  },
  leaveType: {
    type: String,
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['En attente', 'Approuvé', 'Rejeté'],
    default: 'En attente'
  },
  isMedical: { type: Boolean, default: false },
  documents: [{
    originalName: String,
    filePath: String,
    fileType: String,
    fileSize: Number
  }]
});

const leaveBalanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestEmployee',
    required: true
  },
  totalDays: { type: Number, default: 30 },
  usedDays: { type: Number, default: 0 },
  remainingDays: { type: Number, default: 30 },
  medicalDays: { type: Number, default: 0 }
});

// Create models
const TestEmployee = mongoose.model('TestEmployee', employeeSchema);
const TestConge = mongoose.model('TestConge', congeSchema);
const TestLeaveBalance = mongoose.model('TestLeaveBalance', leaveBalanceSchema);

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`\n=== ${req.method} ${req.url} ===`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// Routes
app.post('/api/test-conges', upload.array('documents', 5), async (req, res) => {
  try {
    console.log('=== CREATE TEST LEAVE REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // Get employee ID from various sources
    let employeeId = req.body.employee || req.query.employee;
    
    console.log('Employee ID:', employeeId);
    
    if (!employeeId) {
      console.error('Employee ID is missing');
      return res.status(400).json({ error: "ID d'employé manquant" });
    }
    
    // Create a test employee if it doesn't exist
    let employee = await TestEmployee.findById(employeeId).catch(() => null);
    
    if (!employee) {
      console.log('Creating test employee');
      employee = new TestEmployee({
        _id: new mongoose.Types.ObjectId(employeeId),
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com'
      });
      await employee.save();
    }
    
    // Create a test chef if needed
    const chef = new TestEmployee({
      firstName: 'Test',
      lastName: 'Chef',
      email: 'chef@example.com'
    });
    await chef.save();
    
    // Update employee with chef
    employee.chefId = chef._id;
    await employee.save();
    
    // Get other fields from body
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;
    const isMedical = req.body.isMedical === 'true';
    
    // Create the leave request
    const conge = new TestConge({
      employee: employee._id,
      chef: chef._id,
      leaveType: leaveType || 'Congé payé',
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      numberOfDays: numberOfDays || 1,
      reason: reason || 'Test reason',
      isMedical
    });
    
    // Add documents if any
    if (req.files && req.files.length > 0) {
      conge.documents = req.files.map(file => ({
        originalName: file.originalname,
        filePath: `/uploads/test/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size
      }));
    }
    
    // Save the leave request
    await conge.save();
    console.log('Test leave request created successfully:', conge);
    
    res.status(201).json(conge);
  } catch (error) {
    console.error('Error creating test leave request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-conges', async (req, res) => {
  try {
    const conges = await TestConge.find().populate('employee', 'firstName lastName');
    res.status(200).json(conges);
  } catch (error) {
    console.error('Error getting test leave requests:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-conges/balance/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Create a test employee if it doesn't exist
    let employee = await TestEmployee.findById(employeeId).catch(() => null);
    
    if (!employee) {
      console.log('Creating test employee for balance check');
      employee = new TestEmployee({
        _id: new mongoose.Types.ObjectId(employeeId),
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com'
      });
      await employee.save();
    }
    
    // Find or create leave balance
    let leaveBalance = await TestLeaveBalance.findOne({ employee: employeeId });
    
    if (!leaveBalance) {
      console.log('Creating test leave balance');
      leaveBalance = new TestLeaveBalance({
        employee: employeeId,
        totalDays: 30,
        usedDays: 0,
        remainingDays: 30,
        medicalDays: 0
      });
      await leaveBalance.save();
    }
    
    res.status(200).json(leaveBalance);
  } catch (error) {
    console.error('Error getting test leave balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test API is working!' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    app.listen(port, () => {
      console.log(`Test server running on port ${port}`);
      console.log('Test routes:');
      console.log('- POST /api/test-conges');
      console.log('- GET /api/test-conges');
      console.log('- GET /api/test-conges/balance/:employeeId');
      console.log('- GET /api/test');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
