// models/finalConge.js
const mongoose = require("mongoose");

const finalCongeSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["En attente", "Approuvé", "Refusé"],
    default: "En attente"
  },
  type: {
    type: String,
    enum: ["Congé annuel", "Congé maladie", "Congé sans solde", "Autre"],
    required: true
  },
  attachmentPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },
  approvalDate: {
    type: Date
  },
  comments: {
    type: String
  }
});

const FinalConge = mongoose.model("FinalConge", finalCongeSchema);

module.exports = FinalConge;
