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
app.use(cors());
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

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
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
      console.log("- /api/test");

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
