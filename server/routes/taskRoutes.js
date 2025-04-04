const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");

// Créer une nouvelle tâche
router.post("/", async (req, res) => {
  try {
    const { name, details, deadline, assignedEmployee, priority, status } = req.body;

    // Vérifier que l'ID de l'employé est valide
    if (!assignedEmployee || !mongoose.Types.ObjectId.isValid(assignedEmployee)) {
      return res.status(400).json({ message: "ID de l'employé invalide." });
    }

    const newTask = new Task({
      name,
      details,
      deadline,
      assignedEmployee,
      priority,
      status,
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Récupérer toutes les tâches
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedEmployee", "firstName lastName email");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une tâche par son ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("assignedEmployee", "firstName lastName email");
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une tâche
router.put("/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Supprimer une tâche
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }
    res.status(200).json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
