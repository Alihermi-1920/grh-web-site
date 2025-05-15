// routes/maintenance.js
const express = require("express");
const router = express.Router();
const MaintenanceMode = require("../models/MaintenanceMode");
const auth = require("../middleware/auth");

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Accès refusé. Seuls les administrateurs peuvent gérer le mode maintenance."
    });
  }
};

// PUBLIC ROUTE: Get maintenance status (for client to check)
router.get("/status", async (req, res) => {
  try {
    let settings = await MaintenanceMode.findOne({});

    // If no settings exist, initialize them
    if (!settings) {
      settings = await MaintenanceMode.initializeSettings();
    }

    res.json({
      success: true,
      isGlobalMaintenance: settings.isGlobalMaintenance,
      globalMessage: settings.globalMaintenanceMessage,
      allowAdminAccess: settings.allowAdminAccess,
      pageSettings: settings.pageSettings
    });
  } catch (error) {
    console.error("Error fetching maintenance status:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du statut de maintenance"
    });
  }
});

// PUBLIC ROUTE: Check if a specific page is under maintenance
router.get("/check/:pagePath", async (req, res) => {
  try {
    const { pagePath } = req.params;

    const isUnderMaintenance = await MaintenanceMode.isPageUnderMaintenance(pagePath);
    const message = await MaintenanceMode.getMaintenanceMessage(pagePath);

    res.json({
      success: true,
      isUnderMaintenance,
      message
    });
  } catch (error) {
    console.error("Error checking page maintenance status:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du statut de maintenance de la page"
    });
  }
});

// ADMIN ROUTE: Update global maintenance status
router.put("/global", auth, isAdmin, async (req, res) => {
  try {
    const { isGlobalMaintenance, globalMaintenanceMessage, allowAdminAccess, watermarkVideo } = req.body;

    let settings = await MaintenanceMode.findOne({});

    // If no settings exist, initialize them
    if (!settings) {
      settings = await MaintenanceMode.initializeSettings();
    }

    // Update settings
    settings.isGlobalMaintenance = isGlobalMaintenance;
    if (globalMaintenanceMessage) {
      settings.globalMaintenanceMessage = globalMaintenanceMessage;
    }
    // Admin access is always allowed - this parameter is ignored
    settings.allowAdminAccess = true;

    await settings.save();

    res.json({
      success: true,
      message: isGlobalMaintenance ? "Mode maintenance global activé" : "Mode maintenance global désactivé",
      data: settings
    });
  } catch (error) {
    console.error("Error updating global maintenance status:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut de maintenance global"
    });
  }
});

// ADMIN ROUTE: Update page-specific maintenance status
router.put("/page/:pagePath", auth, isAdmin, async (req, res) => {
  try {
    const { pagePath } = req.params;
    const { isUnderMaintenance, maintenanceMessage } = req.body;

    let settings = await MaintenanceMode.findOne({});

    // If no settings exist, initialize them
    if (!settings) {
      settings = await MaintenanceMode.initializeSettings();
    }

    // Find the page in settings
    const pageIndex = settings.pageSettings.findIndex(page => page.pagePath === pagePath);

    if (pageIndex === -1) {
      // If page doesn't exist in settings, add it
      settings.pageSettings.push({
        pagePath,
        isUnderMaintenance,
        maintenanceMessage: maintenanceMessage || `La page ${pagePath} est en maintenance.`
      });
    } else {
      // Update existing page settings
      settings.pageSettings[pageIndex].isUnderMaintenance = isUnderMaintenance;
      if (maintenanceMessage) {
        settings.pageSettings[pageIndex].maintenanceMessage = maintenanceMessage;
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: isUnderMaintenance ? `Mode maintenance activé pour ${pagePath}` : `Mode maintenance désactivé pour ${pagePath}`,
      data: settings
    });
  } catch (error) {
    console.error("Error updating page maintenance status:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut de maintenance de la page"
    });
  }
});

module.exports = router;
