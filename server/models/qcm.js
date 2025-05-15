const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  note: { type: Number, required: true, min: 0, max: 10 },
});

const qcmSchema = new mongoose.Schema(
  {
    chapter: { type: String, required: true },
    question: { type: String, required: true },
    // Les options seront générées automatiquement (0 à 5)
    options: { type: [optionSchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QCM", qcmSchema);
