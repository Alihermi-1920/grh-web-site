// models/MaintenanceMode.js
const mongoose = require("mongoose");

const maintenanceModeSchema = new mongoose.Schema({
  // Global maintenance settings
  isGlobalMaintenance: {
    type: Boolean,
    default: false
  },
  globalMaintenanceMessage: {
    type: String,
    default: "Le système est actuellement en maintenance. Veuillez réessayer plus tard."
  },
  // Admin access is always allowed - this field is kept for backward compatibility
  // but will be ignored in the code
  allowAdminAccess: {
    type: Boolean,
    default: true
  },
  // Page-specific maintenance settings
  pageSettings: [{
    pagePath: String,
    isUnderMaintenance: Boolean,
    maintenanceMessage: String
  }]
});

// Static method to initialize default settings
maintenanceModeSchema.statics.initializeSettings = async function() {
  // Check if settings already exist
  const existingSettings = await this.findOne({});
  if (existingSettings) {
    return existingSettings;
  }

  // Create default settings
  const defaultSettings = new this({
    isGlobalMaintenance: false,
    globalMaintenanceMessage: "Le système est actuellement en maintenance. Veuillez réessayer plus tard.",
    allowAdminAccess: true,
    pageSettings: [
      {
        pagePath: "dashboard",
        isUnderMaintenance: false,
        maintenanceMessage: "Le tableau de bord est en cours de maintenance."
      },
      {
        pagePath: "employees",
        isUnderMaintenance: false,
        maintenanceMessage: "La gestion des employés est en cours de maintenance."
      },
      {
        pagePath: "projects",
        isUnderMaintenance: false,
        maintenanceMessage: "La gestion des projets est en cours de maintenance."
      },
      {
        pagePath: "evaluations",
        isUnderMaintenance: false,
        maintenanceMessage: "Le système d'évaluation est en cours de maintenance."
      },
      {
        pagePath: "presence",
        isUnderMaintenance: false,
        maintenanceMessage: "Le système de présence est en cours de maintenance."
      }
    ]
  });

  await defaultSettings.save();
  return defaultSettings;
};

// Method to check if a page is under maintenance
maintenanceModeSchema.statics.isPageUnderMaintenance = async function(pagePath) {
  const settings = await this.findOne({});

  // If no settings exist, initialize them
  if (!settings) {
    await this.initializeSettings();
    return false;
  }

  // Check global maintenance first
  if (settings.isGlobalMaintenance) {
    return true;
  }

  // Check page-specific maintenance
  const pageSettings = settings.pageSettings.find(page => page.pagePath === pagePath);
  return pageSettings ? pageSettings.isUnderMaintenance : false;
};

// Method to get maintenance message for a page
maintenanceModeSchema.statics.getMaintenanceMessage = async function(pagePath) {
  const settings = await this.findOne({});

  // If no settings exist, initialize them
  if (!settings) {
    await this.initializeSettings();
    return "Le système est en maintenance.";
  }

  // If global maintenance is active, return global message
  if (settings.isGlobalMaintenance) {
    return settings.globalMaintenanceMessage;
  }

  // Return page-specific message if available
  const pageSettings = settings.pageSettings.find(page => page.pagePath === pagePath);
  return pageSettings && pageSettings.isUnderMaintenance
    ? pageSettings.maintenanceMessage
    : "Cette page est en maintenance.";
};

const MaintenanceMode = mongoose.model("MaintenanceMode", maintenanceModeSchema);

module.exports = MaintenanceMode;
