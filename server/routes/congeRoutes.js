// server/routes/congeRoutes.js
const express = require('express');
const router = express.Router();
const congeController = require('../controllers/congeController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../client/public/uploads');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG and PDF files are allowed'));
    }
    cb(null, true);
  },
  // Preserve the request body fields
  preservePath: true
});

// Middleware to ensure employee ID is preserved
const preserveEmployeeId = (req, res, next) => {
  // Store employee ID from query params or body before multer processes the request
  const employeeId = req.query.employee || req.body.employee || req.query.employeeId || req.body.employeeId;

  if (employeeId) {
    // Store it in a special property that won't be affected by multer
    req._employeeId = employeeId;
    console.log('Preserved employee ID in middleware:', req._employeeId);
  }

  next();
};

// Middleware to restore employee ID after multer
const restoreEmployeeId = (req, res, next) => {
  if (req._employeeId) {
    // Restore the employee ID to the request body
    req.body.employee = req._employeeId;
    console.log('Restored employee ID after multer:', req.body.employee);
  }

  next();
};

// Routes
// Add a route for JSON requests (no files)
router.post('/json', congeController.createConge);

// Keep the original route for FormData requests with files
router.post('/',
  preserveEmployeeId,
  upload.array('documents', 5),
  restoreEmployeeId,
  congeController.createConge
);
router.get('/', congeController.getConges);
router.get('/balance/:employeeId', congeController.getLeaveBalance);
router.put('/:congeId/status', congeController.updateCongeStatus);
router.delete('/:congeId', congeController.deleteConge);

module.exports = router;
