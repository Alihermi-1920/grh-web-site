const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, default: Date.now },
  checkIn: { type: Date, required: true }, // Heure d'entrée (now using Date type)
  checkOut: { type: Date }, // Heure de sortie (now using Date type)
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'halfDay', 'earlyDeparture', 'ropo'],
    default: 'present'
  },
  lateMinutes: { type: Number, default: 0 }, // Minutes de retard
  earlyDepartureMinutes: { type: Number, default: 0 }, // Minutes de départ anticipé
  workHours: { type: Number }, // Heures travaillées (calculées à partir de checkIn et checkOut)
  notes: { type: String }, // Notes sur la présence (explication retard, etc.)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Admin/Chef qui a créé l'enregistrement
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Admin/Chef qui a modifié l'enregistrement
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Méthode statique pour obtenir la présence d'un employé à une date spécifique
presenceSchema.statics.getEmployeePresenceByDate = async function(employeeId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    employeeId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate('employeeId');
};

// Méthode statique pour obtenir les présences de tous les employés à une date spécifique
presenceSchema.statics.getAllPresencesByDate = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate('employeeId');
};

// Méthode statique pour obtenir les statistiques de présence d'un employé (sur une période)
presenceSchema.statics.getEmployeeStats = async function(employeeId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        employeeId: mongoose.Types.ObjectId(employeeId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        lateDays: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        absentDays: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        halfDays: { $sum: { $cond: [{ $eq: ["$status", "halfDay"] }, 1, 0] } },
        earlyDepartures: { $sum: { $cond: [{ $eq: ["$status", "earlyDeparture"] }, 1, 0] } },
        totalLateMinutes: { $sum: "$lateMinutes" },
        totalEarlyDepartureMinutes: { $sum: "$earlyDepartureMinutes" },
        totalWorkHours: { $sum: "$workHours" }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : null;
};

const Presence = mongoose.model("Presence", presenceSchema);
module.exports = Presence;
