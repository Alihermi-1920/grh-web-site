const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
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
    
    // Get tasks assigned by this chef
    const tasks = await Task.find({ assignedBy: chefId })
      .populate("assignedTo", "firstName lastName photo")
      .populate("project", "projectName");
    
    // Get projects for this chef
    const projects = await Project.find({ projectLeader: chefId });
    
    // Get evaluation results for employees under this chef
    const evaluations = await EvaluationResultat.find({ 
      employeeId: { $in: employeeIds } 
    }).sort({ date: -1 });
    
    // Get leave requests for employees under this chef
    const leaveRequests = await Conge.find({ 
      employee: { $in: employeeIds } 
    }).sort({ createdAt: -1 });
    
    // Calculate task statistics
    const taskStats = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in-progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        blocked: tasks.filter(task => task.status === 'blocked').length,
        onHold: tasks.filter(task => task.status === 'on-hold').length
      },
      completedTasks: tasks.filter(task => task.status === 'completed')
    };
    
    // Calculate employee productivity
    const employeeProductivity = employees.map(employee => {
      const employeeTasks = tasks.filter(task => 
        task.assignedTo && 
        (task.assignedTo._id.toString() === employee._id.toString() || 
         task.assignedTo.toString() === employee._id.toString())
      );
      
      const totalTasks = employeeTasks.length;
      const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        employee: {
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          photo: employee.photo
        },
        totalTasks,
        completedTasks,
        completionRate
      };
    });
    
    // Calculate leave request statistics
    const leaveStats = {
      total: leaveRequests.length,
      pending: leaveRequests.filter(req => req.status === 'pending').length,
      approved: leaveRequests.filter(req => req.status === 'approved').length,
      rejected: leaveRequests.filter(req => req.status === 'rejected').length
    };
    
    // Get upcoming deadlines (tasks not completed with deadlines in the next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingDeadlines = tasks
      .filter(task => 
        task.status !== 'completed' && 
        task.deadline && 
        new Date(task.deadline) >= today && 
        new Date(task.deadline) <= nextWeek
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    // Get overdue tasks
    const overdueTasks = tasks
      .filter(task => 
        task.status !== 'completed' && 
        task.deadline && 
        new Date(task.deadline) < today
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    // Prepare response
    const dashboardData = {
      employeeCount: employees.length,
      projectCount: projects.length,
      taskStats,
      employeeProductivity,
      leaveStats,
      upcomingDeadlines,
      overdueTasks,
      recentEvaluations: evaluations.slice(0, 5),
      recentLeaveRequests: leaveRequests.slice(0, 5)
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error("Erreur lors de la récupération des données du tableau de bord:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET task completion timeline data
router.get("/chef/:chefId/task-timeline", async (req, res) => {
  try {
    const { chefId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ message: "ID de chef invalide" });
    }
    
    // Get tasks assigned by this chef
    const tasks = await Task.find({ 
      assignedBy: chefId,
      status: 'completed'
    });
    
    // Group by completion date
    const groupedByDate = {};
    
    // Get date range for the last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Initialize all dates in the range with 0
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      groupedByDate[dateStr] = 0;
    }
    
    // Count completed tasks by date
    tasks.forEach(task => {
      const completionDate = task.completedAt || task.updatedAt;
      if (completionDate) {
        const dateStr = new Date(completionDate).toISOString().split('T')[0];
        if (new Date(dateStr) >= thirtyDaysAgo && new Date(dateStr) <= today) {
          groupedByDate[dateStr] = (groupedByDate[dateStr] || 0) + 1;
        }
      }
    });
    
    // Convert to array format for chart
    const timelineData = Object.entries(groupedByDate).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(timelineData);
  } catch (error) {
    console.error("Erreur lors de la récupération des données de chronologie:", error);
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
    
    // Get tasks assigned by this chef
    const tasks = await Task.find({ assignedBy: chefId })
      .populate("assignedTo", "firstName lastName photo")
      .populate("project", "projectName")
      .populate("comments.author", "firstName lastName photo");
    
    // Extract activities from tasks (comments, status changes, file uploads)
    const activities = [];
    
    // Process tasks
    tasks.forEach(task => {
      // Add task creation
      activities.push({
        type: 'task_created',
        date: task.createdAt,
        task: {
          _id: task._id,
          title: task.title,
          status: task.status
        },
        user: task.assignedTo,
        content: `Tâche créée: ${task.title}`
      });
      
      // Process comments
      if (task.comments && task.comments.length > 0) {
        task.comments.forEach(comment => {
          activities.push({
            type: 'comment',
            date: comment.createdAt,
            task: {
              _id: task._id,
              title: task.title,
              status: task.status
            },
            user: comment.author,
            content: comment.content
          });
        });
      }
      
      // Process attachments
      if (task.attachments && task.attachments.length > 0) {
        task.attachments.forEach(attachment => {
          activities.push({
            type: 'file',
            date: attachment.uploadDate,
            task: {
              _id: task._id,
              title: task.title,
              status: task.status
            },
            user: task.assignedTo,
            content: `Fichier ajouté: ${attachment.originalName}`
          });
        });
      }
    });
    
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
