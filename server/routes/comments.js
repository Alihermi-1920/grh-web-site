const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// Add a comment to a project
router.post("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { text, userId, userName, type, oldStatus, newStatus } = req.body;
    
    console.log("Comment request received for project:", projectId);
    console.log("Comment data:", req.body);
    
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    
    if (!userId || !userName) {
      return res.status(400).json({ message: "User information is required" });
    }
    
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Create comment
    const comment = {
      text,
      author: userId,
      authorName: userName,
      type: type || "general",
      oldStatus,
      newStatus,
      createdAt: new Date()
    };
    
    // Add comment to project
    project.comments = [...(project.comments || []), comment];
    await project.save();
    
    res.status(200).json({
      message: "Comment added successfully",
      comment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all comments for a project
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(200).json(project.comments || []);
  } catch (error) {
    console.error("Error retrieving comments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
