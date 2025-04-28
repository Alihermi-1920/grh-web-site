// routes/project.js
const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");
const Task = require("../models/Task");

// GET tous les projets avec population des références
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("projectLeader", "firstName lastName photo position department")
      .populate("team", "firstName lastName photo position department");

    res.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET un projet spécifique avec toutes les relations
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("projectLeader", "firstName lastName photo position department")
      .populate("team", "firstName lastName photo position department");

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Récupérer les tâches associées au projet
    const tasks = await Task.find({ project: req.params.id })
      .populate("assignedTo", "firstName lastName photo")
      .populate("assignedBy", "firstName lastName");

    // Inclure les tâches dans la réponse
    const projectWithTasks = {
      ...project.toObject(),
      tasks: tasks,
    };

    res.json(projectWithTasks);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST créer un nouveau projet
router.post("/", async (req, res) => {
  try {
    console.log("Received project data:", req.body);

    const {
      projectName,
      projectLeader,
      deadline,
      description,
      priority,
      status,
      team,
      budget
    } = req.body;

    if (!projectName) {
      return res.status(400).json({ message: "Le nom du projet est requis" });
    }

    console.log("Creating new project with data:", {
      projectName,
      projectLeader,
      deadline,
      description,
      priority,
      status,
      team,
      budget
    });

    const newProject = new Project({
      projectName,
      projectLeader,
      deadline,
      description,
      priority,
      status,
      team,
      budget,
      completionPercentage: 0
    });

    const savedProject = await newProject.save();
    console.log("Project saved successfully:", savedProject);

    // Récupérer le projet avec les références
    const populatedProject = await Project.findById(savedProject._id)
      .populate("projectLeader", "firstName lastName photo position department")
      .populate("team", "firstName lastName photo position department");

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);

    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Erreur de validation",
        errors: validationErrors
      });
    }

    // Check if it's a cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: `Format invalide pour le champ ${error.path}`
      });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT mettre à jour un projet
router.put("/:id", async (req, res) => {
  try {
    const {
      projectName,
      projectLeader,
      deadline,
      description,
      priority,
      status,
      team,
      budget,
      completionPercentage
    } = req.body;

    if (!projectName) {
      return res.status(400).json({ message: "Le nom du projet est requis" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        projectName,
        projectLeader,
        deadline,
        description,
        priority,
        status,
        team,
        budget,
        completionPercentage: completionPercentage || 0
      },
      { new: true }
    )
    .populate("projectLeader", "firstName lastName photo position department")
    .populate("team", "firstName lastName photo position department");

    if (!updatedProject) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE supprimer un projet
router.delete("/:id", async (req, res) => {
  try {
    // Vérifier si le projet existe
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Supprimer toutes les tâches associées au projet
    await Task.deleteMany({ project: req.params.id });

    // Supprimer le projet
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Projet et toutes ses tâches supprimés avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET projets d'un employé (soit en tant que chef, soit en tant que membre d'équipe)
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Rechercher tous les projets où l'employé est chef de projet ou membre de l'équipe
    const projects = await Project.find({
      $or: [
        { projectLeader: employeeId },
        { team: { $in: [employeeId] } }
      ]
    })
    .populate("projectLeader", "firstName lastName photo position department")
    .populate("team", "firstName lastName photo position department");

    res.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets de l'employé:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT pour mettre à jour la progression d'un projet (calculée à partir des tâches)
router.put("/:id/progress", async (req, res) => {
  try {
    const projectId = req.params.id;

    // Récupérer toutes les tâches du projet
    const tasks = await Task.find({ project: projectId });

    if (tasks.length === 0) {
      // Si aucune tâche, définir la progression à 0 ou conserver la valeur actuelle
      const project = await Project.findByIdAndUpdate(
        projectId,
        { completionPercentage: 0 },
        { new: true }
      );
      return res.json(project);
    }

    // Calculer la progression moyenne basée sur le pourcentage d'achèvement des tâches
    const totalPercentage = tasks.reduce((sum, task) => sum + task.completionPercentage, 0);
    const averagePercentage = Math.round(totalPercentage / tasks.length);

    // Mettre à jour la progression du projet
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { completionPercentage: averagePercentage },
      { new: true }
    )
    .populate("projectLeader", "firstName lastName photo position department")
    .populate("team", "firstName lastName photo position department");

    res.json(updatedProject);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;