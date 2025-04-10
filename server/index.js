require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import des routeurs
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const presenceRoutes = require("./routes/presenceRoutes");
const projectRoutes = require("./routes/project");
const qcmRoutes = require("./routes/QCM");
const taskRoutes = require("./routes/taskRoutes"); // Nom du fichier mis à jour si nécessaire
const notificationRoutes = require("./routes/notification");
// Si vous utilisez encore les routes de congés, vous pouvez les importer ici
const congeRoutes = require("./routes/conges");
const evaluationResultatRoutes = require("./routes/evaluationresultat");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Définir les routes API
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/qcm", qcmRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conges", congeRoutes);
app.use("/api/evaluationresultat", evaluationResultatRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
