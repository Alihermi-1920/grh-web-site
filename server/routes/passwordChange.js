// routes/passwordChange.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// Endpoint pour changer le mot de passe
router.post("/", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    console.log("Tentative de changement de mot de passe pour:", email);

    // Vérifier que tous les champs requis sont fournis
    if (!email || !currentPassword || !newPassword) {
      console.log("Données manquantes pour le changement de mot de passe");
      return res.status(400).json({ message: "Email, mot de passe actuel et nouveau mot de passe requis" });
    }

    // Vérifier que le nouveau mot de passe est suffisamment long
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
    }

    // Recherche de l'employé par email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      console.log("Employé non trouvé avec l'email:", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    console.log("Employé trouvé pour changement de mot de passe:", employee.email);

    // Vérification du mot de passe actuel
    let passwordMatches = false;

    try {
      // Essayer d'abord la méthode de déchiffrement
      const decryptedPassword = employee.decryptPassword();
      passwordMatches = decryptedPassword === currentPassword;
    } catch (decryptError) {
      console.error("Erreur lors du déchiffrement du mot de passe:", decryptError);

      // Si le déchiffrement échoue, vérifier si le mot de passe est stocké en clair
      passwordMatches = employee.password === currentPassword;
    }

    if (!passwordMatches) {
      console.log("Mot de passe actuel incorrect pour:", email);
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    // Mettre à jour le mot de passe
    employee.password = newPassword;
    await employee.save();

    console.log("Mot de passe changé avec succès pour:", email);
    res.status(200).json({ message: "Mot de passe changé avec succès" });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({ message: "Erreur serveur: " + error.message });
  }
});

module.exports = router;
