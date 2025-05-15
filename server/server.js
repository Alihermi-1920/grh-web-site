const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000; // Default port

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Custom middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  next();
});

// Create uploads directories
const serverUploadsDir = path.join(__dirname, 'uploads');
const serverProjectsDir = path.join(serverUploadsDir, 'projects');
const clientUploadsDir = path.join(__dirname, '../client/public/uploads');
const clientProjectsDir = path.join(clientUploadsDir, 'projects');
const clientCongesDir = path.join(clientUploadsDir, 'conges');

// Create server-side upload directories
if (!fs.existsSync(serverUploadsDir)) {
  fs.mkdirSync(serverUploadsDir, { recursive: true });
  console.log('Created server uploads directory');
}

if (!fs.existsSync(serverProjectsDir)) {
  fs.mkdirSync(serverProjectsDir, { recursive: true });
  console.log('Created server projects uploads directory');
}

// Create client-side upload directories
if (!fs.existsSync(clientUploadsDir)) {
  fs.mkdirSync(clientUploadsDir, { recursive: true });
  console.log('Created client uploads directory');
}

if (!fs.existsSync(clientProjectsDir)) {
  fs.mkdirSync(clientProjectsDir, { recursive: true });
  console.log('Created client projects uploads directory');
}

// Create client-side conges directory
if (!fs.existsSync(clientCongesDir)) {
  fs.mkdirSync(clientCongesDir, { recursive: true });
  console.log('Created client conges uploads directory');
}

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, '../client/public/uploads')));

// Import routes
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const presenceRoutes = require("./routes/presenceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const projectRoutes = require("./routes/projects");
const qcmRoutes = require("./routes/QCM");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notification");
const congeRoutes = require("./routes/finalCongeRoutes");
const evaluationResultatRoutes = require("./routes/evaluationresultat");
const uploadRoutes = require("./routes/upload");
const commentRoutes = require("./routes/comments");
const fileUploadRoutes = require("./routes/fileUploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const usersRoutes = require("./routes/users");
const maintenanceRoutes = require("./routes/maintenance");
// Email routes removed

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/qcm", qcmRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conges", congeRoutes);
app.use("/api/evaluationresultat", evaluationResultatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/files", fileUploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/maintenance", maintenanceRoutes);
// Email routes removed

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log("Routes registered:");
      console.log("- /api/auth");
      console.log("- /api/employees");
      console.log("- /api/departments");
      console.log("- /api/presence");
      console.log("- /api/reports");
      console.log("- /api/projects");
      console.log("- /api/qcm");
      console.log("- /api/tasks");
      console.log("- /api/notifications");
      console.log("- /api/conges");
      console.log("- /api/evaluationresultat");
      console.log("- /api/upload");
      console.log("- /api/comments");
      console.log("- /api/files");
      console.log("- /api/dashboard");
      console.log("- /api/users");
      console.log("- /api/maintenance");
      // Email routes removed
      console.log("- /api/test");
      console.log("- /api/test-email");
      console.log("- /api/leave-notification");

      // Update all project progress values
      console.log("Updating all project progress values...");
      const Project = require('./models/Project');
      const Task = require('./models/Task');

      // Define the updateProjectProgress function
      async function updateAllProjectsProgress() {
        try {
          // Get all projects
          const projects = await Project.find({});

          let updatedCount = 0;

          // Update progress for each project
          for (const project of projects) {
            // Get all tasks for this project
            const tasks = await Task.find({ project: project._id });

            if (tasks.length === 0) {
              // If no tasks, set progress to 0
              await Project.findByIdAndUpdate(
                project._id,
                { completionPercentage: 0 }
              );
            } else {
              // Calculate average progress
              const totalPercentage = tasks.reduce((sum, task) => sum + (task.completionPercentage || 0), 0);
              const averagePercentage = Math.round(totalPercentage / tasks.length);

              // Update project progress
              await Project.findByIdAndUpdate(
                project._id,
                { completionPercentage: averagePercentage }
              );
            }

            updatedCount++;
          }

          console.log(`Updated progress for ${updatedCount} projects`);
        } catch (error) {
          console.error("Error updating project progress:", error);
        }
      }

      // Call the function
      updateAllProjectsProgress();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
