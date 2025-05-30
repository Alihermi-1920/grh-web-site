// routes/workAssignmentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WorkAssignment = require('../models/WorkAssignment');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Configuration de multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../client/public/uploads/travaux');

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'travail-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Créer une nouvelle assignation de travail
router.post('/', upload.array('fichiers', 5), async (req, res) => {
  try {
    const { titre, description, dateLimite, chef } = req.body;
    let employes = req.body.employes;

    // Vérifier que les champs obligatoires sont présents
    if (!titre || !description || !chef || !employes) {
      return res.status(400).json({ message: 'Tous les champs obligatoires sont requis' });
    }

    // Convertir employes en tableau s'il est fourni comme une chaîne
    if (typeof employes === 'string') {
      employes = [employes];
    } else if (!Array.isArray(employes)) {
      return res.status(400).json({ message: 'Le format des employés est invalide' });
    }

    // Vérifier que les IDs sont valides
    if (!mongoose.Types.ObjectId.isValid(chef)) {
      return res.status(400).json({ message: 'ID de chef invalide' });
    }

    for (const employeId of employes) {
      if (!mongoose.Types.ObjectId.isValid(employeId)) {
        return res.status(400).json({ message: `ID d'employé invalide: ${employeId}` });
      }
    }

    // Vérifier que les employés appartiennent bien au chef
    for (const employeId of employes) {
      const employeData = await Employee.findById(employeId);
      if (!employeData || employeData.chefId.toString() !== chef) {
        return res.status(400).json({ message: `L'employé ${employeId} n'appartient pas à ce chef` });
      }
    }

    // Préparer les données des fichiers si présents
    const fichiers = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fichiers.push({
          nomFichier: file.filename,
          cheminFichier: `/uploads/travaux/${file.filename}`,
          typeFichier: file.mimetype,
          tailleFichier: file.size
        });
      });
    }

    // Créer la nouvelle assignation
    const nouvelleAssignation = new WorkAssignment({
      titre,
      description,
      dateLimite: dateLimite || null, // Rendre dateLimite optionnel
      chef,
      employes,
      fichiers
    });

    await nouvelleAssignation.save();
    res.status(201).json(nouvelleAssignation);
  } catch (error) {
    console.error('Erreur lors de la création de l\'assignation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Récupérer toutes les assignations de travail d'un chef
router.get('/chef/:chefId', async (req, res) => {
  try {
    const { chefId } = req.params;

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(chefId)) {
      return res.status(400).json({ message: 'ID de chef invalide' });
    }

    // Récupérer les assignations
    const assignations = await WorkAssignment.find({ chef: chefId })
      .populate('employes', 'firstName lastName email photo cin')
      .sort({ dateCreation: -1 });

    res.status(200).json(assignations);
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Récupérer toutes les assignations de travail d'un employé
router.get('/employe/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(employeId)) {
      return res.status(400).json({ message: 'ID d\'employé invalide' });
    }

    // Récupérer les assignations où l'employé fait partie du tableau employes
    const assignations = await WorkAssignment.find({ employes: employeId })
      .populate('chef', 'firstName lastName')
      .sort({ dateCreation: -1 });

    res.status(200).json(assignations);
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une assignation de travail par son ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'assignation invalide' });
    }

    // Récupérer l'assignation
    const assignation = await WorkAssignment.findById(id)
      .populate('chef', 'firstName lastName')
      .populate('employes', 'firstName lastName email photo cin');

    if (!assignation) {
      return res.status(404).json({ message: 'Assignation non trouvée' });
    }

    res.status(200).json(assignation);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'assignation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le statut d'une assignation avec upload de fichier de réponse
router.patch('/:id/statut', upload.single('fichierReponse'), async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'assignation invalide' });
    }

    // Vérifier que le statut est valide
    if (!['En attente', 'En cours', 'Terminé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Préparer les données de mise à jour
    const updateData = { statut };

    // Si un fichier a été uploadé, l'ajouter à l'assignation
    if (req.file) {
      const fichierReponse = {
        nomFichier: req.file.filename,
        cheminFichier: `/uploads/travaux/${req.file.filename}`,
        typeFichier: req.file.mimetype,
        tailleFichier: req.file.size,
        dateUpload: new Date()
      };

      // Mettre à jour l'assignation avec le fichier de réponse
      const assignation = await WorkAssignment.findByIdAndUpdate(
        id,
        { 
          $set: updateData,
          $push: { fichiers: fichierReponse }
        },
        { new: true }
      );

      if (!assignation) {
        return res.status(404).json({ message: 'Assignation non trouvée' });
      }

      return res.status(200).json(assignation);
    }

    // Si pas de fichier, juste mettre à jour le statut
    const assignation = await WorkAssignment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!assignation) {
      return res.status(404).json({ message: 'Assignation non trouvée' });
    }

    res.status(200).json(assignation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une assignation de travail
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID d\'assignation invalide' });
    }

    // Récupérer l'assignation pour obtenir les fichiers à supprimer
    const assignation = await WorkAssignment.findById(id);
    if (!assignation) {
      return res.status(404).json({ message: 'Assignation non trouvée' });
    }

    // Supprimer les fichiers associés
    if (assignation.fichiers && assignation.fichiers.length > 0) {
      assignation.fichiers.forEach(fichier => {
        const cheminFichier = path.join(
          __dirname,
          '../../client/public',
          fichier.cheminFichier
        );
        if (fs.existsSync(cheminFichier)) {
          fs.unlinkSync(cheminFichier);
        }
      });
    }

    // Supprimer l'assignation
    await WorkAssignment.findByIdAndDelete(id);

    res.status(200).json({ message: 'Assignation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'assignation:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;