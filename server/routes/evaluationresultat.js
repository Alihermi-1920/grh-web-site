// routes/evaluationresultat.js
const express = require("express");
const router = express.Router();
const EvaluationResultat = require("../models/evaluationresultat");
const mongoose = require("mongoose");

// Create a new evaluation result
router.post("/", async (req, res) => {
  try {
    const { employeeId, employeeName, chapterScores, globalScore, periode, chapterComments } = req.body;
    if (!employeeId || !employeeName || !chapterScores || globalScore === undefined) {
      return res.status(400).json({ message: "Certains champs requis sont manquants." });
    }

    // Check if this employee has already been evaluated this month
    const existingEvaluation = await EvaluationResultat.findOne({
      employeeId,
      periode
    });

    if (existingEvaluation) {
      console.log(`Employee ${employeeId} already evaluated for ${periode}. Evaluation ID: ${existingEvaluation._id}`);
      return res.status(400).json({
        message: "Cet employé a déjà été évalué ce mois-ci.",
        existingEvaluation: existingEvaluation._id
      });
    }

    console.log(`Creating new evaluation for employee ${employeeId} for period ${periode}`);

    const newResult = new EvaluationResultat({
      employeeId,
      employeeName,
      chapterScores,
      chapterComments,
      globalScore,
      periode,
      date: new Date()
    });

    await newResult.save();
    res.status(201).json(newResult);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'évaluation :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get all evaluation results
router.get("/", async (req, res) => {
  try {
    const { year, month, employeeId } = req.query;
    let query = {};

    // Filter by employee if specified
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Filter by year and month if specified
    if (year || month) {
      // Create date range for filtering
      let startDate, endDate;

      if (year && month) {
        // Filter by specific year and month
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
      } else if (year) {
        // Filter by year only
        startDate = new Date(parseInt(year), 0, 1);
        endDate = new Date(parseInt(year), 11, 31);
      }

      query.date = { $gte: startDate, $lte: endDate };
    }

    // Get current user role from query params
    const { userRole, chefId } = req.query;

    // If user is a chef, only return evaluations for their employees
    if (userRole === 'Chef' && chefId) {
      // First get all employees for this chef
      const Employee = require("../models/Employee");
      const chefEmployees = await Employee.find({ chefId });
      const employeeIds = chefEmployees.map(emp => emp._id);

      // Add to query to only include these employees
      query.employeeId = { $in: employeeIds };
    }

    const results = await EvaluationResultat.find(query)
      .sort({ date: -1 }) // Most recent first
      .populate('employeeId', 'firstName lastName email photo department position');

    res.status(200).json(results);
  } catch (error) {
    console.error("Erreur lors de la récupération des évaluations :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get a specific evaluation result by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID d'évaluation invalide" });
    }

    const result = await EvaluationResultat.findById(id)
      .populate('employeeId', 'firstName lastName email photo department position');

    if (!result) {
      return res.status(404).json({ message: "Évaluation non trouvée" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'évaluation :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get evaluated employees for the current period
router.get("/evaluated-employees", async (req, res) => {
  try {
    const { periode, chefId } = req.query;
    console.log(`Getting evaluated employees for period: ${periode}, chefId: ${chefId || 'none'}`);

    let query = {};

    // Filter by period if specified
    if (periode) {
      query.periode = periode;
      console.log(`Filtering by period: ${periode}`);
    }

    // If chef ID is provided, only get evaluations for their employees
    if (chefId) {
      console.log(`Filtering by chef: ${chefId}`);
      // First get all employees for this chef
      const Employee = require("../models/Employee");
      const chefEmployees = await Employee.find({ chefId });
      console.log(`Found ${chefEmployees.length} employees for chef ${chefId}`);

      const employeeIds = chefEmployees.map(emp => emp._id.toString());
      console.log(`Employee IDs for chef ${chefId}: ${employeeIds.join(', ')}`);

      // Add to query to only include these employees
      query.employeeId = { $in: employeeIds.map(id => mongoose.Types.ObjectId(id)) };
    }

    console.log(`Final query for evaluations:`, query);

    // Get all evaluations matching the query
    const evaluations = await EvaluationResultat.find(query);
    console.log(`Found ${evaluations.length} evaluations matching the query`);

    // Extract unique employee IDs and ensure they are strings
    const evaluatedEmployeeIds = [...new Set(evaluations.map(eval => {
      // Make sure we're returning a string ID regardless of whether employeeId is an ObjectId or string
      if (!eval.employeeId) return null;
      return typeof eval.employeeId === 'object' && eval.employeeId._id
        ? eval.employeeId._id.toString()
        : eval.employeeId.toString();
    }).filter(id => id !== null))];

    console.log(`Returning ${evaluatedEmployeeIds.length} evaluated employee IDs: ${evaluatedEmployeeIds.join(', ')}`);

    res.status(200).json(evaluatedEmployeeIds);
  } catch (error) {
    console.error("Erreur lors de la récupération des employés évalués :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get evaluations for employees under a specific chef
router.get("/chef/:chefId", async (req, res) => {
  try {
    const { chefId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ message: "ID de chef invalide" });
    }

    // Get all employees for this chef
    const Employee = require("../models/Employee");
    const chefEmployees = await Employee.find({ chefId });

    if (chefEmployees.length === 0) {
      return res.status(200).json([]); // No employees, return empty array
    }

    const employeeIds = chefEmployees.map(emp => emp._id);

    // Get evaluations for these employees
    const evaluations = await EvaluationResultat.find({
      employeeId: { $in: employeeIds }
    })
    .sort({ date: -1 }) // Most recent first
    .populate('employeeId', 'firstName lastName email photo department position');

    res.status(200).json(evaluations);
  } catch (error) {
    console.error("Erreur lors de la récupération des évaluations par chef:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get evaluations for a specific employee
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "ID d'employé invalide" });
    }

    // Get evaluations for this employee
    const evaluations = await EvaluationResultat.find({ employeeId })
      .sort({ date: -1 }) // Most recent first
      .populate('employeeId', 'firstName lastName email photo department position');

    res.status(200).json(evaluations);
  } catch (error) {
    console.error("Erreur lors de la récupération des évaluations par employé:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Delete an evaluation result
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID d'évaluation invalide" });
    }

    const result = await EvaluationResultat.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Évaluation non trouvée" });
    }

    res.status(200).json({ message: "Évaluation supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'évaluation :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
