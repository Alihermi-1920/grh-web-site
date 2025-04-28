// models/Project.js (updated)
const mongoose = require("mongoose");

// Document schema
const DocumentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  uploadDate: { type: Date, default: Date.now }
});

// Comment schema
const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  authorName: { type: String },
  type: {
    type: String,
    enum: ["general", "status_change", "team_update", "document_upload"],
    default: "general"
  },
  oldStatus: { type: String },
  newStatus: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    projectLeader: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    deadline: { type: Date },
    description: { type: String },
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "on-hold", "rejected"],
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
    documents: [DocumentSchema],
    comments: [CommentSchema]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);