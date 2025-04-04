const express = require("express");
const router = express.Router();
const Department = require("../models/Department");

// Endpoint pour ajouter un département
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    // Vérifier si le département existe déjà (en minuscules)
    const existing = await Department.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Département existant" });
    }
    const department = new Department({ name: name.toLowerCase() });
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Endpoint pour récupérer tous les départements
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint pour modifier un département
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { name: name.toLowerCase() },
      { new: true }
    );
    if (!updatedDepartment) {
      return res.status(404).json({ message: "Département non trouvé" });
    }
    res.status(200).json(updatedDepartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Endpoint pour supprimer un département
router.delete("/:id", async (req, res) => {
  try {
    const deletedDepartment = await Department.findByIdAndDelete(req.params.id);
    if (!deletedDepartment) {
      return res.status(404).json({ message: "Département non trouvé" });
    }
    res.status(200).json({ message: "Département supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
