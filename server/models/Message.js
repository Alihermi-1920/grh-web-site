const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    },
    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    attachments: [
      {
        fileName: { type: String, required: true },
        originalName: { type: String, required: true },
        filePath: { type: String, required: true },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadDate: { type: Date, default: Date.now }
      }
    ],
    isRead: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
