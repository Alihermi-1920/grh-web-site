const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const router = express.Router();

// Route de connexion
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Rechercher l'utilisateur par email
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Déchiffrer et comparer le mot de passe
    const decryptedPassword = user.decryptPassword();
    if (decryptedPassword !== password) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Créer un token JWT
    const token = jwt.sign({ userId: user._id }, "secretkey", { expiresIn: "1h" });

    // Répondre avec les informations nécessaires
    res.json({
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        photo: user.photo,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
