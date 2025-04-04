// server/routes/chefDashboard.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/auth");

// Appliquer le middleware d'authentification
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    // L'ID du chef connecté est récupéré depuis req.user (décodé par le JWT)
    const chefId = req.user.id;

    // Récupérer le profil du chef en sélectionnant uniquement firstName, lastName et role
    const chefProfile = await Employee.findById(chefId).select("firstName lastName role");
    if (!chefProfile) {
      return res.status(404).json({ message: "Chef non trouvé" });
    }

    // Récupérer la liste des employés gérés par ce chef (en filtrant par le champ "manager")
    // On suppose que le modèle Employee possède un champ "manager" qui contient l'ID du chef
    const employees = await Employee.find({ manager: chefId }).select("firstName lastName role");

    res.status(200).json({
      profile: chefProfile,
      employees,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
