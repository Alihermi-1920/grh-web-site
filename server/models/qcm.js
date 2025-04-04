// models/qcm.js
const mongoose = require("mongoose");

const qcmSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
}, {
  timestamps: true // Optionnel : ajoute des timestamps pour la création et la mise à jour
});

module.exports = mongoose.model("QCM", qcmSchema);
