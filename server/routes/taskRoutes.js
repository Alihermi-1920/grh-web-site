// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create both server and client upload directories
    const serverDir = "uploads/tasks";
    const clientDir = path.join(__dirname, "../../client/public/uploads/tasks");

    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    // Store in client directory for easy access
    cb(null, clientDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// GET toutes les tâches
router.get("/", async (req, res) => {
  try {
    // Check if we need to filter by assignedBy
    const filter = {};
    if (req.query.assignedBy) {
      filter.assignedBy = req.query.assignedBy;
      console.log(`Filtering tasks by assignedBy: ${req.query.assignedBy}`);
    }

    const tasks = await Task.find(filter)
      .populate("project", "projectName")
      .populate("assignedTo", "firstName lastName photo")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo");

    console.log(`Found ${tasks.length} tasks${req.query.assignedBy ? ` for chef ${req.query.assignedBy}` : ''}`);
    res.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET les tâches d'un projet spécifique
router.get("/project/:projectId", async (req, res) => {
  try {
    console.log("Fetching tasks for project:", req.params.projectId);

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({ message: "ID de projet invalide" });
    }

    // Find tasks for this project
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "firstName lastName email photo role position department")
      .populate("assignedBy", "firstName lastName email photo")
      .populate("comments.author", "firstName lastName photo")
      .sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks for project ${req.params.projectId}`);

    res.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches du projet:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET les tâches assignées à un employé
router.get("/employee/:employeeId", async (req, res) => {
  try {
    console.log("Fetching tasks for employee:", req.params.employeeId);

    // Validate employeeId
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: "ID d'employé invalide" });
    }

    // Find tasks assigned to this employee
    const tasks = await Task.find({ assignedTo: req.params.employeeId })
      .populate("project", "projectName status priority deadline")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo")
      .sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks for employee ${req.params.employeeId}`);

    res.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches de l'employé:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET une tâche spécifique
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "projectName")
      .populate("assignedTo", "firstName lastName photo position department")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo");

    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    res.json(task);
  } catch (error) {
    console.error("Erreur lors de la récupération de la tâche:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST créer une nouvelle tâche
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedTo,
      assignedBy,
      deadline,
      priority,
      status
    } = req.body;

    if (!title || !projectId || !assignedBy) {
      return res.status(400).json({
        message: "Le titre, le projet et l'assignateur sont requis"
      });
    }

    // Vérifier que le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const newTask = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      assignedBy,
      deadline,
      priority: priority || "medium",
      status: status || "pending",
      completionPercentage: 0
    });

    const savedTask = await newTask.save();

    // Récupérer la tâche avec les références populées
    const populatedTask = await Task.findById(savedTask._id)
      .populate("project", "projectName")
      .populate("assignedTo", "firstName lastName photo")
      .populate("assignedBy", "firstName lastName photo");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT mettre à jour une tâche
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      deadline,
      priority,
      status,
      completionPercentage
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Le titre est requis" });
    }

    // Automatically set completion percentage based on status if not explicitly provided
    let autoCompletionPercentage = completionPercentage;

    if (status && !completionPercentage) {
      // Automatically set progress based on status
      switch (status) {
        case "pending":
          autoCompletionPercentage = 0;
          break;
        case "in-progress":
          autoCompletionPercentage = 25;
          break;
        case "review":
          autoCompletionPercentage = 75;
          break;
        case "completed":
          autoCompletionPercentage = 100;
          break;
        case "blocked":
        case "on-hold":
          // Keep existing percentage for these statuses
          const existingTask = await Task.findById(req.params.id);
          autoCompletionPercentage = existingTask ? existingTask.completionPercentage : 0;
          break;
        default:
          autoCompletionPercentage = 0;
      }
    } else if (status === "completed" && completionPercentage < 100) {
      // Force 100% completion when status is completed
      autoCompletionPercentage = 100;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        assignedTo,
        deadline,
        priority,
        status,
        completionPercentage: autoCompletionPercentage
      },
      { new: true }
    )
    .populate("project", "projectName")
    .populate("assignedTo", "firstName lastName photo")
    .populate("assignedBy", "firstName lastName photo")
    .populate("comments.author", "firstName lastName photo");

    if (!updatedTask) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    // Mettre à jour la progression du projet associé
    const projectId = updatedTask.project._id || updatedTask.project;
    await updateProjectProgress(projectId);

    res.json(updatedTask);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE supprimer une tâche
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    const projectId = task.project;

    await Task.findByIdAndDelete(req.params.id);

    // Mettre à jour la progression du projet
    await updateProjectProgress(projectId);

    res.json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST ajouter un commentaire à une tâche
router.post("/:id/comments", async (req, res) => {
  try {
    const { content, authorId } = req.body;

    if (!content || !authorId) {
      return res.status(400).json({
        message: "Le contenu et l'auteur sont requis"
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    task.comments.push({
      content,
      author: authorId,
      createdAt: new Date()
    });

    const updatedTask = await task.save();

    // Update project progress
    await updateProjectProgress(task.project);

    // Récupérer la tâche mise à jour avec les références populées
    const populatedTask = await Task.findById(updatedTask._id)
      .populate("project", "projectName")
      .populate("assignedTo", "firstName lastName photo")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo");

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST ajouter un fichier à une tâche
router.post("/:id/attachments", async (req, res) => {
  try {
    console.log("Received file upload request for task:", req.params.id);
    console.log("Request body:", req.body);

    // Check if task exists before processing upload
    const taskExists = await Task.exists({ _id: req.params.id });
    if (!taskExists) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    // Use upload middleware after validating task exists
    upload.array("files", 10)(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: "Erreur lors du téléchargement des fichiers: " + err.message });
      }

      try {
        // Fetch task again after multer processing
        const task = await Task.findById(req.params.id);

        // Vérifier si des fichiers ont été téléchargés
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
        }

        console.log(`Processing ${req.files.length} files for task ${req.params.id}`);

        const attachments = [];

        // Traiter chaque fichier téléchargé
        for (const file of req.files) {
          console.log("Processing file:", file.originalname);

          // Convert Windows path to web path
          const webPath = `/uploads/tasks/${file.filename}`;

          const attachment = {
            fileName: file.filename,
            originalName: file.originalname,
            filePath: webPath,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: req.body.userId,
            uploadDate: new Date(),
          };

          task.attachments.push(attachment);
          attachments.push(attachment);
        }

        // Si un commentaire est fourni, l'ajouter
        if (req.body.comment && req.body.userId) {
          task.comments.push({
            content: `Fichier(s) ajouté(s): ${req.body.comment}`,
            author: req.body.userId,
            createdAt: new Date()
          });
        }

        await task.save();
        console.log("Task saved with new attachments");

        // Update project progress
        await updateProjectProgress(task.project);

        // Récupérer la tâche mise à jour avec les références peuplées
        const updatedTask = await Task.findById(req.params.id)
          .populate("project", "projectName status priority deadline")
          .populate("assignedTo", "firstName lastName email photo role position department")
          .populate("assignedBy", "firstName lastName email photo")
          .populate("comments.author", "firstName lastName photo");

        res.status(201).json({
          message: `${req.files.length} fichier(s) téléchargé(s) avec succès`,
          task: updatedTask,
          attachments: attachments
        });
      } catch (innerError) {
        console.error("Error processing files:", innerError);
        console.error("Stack trace:", innerError.stack);
        res.status(500).json({ message: "Erreur lors du traitement des fichiers: " + innerError.message });
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout des fichiers:", error);
    console.error("Stack trace:", error.stack);
    console.error("Request body:", req.body);
    console.error("Task ID:", req.params.id);
    res.status(500).json({ message: "Erreur serveur: " + error.message });
  }
});

// DELETE supprimer un fichier d'une tâche
router.delete("/:id/attachments/:attachmentId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Pièce jointe non trouvée" });
    }

    // Supprimer le fichier physique
    const fileName = attachment.fileName;
    const clientFilePath = path.join(__dirname, "../../client/public/uploads/tasks", fileName);

    if (fs.existsSync(clientFilePath)) {
      fs.unlinkSync(clientFilePath);
      console.log(`Deleted file: ${clientFilePath}`);
    } else {
      console.log(`File not found: ${clientFilePath}`);
    }

    // Supprimer la référence dans la base de données
    task.attachments.pull(req.params.attachmentId);
    await task.save();

    // Update project progress
    await updateProjectProgress(task.project);

    // Récupérer la tâche mise à jour avec les références peuplées
    const updatedTask = await Task.findById(req.params.id)
      .populate("project", "projectName status priority deadline")
      .populate("assignedTo", "firstName lastName email photo role position department")
      .populate("assignedBy", "firstName lastName email photo")
      .populate("comments.author", "firstName lastName photo");

    res.json(updatedTask);
  } catch (error) {
    console.error("Erreur lors de la suppression de la pièce jointe:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour mettre à jour la progression de tous les projets
router.post("/update-all-projects-progress", async (req, res) => {
  try {
    // Get all projects
    const projects = await Project.find({});

    let updatedCount = 0;

    // Update progress for each project
    for (const project of projects) {
      await updateProjectProgress(project._id);
      updatedCount++;
    }

    res.json({
      message: `Progression mise à jour pour ${updatedCount} projets`,
      updatedCount
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression des projets:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Fonction utilitaire pour mettre à jour la progression d'un projet
async function updateProjectProgress(projectId) {
  try {
    // Récupérer toutes les tâches du projet
    const tasks = await Task.find({ project: projectId });

    if (tasks.length === 0) {
      // Si aucune tâche, mettre la progression à 0
      await Project.findByIdAndUpdate(
        projectId,
        { completionPercentage: 0 }
      );
      return;
    }

    // Calculer la progression moyenne
    const totalPercentage = tasks.reduce((sum, task) => sum + (task.completionPercentage || 0), 0);
    const averagePercentage = Math.round(totalPercentage / tasks.length);

    console.log(`Updating project ${projectId} progress to ${averagePercentage}% based on ${tasks.length} tasks`);

    // Mettre à jour la progression du projet
    await Project.findByIdAndUpdate(
      projectId,
      { completionPercentage: averagePercentage }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression du projet:", error);
  }
}

module.exports = router;