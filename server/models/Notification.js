// server/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. "project", "message", etc.
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    // Optional: If notification is related to a project, you may store a reference:
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
