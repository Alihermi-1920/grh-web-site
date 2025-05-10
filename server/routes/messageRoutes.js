const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Message = require("../models/Message");
const Employee = require("../models/Employee");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, "../../client/public/uploads/messages");

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

// GET all conversations for a user
router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).sort({ createdAt: -1 });

    // Extract unique conversation partners
    const conversationPartners = new Set();
    messages.forEach(message => {
      if (message.sender.toString() === userId) {
        conversationPartners.add(message.receiver.toString());
      } else {
        conversationPartners.add(message.sender.toString());
      }
    });

    // Get details for each conversation partner
    const conversations = await Promise.all(
      Array.from(conversationPartners).map(async (partnerId) => {
        const partner = await Employee.findById(partnerId).select("firstName lastName photo role cin department");

        // Get the latest message in this conversation
        const latestMessage = await Message.findOne({
          $or: [
            { sender: userId, receiver: partnerId },
            { sender: partnerId, receiver: userId }
          ]
        }).sort({ createdAt: -1 });

        // Count unread messages
        const unreadCount = await Message.countDocuments({
          sender: partnerId,
          receiver: userId,
          isRead: false
        });

        return {
          partner,
          latestMessage,
          unreadCount
        };
      })
    );

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET messages between two users
router.get("/conversation/:userId/:partnerId", async (req, res) => {
  try {
    const { userId, partnerId } = req.params;

    // Find all messages between these two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ]
    })
      .populate("sender", "firstName lastName photo role cin department")
      .populate("receiver", "firstName lastName photo role cin department")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: partnerId, receiver: userId, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all employees for a chef
router.get("/employees/:chefId", async (req, res) => {
  try {
    const { chefId } = req.params;

    // Find all employees where the chef is the specified chef
    const employees = await Employee.find({ chefId: chefId })
      .select("firstName lastName photo role cin department");

    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET chef for an employee
router.get("/chef/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find the employee
    const employee = await Employee.findById(employeeId);

    if (!employee || !employee.chefId) {
      return res.status(404).json({ message: "Chef not found" });
    }

    // Get the chef details
    const chef = await Employee.findById(employee.chefId)
      .select("firstName lastName photo role cin department");

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    res.json(chef);
  } catch (error) {
    console.error("Error fetching chef:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST send a new message
router.post("/", upload.array("attachments", 5), async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    // Validate required fields
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({
        message: "Sender ID, receiver ID, and content are required"
      });
    }

    // Process uploaded files if any
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/messages/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date()
    })) : [];

    // Create new message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      attachments,
      isRead: false
    });

    const savedMessage = await newMessage.save();

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender", "firstName lastName photo role cin department")
      .populate("receiver", "firstName lastName photo role cin department");

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a message
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if requester is the sender
    if (message.sender.toString() !== userId) {
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

    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET unread message count
router.get("/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
