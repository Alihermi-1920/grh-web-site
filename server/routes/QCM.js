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
    if (!question)
      return res.status(404).json({ message: "Question non trouvée" });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/qcm - Ajouter une nouvelle question
router.post("/", async (req, res) => {
  const { chapter, question } = req.body;

  if (!chapter || !question) {
    return res.status(400).json({ message: "Chapitre et question sont requis" });
  }

  // Génération automatique des options de 0 à 5
  const finalOptions = Array.from({ length: 6 }, (_, note) => ({
    text: note.toString(),
    note,
  }));

  try {
    const newQuestion = new QCM({ chapter, question, options: finalOptions });
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PUT /api/qcm/:id - Modifier une question existante
router.put("/:id", async (req, res) => {
  const { chapter, question } = req.body;

  // Pour la modification, nous laissons les options inchangées
  const updatedData = { chapter, question };

  try {
    const updatedQuestion = await QCM.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );
    if (!updatedQuestion)
      return res.status(404).json({ message: "Question non trouvée" });
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/qcm/:id - Supprimer une question
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await QCM.findByIdAndDelete(req.params.id);
    if (!deletedQuestion)
      return res.status(404).json({ message: "Question non trouvée" });
    res.json({ message: "Question supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE /api/qcm/chapter/:chapterName - Supprimer toutes les questions d'un chapitre
router.delete("/chapter/:chapterName", async (req, res) => {
  try {
    const { chapterName } = req.params;

    // Delete all questions with the specified chapter name
    const result = await QCM.deleteMany({ chapter: chapterName });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Aucune question trouvée dans ce chapitre" });
    }

    res.json({
      message: `${result.deletedCount} question(s) supprimée(s) avec succès`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du chapitre:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
