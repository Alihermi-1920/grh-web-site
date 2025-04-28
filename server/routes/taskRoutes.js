// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");

// GET toutes les tâches
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("project", "projectName")
      .populate("assignedTo", "firstName lastName photo")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo");
    
    res.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET les tâches d'un projet spécifique
router.get("/project/:projectId", async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "firstName lastName photo")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo");
    
    res.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET les tâches assignées à un employé
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.employeeId })
      .populate("project", "projectName")
      .populate("assignedBy", "firstName lastName photo")
      .populate("comments.author", "firstName lastName photo");
    
    res.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches de l'employé:", error);
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
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        assignedTo,
        deadline,
        priority,
        status,
        completionPercentage: completionPercentage || 0
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

// Fonction utilitaire pour mettre à jour la progression d'un projet
async function updateProjectProgress(projectId) {
  try {
    // Récupérer toutes les tâches du projet
    const tasks = await Task.find({ project: projectId });
    
    if (tasks.length === 0) {
      // Si aucune tâche, conserver la progression actuelle ou la mettre à 0
      return;
    }
    
    // Calculer la progression moyenne
    const totalPercentage = tasks.reduce((sum, task) => sum + (task.completionPercentage || 0), 0);
    const averagePercentage = Math.round(totalPercentage / tasks.length);
    
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