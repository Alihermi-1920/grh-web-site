const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const EvaluationResultat = require("../models/evaluationresultat");
const Conge = require("../models/finalConge");

// GET chef dashboard data
router.get("/chef/:chefId", async (req, res) => {
  try {
    const { chefId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ message: "ID de chef invalide" });
    }
    
    // Get employees under this chef
    const employees = await Employee.find({ chefId });
    const employeeIds = employees.map(emp => emp._id);
    
    
    // Get evaluation results for employees under this chef
    const evaluations = await EvaluationResultat.find({ 
      employeeId: { $in: employeeIds } 
    }).sort({ date: -1 });
    
    // Get leave requests for employees under this chef
    const leaveRequests = await Conge.find({ 
      employee: { $in: employeeIds } 
    }).sort({ createdAt: -1 });
    
    
    // Calculate leave request statistics
    const leaveStats = {
      total: leaveRequests.length,
      pending: leaveRequests.filter(req => req.status === 'pending').length,
      approved: leaveRequests.filter(req => req.status === 'approved').length,
      rejected: leaveRequests.filter(req => req.status === 'rejected').length
    };
    
    
    // Prepare response
    const dashboardData = {
      employeeCount: employees.length,
      leaveStats,
      recentEvaluations: evaluations.slice(0, 5),
      recentLeaveRequests: leaveRequests.slice(0, 5)
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error("Erreur lors de la récupération des données du tableau de bord:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// GET recent activities for chef
router.get("/chef/:chefId/activities", async (req, res) => {
  try {
    const { chefId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ message: "ID de chef invalide" });
    }
    
    // Get employees under this chef
    const employees = await Employee.find({ chefId });
    const employeeIds = employees.map(emp => emp._id);
    
    // Initialize activities array
    const activities = [];
    
    // Get leave requests
    const leaveRequests = await Conge.find({ 
      employee: { $in: employeeIds } 
    })
    .populate("employee", "firstName lastName photo")
    .sort({ createdAt: -1 });
    
    // Add leave requests to activities
    leaveRequests.forEach(req => {
      activities.push({
        type: 'leave',
        date: req.createdAt,
        user: req.employee,
        content: `Demande de congé du ${new Date(req.startDate).toLocaleDateString('fr-FR')} au ${new Date(req.endDate).toLocaleDateString('fr-FR')}`,
        status: req.status
      });
    });
    
    // Sort by date (newest first)
    const sortedActivities = activities
      .filter(activity => activity.date) // Filter out activities without dates
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only the 20 most recent activities
    res.json(sortedActivities.slice(0, 20));
  } catch (error) {
    console.error("Erreur lors de la récupération des activités récentes:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
