const express = require("express");
const app = express();
const port = 5001; // Use a different port to avoid conflicts

// Import the routes
const uploadRoutes = require("./routes/upload");
const commentRoutes = require("./routes/comments");

// Middleware
app.use(express.json());

// Register routes
app.use("/api/upload", uploadRoutes);
app.use("/api/comments", commentRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route works!" });
});

// Start server
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  console.log("Routes registered:");
  console.log("- /api/upload");
  console.log("- /api/comments");
  console.log("- /test");
});
