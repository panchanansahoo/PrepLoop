import express from 'express';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { contactLimiter, isEmailCoolingDown, markEmailSent } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../utils/captcha.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('contact');

// Reuse a single transporter (connection pooling)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/contact - Store contact form submissions
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, captchaToken } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Optional CAPTCHA verification (enabled when RECAPTCHA_SECRET_KEY is set)
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error });
    }

    // Per-email cooldown: 60 seconds between submissions from the same email
    if (isEmailCoolingDown('contact', email)) {
      return res.status(429).json({ error: 'Please wait at least 60 seconds before sending another message.' });
    }

    // Save to database
    const { error: dbError } = await supabaseAdmin
      .from('contacts')
      .insert({ name, email, subject, message });

    if (dbError) {
      logger.error('DB insert error', { error: dbError.message, code: dbError.code });
      return res.status(500).json({ error: 'Failed to save message. Please try again later.' });
    }

    // Try to send email notification if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: `"PrepLoop Support" <support@preploop.me>`,
          to: 'support@preploop.me',
          subject: `PrepLoop Contact: ${subject}`,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
          replyTo: email
        });
        logger.info('Email sent to support', { from: email });
      } catch (emailError) {
        logger.error('Email sending failed (contact saved to DB)', { error: emailError.message });
      }
    }

    markEmailSent('contact', email);
    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    logger.error('Contact form error', { error: error.message });
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

export default router;
