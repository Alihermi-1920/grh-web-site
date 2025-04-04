// Exemple dans un contrôleur d'authentification (server/controllers/authController.js)
const jwt = require("jsonwebtoken");
const config = require("../config");
const Employee = require("../models/Employee");

const login = async (req, res) => {
  const { email, password } = req.body;

  // Vérifier l'existence de l'utilisateur et comparer le mot de passe...
  const employee = await Employee.findOne({ email });
  if (!employee) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }
  // On compare le password avec bcrypt, etc. (à implémenter)
  // Supposons que la vérification est faite et que l'utilisateur est authentifié

  // Générer un token JWT (contient l'ID et éventuellement le rôle)
  const token = jwt.sign(
    { id: employee._id, role: employee.role },
    config.jwtSecret,
    { expiresIn: "1h" } // Le token expire dans 1 heure
  );

  res.status(200).json({ token });
};

module.exports = { login };
