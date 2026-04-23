import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import { getVerificationEmailHTML } from './utils/emailVerification.js';

const sendTest = async (testEmail) => {
  console.log(`Sending premium test email to ${testEmail}...`);
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email?token=test_token_12345&email=${encodeURIComponent(testEmail)}`;
    const html = getVerificationEmailHTML(verificationUrl, testEmail);

    const info = await transporter.sendMail({
      from: `"PrepLoop" <support@preploop.me>`,
      to: testEmail,
      subject: 'Confirm Your Email - PrepLoop',
      html
    });

    console.log('\u2705 Premium test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('\u274C Error sending test email:', error);
  }
};

const email = process.argv[2];
if (!email) {
  console.error("Usage: node test-email.js panchanansahoo0143@gmail.com");
  process.exit(1);
}

sendTest(email);
