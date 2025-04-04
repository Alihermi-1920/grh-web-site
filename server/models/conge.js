// models/conge.js
const mongoose = require("mongoose");

const congeSchema = new mongoose.Schema(
  {
    employee: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    },
    leaveType: { type: String, required: true },
    leaveDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    adminJustification: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conge", congeSchema);
