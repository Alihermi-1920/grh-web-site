// server/routes/finalCongeRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const Conge = require('../models/Conge');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
const { sendLeaveStatusNotification } = require('../services/emailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use a path that will be accessible from the client
    const uploadDir = path.join(__dirname, '../../client/public/uploads/conges');

    console.log('Upload directory:', uploadDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created upload directory');
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'conge-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and Office documents
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    console.log('File accepted:', file.originalname, file.mimetype);
    cb(null, true);
  } else {
    console.log('File rejected:', file.originalname, file.mimetype);
    cb(new Error('Type de fichier non pris en charge'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Middleware to preserve employee ID
const preserveEmployeeId = (req, res, next) => {
  console.log('=== PRESERVE EMPLOYEE ID MIDDLEWARE ===');
  console.log('Request URL:', req.url);
  console.log('Request query:', req.query);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);

  // Store employee ID from query params, headers, or body
  const employeeId = req.query.employee ||
                    req.query.employeeId ||
                    req.headers['x-employee-id'] ||
                    (req.body && (req.body.employee || req.body.employeeId));

  if (employeeId) {
    // Store it in a special property that won't be affected by multer
    req._employeeId = employeeId;
    console.log('Preserved employee ID:', req._employeeId);
  } else {
    console.log('No employee ID found to preserve');
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
    let { leaveType, startDate, endDate, numberOfDays, reason } = req.body;
    const isMedical = req.body.isMedical === 'true' || req.body.leaveType === 'Congé médical';

    // Fix encoding issues in leave type
    if (leaveType === 'Cong� pay�' || leaveType === 'Congé payé' || leaveType === 'Congé payé') {
      leaveType = 'Congé payé';
    } else if (leaveType === 'Cong� sans solde' || leaveType === 'Congé sans solde') {
      leaveType = 'Congé sans solde';
    } else if (leaveType === 'Cong� m�dical' || leaveType === 'Congé médical') {
      leaveType = 'Congé médical';
    } else if (leaveType === 'Cong� personnel' || leaveType === 'Congé personnel') {
      leaveType = 'Congé personnel';
    }

    console.log('Normalized leave type:', leaveType);

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
      console.log(`Processing ${req.files.length} uploaded files:`);

      // Create document objects with all required fields
      const documentsList = req.files.map(file => {
        const docInfo = {
          originalName: file.originalname,
          filePath: `/uploads/conges/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadDate: new Date()
        };

        console.log(`- Document: ${docInfo.originalName}`);
        console.log(`  Path: ${docInfo.filePath}`);
        console.log(`  Type: ${docInfo.fileType}`);
        console.log(`  Size: ${docInfo.fileSize} bytes`);

        return docInfo;
      });

      // Initialize documents array if it doesn't exist
      if (!conge.documents) {
        conge.documents = [];
      }

      // Add documents to the array
      conge.documents.push(...documentsList);
      console.log(`Added ${documentsList.length} documents to the leave request`);
      console.log(`Total documents: ${conge.documents.length}`);

      // Log each document for verification
      conge.documents.forEach((doc, index) => {
        console.log(`Document ${index + 1} in conge object:`, doc);
      });
    } else {
      console.log('No documents uploaded with this leave request');
      // Ensure documents is an empty array, not undefined
      conge.documents = [];
    }

    // Save the leave request
    try {
      // Force documents to be an array if it's null or undefined
      if (!conge.documents) {
        conge.documents = [];
      }

      // Ensure each document has all required fields
      if (conge.documents.length > 0) {
        conge.documents = conge.documents.map(doc => ({
          originalName: doc.originalName || 'Unknown',
          filePath: doc.filePath || '',
          fileType: doc.fileType || 'application/octet-stream',
          fileSize: doc.fileSize || 0,
          uploadDate: doc.uploadDate || new Date()
        }));
      }

      // Save with documents
      const savedConge = await conge.save();
      console.log('Leave request created successfully:', savedConge._id);
      console.log('Documents saved:', savedConge.documents ? savedConge.documents.length : 0);

      // Verify that the documents were saved correctly by fetching again
      const verifiedConge = await Conge.findById(savedConge._id);
      console.log('Verified leave request documents:', verifiedConge.documents ? verifiedConge.documents.length : 0);

      if (verifiedConge.documents && verifiedConge.documents.length > 0) {
        verifiedConge.documents.forEach((doc, index) => {
          console.log(`- Verified document ${index + 1}: ${doc.originalName}, ${doc.filePath}`);
        });
      } else {
        console.log('- No documents were found in the verified leave request');

        // If documents were lost, try to update them directly
        if (conge.documents && conge.documents.length > 0) {
          console.log('Attempting to update documents directly...');

          const updateResult = await Conge.updateOne(
            { _id: savedConge._id },
            { $set: { documents: conge.documents } }
          );

          console.log('Update result:', updateResult);

          // Check again
          const reVerifiedConge = await Conge.findById(savedConge._id);
          console.log('Re-verified documents:', reVerifiedConge.documents ? reVerifiedConge.documents.length : 0);
        }
      }
    } catch (saveError) {
      console.error('Error saving leave request:', saveError);
      throw saveError;
    }

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

    // Fetch leave requests with populated employee field
    let conges = await Conge.find(query)
      .populate('employee', 'firstName lastName email photo')
      .sort({ createdAt: -1 });

    // Ensure documents are properly included
    conges = await Promise.all(conges.map(async (conge) => {
      // If documents are missing or empty, try to fetch them directly
      if (!conge.documents || conge.documents.length === 0) {
        console.log(`Leave request ${conge._id} has no documents, trying to fetch directly`);

        // Fetch the leave request directly to ensure documents are included
        const fullConge = await Conge.findById(conge._id);

        if (fullConge.documents && fullConge.documents.length > 0) {
          console.log(`Found ${fullConge.documents.length} documents for leave request ${conge._id}`);
          conge.documents = fullConge.documents;
        } else {
          console.log(`No documents found for leave request ${conge._id}`);
          conge.documents = [];
        }
      }

      return conge;
    }));

    console.log(`Found ${conges.length} leave requests`);

    // Log document information for debugging
    conges.forEach((conge, index) => {
      console.log(`Leave request ${index + 1} (${conge._id}):`);
      console.log(`- Employee: ${conge.employee?._id || conge.employee}`);
      console.log(`- Status: ${conge.status}`);
      console.log(`- Documents: ${conge.documents ? conge.documents.length : 0}`);

      // Check if documents array exists and has items
      if (!conge.documents) {
        console.log('  - Documents array is undefined or null');
      } else if (conge.documents.length === 0) {
        console.log('  - Documents array is empty');
      } else {
        conge.documents.forEach((doc, docIndex) => {
          console.log(`  - Document ${docIndex + 1}: ${doc.originalName || 'No name'}`);
          console.log(`    Path: ${doc.filePath || 'No path'}`);
          console.log(`    Type: ${doc.fileType || 'No type'}`);
          console.log(`    Size: ${doc.fileSize || 'No size'} bytes`);
        });
      }

      // Log the full leave request object for debugging
      console.log('Full leave request object:');
      console.log(JSON.stringify(conge, null, 2));
    });

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
    let { status, justification, resendEmail } = req.body;
    console.log('Leave request ID:', congeId);
    console.log('New status (raw):', status);
    console.log('Justification:', justification);
    console.log('Resend email flag:', resendEmail);

    // Fix status encoding issues
    if (status === 'Approuve' || status === 'Approuv\u00e9' || status === 'Approuv�') {
      status = 'Approuvé';
      console.log('Fixed status to: Approuvé');
    } else if (status === 'Rejete' || status === 'Rejet\u00e9' || status === 'Rejet�') {
      status = 'Rejeté';
      console.log('Fixed status to: Rejeté');
    }

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

    // If the request is approved and not medical or unpaid leave, update the leave balance
    if (status === 'Approuvé' && !conge.isMedical && conge.leaveType !== 'Congé sans solde') {
      try {
        let leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });

        if (!leaveBalance) {
          // If no leave balance exists, create a new one
          if (conge.numberOfDays > 30) {
            return res.status(400).json({
              error: "Solde de congé insuffisant",
              remainingDays: 30,
              requestedDays: conge.numberOfDays
            });
          }

          leaveBalance = new LeaveBalance({
            employee: conge.employee,
            totalDays: 30,
            usedDays: conge.numberOfDays,
            remainingDays: 30 - conge.numberOfDays,
            medicalDays: 0
          });
        } else {
          // Check if there are enough remaining days
          if (leaveBalance.remainingDays < conge.numberOfDays) {
            return res.status(400).json({
              error: "Solde de congé insuffisant",
              remainingDays: leaveBalance.remainingDays,
              requestedDays: conge.numberOfDays
            });
          }

          leaveBalance.usedDays += conge.numberOfDays;
          leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;

          // Double-check that we're not going below zero
          if (leaveBalance.remainingDays < 0) {
            return res.status(400).json({
              error: "Solde de congé insuffisant",
              remainingDays: leaveBalance.remainingDays + conge.numberOfDays, // Original value
              requestedDays: conge.numberOfDays
            });
          }
        }

        await leaveBalance.save();
        console.log('Leave balance updated:', leaveBalance);
      } catch (balanceError) {
        console.error('Error updating leave balance:', balanceError);
        return res.status(400).json({
          error: "Solde de congé insuffisant",
          message: balanceError.message
        });
      }
    } else if (status === 'Approuvé' && (conge.isMedical || conge.leaveType === 'Congé sans solde')) {
      console.log('Skipping leave balance update for medical or unpaid leave');
    }

    await conge.save();
    console.log('Leave request status updated successfully');

    // Create a response object with the leave request data
    // Email notifications will be sent manually via the send-email endpoint
    const responseData = {
      ...conge.toObject(),
      emailSent: false,
      emailError: null
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut de la demande de congé" });
  }
});

// Add documents to a leave request
router.post('/:congeId/documents', upload.array('documents', 5), async (req, res) => {
  try {
    console.log('=== ADD DOCUMENTS TO LEAVE REQUEST ===');
    const { congeId } = req.params;
    console.log('Leave request ID:', congeId);
    console.log('Files:', req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Process uploaded files
    const documentsList = req.files.map(file => ({
      originalName: file.originalname,
      filePath: `/uploads/conges/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date()
    }));

    // Initialize documents array if it doesn't exist
    if (!conge.documents) {
      conge.documents = [];
    }

    // Add documents to the array
    conge.documents.push(...documentsList);

    // Save the leave request
    await conge.save();

    console.log(`Added ${documentsList.length} documents to leave request ${congeId}`);
    console.log(`Total documents: ${conge.documents.length}`);

    // Verify the documents were saved correctly
    const verifiedConge = await Conge.findById(congeId);
    console.log('Verified documents count:', verifiedConge.documents.length);

    if (verifiedConge.documents.length > 0) {
      verifiedConge.documents.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`, doc.originalName, doc.filePath);
      });
    }

    res.status(200).json({
      message: 'Documents added successfully',
      documents: verifiedConge.documents
    });
  } catch (error) {
    console.error('Error adding documents:', error);
    res.status(500).json({ error: 'Error adding documents' });
  }
});

// Get a single leave request by ID
router.get('/:congeId', async (req, res) => {
  try {
    console.log('=== GET LEAVE REQUEST BY ID ===');
    const { congeId } = req.params;
    console.log('Leave request ID:', congeId);

    // Find the leave request
    const conge = await Conge.findById(congeId)
      .populate('employee', 'firstName lastName email photo');

    if (!conge) {
      console.error('Leave request not found:', congeId);
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    console.log('Found leave request:', conge._id);

    res.status(200).json(conge);
  } catch (error) {
    console.error('Error getting leave request:', error);
    res.status(500).json({ error: "Erreur lors de la récupération de la demande de congé" });
  }
});

// Get documents for a leave request
router.get('/:congeId/documents', async (req, res) => {
  try {
    console.log('=== GET DOCUMENTS FOR LEAVE REQUEST ===');
    const { congeId } = req.params;
    console.log('Leave request ID:', congeId);

    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    console.log('Found leave request:', conge._id);
    console.log('Documents:', conge.documents ? conge.documents.length : 0);

    if (!conge.documents || conge.documents.length === 0) {
      return res.status(200).json({ documents: [] });
    }

    // Log document information
    conge.documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, doc.originalName, doc.filePath);
    });

    res.status(200).json({ documents: conge.documents });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Error getting documents' });
  }
});





// Send email notification for a leave request
router.post('/:congeId/send-email', async (req, res) => {
  try {
    console.log('=== SEND EMAIL NOTIFICATION FOR LEAVE REQUEST ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    console.log('Request body:', req.body);

    const { congeId } = req.params;
    console.log('Leave request ID:', congeId);

    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      console.error('Leave request not found:', congeId);
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Check if the leave request has been approved or rejected
    if (conge.status === 'En attente') {
      console.error('Leave request is still pending:', congeId);
      return res.status(400).json({ error: "La demande de congé est toujours en attente" });
    }

    // Get employee and chef details for the email
    const employee = await Employee.findById(conge.employee);
    const chef = await Employee.findById(conge.chef);

    if (!employee) {
      console.error('Employee not found for email notification');
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    if (!employee.email) {
      console.error('Employee has no email address');
      return res.status(400).json({ error: "L'employé n'a pas d'adresse email" });
    }

    console.log('Sending email notification to employee:', employee.email);

    // Send the email notification
    const emailResult = await sendLeaveStatusNotification(conge, employee, chef);

    if (emailResult.success) {
      console.log('Email notification sent successfully');
      res.status(200).json({
        success: true,
        message: "Notification envoyée avec succès",
        messageId: emailResult.messageId
      });
    } else {
      console.error('Failed to send email notification:', emailResult.error);
      res.status(500).json({
        success: false,
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de la notification" });
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

    // If the leave was approved and not medical or unpaid, restore the leave balance
    if (conge.status === 'Approuvé' && !conge.isMedical && conge.leaveType !== 'Congé sans solde') {
      try {
        const leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });

        if (leaveBalance) {
          leaveBalance.usedDays -= conge.numberOfDays;
          leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;
          await leaveBalance.save();
          console.log('Leave balance restored:', leaveBalance);
        }
      } catch (balanceError) {
        console.error('Error restoring leave balance:', balanceError);
        // Continue with deletion even if balance restoration fails
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
