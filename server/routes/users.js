const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Apply auth middleware to all routes
router.use(auth);

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../client/public/uploads/profiles');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter to validate image types
const fileFilter = (req, file, cb) => {
  // Accept only images
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non pris en charge. Veuillez télécharger une image.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// GET user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('chefId', 'firstName lastName photo');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH update user profile
router.patch('/:id', async (req, res) => {
  try {
    // Check if the user is updating their own profile or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier ce profil' });
    }
    
    // Fields that can be updated by regular users
    const allowedUpdates = ['phone'];
    
    // Additional fields that can be updated by admins
    const adminAllowedUpdates = ['firstName', 'lastName', 'email', 'department', 'position', 'role', 'hireDate', 'cin'];
    
    const updates = {};
    
    // Filter updates based on user role
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) || (req.user.role === 'Admin' && adminAllowedUpdates.includes(key))) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST upload profile photo
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    // Check if the user is updating their own photo or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier cette photo' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune photo téléchargée' });
    }
    
    // Get the relative path for storing in the database
    const photoPath = `/uploads/profiles/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { photo: photoPath },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST change password
router.post('/:id/password', async (req, res) => {
  try {
    // Check if the user is changing their own password or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier ce mot de passe' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }
    
    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Save user with new password
    await user.save();
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
