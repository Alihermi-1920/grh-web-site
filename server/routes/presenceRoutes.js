// routes/presence.js
const express = require("express");
const router = express.Router();
const Presence = require("../models/presence");

// Ajouter une présence (check‑in)
router.post("/checkin", async (req, res) => {
  try {
    const { employeeId, checkIn } = req.body;
    const presence = new Presence({ employeeId, checkIn });
    await presence.save();
    res.status(201).json(presence);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'enregistrement de la présence", error });
  }
});

// Ajouter une sortie (check‑out)
router.put("/checkout/:id", async (req, res) => {
  try {
    const { checkOut } = req.body;
    const presence = await Presence.findByIdAndUpdate(
      req.params.id,
      { checkOut },
      { new: true }
    );
    if (!presence) return res.status(404).json({ message: "Enregistrement non trouvé" });
    res.status(200).json(presence);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de la présence", error });
  }
});

// Obtenir toutes les présences avec population du champ employeeId
router.get("/", async (req, res) => {
  try {
    const presences = await Presence.find().populate("employeeId");
    res.status(200).json(presences);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des présences", error });
  }
});

module.exports = router;
