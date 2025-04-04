const express = require("express");
const router = express.Router();
const Conge = require("../models/conge");

// Pour cet exemple, nous supposons que l'authentification est gérée par un middleware qui définit req.user.
// Si req.user existe, nous pouvons en extraire le rôle et l'ID.

router.post("/", async (req, res) => {
  try {
    // Si l'utilisateur est connecté
    if (req.user) {
      // Si ce n'est pas un chef, on force l'ID de l'employé à celui de l'utilisateur connecté
      if (req.user.role !== "Chef") {
        req.body.employee = req.user._id;
      } else {
        // Si c'est un chef, vérifiez que le champ employee est renseigné dans le corps de la requête
        if (!req.body.employee) {
          return res.status(400).json({ error: "Le champ employee est obligatoire pour le chef." });
        }
      }
    } else {
      // Si aucune authentification n'est présente, vous pouvez exiger que le client fournisse l'ID
      if (!req.body.employee) {
        return res.status(400).json({ error: "Le champ employee est obligatoire." });
      }
    }
    
    const newConge = new Conge(req.body);
    await newConge.save();
    res.status(201).json(newConge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Autres routes (GET, PUT, DELETE) restent inchangées.
router.get("/", async (req, res) => {
  try {
    const conges = await Conge.find({}).populate("employee");
    res.json(conges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedConge = await Conge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedConge) return res.status(404).json({ error: "Congé non trouvé" });
    res.json(updatedConge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedConge = await Conge.findByIdAndDelete(req.params.id);
    if (!deletedConge) return res.status(404).json({ error: "Congé non trouvé" });
    res.json({ message: "Demande de congé supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
