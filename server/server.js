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
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directories
const serverUploadsDir = path.join(__dirname, 'uploads');
const serverProjectsDir = path.join(serverUploadsDir, 'projects');
const clientUploadsDir = path.join(__dirname, '../client/public/uploads');
const clientProjectsDir = path.join(clientUploadsDir, 'projects');

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
const congeRoutes = require("./routes/conges");
const evaluationResultatRoutes = require("./routes/evaluationresultat");
const uploadRoutes = require("./routes/upload");
const commentRoutes = require("./routes/comments");

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
      console.log("- /api/test");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
