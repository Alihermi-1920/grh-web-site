const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Project = require("../models/Project");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create client-side upload directory
    const uploadDir = path.join(__dirname, "../../client/public/uploads/projects");
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created upload directory:", uploadDir);
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

const upload = multer({ storage: storage });

// Upload files to a project
router.post("/:projectId", upload.array("files", 5), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, userName } = req.body;
    
    console.log("Upload request received for project:", projectId);
    console.log("Files:", req.files ? req.files.length : 0);
    console.log("User:", userId, userName);
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Process uploaded files
    const documents = req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/projects/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
      uploadDate: new Date()
    }));
    
    // Add documents to project
    project.documents = [...(project.documents || []), ...documents];
    
    // Add a comment about the document upload
    if (userId && userName) {
      const comment = {
        text: `${userName} added ${req.files.length} document(s) to the project`,
        author: userId,
        authorName: userName,
        type: "document_upload",
        createdAt: new Date()
      };
      
      project.comments = [...(project.comments || []), comment];
    }
    
    await project.save();
    
    res.status(200).json({
      message: "Files uploaded successfully",
      documents: documents
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
