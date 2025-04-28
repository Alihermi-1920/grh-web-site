const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Presence = mongoose.model("Presence");
const Employee = mongoose.model("Employee");

// Générer un rapport de présence pour une date spécifique
router.get("/daily", async (req, res) => {
  try {
    const { date, period } = req.query;
    if (!date) {
      return res.status(400).json({ message: "La date est requise" });
    }

    let startDate, endDate;

    // Déterminer la période du rapport
    if (period === 'week') {
      // Pour une semaine
      startDate = new Date(date);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Début de la semaine (dimanche)
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Fin de la semaine (samedi)
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      // Pour un mois
      startDate = new Date(date);
      startDate.setDate(1); // Premier jour du mois
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // Premier jour du mois suivant
      endDate.setDate(0); // Dernier jour du mois actuel
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Pour un jour (par défaut)
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log(`Génération du rapport pour la période: ${startDate.toISOString()} à ${endDate.toISOString()}`);
    console.log(`Période demandée: ${period || 'day'}`);

    // Récupérer toutes les présences pour la période spécifiée
    const presences = await Presence.find({
      $or: [
        // Vérifier le champ date
        { date: { $gte: startDate, $lte: endDate } },
        // Vérifier aussi le champ checkIn pour les anciens enregistrements
        { checkIn: { $gte: startDate, $lte: endDate } }
      ]
    }).populate('employeeId');

    // Log pour le débogage
    console.log(`Rapport pour la période: ${presences.length} enregistrements trouvés`);

    // Compter les statuts
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      ropo: 0,
      halfDay: 0,
      earlyDeparture: 0
    };

    presences.forEach(p => {
      if (p.status && statusCounts.hasOwnProperty(p.status)) {
        statusCounts[p.status]++;
      }

      if (p.employeeId) {
        console.log(`- Employé: ${p.employeeId.firstName} ${p.employeeId.lastName}, Status: ${p.status}`);
      } else {
        console.log(`- Employé inconnu, ID: ${p.employeeId}, Status: ${p.status}`);
      }
    });

    console.log("Comptage des statuts:", statusCounts);

    // Filtrer les présences valides (avec employeeId)
    const validPresences = presences.filter(p => p.employeeId && p.employeeId._id);

    const allEmployees = await Employee.find({});
    const presentEmployeeIds = validPresences.map(p => p.employeeId._id.toString());
    const absentEmployees = allEmployees.filter(emp => !presentEmployeeIds.includes(emp._id.toString()));

    const reportData = {
      present: validPresences.filter(p => p.status === 'present').length,
      late: validPresences.filter(p => p.status === 'late').length,
      ropo: validPresences.filter(p => p.status === 'ropo').length,
      absent: absentEmployees.length,
      period: period || 'day',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      details: [...validPresences, ...absentEmployees.map(emp => ({
        employeeId: emp,
        status: 'absent',
        virtual: true
      }))]
    };

    res.status(200).json(reportData);
  } catch (error) {
    console.error("Erreur lors de la génération du rapport:", error);
    res.status(500).json({ message: "Erreur lors de la génération du rapport", error: error.message });
  }
});

module.exports = router;
