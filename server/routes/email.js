const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Route pour configurer le transporteur d'email
router.post('/config', async (req, res) => {
  try {
    // Vérifier que tous les champs nécessaires sont présents
    const { host, port, secure, user, password } = req.body;
    
    if (!host || !port || secure === undefined || !user || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs sont obligatoires (host, port, secure, user, password)' 
      });
    }
    
    // Initialiser le transporteur avec les informations fournies
    const result = emailService.initializeTransporter({
      host,
      port,
      secure,
      user,
      password
    });
    
    if (result.success) {
      res.json({ success: true, message: 'Configuration email réussie' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erreur lors de la configuration email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour envoyer une notification de statut de congé
router.post('/leave-status', async (req, res) => {
  try {
    // Vérifier que tous les champs nécessaires sont présents
    const { email, status, startDate, endDate, leaveType } = req.body;
    
    if (!email || !status || !startDate || !endDate || !leaveType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tous les champs sont obligatoires (email, status, startDate, endDate, leaveType)' 
      });
    }
    
    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Format d\'email invalide' 
      });
    }
    
    // Envoyer la notification de statut de congé
    const result = await emailService.sendLeaveStatusNotification(
      email,
      status,
      startDate,
      endDate,
      leaveType
    );
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Notification de statut de congé envoyée avec succès à ${email}`,
        messageId: result.messageId,
        previewUrl: result.previewUrl
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de statut de congé:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;