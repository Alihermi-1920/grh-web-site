const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const TaskMessage = require("../models/TaskMessage");
const Task = require("../models/Task");
const Employee = require("../models/Employee");
const auth = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, "../../client/public/uploads/tasks");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, Word docs, Excel files
  const allowedFileTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les images, PDF, Word et Excel sont acceptés.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET all messages for a specific task
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const messages = await TaskMessage.find({ taskId })
      .populate("sender", "firstName lastName photo role")
      .populate("receiver", "firstName lastName photo role")
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error("Error fetching task messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all unread messages for a user
router.get("/unread/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const unreadMessages = await TaskMessage.find({ 
      receiver: employeeId,
      isRead: false
    })
      .populate("sender", "firstName lastName photo role")
      .populate("taskId", "name");
    
    res.json(unreadMessages);
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST send a new message
router.post("/", upload.array("attachments", 5), async (req, res) => {
  try {
    const { taskId, senderId, receiverId, message } = req.body;
    
    // Validate required fields
    if (!taskId || !senderId || !receiverId || !message) {
      return res.status(400).json({ 
        message: "Task ID, sender ID, receiver ID, and message are required" 
      });
    }
    
    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Process uploaded files if any
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/tasks/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date()
    })) : [];
    
    // Create new message
    const newMessage = new TaskMessage({
      taskId,
      sender: senderId,
      receiver: receiverId,
      message,
      attachments,
      isRead: false
    });
    
    const savedMessage = await newMessage.save();
    
    // Update task to indicate unread messages
    await Task.findByIdAndUpdate(taskId, { hasUnreadMessages: true });
    
    // Populate sender and receiver info
    const populatedMessage = await TaskMessage.findById(savedMessage._id)
      .populate("sender", "firstName lastName photo role")
      .populate("receiver", "firstName lastName photo role");
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT mark message as read
router.put("/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await TaskMessage.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if all messages for this task are read
    const unreadCount = await TaskMessage.countDocuments({
      taskId: message.taskId,
      receiver: message.receiver,
      isRead: false
    });
    
    // If no unread messages, update task
    if (unreadCount === 0) {
      await Task.findByIdAndUpdate(message.taskId, { hasUnreadMessages: false });
    }
    
    res.json(message);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a message (only sender can delete)
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { employeeId } = req.body;
    
    const message = await TaskMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if requester is the sender
    if (message.sender.toString() !== employeeId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    // Delete any attached files
    if (message.attachments && message.attachments.length > 0) {
      message.attachments.forEach(attachment => {
        const filePath = path.join(
          __dirname, 
          "../../client/public", 
          attachment.filePath
        );
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await TaskMessage.findByIdAndDelete(messageId);
    
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
