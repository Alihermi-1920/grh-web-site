// models/conge.js
const mongoose = require("mongoose");

// Schéma pour les documents justificatifs
const DocumentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
  uploadDate: { type: Date, default: Date.now }
}, { _id: true }); // Ensure each document gets its own ID

// Add a toString method for debugging
DocumentSchema.methods.toString = function() {
  return `Document: ${this.originalName}, Path: ${this.filePath}, Type: ${this.fileType}, Size: ${this.fileSize}`;
};

const congeSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },
    leaveType: {
      type: String,
      required: true,
      enum: ["Congé payé", "Congé sans solde", "Congé médical", "Congé personnel"]
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["En attente", "Approuvé", "Rejeté"],
      default: "En attente"
    },
    chefJustification: { type: String },
    isMedical: { type: Boolean, default: false },
    documents: [DocumentSchema],
    deductFromBalance: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conge", congeSchema);
