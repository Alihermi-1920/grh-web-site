// server/routes/notification.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET all notifications sorted by creation date (latest first)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// GET the count of unread notifications
router.get("/count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// POST a new notification
router.post("/", async (req, res) => {
  const { type, message } = req.body;
  if (!type || !message) {
    return res.status(400).json({ message: "Le type et le message sont obligatoires" });
  }
  try {
    const notification = new Notification({ type, message });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// PATCH: Mark a notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// DELETE a notification
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }
    res.json({ message: "Notification supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
