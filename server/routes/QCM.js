// routes/QCM.js
const express = require("express");
const router = express.Router();
const QCM = require("../models/qcm");

// GET /api/qcm - Récupérer toutes les questions du QCM
router.get("/", async (req, res) => {
  try {
    const questions = await QCM.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/qcm/:id - Récupérer une question par son ID
router.get("/:id", async (req, res) => {
  try {
    const question = await QCM.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question non trouvée" });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/qcm - Ajouter une nouvelle question
router.post("/", async (req, res) => {
  const { question, options } = req.body;
  if (!question || !options || !Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ message: "Données invalides" });
  }
  try {
    const newQuestion = new QCM({ question, options });
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT /api/qcm/:id - Modifier une question existante
router.put("/:id", async (req, res) => {
  const { question, options } = req.body;
  try {
    const updatedQuestion = await QCM.findByIdAndUpdate(
      req.params.id,
      { question, options },
      { new: true }
    );
    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question non trouvée" });
    }
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/qcm/:id - Supprimer une question
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await QCM.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question non trouvée" });
    }
    res.json({ message: "Question supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
