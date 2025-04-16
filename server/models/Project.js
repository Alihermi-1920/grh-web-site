// models/Project.js (updated)
const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    projectLeader: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    deadline: { type: Date },
    description: { type: String },
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "on-hold"],
      default: "planning",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    budget: { type: Number },
    completionPercentage: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);