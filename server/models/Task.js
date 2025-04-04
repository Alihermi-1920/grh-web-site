const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    details: { type: String, required: true },
    deadline: { type: Date, required: true },
    assignedEmployee: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
