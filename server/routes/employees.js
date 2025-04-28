// routes/employees.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const Employee = require("../models/Employee");
const path = require("path");
const mongoose = require("mongoose");

// Configuration de multer pour stocker les fichiers dans le dossier uploads public
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Utiliser un chemin relatif qui fonctionnera sur tous les systèmes
    cb(null, path.join(__dirname, "../../client/public/uploads"));
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
    console.log("Requête reçue pour ajouter un employé:", req.body);
    const employeeData = { ...req.body };

    // Si une photo est uploadée, on ajoute son chemin aux données
    if (req.file) {
      // Stocker seulement le chemin relatif
      employeeData.photo = `/uploads/${req.file.filename}`;
      console.log("Photo uploadée:", employeeData.photo);
    }

    // Gérer le chefId - si vide ou invalide, ne pas l'inclure
    if (!employeeData.chefId || employeeData.chefId === "") {
      delete employeeData.chefId;
      console.log("chefId vide ou invalide, supprimé des données");
    }

    const employee = new Employee(employeeData);
    await employee.save();
    console.log("Employé ajouté avec succès:", employee);
    res.status(201).json(employee);
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un employé:", error);
    res.status(400).json({ message: error.message });
  }
});

// Endpoint pour récupérer tous les employés
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().populate('chefId', 'firstName lastName email');
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint pour récupérer tous les chefs
router.get("/chefs", async (req, res) => {
  try {
    const chefs = await Employee.find({ role: "Chef" });
    res.status(200).json(chefs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint pour récupérer les employés d'un chef spécifique
router.get("/chef/:chefId", async (req, res) => {
  try {
    const { chefId } = req.params;

    // Valider l'ID du chef
    if (!mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ message: "ID de chef invalide" });
    }

    // Trouver les employés qui ont ce chef
    const employees = await Employee.find({ chefId });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Erreur lors de la récupération des employés par chef:", error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint pour modifier un employé
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Si une nouvelle photo est uploadée, on met à jour le chemin
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    // Gérer le chefId - si vide ou invalide, ne pas l'inclure
    if (!updateData.chefId || updateData.chefId === "") {
      delete updateData.chefId;
      console.log("chefId vide ou invalide, supprimé des données de mise à jour");
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un employé:", error);
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
    console.log("Tentative de connexion pour:", email);

    // Vérifier que les champs email et password sont fournis
    if (!email || !password) {
      console.log("Email ou mot de passe manquant");
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Recherche de l'employé par email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      console.log("Employé non trouvé avec l'email:", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    console.log("Employé trouvé:", employee.email, "avec le rôle:", employee.role);

    // Vérification simplifiée du mot de passe pour les tests
    // Si le mot de passe est stocké en clair ou si la méthode de déchiffrement échoue
    let passwordMatches = false;

    try {
      // Essayer d'abord la méthode de déchiffrement
      const decryptedPassword = employee.decryptPassword();
      console.log("Mot de passe déchiffré avec succès");
      passwordMatches = decryptedPassword === password;
    } catch (decryptError) {
      console.error("Erreur lors du déchiffrement du mot de passe:", decryptError);

      // Si le déchiffrement échoue, vérifier si le mot de passe est stocké en clair
      // (pour les comptes de test ou si le chiffrement n'a pas été appliqué)
      passwordMatches = employee.password === password;
      console.log("Vérification du mot de passe en clair:", passwordMatches ? "réussie" : "échouée");
    }

    if (!passwordMatches) {
      console.log("Mot de passe incorrect pour:", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    console.log("Authentification réussie pour:", email);

    // Authentification réussie : renvoyer les données de l'employé
    res.status(200).json(employee);
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur: " + error.message });
  }
});

module.exports = router;
