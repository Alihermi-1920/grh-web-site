require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Import des routeurs
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const presenceRoutes = require("./routes/presenceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const qcmRoutes = require("./routes/QCM");
const notificationRoutes = require("./routes/notification");
// Si vous utilisez encore les routes de congés, vous pouvez les importer ici
const congeRoutes = require("./routes/conges");
const evaluationResultatRoutes = require("./routes/evaluationresultat");
// New routes for uploads and comments
const uploadRoutes = require("./routes/fileUploadRoutes");
// Nouvelle route pour les assignations de travail
const workAssignmentRoutes = require("./routes/workAssignmentRoutes");
// Messaging system routes removed
// Password change route
const passwordChangeRoutes = require("./routes/passwordChange");
// Maintenance routes removed
// Performance AI routes removed

// Make sure the email service is available
try {
  fs.accessSync(path.join(__dirname, 'services', 'emailService.js'));
  console.log('Email service found');
} catch (error) {
  console.error('Email service not found, creating it...');
  // We'll handle this later if needed
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directories if they don't exist
const serverUploadsDir = path.join(__dirname, 'uploads');
const clientUploadsDir = path.join(__dirname, '../client/public/uploads');

// Create server-side upload directories
if (!fs.existsSync(serverUploadsDir)) {
  fs.mkdirSync(serverUploadsDir, { recursive: true });
  console.log('Created server uploads directory');
}

// Create reports directory for AI-generated PDFs
const reportsDir = path.join(serverUploadsDir, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log('Created reports directory for AI-generated PDFs');
}

// Create client-side upload directories
if (!fs.existsSync(clientUploadsDir)) {
  fs.mkdirSync(clientUploadsDir, { recursive: true });
  console.log('Created client uploads directory');
}

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, '../client/public/uploads')));

// Définir les routes API
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/qcm", qcmRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conges", congeRoutes);
app.use("/api/evaluationresultat", evaluationResultatRoutes);
// Register new routes
app.use("/api/upload", uploadRoutes);
// Route pour les assignations de travail
app.use("/api/travaux", workAssignmentRoutes);
// Message routes removed
app.use("/api/password-change", passwordChangeRoutes);
// Maintenance routes removed
// Performance AI routes removed

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Test email route
app.get("/api/test-email", async (req, res) => {
  try {
    // Import the email service
    const { sendTestEmail } = require('./services/emailService');

    // Get the recipient email from the query parameter or use a default
    let recipientEmail = req.query.email || 'huiihyii212@gmail.com';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error(`Invalid email format: ${recipientEmail}`);
      recipientEmail = 'huiihyii212@gmail.com';
      console.log(`Using default email instead: ${recipientEmail}`);
    }

    // Log all request information for debugging
    console.log('=== TEST EMAIL REQUEST ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request query:', req.query);
    console.log('Request headers:', req.headers);
    console.log(`Sending test email to ${recipientEmail}...`);

    // Send a test email
    const result = await sendTestEmail(recipientEmail);

    if (result.success) {
      console.log('Test email sent successfully');
      console.log('Message ID:', result.messageId);
      res.json({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
        messageId: result.messageId
      });
    } else {
      console.error('Failed to send test email:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in test email route:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Leave notification email route
app.get("/api/leave-notification", async (req, res) => {
  try {
    // Import the email service
    const { sendLeaveNotificationEmail } = require('./services/emailService');

    // Get the recipient email from the query parameter or use a default
    let recipientEmail = req.query.email || 'huiihyii212@gmail.com';

    // Get other parameters
    const status = req.query.status || 'Approuvé';
    const employeeName = req.query.name || 'Employé';
    const startDate = req.query.startDate || new Date().toISOString();
    const endDate = req.query.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const numberOfDays = req.query.days || '7';
    const leaveType = req.query.type || 'Congé payé';
    const reason = req.query.reason || 'Vacances';
    const justification = req.query.justification || '';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error(`Invalid email format: ${recipientEmail}`);
      recipientEmail = 'huiihyii212@gmail.com';
      console.log(`Using default email instead: ${recipientEmail}`);
    }

    // Log all request information for debugging
    console.log('=== LEAVE NOTIFICATION EMAIL REQUEST ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request query:', req.query);
    console.log(`Sending leave notification email to ${recipientEmail}...`);

    // Create leave request object
    const leaveRequest = {
      status,
      startDate,
      endDate,
      numberOfDays,
      leaveType,
      reason,
      justification
    };

    // Create employee object
    const employee = {
      email: recipientEmail,
      firstName: employeeName.split(' ')[0] || 'Employé',
      lastName: employeeName.split(' ')[1] || ''
    };

    // Send the leave notification email
    const result = await sendLeaveNotificationEmail(leaveRequest, employee);

    if (result.success) {
      console.log('Leave notification email sent successfully');
      console.log('Message ID:', result.messageId);
      res.json({
        success: true,
        message: `Leave notification email sent successfully to ${recipientEmail}`,
        messageId: result.messageId
      });
    } else {
      console.error('Failed to send leave notification email:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in leave notification email route:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");

    // Log registered routes
    console.log("Routes registered:");
    console.log("- /api/auth");
    console.log("- /api/employees");
    console.log("- /api/departments");
    console.log("- /api/presence");
    console.log("- /api/reports");
    console.log("- /api/qcm");
    console.log("- /api/notifications");
    console.log("- /api/conges");
    console.log("- /api/evaluationresultat");
    console.log("- /api/upload");
    console.log("- /api/travaux");
    console.log("- /api/comments");
    console.log("- /api/password-change");
    console.log("- /api/maintenance");
    console.log("- /api/test");
    console.log("- /api/test-email");
    console.log("- /api/leave-notification");

    // Create mock PDF for development
    // try {
    //   require('./utils/createMockPdf');
    //   console.log('Mock PDF created for development');
    // } catch (error) {
    //   console.error('Error creating mock PDF:', error);
    // }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
