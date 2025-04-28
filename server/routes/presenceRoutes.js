// routes/presence.js
const express = require("express");
const router = express.Router();
const Presence = require("../models/presence");
const Employee = require("../models/Employee");

// Configuration de l'heure de travail standard
const WORK_START_HOUR = 9; // 9h du matin
const WORK_START_MINUTE = 0;
const WORK_END_HOUR = 17; // 17h (5pm)
const WORK_END_MINUTE = 0;
const LATE_THRESHOLD_MINUTES = 15; // Considéré en retard après 15 minutes
const EARLY_DEPARTURE_THRESHOLD_MINUTES = 15; // Départ anticipé si > 15 minutes avant la fin

// Helper pour calculer les minutes de retard
const calculateLateMinutes = (checkInTime) => {
  const workStartTime = new Date(checkInTime);
  workStartTime.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);

  if (checkInTime <= workStartTime) return 0;

  const diffMs = checkInTime - workStartTime;
  return Math.floor(diffMs / 60000); // Conversion ms -> minutes
};

// Helper pour calculer les minutes de départ anticipé
const calculateEarlyDepartureMinutes = (checkOutTime) => {
  const workEndTime = new Date(checkOutTime);
  workEndTime.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0);

  if (checkOutTime >= workEndTime) return 0;

  const diffMs = workEndTime - checkOutTime;
  return Math.floor(diffMs / 60000); // Conversion ms -> minutes
};

// Helper pour calculer les heures travaillées
const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkOut) return null;

  const diffMs = checkOut - checkIn;
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); // Heures avec 2 décimales
};

// Helper pour déterminer le statut
const determineStatus = (lateMinutes, earlyDepartureMinutes, workHours) => {
  if (lateMinutes > LATE_THRESHOLD_MINUTES && earlyDepartureMinutes > EARLY_DEPARTURE_THRESHOLD_MINUTES) {
    return 'halfDay';
  } else if (lateMinutes > LATE_THRESHOLD_MINUTES) {
    return 'late';
  } else if (earlyDepartureMinutes > EARLY_DEPARTURE_THRESHOLD_MINUTES) {
    return 'earlyDeparture';
  }
  return 'present';
};

// ===== ROUTES API =====

// 1. Obtenir toutes les présences avec population du champ employeeId
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, employeeId, status } = req.query;
    let query = {};

    // Filtrage par date
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Filtrage par employé
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Filtrage par statut
    if (status) {
      query.status = status;
    }

    const presences = await Presence.find(query)
      .populate('employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ date: -1, checkIn: -1 });

    res.status(200).json(presences);
  } catch (error) {
    console.error("Erreur lors de la récupération des présences:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des présences", error: error.message });
  }
});

// 2. Obtenir la présence par ID
router.get("/:id", async (req, res) => {
  try {
    const presence = await Presence.findById(req.params.id)
      .populate('employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!presence) {
      return res.status(404).json({ message: "Présence non trouvée" });
    }

    res.status(200).json(presence);
  } catch (error) {
    console.error("Erreur lors de la récupération de la présence:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la présence", error: error.message });
  }
});

// 3. Obtenir les présences par date (pour tous les employés)
router.get("/date/:date", async (req, res) => {
  try {
    const dateString = req.params.date;
    const presences = await Presence.getAllPresencesByDate(dateString);

    // Récupérer tous les employés pour identifier les absents
    const allEmployees = await Employee.find({});
    const presentEmployeeIds = presences.map(p => p.employeeId._id.toString());

    // Créer un objet pour chaque employé absent
    const absentEmployees = allEmployees
      .filter(emp => !presentEmployeeIds.includes(emp._id.toString()))
      .map(emp => ({
        employeeId: emp,
        date: new Date(dateString),
        status: 'absent',
        virtual: true // Indique que cet enregistrement n'est pas dans la base de données
      }));

    // Combiner les présents et les absents
    const result = [...presences, ...absentEmployees];

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des présences par date:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des présences par date", error: error.message });
  }
});

// 4. Obtenir les statistiques d'un employé
router.get("/stats/:employeeId", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate et endDate sont requis" });
    }

    const stats = await Presence.getEmployeeStats(req.params.employeeId, startDate, endDate);
    res.status(200).json(stats || { message: "Aucune donnée trouvée pour cette période" });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques", error: error.message });
  }
});

// 5. Enregistrer une entrée (check-in)
router.post("/checkin", async (req, res) => {
  try {
    const { employeeId, checkIn, notes, createdBy } = req.body;

    // Valider les données
    if (!employeeId || !checkIn) {
      return res.status(400).json({ message: "employeeId et checkIn sont obligatoires" });
    }

    // Vérifier si l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    // Vérifier s'il n'y a pas déjà un enregistrement pour cette date
    const checkInDate = new Date(checkIn);
    const existingPresence = await Presence.getEmployeePresenceByDate(employeeId, checkInDate);

    if (existingPresence) {
      return res.status(400).json({ message: "L'employé a déjà un enregistrement pour cette date" });
    }

    // Calculer les minutes de retard
    const lateMinutes = calculateLateMinutes(checkInDate);

    // Déterminer le statut initial
    const initialStatus = lateMinutes > LATE_THRESHOLD_MINUTES ? 'late' : 'present';

    // Créer l'enregistrement
    const presence = new Presence({
      employeeId,
      date: checkInDate,
      checkIn: checkInDate,
      lateMinutes,
      status: initialStatus,
      notes,
      createdBy,
      updatedBy: createdBy
    });

    await presence.save();

    // Récupérer l'enregistrement complet avec les relations
    const populatedPresence = await Presence.findById(presence._id)
      .populate('employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.status(201).json(populatedPresence);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la présence:", error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement de la présence", error: error.message });
  }
});

// 6. Enregistrer une sortie (check-out)
router.put("/checkout/:id", async (req, res) => {
  try {
    const { checkOut, notes, updatedBy } = req.body;

    // Valider les données
    if (!checkOut) {
      return res.status(400).json({ message: "checkOut est obligatoire" });
    }

    // Trouver l'enregistrement
    const presence = await Presence.findById(req.params.id);
    if (!presence) {
      return res.status(404).json({ message: "Enregistrement non trouvé" });
    }

    // Vérifier que le check-out est après le check-in
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= presence.checkIn) {
      return res.status(400).json({ message: "Le check-out doit être après le check-in" });
    }

    // Calculer les minutes de départ anticipé
    const earlyDepartureMinutes = calculateEarlyDepartureMinutes(checkOutDate);

    // Calculer les heures travaillées
    const workHours = calculateWorkHours(presence.checkIn, checkOutDate);

    // Déterminer le statut final - Conserver le statut 'present' pour les employés qui font checkout
    // Cela permet de les afficher dans l'onglet "Check-out" qui filtre sur status === 'present' && checkOut
    let status = presence.status;
    if (presence.status !== 'late' && presence.status !== 'ropo') {
      status = 'present';
    }

    // Mettre à jour l'enregistrement
    const updatedPresence = await Presence.findByIdAndUpdate(
      req.params.id,
      {
        checkOut: checkOutDate,
        earlyDepartureMinutes,
        workHours,
        status,
        notes: notes || presence.notes,
        updatedBy,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('employeeId')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');

    if (!updatedPresence) {
      return res.status(404).json({ message: "Enregistrement non trouvé après mise à jour" });
    }

    res.status(200).json(updatedPresence);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la présence:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la présence", error: error.message });
  }
});

// 7. Créer ou mettre à jour une présence complète
router.post("/", async (req, res) => {
  try {
    const {
      employeeId, date, checkIn, checkOut, status, lateMinutes,
      earlyDepartureMinutes, workHours, notes, createdBy
    } = req.body;

    // Valider les données
    if (!employeeId || !date || !checkIn) {
      return res.status(400).json({ message: "employeeId, date et checkIn sont obligatoires" });
    }

    // Vérifier si l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    // Convertir en dates
    const presenceDate = new Date(date);
    const checkInTime = new Date(checkIn);
    let checkOutTime = checkOut ? new Date(checkOut) : null;

    // Vérifier s'il y a déjà un enregistrement pour cette date
    const existingPresence = await Presence.getEmployeePresenceByDate(employeeId, presenceDate);

    // Calculer automatiquement si non fourni
    const calculatedLateMinutes = lateMinutes !== undefined ? lateMinutes : calculateLateMinutes(checkInTime);
    let calculatedEarlyDepartureMinutes = earlyDepartureMinutes;
    let calculatedWorkHours = workHours;
    let calculatedStatus = status;

    if (checkOutTime) {
      calculatedEarlyDepartureMinutes = earlyDepartureMinutes !== undefined ?
        earlyDepartureMinutes : calculateEarlyDepartureMinutes(checkOutTime);

      calculatedWorkHours = workHours !== undefined ?
        workHours : calculateWorkHours(checkInTime, checkOutTime);

      calculatedStatus = status || determineStatus(
        calculatedLateMinutes,
        calculatedEarlyDepartureMinutes,
        calculatedWorkHours
      );
    } else if (!calculatedStatus) {
      calculatedStatus = calculatedLateMinutes > LATE_THRESHOLD_MINUTES ? 'late' : 'present';
    }

    let presence;

    if (existingPresence) {
      // Mettre à jour l'enregistrement existant
      presence = await Presence.findByIdAndUpdate(
        existingPresence._id,
        {
          checkIn: checkInTime,
          checkOut: checkOutTime,
          lateMinutes: calculatedLateMinutes,
          earlyDepartureMinutes: calculatedEarlyDepartureMinutes,
          workHours: calculatedWorkHours,
          status: calculatedStatus,
          notes,
          updatedBy: createdBy,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      // Créer un nouvel enregistrement
      presence = new Presence({
        employeeId,
        date: presenceDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        lateMinutes: calculatedLateMinutes,
        earlyDepartureMinutes: calculatedEarlyDepartureMinutes,
        workHours: calculatedWorkHours,
        status: calculatedStatus,
        notes,
        createdBy,
        updatedBy: createdBy
      });

      await presence.save();
    }

    // Récupérer l'enregistrement complet avec les relations
    const populatedPresence = await Presence.findById(presence._id)
      .populate('employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.status(201).json(populatedPresence);
  } catch (error) {
    console.error("Erreur lors de la création/mise à jour de la présence:", error);
    res.status(500).json({ message: "Erreur lors de la création/mise à jour de la présence", error: error.message });
  }
});

// 8. Supprimer une présence
router.delete("/:id", async (req, res) => {
  try {
    const presence = await Presence.findByIdAndDelete(req.params.id);

    if (!presence) {
      return res.status(404).json({ message: "Présence non trouvée" });
    }

    res.status(200).json({ message: "Présence supprimée avec succès", deletedPresence: presence });
  } catch (error) {
    console.error("Erreur lors de la suppression de la présence:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de la présence", error: error.message });
  }
});

// 9. Marquer un employé comme absent pour une date
router.post("/absent", async (req, res) => {
  try {
    const { employeeId, date, notes, createdBy } = req.body;

    // Valider les données
    if (!employeeId || !date) {
      return res.status(400).json({ message: "employeeId et date sont obligatoires" });
    }

    // Vérifier si l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employé non trouvé" });
    }

    // Vérifier s'il n'y a pas déjà un enregistrement pour cette date
    const presenceDate = new Date(date);
    const existingPresence = await Presence.getEmployeePresenceByDate(employeeId, presenceDate);

    if (existingPresence) {
      return res.status(400).json({ message: "L'employé a déjà un enregistrement pour cette date" });
    }

    // Créer l'enregistrement
    const presence = new Presence({
      employeeId,
      date: presenceDate,
      checkIn: presenceDate, // On met la date comme checkIn par défaut
      status: 'absent',
      notes,
      createdBy,
      updatedBy: createdBy
    });

    await presence.save();

    // Récupérer l'enregistrement complet avec les relations
    const populatedPresence = await Presence.findById(presence._id)
      .populate('employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.status(201).json(populatedPresence);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'absence:", error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement de l'absence", error: error.message });
  }
});

// 10. Obtenir les rapports de présence agrégés par jour, semaine ou mois
router.get("/reports/:type", async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;
    const reportType = req.params.type; // 'daily', 'weekly', 'monthly'

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate et endDate sont requis" });
    }

    let matchStage = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Si un département est spécifié, filtrer par employés de ce département
    if (departmentId) {
      // On doit d'abord récupérer les IDs des employés du département
      const departmentEmployees = await Employee.find({ department: departmentId }).select('_id');
      const employeeIds = departmentEmployees.map(emp => emp._id);

      matchStage.employeeId = { $in: employeeIds };
    }

    // Déterminer le format de groupement selon le type de rapport
    let groupId;
    if (reportType === 'daily') {
      groupId = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" }
      };
    } else if (reportType === 'weekly') {
      groupId = {
        year: { $year: "$date" },
        week: { $week: "$date" }
      };
    } else if (reportType === 'monthly') {
      groupId = {
        year: { $year: "$date" },
        month: { $month: "$date" }
      };
    } else {
      return res.status(400).json({ message: "Type de rapport invalide. Utilisez 'daily', 'weekly' ou 'monthly'" });
    }

    const aggregationResult = await Presence.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          date: { $first: "$date" },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "halfDay"] }, 1, 0] } },
          earlyDeparture: { $sum: { $cond: [{ $eq: ["$status", "earlyDeparture"] }, 1, 0] } },
          totalLateMinutes: { $sum: "$lateMinutes" },
          totalEarlyDepartureMinutes: { $sum: "$earlyDepartureMinutes" },
          totalWorkHours: { $sum: "$workHours" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ]);

    res.status(200).json(aggregationResult);
  } catch (error) {
    console.error("Erreur lors de la génération du rapport:", error);
    res.status(500).json({ message: "Erreur lors de la génération du rapport", error: error.message });
  }
});



module.exports = router;
