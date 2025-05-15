/**
 * Email Service for Delice HRMS
 * Handles sending email notifications for leave requests using MailerSend
 */

const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// MailerSend API key - Your actual API key
const API_KEY = 'mlsn.c9fbca8467c14b9de653af184a839a4e2b6c5b4a317f80c03326cf0616d07072';

// Initialize MailerSend client
const mailerSend = new MailerSend({
  apiKey: API_KEY,
});

// Default sender information
// Using your test domain from MailerSend
const DEFAULT_SENDER = {
  email: 'no-reply@test-y7zpl985w3045vx6.mlsender.net',
  name: 'Delice Centre Laitier Nord HRMS'
};

/**
 * Sends an email notification when a leave request status is updated
 *
 * @param {Object} leaveRequest - The leave request object
 * @param {Object} employee - The employee object
 * @param {Object} chef - The chef object
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendLeaveStatusNotification(leaveRequest, employee, chef) {
  try {
    console.log('=== SENDING LEAVE STATUS NOTIFICATION EMAIL ===');
    console.log(`To: ${employee.email}`);
    console.log(`Status: ${leaveRequest.status}`);
    console.log(`API Key (first 10 chars): ${API_KEY.substring(0, 10)}...`);
    console.log(`Sender email: ${DEFAULT_SENDER.email}`);
    console.log(`Sender name: ${DEFAULT_SENDER.name}`);

    // Validate inputs
    if (!employee || !employee.email) {
      console.error('Invalid employee or missing email');
      return {
        success: false,
        error: 'Invalid employee or missing email'
      };
    }

    if (!leaveRequest) {
      console.error('Invalid leave request');
      return {
        success: false,
        error: 'Invalid leave request'
      };
    }

    // Format dates for display
    const startDate = new Date(leaveRequest.startDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const endDate = new Date(leaveRequest.endDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Determine status text and color
    const isApproved = leaveRequest.status === 'Approuvé';
    const statusText = isApproved ? 'approuvée' : 'rejetée';
    const statusColor = isApproved ? '#4CAF50' : '#F44336';
    const chefName = chef ? `${chef.firstName} ${chef.lastName}` : 'Votre responsable';

    // Create email subject
    const subject = `Notification: Votre demande de congé a été ${statusText}`;

    // Create a simpler email content for maximum compatibility
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Notification de Demande de Congé</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #0a4da3; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Notification de Demande de Congé</h1>
            <p style="margin: 10px 0 0;">Statut: <strong>${statusText.toUpperCase()}</strong></p>
          </div>

          <div style="padding: 20px;">
            <p>Bonjour ${employee.firstName} ${employee.lastName},</p>

            <p>Nous vous informons que votre demande de congé a été <strong style="color: ${statusColor};">${statusText}</strong> par ${chefName}.</p>

            <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0a4da3;">
              <h3 style="margin-top: 0; color: #0a4da3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Détails de la demande</h3>

              <p><strong>Type de congé:</strong> ${leaveRequest.leaveType}</p>
              <p><strong>Période:</strong> Du ${startDate} au ${endDate}</p>
              <p><strong>Nombre de jours:</strong> ${leaveRequest.numberOfDays} jour${leaveRequest.numberOfDays > 1 ? 's' : ''}</p>
              <p><strong>Raison:</strong> ${leaveRequest.reason}</p>
              ${leaveRequest.justification ? `<p><strong>Commentaire:</strong> ${leaveRequest.justification}</p>` : ''}
            </div>

            <p>Pour plus d'informations, veuillez vous connecter à votre compte HRMS ou contacter votre responsable.</p>

            <p>Cordialement,<br>
            L'équipe des Ressources Humaines<br>
            <strong style="color: #0a4da3;">Delice Centre Laitier Nord</strong></p>
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
            <p>&copy; 2025 Delice Centre Laitier Nord. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create plain text version for email clients that don't support HTML
    const textContent = `
      DELICE CENTRE LAITIER NORD
      ===========================

      NOTIFICATION DE DEMANDE DE CONGÉ
      Statut: ${statusText.toUpperCase()}

      Bonjour ${employee.firstName} ${employee.lastName},

      Nous vous informons que votre demande de congé a été ${statusText} par ${chefName}.

      DÉTAILS DE LA DEMANDE:
      ---------------------
      Type de congé: ${leaveRequest.leaveType}
      Période: Du ${startDate} au ${endDate}
      Nombre de jours: ${leaveRequest.numberOfDays} jour${leaveRequest.numberOfDays > 1 ? 's' : ''}
      Raison: ${leaveRequest.reason}
      ${leaveRequest.justification ? `Commentaire: ${leaveRequest.justification}` : ''}

      Pour plus d'informations, veuillez vous connecter à votre compte HRMS ou contacter votre responsable.

      Cordialement,
      L'équipe des Ressources Humaines
      Delice Centre Laitier Nord

      ---
      Ceci est un email automatique, merci de ne pas y répondre.
      © 2025 Delice Centre Laitier Nord. Tous droits réservés.
    `;

    // Create sender
    const sender = new Sender(DEFAULT_SENDER.email, DEFAULT_SENDER.name);

    // Create recipient - using employee's actual email
    const recipients = [
      new Recipient(employee.email, `${employee.firstName} ${employee.lastName}`)
    ];

    console.log(`Sending email to: ${employee.email}`);

    // Create email params
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(textContent);

    // Send the email
    console.log('Sending email via MailerSend...');
    console.log('Email parameters:', {
      from: sender.email,
      to: recipients[0].email,
      subject: subject
    });

    const response = await mailerSend.email.send(emailParams);

    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    console.log('Response status:', response.status);
    console.log('Message ID:', response.headers['x-message-id']);

    // Log all response headers for debugging
    console.log('Response headers:', JSON.stringify(response.headers));

    return {
      success: true,
      messageId: response.headers['x-message-id'],
      response: response
    };
  } catch (error) {
    console.error('=== ERROR SENDING EMAIL ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }

    // Try to log the full error object
    try {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (jsonError) {
      console.error('Could not stringify error object:', jsonError.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send a test email to verify the email service is working
 *
 * @param {string} recipientEmail - The email address to send the test to
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendTestEmail(recipientEmail) {
  try {
    console.log('=== SENDING TEST EMAIL ===');
    console.log(`To: ${recipientEmail}`);
    console.log(`API Key (first 10 chars): ${API_KEY.substring(0, 10)}...`);
    console.log(`Sender email: ${DEFAULT_SENDER.email}`);
    console.log(`Sender name: ${DEFAULT_SENDER.name}`);

    // Create sender
    const sender = new Sender(DEFAULT_SENDER.email, DEFAULT_SENDER.name);

    // Create recipient
    const recipients = [
      new Recipient(recipientEmail, 'Employee')
    ];

    // Format dates for display
    const startDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Create email subject and content
    const subject = 'Notification: Votre demande de congé a été approuvée';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Notification de Demande de Congé</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #0a4da3; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Notification de Demande de Congé</h1>
            <p style="margin: 10px 0 0;">Statut: <strong>APPROUVÉE</strong></p>
          </div>

          <div style="padding: 20px;">
            <p>Bonjour,</p>

            <p>Nous vous informons que votre demande de congé a été <strong style="color: #4CAF50;">approuvée</strong> par votre responsable.</p>

            <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0a4da3;">
              <h3 style="margin-top: 0; color: #0a4da3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Détails de la demande</h3>

              <p><strong>Type de congé:</strong> Congé payé</p>
              <p><strong>Période:</strong> Du ${startDate} au ${endDate}</p>
              <p><strong>Nombre de jours:</strong> 7 jours</p>
              <p><strong>Raison:</strong> Vacances d'été</p>
            </div>

            <p>Pour plus d'informations, veuillez vous connecter à votre compte HRMS ou contacter votre responsable.</p>

            <p>Cordialement,<br>
            L'équipe des Ressources Humaines<br>
            <strong style="color: #0a4da3;">Delice Centre Laitier Nord</strong></p>
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
            <p>&copy; 2025 Delice Centre Laitier Nord. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
      DELICE CENTRE LAITIER NORD
      ===========================

      NOTIFICATION DE DEMANDE DE CONGÉ
      Statut: APPROUVÉE

      Bonjour,

      Nous vous informons que votre demande de congé a été approuvée par votre responsable.

      DÉTAILS DE LA DEMANDE:
      ---------------------
      Type de congé: Congé payé
      Période: Du ${startDate} au ${endDate}
      Nombre de jours: 7 jours
      Raison: Vacances d'été

      Pour plus d'informations, veuillez vous connecter à votre compte HRMS ou contacter votre responsable.

      Cordialement,
      L'équipe des Ressources Humaines
      Delice Centre Laitier Nord

      ---
      Ceci est un email automatique, merci de ne pas y répondre.
      © 2025 Delice Centre Laitier Nord. Tous droits réservés.
    `;

    // Create email params
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(textContent);

    // Send the email
    console.log('Sending test email via MailerSend...');
    console.log('Email parameters:', {
      from: sender.email,
      to: recipients[0].email,
      subject: subject
    });

    const response = await mailerSend.email.send(emailParams);

    console.log('=== TEST EMAIL SENT SUCCESSFULLY ===');
    console.log('Response status:', response.status);
    console.log('Message ID:', response.headers['x-message-id']);
    console.log('Response headers:', JSON.stringify(response.headers));

    return {
      success: true,
      messageId: response.headers['x-message-id'],
      response: response
    };
  } catch (error) {
    console.error('=== ERROR SENDING TEST EMAIL ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }

    // Try to log the full error object
    try {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (jsonError) {
      console.error('Could not stringify error object:', jsonError.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sends a leave notification email to an employee
 *
 * @param {Object} leaveRequest - The leave request object
 * @param {Object} employee - The employee object
 * @returns {Promise<Object>} - Result of the email sending operation
 */
async function sendLeaveNotificationEmail(leaveRequest, employee) {
  try {
    console.log('=== SENDING LEAVE NOTIFICATION EMAIL ===');
    console.log(`To: ${employee.email}`);
    console.log(`Status: ${leaveRequest.status}`);
    console.log(`API Key (first 10 chars): ${API_KEY.substring(0, 10)}...`);
    console.log(`Sender email: ${DEFAULT_SENDER.email}`);
    console.log(`Sender name: ${DEFAULT_SENDER.name}`);

    // Validate inputs
    if (!employee || !employee.email) {
      console.error('Invalid employee or missing email');
      return {
        success: false,
        error: 'Invalid employee or missing email'
      };
    }

    if (!leaveRequest) {
      console.error('Invalid leave request');
      return {
        success: false,
        error: 'Invalid leave request'
      };
    }

    // Format dates for display
    const startDate = new Date(leaveRequest.startDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const endDate = new Date(leaveRequest.endDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Determine status text and color
    const isApproved = leaveRequest.status === 'Approuvé';
    const statusText = isApproved ? 'approuvée' : 'rejetée';
    const statusColor = isApproved ? '#4CAF50' : '#F44336';
    const employeeName = `${employee.firstName} ${employee.lastName}`.trim() || 'Employé';

    // Create email subject
    const subject = `Notification: Votre demande de congé a été ${statusText}`;

    // Create a simpler email content for maximum compatibility
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Notification de Demande de Congé</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #0a4da3; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Notification de Demande de Congé</h1>
            <p style="margin: 10px 0 0;">Statut: <strong>${statusText.toUpperCase()}</strong></p>
          </div>

          <div style="padding: 20px;">
            <p>Bonjour ${employeeName},</p>

            <p>Nous vous informons que votre demande de congé a été <strong style="color: ${statusColor};">${statusText}</strong> par votre responsable.</p>

            <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0a4da3;">
              <h3 style="margin-top: 0; color: #0a4da3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Détails de la demande</h3>

              <p><strong>Type de congé:</strong> ${leaveRequest.leaveType || 'Congé payé'}</p>
              <p><strong>Période:</strong> Du ${startDate} au ${endDate}</p>
              <p><strong>Nombre de jours:</strong> ${leaveRequest.numberOfDays || '?'} jour${leaveRequest.numberOfDays > 1 ? 's' : ''}</p>
              <p><strong>Raison:</strong> ${leaveRequest.reason || 'Non spécifiée'}</p>
              ${leaveRequest.justification ? `<p><strong>Commentaire:</strong> ${leaveRequest.justification}</p>` : ''}
            </div>

            <p>Pour plus d'informations, veuillez vous connecter à votre compte HRMS ou contacter votre responsable.</p>

            <p>Cordialement,<br>
            L'équipe des Ressources Humaines<br>
            <strong style="color: #0a4da3;">Delice Centre Laitier Nord</strong></p>
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
            <p>&copy; 2025 Delice Centre Laitier Nord. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create plain text version for email clients that don't support HTML
    const textContent = `
      DELICE CENTRE LAITIER NORD
      ===========================

      NOTIFICATION DE DEMANDE DE CONGÉ
      Statut: ${statusText.toUpperCase()}

      Bonjour ${employeeName},

      Nous vous informons que votre demande de congé a été ${statusText} par votre responsable.

      DÉTAILS DE LA DEMANDE:
      ---------------------
      Type de congé: ${leaveRequest.leaveType || 'Congé payé'}
      Période: Du ${startDate} au ${endDate}
      Nombre de jours: ${leaveRequest.numberOfDays || '?'} jour${leaveRequest.numberOfDays > 1 ? 's' : ''}
      Raison: ${leaveRequest.reason || 'Non spécifiée'}
      ${leaveRequest.justification ? `Commentaire: ${leaveRequest.justification}` : ''}

      Pour plus d'informations, veuillez vous connecter à votre compte HRMS ou contacter votre responsable.

      Cordialement,
      L'équipe des Ressources Humaines
      Delice Centre Laitier Nord

      ---
      Ceci est un email automatique, merci de ne pas y répondre.
      © 2025 Delice Centre Laitier Nord. Tous droits réservés.
    `;

    // Create sender
    const sender = new Sender(DEFAULT_SENDER.email, DEFAULT_SENDER.name);

    // Create recipient - using employee's actual email
    const recipients = [
      new Recipient(employee.email, employeeName)
    ];

    console.log(`Sending email to: ${employee.email}`);

    // Create email params
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(textContent);

    // Send the email
    console.log('Sending email via MailerSend...');
    console.log('Email parameters:', {
      from: sender.email,
      to: recipients[0].email,
      subject: subject
    });

    const response = await mailerSend.email.send(emailParams);

    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    console.log('Response status:', response.status);
    console.log('Message ID:', response.headers['x-message-id']);

    // Log all response headers for debugging
    console.log('Response headers:', JSON.stringify(response.headers));

    return {
      success: true,
      messageId: response.headers['x-message-id'],
      response: response
    };
  } catch (error) {
    console.error('=== ERROR SENDING EMAIL ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }

    // Try to log the full error object
    try {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (jsonError) {
      console.error('Could not stringify error object:', jsonError.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendLeaveStatusNotification,
  sendTestEmail,
  sendLeaveNotificationEmail
};
