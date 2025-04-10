// models/evaluationresultat.js
const mongoose = require("mongoose");

const evaluationResultatSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  employeeName: { type: String, required: true },
  chapterScores: { type: Map, of: Number, required: true },
  globalScore: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model("EvaluationResultat", evaluationResultatSchema);
