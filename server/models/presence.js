const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, default: Date.now },
  checkIn: { type: String, required: true }, // Heure d'entrée
  checkOut: { type: String }, // Heure de sortie
});

const Presence = mongoose.model("Presence", presenceSchema);
module.exports = Presence;
