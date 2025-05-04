const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Conge = require("../models/Conge");
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

    // Vérifier le solde de congés
    let leaveBalance = await LeaveBalance.findOne({ employee: employeeId });
    console.log("Found leave balance:", leaveBalance);

    // Si aucun solde n'existe, en créer un par défaut
    if (!leaveBalance) {
      console.log("Creating new leave balance for employee:", employeeId);
      leaveBalance = new LeaveBalance({ employee: employeeId });
      await leaveBalance.save();
    }

    console.log("Remaining days:", leaveBalance.remainingDays);
    console.log("Requested days:", numberOfDays);

    // Vérifier si l'employé a assez de jours de congé
    if (leaveBalance.remainingDays < numberOfDays) {
      console.log("Insufficient leave balance");
      return res.status(400).json({
        error: "Solde de congés insuffisant",
        remainingDays: leaveBalance.remainingDays
      });
    }

    req.leaveBalance = leaveBalance;
    next();
  } catch (err) {
    console.error("Error in checkLeaveBalance:", err);
    res.status(500).json({ error: err.message });
  }
};

// Créer une demande de congé
router.post("/", checkEmployeeExists, checkLeaveBalance, upload.array("documents", 5), async (req, res) => {
  try {
    console.log("Creating leave request with employee ID:", req.employeeId);

    // Check for unpaid leave flag
    const isUnpaid = req.body.isUnpaid === 'true' || req.body.isUnpaid === true;
    console.log("Is unpaid leave (in route handler):", isUnpaid);

    // Determine if this is a paid leave that should deduct from balance
    let shouldDeductFromBalance = false;

    // Only paid leave should deduct from balance
    if (req.body.leaveType === "Congé payé") {
      shouldDeductFromBalance = true;
    }

    // Medical leave and unpaid leave should never deduct from balance
    if (req.body.leaveType === "Congé médical" ||
        req.body.leaveType === "Congé sans solde" ||
        req.body.isMedical === 'true' ||
        isUnpaid) {
      shouldDeductFromBalance = false;
    }

    console.log("Should deduct from balance:", shouldDeductFromBalance);

    // Préparer les données de base
    const congeData = {
      employee: req.employeeId, // Use the validated employee ID
      leaveType: req.body.leaveType,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      numberOfDays: parseInt(req.body.numberOfDays),
      reason: req.body.reason,
      isMedical: req.body.leaveType === "Congé médical" || req.body.isMedical === 'true',
      // Explicitly set deductFromBalance based on our logic
      deductFromBalance: shouldDeductFromBalance
    };

    console.log("Leave request data:", congeData);

    // Ajouter les documents si présents
    if (req.files && req.files.length > 0) {
      congeData.documents = req.files.map(file => ({
        fileName: file.filename,
        originalName: file.originalname,
        filePath: `/uploads/medical/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size
      }));
    }

    // Créer la demande de congé
    const newConge = new Conge(congeData);
    await newConge.save();

    res.status(201).json(newConge);
  } catch (err) {
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
      .populate("employee", "firstName lastName email photo")
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
      .populate("employee", "firstName lastName email photo");

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
    res.json(conge);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

    console.log("Employee ID for document upload:", employeeId);

    // Find the leave request
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ error: "Demande de congé non trouvée" });
    }

    // Verify that the employee owns this leave request
    if (conge.employee.toString() !== employeeId) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier cette demande" });
    }

    // Process uploaded documents
    if (req.files && req.files.length > 0) {
      const documents = req.files.map(file => ({
        fileName: file.filename,
        originalName: file.originalname,
        filePath: `/uploads/medical/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size
      }));

      // Add new documents to existing ones
      if (!conge.documents) {
        conge.documents = [];
      }

      conge.documents = [...conge.documents, ...documents];
      await conge.save();

      res.status(200).json(conge);
    } else {
      res.status(400).json({ error: "Aucun document fourni" });
    }
  } catch (err) {
    console.error("Error adding documents:", err);
    res.status(500).json({ error: err.message });
  }
});

// Récupérer le solde de congés d'un employé
router.get("/balance/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    let leaveBalance = await LeaveBalance.findOne({ employee: employeeId });

    // Si aucun solde n'existe, en créer un par défaut
    if (!leaveBalance) {
      leaveBalance = new LeaveBalance({ employee: employeeId });
      await leaveBalance.save();
    }

    res.json({
      totalDays: leaveBalance.totalDays,
      usedDays: leaveBalance.usedDays,
      remainingDays: leaveBalance.remainingDays,
      medicalDays: leaveBalance.medicalDays,
      year: leaveBalance.year
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
