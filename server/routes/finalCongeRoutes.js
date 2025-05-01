// server/routes/finalCongeRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Conge = require('../models/Conge');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../client/public/uploads/conges');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'conge-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to preserve employee ID
const preserveEmployeeId = (req, res, next) => {
  console.log('=== PRESERVE EMPLOYEE ID MIDDLEWARE ===');
  console.log('Request URL:', req.url);
  console.log('Request query:', req.query);
  console.log('Request body:', req.body);
  
  // Store employee ID from query params or body
  const employeeId = req.query.employee || req.query.employeeId;
  
  if (employeeId) {
    // Store it in a special property that won't be affected by multer
    req._employeeId = employeeId;
    console.log('Preserved employee ID:', req._employeeId);
  }
  
  next();
};

// Create a new leave request - JSON version (no files)
router.post('/json', async (req, res) => {
  try {
    console.log('=== CREATE LEAVE REQUEST (JSON) ===');
    console.log('Request body:', req.body);
    
    // Get employee ID
    const employeeId = req.body.employee || req.body.employeeId;
    
    if (!employeeId) {
      console.error('Employee ID is missing');
      return res.status(400).json({ error: "ID d'employé manquant" });
    }
    
    // Validate employee ID format
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid employee ID format:', employeeId);
      return res.status(400).json({ error: "Format d'ID d'employé invalide" });
    }
    
    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.error('Employee not found:', employeeId);
      return res.status(404).json({ error: "Employé non trouvé" });
    }
    
    // Check if employee has a chef
    if (!employee.chefId) {
      console.error('Employee has no chef assigned:', employeeId);
      return res.status(400).json({ error: "Aucun chef responsable assigné à cet employé" });
    }
    
    // Get other fields from body
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;
    const isMedical = req.body.isMedical === true || req.body.leaveType === 'Congé médical';
    
    // Create the leave request
    const conge = new Conge({
      employee: employeeId,
      chef: employee.chefId,
      leaveType,
      startDate,
      endDate,
      numberOfDays: parseInt(numberOfDays),
      reason,
      isMedical,
      status: 'En attente',
      deductFromBalance: !isMedical
    });
    
    // Save the leave request
    await conge.save();
    console.log('Leave request created successfully:', conge._id);
    
    res.status(201).json(conge);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: "Erreur lors de la création de la demande de congé" });
  }
});

// Create a new leave request - FormData version (with files)
router.post('/', preserveEmployeeId, upload.array('documents', 5), async (req, res) => {
  try {
    console.log('=== CREATE LEAVE REQUEST (FORMDATA) ===');
    console.log('Request body after multer:', req.body);
    console.log('Request files:', req.files);
    console.log('Preserved employee ID:', req._employeeId);
    
    // Get employee ID from various sources
    let employeeId = req.body.employee || 
                    req.body.employeeId || 
                    req._employeeId || 
                    req.query.employee || 
                    req.query.employeeId;
    
    console.log('Final employee ID:', employeeId);
    
    if (!employeeId) {
      console.error('Employee ID is missing');
      return res.status(400).json({ error: "ID d'employé manquant" });
    }
    
    // Validate employee ID format
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid employee ID format:', employeeId);
      return res.status(400).json({ error: "Format d'ID d'employé invalide" });
    }
    
    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.error('Employee not found:', employeeId);
      return res.status(404).json({ error: "Employé non trouvé" });
    }
    
    console.log('Found employee:', employee.firstName, employee.lastName);
    
    // Check if employee has a chef
    if (!employee.chefId) {
      console.error('Employee has no chef assigned:', employeeId);
      return res.status(400).json({ error: "Aucun chef responsable assigné à cet employé" });
    }
    
    // Get other fields from body
    const { leaveType, startDate, endDate, numberOfDays, reason } = req.body;
    const isMedical = req.body.isMedical === 'true' || req.body.leaveType === 'Congé médical';
    
    // Create the leave request
    const conge = new Conge({
      employee: employeeId,
      chef: employee.chefId,
      leaveType,
      startDate,
      endDate,
      numberOfDays: parseInt(numberOfDays),
      reason,
      isMedical,
      status: 'En attente',
      deductFromBalance: !isMedical
    });
    
    // Add documents if any
    if (req.files && req.files.length > 0) {
      conge.documents = req.files.map(file => ({
        originalName: file.originalname,
        filePath: `/uploads/conges/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadDate: new Date()
      }));
    }
    
    // Save the leave request
    await conge.save();
    console.log('Leave request created successfully:', conge._id);
    
    res.status(201).json(conge);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: "Erreur lors de la création de la demande de congé" });
  }
});

// Get all leave requests
router.get('/', async (req, res) => {
  try {
    console.log('=== GET LEAVE REQUESTS ===');
    console.log('Request query:', req.query);
    
    const { employee, employeeId, chef, chefId, status } = req.query;
    let query = {};
    
    // Filter by employee
    if (employee || employeeId) {
      query.employee = employee || employeeId;
      console.log('Filtering by employee:', query.employee);
    }
    
    // Filter by chef
    if (chef || chefId) {
      query.chef = chef || chefId;
      console.log('Filtering by chef:', query.chef);
    }
    
    // Filter by status
    if (status) {
      query.status = status;
      console.log('Filtering by status:', query.status);
    }
    
    console.log('Final query:', query);
    
    const conges = await Conge.find(query)
      .populate('employee', 'firstName lastName email photo')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${conges.length} leave requests`);
    
    res.status(200).json(conges);
  } catch (error) {
    console.error('Error getting leave requests:', error);
    res.status(500).json({ error: "Erreur lors de la récupération des demandes de congé" });
  }
});

// Get leave balance for an employee
router.get('/balance/:employeeId', async (req, res) => {
  try {
    console.log('=== GET LEAVE BALANCE ===');
    const { employeeId } = req.params;
    console.log('Employee ID:', employeeId);
    
    // Validate employee ID
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid employee ID format:', employeeId);
      return res.status(400).json({ error: "Format d'ID d'employé invalide" });
    }
    
    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.error('Employee not found:', employeeId);
      return res.status(404).json({ error: "Employé non trouvé" });
    }
    
    // Find or create leave balance
    let leaveBalance = await LeaveBalance.findOne({ employee: employeeId });
    
    if (!leaveBalance) {
      console.log('Creating new leave balance for employee:', employeeId);
      leaveBalance = new LeaveBalance({
        employee: employeeId,
        totalDays: 30,
        usedDays: 0,
        remainingDays: 30,
        medicalDays: 0
      });
      
      await leaveBalance.save();
    }
    
    console.log('Leave balance:', leaveBalance);
    
    res.status(200).json(leaveBalance);
  } catch (error) {
    console.error('Error getting leave balance:', error);
    res.status(500).json({ error: "Erreur lors de la récupération du solde de congés" });
  }
});

// Update leave request status
router.put('/:congeId/status', async (req, res) => {
  try {
    console.log('=== UPDATE LEAVE REQUEST STATUS ===');
    const { congeId } = req.params;
    const { status, justification } = req.body;
    console.log('Leave request ID:', congeId);
    console.log('New status:', status);
    console.log('Justification:', justification);
    
    // Validate status
    if (!status || !['En attente', 'Approuvé', 'Rejeté'].includes(status)) {
      console.error('Invalid status:', status);
      return res.status(400).json({ error: "Statut invalide" });
    }
    
    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      console.error('Leave request not found:', congeId);
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }
    
    // Update the leave request
    conge.status = status;
    if (justification) {
      conge.chefJustification = justification;
    }
    
    // If the request is approved and not medical, update the leave balance
    if (status === 'Approuvé' && !conge.isMedical) {
      let leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });
      
      if (!leaveBalance) {
        leaveBalance = new LeaveBalance({
          employee: conge.employee,
          totalDays: 30,
          usedDays: conge.numberOfDays,
          remainingDays: 30 - conge.numberOfDays,
          medicalDays: 0
        });
      } else {
        leaveBalance.usedDays += conge.numberOfDays;
        leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
      }
      
      await leaveBalance.save();
      console.log('Leave balance updated:', leaveBalance);
    }
    
    await conge.save();
    console.log('Leave request status updated successfully');
    
    res.status(200).json(conge);
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut de la demande de congé" });
  }
});

// Delete a leave request
router.delete('/:congeId', async (req, res) => {
  try {
    console.log('=== DELETE LEAVE REQUEST ===');
    const { congeId } = req.params;
    console.log('Leave request ID:', congeId);
    
    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      console.error('Leave request not found:', congeId);
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }
    
    // Delete associated documents
    if (conge.documents && conge.documents.length > 0) {
      conge.documents.forEach(doc => {
        const filePath = path.join(__dirname, '../../client/public', doc.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Deleted file:', filePath);
        }
      });
    }
    
    // If the leave was approved and not medical, restore the leave balance
    if (conge.status === 'Approuvé' && !conge.isMedical) {
      const leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });
      
      if (leaveBalance) {
        leaveBalance.usedDays -= conge.numberOfDays;
        leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
        await leaveBalance.save();
        console.log('Leave balance restored:', leaveBalance);
      }
    }
    
    await Conge.findByIdAndDelete(congeId);
    console.log('Leave request deleted successfully');
    
    res.status(200).json({ message: "Demande de congé supprimée avec succès" });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ error: "Erreur lors de la suppression de la demande de congé" });
  }
});

module.exports = router;
