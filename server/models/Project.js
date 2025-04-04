// models/Project.js
const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    projectLeader: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    deadline: { type: Date },
    description: { type: String },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  },
  {
    timestamps: true, // ajoute createdAt et updatedAt automatiquement
  }
);

module.exports = mongoose.model("Project", ProjectSchema);
