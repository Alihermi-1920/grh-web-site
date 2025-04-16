// models/PTask.js
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "blocked"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completionPercentage: { type: Number, default: 0 },
    comments: [
      {
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", TaskSchema);