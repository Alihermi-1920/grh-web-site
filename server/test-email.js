/**
 * Test script for MailerSend integration
 * Run this script with: node test-email.js
 */

const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// Your MailerSend API key
const API_KEY = 'mlsn.c9fbca8467c14b9de653af184a839a4e2b6c5b4a317f80c03326cf0616d07072';

// Initialize MailerSend client
const mailerSend = new MailerSend({
  apiKey: API_KEY,
});

// Using MailerSend's testing domain
const SENDER_EMAIL = 'hello@mailersend.com';
const SENDER_NAME = 'Delice HRMS Test';

// Your test recipient email
const TEST_RECIPIENT = 'huiihyii212@gmail.com';

async function sendTestEmail() {
  console.log('=== SENDING TEST EMAIL ===');
  console.log(`API Key (first 10 chars): ${API_KEY.substring(0, 10)}...`);
  console.log(`Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`Recipient: ${TEST_RECIPIENT}`);

  try {
    // Create sender
    const sender = new Sender(SENDER_EMAIL, SENDER_NAME);

    // Create recipient
    const recipients = [
      new Recipient(TEST_RECIPIENT, 'Test Recipient')
    ];

    // Create email params
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject('MailerSend Test Email')
      .setHtml('<h1>This is a test email</h1><p>If you receive this, the MailerSend integration is working correctly.</p>')
      .setText('This is a test email. If you receive this, the MailerSend integration is working correctly.');

    console.log('Sending email via MailerSend...');

    // Send the email
    const response = await mailerSend.email.send(emailParams);

    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    console.log('Response status:', response.status);
    console.log('Message ID:', response.headers['x-message-id']);
    console.log('Response headers:', JSON.stringify(response.headers));

    return {
      success: true,
      messageId: response.headers['x-message-id']
    };
  } catch (error) {
    console.error('=== ERROR SENDING EMAIL ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
sendTestEmail()
  .then(result => {
    console.log('Test completed with result:', result);
    if (result.success) {
      console.log('✅ SUCCESS: Email sent successfully! Check your inbox.');
    } else {
      console.log('❌ FAILED: Email could not be sent. See error details above.');
    }
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
  });
