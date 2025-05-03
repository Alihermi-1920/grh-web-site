// server/routes/fileUploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Conge = require('../models/Conge');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use a path that will be accessible from the client
    const uploadDir = path.join(__dirname, '../../client/public/uploads/conges');

    console.log('Upload directory:', uploadDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created upload directory');
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'conge-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and Office documents
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    console.log('File accepted:', file.originalname, file.mimetype);
    cb(null, true);
  } else {
    console.log('File rejected:', file.originalname, file.mimetype);
    cb(new Error('Type de fichier non pris en charge'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Upload files route
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    console.log('=== FILE UPLOAD ===');
    console.log('Request files:', req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filePath: `/uploads/conges/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date()
    }));

    console.log('Processed files:', uploadedFiles);

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Error uploading files' });
  }
});

// Attach files to a leave request
router.post('/attach/:congeId', async (req, res) => {
  try {
    console.log('=== ATTACH FILES TO LEAVE REQUEST ===');
    const { congeId } = req.params;
    const { files } = req.body;

    console.log('Leave request ID:', congeId);
    console.log('Files to attach:', files);

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files to attach' });
    }

    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Initialize documents array if it doesn't exist
    if (!conge.documents) {
      conge.documents = [];
    }

    // Add files to documents array
    conge.documents.push(...files);

    // Save the leave request
    const savedConge = await conge.save();

    console.log('Files attached successfully');
    console.log('Updated documents count:', savedConge.documents.length);

    // Verify the documents were saved correctly
    const verifiedConge = await Conge.findById(congeId);
    console.log('Verified documents count:', verifiedConge.documents.length);

    if (verifiedConge.documents.length > 0) {
      verifiedConge.documents.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`, doc.originalName, doc.filePath);
      });
    }

    res.status(200).json({
      message: 'Files attached successfully',
      documents: verifiedConge.documents
    });
  } catch (error) {
    console.error('Error attaching files:', error);
    res.status(500).json({ error: 'Error attaching files' });
  }
});

// Get files for a leave request
router.get('/:congeId', async (req, res) => {
  try {
    console.log('=== GET FILES FOR LEAVE REQUEST ===');
    const { congeId } = req.params;

    console.log('Leave request ID:', congeId);

    // Find the leave request
    const conge = await Conge.findById(congeId);
    if (!conge) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    console.log('Found leave request:', conge._id);
    console.log('Documents:', conge.documents ? conge.documents.length : 0);

    if (!conge.documents || conge.documents.length === 0) {
      return res.status(200).json({ documents: [] });
    }

    res.status(200).json({ documents: conge.documents });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: 'Error getting files' });
  }
});

module.exports = router;
