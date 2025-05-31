const nodemailer = require('nodemailer');

// Variable pour stocker le transporteur
let transporter = null;

// Fonction pour initialiser le transporteur avec les informations d'authentification
const initializeTransporter = (config) => {
  try {
    console.log('Initialisation du transporteur email avec la configuration:', config);
    
    // Mettre à jour les variables d'environnement (en mémoire seulement)
    process.env.EMAIL_HOST = config.host;
    process.env.EMAIL_PORT = config.port.toString();
    process.env.EMAIL_SECURE = config.secure.toString();
    process.env.EMAIL_USER = config.user;
    process.env.EMAIL_PASS = config.password;
    
    // Créer le transporteur avec la configuration fournie
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true pour le port 465, false pour les autres ports
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
    
    console.log('Transporteur email initialisé avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du transporteur email:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour obtenir le transporteur ou créer un compte de test si non configuré
const getTransporter = async () => {
  // Si le transporteur n'est pas configuré, utiliser les informations Gmail depuis les variables d'environnement
  if (!transporter) {
    console.log('Aucun transporteur configuré, utilisation des informations depuis les variables d\'environnement...');
    
    // Créer un transporteur avec les informations des variables d'environnement
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_SECURE === 'true', // true pour 465, false pour les autres ports
      auth: {
        user: process.env.EMAIL_USER || 'helloohello42@gmail.com',
        pass: process.env.EMAIL_PASS || 'eleg hzis hpto oagh', // Mot de passe d'application
      },
    });
    
    console.log('Transporteur email configuré avec succès');
  }
  
  return transporter;
};

// Fonction pour envoyer un email de notification de congé
const sendLeaveNotificationEmail = async (leaveRequest, employee) => {
  try {
    console.log(`Tentative d'envoi d'un email de notification de congé à ${employee.email}...`);
    
    // Obtenir le transporteur
    const mailTransporter = await getTransporter();
    
    // Préparer le contenu HTML en fonction du statut
    let statusColor = '#3498db'; // Bleu par défaut
    let statusMessage = '';
    
    if (leaveRequest.status === 'Approuvé') {
      statusColor = '#2ecc71'; // Vert
      statusMessage = 'Votre demande de congé a été <strong>approuvée</strong>.';
    } else if (leaveRequest.status === 'Rejeté') {
      statusColor = '#e74c3c'; // Rouge
      statusMessage = 'Votre demande de congé a été <strong>rejetée</strong>.';
    } else {
      statusMessage = 'Votre demande de congé est <strong>en attente</strong> de validation.';
    }
    
    // Formater les dates
    const startDate = new Date(leaveRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(leaveRequest.endDate).toLocaleDateString('fr-FR');
    
    // Créer le contenu HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Notification de Congé</h2>
        <p>Bonjour ${employee.firstName} ${employee.lastName},</p>
        <p>${statusMessage}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: ${statusColor};">Détails du congé</h3>
          <p><strong>Type de congé:</strong> ${leaveRequest.leaveType}</p>
          <p><strong>Période:</strong> Du ${startDate} au ${endDate}</p>
          <p><strong>Nombre de jours:</strong> ${leaveRequest.numberOfDays}</p>
          <p><strong>Motif:</strong> ${leaveRequest.reason}</p>
          ${leaveRequest.justification ? `<p><strong>Justification:</strong> ${leaveRequest.justification}</p>` : ''}
        </div>
        
        <p>Pour plus d'informations, veuillez vous connecter à votre espace personnel.</p>
        <p>Cordialement,<br>L'équipe RH</p>
      </div>
    `;
    
    // Configurer les options de l'email
    const mailOptions = {
      from: `"Service RH" <${process.env.EMAIL_USER || 'rh@entreprise.com'}>`,
      to: employee.email,
      subject: `Notification de congé - ${leaveRequest.status}`,
      html: htmlContent,
      text: `Bonjour ${employee.firstName} ${employee.lastName}, votre demande de congé (${leaveRequest.leaveType}) du ${startDate} au ${endDate} a été ${leaveRequest.status.toLowerCase()}.`,
    };
    
    // Envoyer l'email
    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('Email de notification envoyé avec succès');
    console.log('ID du message:', info.messageId);
    console.log('Envoyé depuis:', process.env.EMAIL_USER || 'compte de test');
    
    // Si c'est un compte de test Ethereal, afficher l'URL de prévisualisation
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        sender: 'compte de test Ethereal'
      };
    }
    
    return { 
      success: true, 
      messageId: info.messageId,
      sender: process.env.EMAIL_USER || 'compte configuré'
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
    return { success: false, error: error.message };
  }
};

// Fonction simplifiée pour envoyer une notification de statut de congé
const sendLeaveStatusNotification = async (email, status, startDate, endDate, leaveType) => {
  try {
    console.log(`Tentative d'envoi d'une notification de statut de congé à ${email}...`);
    
    // Obtenir le transporteur
    const mailTransporter = await getTransporter();
    
    // Formater les dates
    const formattedStartDate = new Date(startDate).toLocaleDateString('fr-FR');
    const formattedEndDate = new Date(endDate).toLocaleDateString('fr-FR');
    
    // Déterminer la couleur en fonction du statut
    let statusColor = '#3498db'; // Bleu par défaut
    if (status.toLowerCase() === 'approuvé') {
      statusColor = '#2ecc71'; // Vert
    } else if (status.toLowerCase() === 'rejeté') {
      statusColor = '#e74c3c'; // Rouge
    }
    
    // Configurer les options de l'email
    const mailOptions = {
      from: `"Service RH" <${process.env.EMAIL_USER || 'rh@entreprise.com'}>`,
      to: email,
      subject: `Notification de congé - ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Notification de Congé</h2>
          <p>Bonjour,</p>
          <p>Votre demande de congé a été <strong style="color: ${statusColor};">${status.toLowerCase()}</strong>.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Détails du congé</h3>
            <p><strong>Type de congé:</strong> ${leaveType}</p>
            <p><strong>Période:</strong> Du ${formattedStartDate} au ${formattedEndDate}</p>
          </div>
          
          <p>Pour plus d'informations, veuillez vous connecter à votre espace personnel.</p>
          <p>Cordialement,<br>L'équipe RH</p>
        </div>
      `,
      text: `Bonjour, votre demande de congé (${leaveType}) du ${formattedStartDate} au ${formattedEndDate} a été ${status.toLowerCase()}.`,
    };
    
    // Envoyer l'email
    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('Email de notification envoyé avec succès');
    console.log('ID du message:', info.messageId);
    console.log('Envoyé depuis:', process.env.EMAIL_USER || 'compte de test');
    
    // Si c'est un compte de test Ethereal, afficher l'URL de prévisualisation
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        sender: 'compte de test Ethereal'
      };
    }
    
    return { 
      success: true, 
      messageId: info.messageId,
      sender: process.env.EMAIL_USER || 'compte configuré'
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeTransporter,
  getTransporter,
  sendLeaveNotificationEmail,
  sendLeaveStatusNotification
};