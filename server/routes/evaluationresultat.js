// routes/evaluationresultat.js
const express = require("express");
const router = express.Router();
const EvaluationResultat = require("../models/evaluationresultat");

router.post("/", async (req, res) => {
  try {
    const { employeeId, employeeName, chapterScores, globalScore, date } = req.body;
    if (!employeeId || !employeeName || !chapterScores || globalScore === undefined) {
      return res.status(400).json({ message: "Certains champs requis sont manquants." });
    }
    const newResult = new EvaluationResultat({
      employeeId,
      employeeName,
      chapterScores,
      globalScore,
      date: date || Date.now()
    });
    await newResult.save();
    res.status(201).json(newResult);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'évaluation :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
