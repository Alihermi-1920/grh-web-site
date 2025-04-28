// routes/projects.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Project = require("../models/Project");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to both server and client directories
    const serverUploadDir = path.join(__dirname, "../uploads/projects");
    const clientUploadDir = path.join(__dirname, "../../client/public/uploads/projects");

    // Ensure both directories exist
    if (!fs.existsSync(serverUploadDir)) {
      fs.mkdirSync(serverUploadDir, { recursive: true });
    }

    if (!fs.existsSync(clientUploadDir)) {
      fs.mkdirSync(clientUploadDir, { recursive: true });
    }

    // Save to client directory for direct access from browser
    cb(null, clientUploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to accept only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Veuillez télécharger un document PDF, Word, Excel, PowerPoint, texte ou image.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create a new project
router.post("/", async (req, res) => {
  try {
    const { projectName, projectLeader, deadline, description, priority } = req.body;

    // Validate required fields
    if (!projectName || !projectLeader || !deadline) {
      return res.status(400).json({
        message: "Le nom du projet, le chef de projet et la date limite sont obligatoires"
      });
    }

    // Check if the project leader exists and is a chef
    const leader = await Employee.findById(projectLeader);
    if (!leader) {
      return res.status(404).json({ message: "Chef de projet non trouvé" });
    }

    if (leader.role !== "Chef") {
      return res.status(400).json({
        message: "Le chef de projet doit avoir le rôle 'Chef'"
      });
    }

    // Create the project
    const project = new Project({
      projectName,
      projectLeader,
      deadline,
      description,
      priority,
      status: "planning", // Default status
      team: [], // Empty team initially
      completionPercentage: 0
    });

    await project.save();

    res.status(201).json(project);
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("projectLeader", "firstName lastName email photo")
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get projects by employee (chef) ID
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Validate employeeId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "ID d'employé invalide" });
    }

    // Find projects where this employee is the project leader
    const projects = await Project.find({ projectLeader: employeeId })
      .populate("projectLeader", "firstName lastName email photo")
      .populate("team", "firstName lastName email photo role")
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets par employé:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get a specific project by ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("projectLeader", "firstName lastName email photo")
      .populate("team", "firstName lastName email photo role");

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Update a project
router.put("/:id", async (req, res) => {
  try {
    const { projectName, projectLeader, deadline, description, status, priority, team, budget } = req.body;

    // Find the project
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // If changing the project leader, verify the new leader
    if (projectLeader && projectLeader !== project.projectLeader?.toString()) {
      const leader = await Employee.findById(projectLeader);
      if (!leader) {
        return res.status(404).json({ message: "Chef de projet non trouvé" });
      }

      if (leader.role !== "Chef") {
        return res.status(400).json({
          message: "Le chef de projet doit avoir le rôle 'Chef'"
        });
      }
    }

    // Prepare update object
    const updateData = {};

    // Only include fields that are provided
    if (projectName !== undefined) updateData.projectName = projectName;
    if (projectLeader !== undefined) updateData.projectLeader = projectLeader;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (budget !== undefined) updateData.budget = budget;

    // Handle team updates
    if (team !== undefined) {
      // Validate that all team members exist
      if (team.length > 0) {
        const teamMembers = await Employee.find({ _id: { $in: team } });
        if (teamMembers.length !== team.length) {
          return res.status(400).json({ message: "Un ou plusieurs membres de l'équipe n'existent pas" });
        }
      }
      updateData.team = team;
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate("projectLeader", "firstName lastName email photo")
    .populate("team", "firstName lastName email photo role position department");

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.status(200).json({ message: "Projet supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Upload files to a project
router.post("/:id/documents", upload.array("files", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de projet invalide" });
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
    }

    // Process uploaded files
    const documents = req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/projects/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
      uploadDate: new Date()
    }));

    // Add documents to project
    project.documents = [...(project.documents || []), ...documents];

    // Add a comment about the document upload
    if (userId && userName) {
      const comment = {
        text: `${userName} a ajouté ${req.files.length} document(s) au projet`,
        author: userId,
        authorName: userName,
        type: "document_upload",
        createdAt: new Date()
      };

      project.comments = [...(project.comments || []), comment];
    }

    await project.save();

    res.status(200).json({
      message: "Documents téléchargés avec succès",
      documents: documents
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement des documents:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get all documents for a project
router.get("/:id/documents", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de projet invalide" });
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.status(200).json(project.documents || []);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Add a comment to a project
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId, userName, type, oldStatus, newStatus } = req.body;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de projet invalide" });
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Create comment
    const comment = {
      text,
      author: userId || author, // Support both userId and author for backward compatibility
      authorName: userName || authorName, // Support both userName and authorName for backward compatibility
      type: type || "general",
      oldStatus,
      newStatus,
      createdAt: new Date()
    };

    // Add comment to project
    project.comments = [...(project.comments || []), comment];
    await project.save();

    res.status(200).json({
      message: "Commentaire ajouté avec succès",
      comment
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get all comments for a project
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de projet invalide" });
    }

    // Find the project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.status(200).json(project.comments || []);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
