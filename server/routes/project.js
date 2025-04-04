// routes/project.js
const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Notification = require("../models/Notification");

// Récupérer tous les projets
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("projectLeader")
      .populate("team");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer un projet par son ID
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("projectLeader")
      .populate("team");
    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Créer un nouveau projet et générer une notification
router.post("/", async (req, res) => {
  try {
    const newProject = new Project(req.body);
    const savedProject = await newProject.save();

    // Création de la notification lors de la création du projet
    const notification = new Notification({
      type: "project",
      message: `Nouveau projet créé : ${savedProject.projectName}`,
      project: savedProject._id,
    });
    await notification.save();

    res.status(201).json(savedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mettre à jour un projet existant
router.put("/:id", async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }
    res.json(updatedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Supprimer un projet
router.delete("/:id", async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }
    res.json({ message: "Projet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
