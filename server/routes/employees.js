// routes/employees.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const Employee = require("../models/Employee");

// Configuration de multer pour stocker les fichiers dans le dossier "C:/Users/Lenovo/Desktop/grh-web-site/client/public"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Utilisation de barres obliques pour Windows
    cb(null, "C:/Users/Lenovo/Desktop/grh-web-site/client/public");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Endpoint pour ajouter un employé avec photo
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const employeeData = { ...req.body };

    // Si une photo est uploadée, on ajoute son chemin aux données
    if (req.file) {
      employeeData.photo = req.file.path;
    }

    const employee = new Employee(employeeData);
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Endpoint pour récupérer tous les employés
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint pour modifier un employé
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Si une nouvelle photo est uploadée, on met à jour le chemin
    if (req.file) {
      updateData.photo = req.file.path;
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Endpoint pour supprimer un employé
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }
    res.status(200).json({ message: "Employé supprimé avec succès" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ===============================================
// Endpoint pour la connexion d'un employé/chef
// ===============================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier que les champs email et password sont fournis
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Recherche de l'employé par email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Déchiffrer le mot de passe stocké dans la base de données
    const decryptedPassword = employee.decryptPassword();
    if (decryptedPassword !== password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Authentification réussie : renvoyer les données de l'employé (y compris le champ "role" pour la gestion des accès)
    // Vous pouvez aussi envisager d'ajouter la génération d'un token JWT ici pour renforcer la sécurité
    res.status(200).json(employee);
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
