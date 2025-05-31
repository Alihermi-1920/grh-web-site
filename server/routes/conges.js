const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Conge = require("../models/conge");
const LeaveBalance = require("../models/LeaveBalance");
const Employee = require("../models/Employee");

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../client/public/uploads/medical");

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "medical-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images et PDFs
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Seuls les fichiers images (JPG, PNG) et PDF sont acceptés"));
  }
});

// Middleware pour vérifier si l'employé existe
const checkEmployeeExists = async (req, res, next) => {
  try {
    console.log("Headers:", req.headers);
    console.log("Query params:", req.query);
    console.log("Body:", req.body);

    // Check for employee ID in multiple places (in order of priority)
    const employeeId = req.headers['x-employee-id'] ||
                       req.query.employee ||
                       (req.body && req.body.employee) ||
                       (req.user && req.user._id);

    console.log("Found employee ID:", employeeId);

    if (!employeeId) {
      return res.status(400).json({ error: "ID d'employé manquant" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    // Store the employee ID in req for later use
    req.employeeId = employeeId;
    req.employee = employee;
    next();
  } catch (err) {
    console.error("Error in checkEmployeeExists:", err);
    res.status(500).json({ error: err.message });
  }
};

// Middleware pour vérifier le solde de congés
const checkLeaveBalance = async (req, res, next) => {
  try {
    // Use the employeeId that was already validated in checkEmployeeExists
    const employeeId = req.employeeId;
    const numberOfDays = parseInt(req.body.numberOfDays) || 0;
    const isMedical = req.body.isMedical === 'true' || req.body.isMedical === true;
    const leaveType = req.body.leaveType;

    console.log("Check leave balance for:", employeeId);
    console.log("Leave type:", leaveType);
    console.log("Number of days:", numberOfDays);
    console.log("Is medical:", isMedical);

    // Check for unpaid leave flag
    const isUnpaid = req.body.isUnpaid === 'true' || req.body.isUnpaid === true;

    console.log("Is unpaid leave:", isUnpaid);

    // Skip balance check for medical leave and unpaid leave
    if (isMedical || leaveType === "Congé médical" || leaveType === "Congé sans solde" || isUnpaid) {
      console.log("Skipping balance check for medical or unpaid leave");
      return next();
    }

    // Find the employee's leave balance
    let leaveBalance = await LeaveBalance.findOne({ employee: employeeId });

    // If no balance record exists, create one with default values
    if (!leaveBalance) {
      console.log("No leave balance found, creating default balance");
      leaveBalance = new LeaveBalance({
        employee: employeeId,
        totalDays: 30, // Default annual leave allowance
        usedDays: 0,
        remainingDays: 30
      });
      await leaveBalance.save();
    }

    console.log("Current leave balance:", leaveBalance);

    // Check if employee has enough leave days
    if (numberOfDays > leaveBalance.remainingDays) {
      return res.status(400).json({
        error: `Solde de congés insuffisant. Jours demandés: ${numberOfDays}, Jours disponibles: ${leaveBalance.remainingDays}`
      });
    }

    next();
  } catch (err) {
    console.error("Error in checkLeaveBalance:", err);
    res.status(500).json({ error: err.message });
  }
};

// Créer une nouvelle demande de congé
router.post("/", checkEmployeeExists, checkLeaveBalance, upload.array("documents", 5), async (req, res) => {
  try {
    console.log("Creating new leave request");
    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    const {
      startDate,
      endDate,
      numberOfDays,
      reason,
      leaveType,
      isMedical,
      isUnpaid
    } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !numberOfDays || !reason || !leaveType) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Process uploaded documents
    const documents = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Convert Windows backslashes to forward slashes for URLs
        const relativePath = file.path
          .replace(/\\/g, '/')
          .split('client/public')[1];

        documents.push({
          originalName: file.originalname,
          filePath: relativePath,
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    // Determine if the leave should deduct from balance
    const deductFromBalance = !(isMedical === 'true' || isMedical === true || 
                               isUnpaid === 'true' || isUnpaid === true || 
                               leaveType === "Congé médical" || 
                               leaveType === "Congé sans solde");

    console.log("Deduct from balance:", deductFromBalance);

    // Create new leave request
    const newConge = new Conge({
      employee: req.employeeId,
      startDate,
      endDate,
      numberOfDays: parseInt(numberOfDays),
      reason,
      leaveType,
      status: "En attente",
      documents,
      isMedical: isMedical === 'true' || isMedical === true,
      deductFromBalance
    });

    await newConge.save();
    console.log("Leave request saved successfully");

    res.status(201).json(newConge);
  } catch (err) {
    console.error("Error creating leave request:", err);
    res.status(400).json({ error: err.message });
  }
});

// Récupérer toutes les demandes de congé
router.get("/", async (req, res) => {
  try {
    const { employeeId, employee, chefId, chef, status } = req.query;
    let query = {};

    console.log("Query parameters:", req.query);

    // Filtrer par employé si spécifié (support both employeeId and employee)
    if (employeeId || employee) {
      query.employee = employeeId || employee;
      console.log("Filtering by employee:", query.employee);
    }

    // Filtrer par statut si spécifié
    if (status) {
      query.status = status;
      console.log("Filtering by status:", status);
    }

    // Si un chef est spécifié (support both chefId and chef), récupérer les congés de ses employés
    if (chefId || chef) {
      const chefIdentifier = chefId || chef;
      console.log("Filtering by chef:", chefIdentifier);

      const employees = await Employee.find({ chefId: chefIdentifier });
      console.log("Found employees for chef:", employees.length);

      const employeeIds = employees.map(emp => emp._id);
      query.employee = { $in: employeeIds };
    }

    const conges = await Conge.find(query)
      .populate("employee", "firstName lastName email photo cin")
      .sort({ createdAt: -1 });

    res.json(conges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer une demande de congé par ID
router.get("/:id", async (req, res) => {
  try {
    const conge = await Conge.findById(req.params.id)
      .populate("employee", "firstName lastName email photo cin");

    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    res.json(conge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les documents d'une demande de congé
router.get("/:id/documents", async (req, res) => {
  try {
    console.log("Fetching documents for leave request:", req.params.id);

    const conge = await Conge.findById(req.params.id);

    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Ensure documents is always an array
    const documents = Array.isArray(conge.documents) ? conge.documents : [];

    console.log(`Found ${documents.length} documents for leave request ${req.params.id}`);

    // Log each document for debugging
    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, doc.originalName, doc.filePath);
    });

    res.json({ documents });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: err.message });
  }
});

// Mettre à jour le statut d'une demande de congé
router.put("/:id/status", async (req, res) => {
  try {
    const { status, justification } = req.body;

    if (!status || !["En attente", "Approuvé", "Rejeté"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Mettre à jour le statut
    conge.status = status;
    if (justification) {
      conge.chefJustification = justification;
    }

    // Si la demande est approuvée, mettre à jour le solde de congés
    if (status === "Approuvé") {
      let leaveBalance = await LeaveBalance.findOne({ employee: conge.employee });
      console.log("Found leave balance:", leaveBalance);

      // Créer un solde si aucun n'existe
      if (!leaveBalance) {
        console.log("Creating new leave balance for employee:", conge.employee);
        leaveBalance = new LeaveBalance({
          employee: conge.employee,
          totalDays: 30,
          usedDays: 0,
          remainingDays: 30
        });
      }

      // Mettre à jour le solde seulement si ce n'est pas un congé médical ou sans solde
      if (conge.deductFromBalance === true) {
        console.log("Updating leave balance. Current used days:", leaveBalance.usedDays);
        console.log("Adding days:", conge.numberOfDays);

        leaveBalance.usedDays += conge.numberOfDays;
        leaveBalance.remainingDays = leaveBalance.totalDays - leaveBalance.usedDays;

        console.log("New used days:", leaveBalance.usedDays);
        console.log("New remaining days:", leaveBalance.remainingDays);
      } else {
        console.log("Not updating leave balance because deductFromBalance is false");
        console.log("Leave type:", conge.leaveType);
        console.log("deductFromBalance flag:", conge.deductFromBalance);

        // Track medical leave days separately
        if (conge.leaveType === "Congé médical" || conge.isMedical === true) {
          console.log("Updating medical leave days. Current medical days:", leaveBalance.medicalDays || 0);
          if (!leaveBalance.medicalDays) {
            leaveBalance.medicalDays = 0;
          }
          leaveBalance.medicalDays += conge.numberOfDays;
          console.log("New medical days:", leaveBalance.medicalDays);
        }
      }

      // Ajouter à l'historique
      leaveBalance.history.push({
        date: new Date(),
        days: conge.numberOfDays,
        type: conge.leaveType,
        leaveId: conge._id
      });

      await leaveBalance.save();
      console.log("Leave balance saved successfully");
    }

    await conge.save();
    
    // Envoyer un email de notification à l'employé si le statut a changé
    try {
      // Récupérer les informations de l'employé
      const employee = await Employee.findById(conge.employee);
      if (employee && employee.email) {
        // Importer le service d'email
        const emailService = require('../services/emailService');
        
        console.log(`Envoi d'une notification par email à ${employee.email} pour le changement de statut à ${status}`);
        
        // Envoyer l'email de notification
        const emailResult = await emailService.sendLeaveNotificationEmail(conge, employee);
        
        if (emailResult.success) {
          console.log('Email de notification envoyé avec succès');
          // Marquer la demande comme notifiée
          conge.notified = true;
          await conge.save();
        } else {
          console.error('Erreur lors de l\'envoi de l\'email de notification:', emailResult.error);
        }
      } else {
        console.log("Impossible d'envoyer un email: l'employé n'a pas d'adresse email ou n'existe pas");
      }
    } catch (emailError) {
      console.error('Erreur lors de la tentative d\'envoi d\'email:', emailError);
      // Ne pas bloquer la mise à jour du statut si l'envoi d'email échoue
    }
    
    res.json(conge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Route pour envoyer un email de notification pour une demande de congé
router.post("/:id/notify", async (req, res) => {
  try {
    // Récupérer la demande de congé
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Récupérer les informations de l'employé
    const employee = await Employee.findById(conge.employee);
    if (!employee) {
      return res.status(404).json({ error: "Employé non trouvé" });
    }

    // Vérifier que l'employé a une adresse email
    if (!employee.email) {
      return res.status(400).json({ error: "L'employé n'a pas d'adresse email" });
    }

    // Importer le service d'email
    const emailService = require('../services/emailService');

    // Envoyer l'email de notification
    const result = await emailService.sendLeaveNotificationEmail(conge, employee);

    if (result.success) {
      // Mettre à jour le statut de notification de la demande de congé
      conge.notified = true;
      await conge.save();

      res.json({
        success: true,
        message: `Notification envoyée avec succès à ${employee.email}`,
        messageId: result.messageId,
        previewUrl: result.previewUrl
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Supprimer une demande de congé
router.delete("/:id", async (req, res) => {
  try {
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Supprimer les fichiers associés
    if (conge.documents && conge.documents.length > 0) {
      conge.documents.forEach(doc => {
        const filePath = path.join(__dirname, "../../client/public", doc.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Conge.findByIdAndDelete(req.params.id);
    res.json({ message: "Demande de congé supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ajouter des documents à une demande de congé existante
router.post("/:id/documents", upload.array("documents", 5), async (req, res) => {
  try {
    console.log("Adding documents to leave request:", req.params.id);
    console.log("Query params:", req.query);
    console.log("Headers:", req.headers);

    // Get employee ID from various sources
    const employeeId = req.headers['x-employee-id'] || req.query.employee;

    if (!employeeId) {
      return res.status(400).json({ error: "ID d'employé manquant" });
    }

    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Vérifier que l'employé est bien le propriétaire de la demande
    if (conge.employee.toString() !== employeeId) {
      return res.status(403).json({ error: "Non autorisé à modifier cette demande" });
    }

    // Process uploaded documents
    const newDocuments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Convert Windows backslashes to forward slashes for URLs
        const relativePath = file.path
          .replace(/\\/g, '/')
          .split('client/public')[1];

        newDocuments.push({
          originalName: file.originalname,
          filePath: relativePath,
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    // Ajouter les nouveaux documents à la liste existante
    conge.documents = [...(conge.documents || []), ...newDocuments];
    await conge.save();

    res.json({ message: "Documents ajoutés avec succès", documents: conge.documents });
  } catch (err) {
    console.error("Error adding documents:", err);
    res.status(500).json({ error: err.message });
  }
});

// Nouvelle route pour envoyer une notification par email
router.post("/:id/notify", async (req, res) => {
  try {
    // Importer le service d'email
    const { sendLeaveNotificationEmail } = require('../services/emailService');
    
    // Récupérer la demande de congé
    const conge = await Conge.findById(req.params.id)
      .populate("employee", "firstName lastName email photo cin");
      
    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }
    
    // Vérifier que l'employé a une adresse email
    if (!conge.employee || !conge.employee.email) {
      return res.status(400).json({ error: "L'employé n'a pas d'adresse email" });
    }
    
    // Créer l'objet de demande de congé pour l'email
    const leaveRequest = {
      status: conge.status,
      startDate: conge.startDate,
      endDate: conge.endDate,
      numberOfDays: conge.numberOfDays,
      leaveType: conge.leaveType,
      reason: conge.reason,
      justification: conge.chefJustification || ''
    };
    
    // Créer l'objet employé pour l'email
    const employee = {
      email: conge.employee.email,
      firstName: conge.employee.firstName || '',
      lastName: conge.employee.lastName || ''
    };
    
    // Envoyer l'email de notification
    const result = await sendLeaveNotificationEmail(leaveRequest, employee);
    
    if (result.success) {
      // Mettre à jour la demande de congé pour indiquer que la notification a été envoyée
      conge.notificationSent = true;
      conge.notificationDate = new Date();
      await conge.save();
      
      res.json({
        success: true,
        message: `Notification envoyée avec succès à ${employee.email}`,
        messageId: result.messageId,
        previewUrl: result.previewUrl
      });
    } else {
      throw new Error(result.error || "Erreur lors de l'envoi de l'email");
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi de la notification:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
