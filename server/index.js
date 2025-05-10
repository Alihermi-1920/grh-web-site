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
const projectRoutes = require("./routes/projects");
const qcmRoutes = require("./routes/QCM");
const taskRoutes = require("./routes/taskRoutes"); // Nom du fichier mis à jour si nécessaire
const notificationRoutes = require("./routes/notification");
// Si vous utilisez encore les routes de congés, vous pouvez les importer ici
const congeRoutes = require("./routes/conges");
const evaluationResultatRoutes = require("./routes/evaluationresultat");
// New routes for uploads and comments
const uploadRoutes = require("./routes/upload");
const commentRoutes = require("./routes/comments");
// Messaging system routes removed
// Password change route
const passwordChangeRoutes = require("./routes/passwordChange");
// Performance AI routes removed

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directories if they don't exist
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

if (!fs.existsSync(clientProjectsDir)) {
  fs.mkdirSync(clientProjectsDir, { recursive: true });
  console.log('Created client projects uploads directory');
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
app.use("/api/projects", projectRoutes);
app.use("/api/qcm", qcmRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conges", congeRoutes);
app.use("/api/evaluationresultat", evaluationResultatRoutes);
// Register new routes
app.use("/api/upload", uploadRoutes);
app.use("/api/comments", commentRoutes);
// Message routes removed
app.use("/api/password-change", passwordChangeRoutes);
// Performance AI routes removed

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");

    // Create mock PDF for development
    try {
      require('./utils/createMockPdf');
      console.log('Mock PDF created for development');
    } catch (error) {
      console.error('Error creating mock PDF:', error);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
