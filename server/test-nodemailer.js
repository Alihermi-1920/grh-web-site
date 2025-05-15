/**
 * Test script for email sending using Nodemailer
 * First install nodemailer: npm install nodemailer
 * Then run: node test-nodemailer.js
 */

// First, let's check if we can send emails using Nodemailer
console.log('Starting email test with Nodemailer...');

try {
  // Try to require nodemailer
  const nodemailer = require('nodemailer');
  console.log('Nodemailer loaded successfully');

  // Create a test account on Ethereal (fake SMTP service for testing)
  async function main() {
    console.log('Creating test account...');
    
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      console.log('Test account created:', testAccount.user);

      // Create a transporter object using the test account
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('Sending test email...');
      
      // Send mail with defined transport object
      const info = await transporter.sendMail({
        from: '"Delice HRMS Test" <test@example.com>',
        to: 'helloohello42@gmail.com',
        subject: 'Test Email from Nodemailer',
        text: 'This is a test email from Nodemailer. If you see this, email sending works!',
        html: '<h1>Test Email</h1><p>This is a test email from Nodemailer. If you see this, email sending works!</p>'
      });

      console.log('Message sent: %s', info.messageId);
      
      // Preview URL only works with Ethereal accounts
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      
      console.log('✅ SUCCESS: Test email sent successfully!');
      console.log('Note: This is a test email that goes to Ethereal.email, not to your actual inbox.');
      console.log('You can view it at the Preview URL above.');
    } catch (error) {
      console.error('Error in test:', error);
    }
  }

  main().catch(console.error);
} catch (error) {
  console.error('Failed to load nodemailer:', error);
  console.log('Please install nodemailer first: npm install nodemailer');
}
