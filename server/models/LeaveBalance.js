// models/LeaveBalance.js
const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true
    },
    totalDays: {
      type: Number,
      default: 30, // Solde annuel par défaut
      min: 0
    },
    usedDays: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingDays: {
      type: Number,
      default: 30,
      min: 0
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    medicalDays: {
      type: Number,
      default: 0 // Jours de congé médical (non déduits du solde)
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        days: { type: Number, required: true },
        type: { type: String, required: true },
        leaveId: { type: mongoose.Schema.Types.ObjectId, ref: "Conge" }
      }
    ]
  },
  { timestamps: true }
);

// Add remainingDays as a real field
leaveBalanceSchema.pre('save', function(next) {
  this.remainingDays = this.totalDays - this.usedDays;
  next();
});

// Virtuel pour calculer le solde restant (for backward compatibility)
leaveBalanceSchema.virtual("calculatedRemainingDays").get(function() {
  return this.totalDays - this.usedDays;
});

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
