// models/WorkAssignment.js
const mongoose = require("mongoose");

const workAssignmentSchema = new mongoose.Schema(
  {
    titre: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    dateCreation: { 
      type: Date, 
      default: Date.now 
    },
    dateLimite: { 
      type: Date,
      required: false // Rendre le champ optionnel
    },
    chef: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    },
    employes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee", 
      required: true 
    }],
    statut: { 
      type: String, 
      enum: ["En attente", "En cours", "Terminé"], 
      default: "En attente" 
    },
    fichiers: [{
      nomFichier: { type: String, required: true },
      cheminFichier: { type: String, required: true },
      typeFichier: { type: String },
      tailleFichier: { type: Number },
      dateUpload: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkAssignment", workAssignmentSchema);