import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { contactLimiter, isEmailCoolingDown, markEmailSent } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../utils/captcha.js';
import { createLogger } from '../utils/structuredLogger.js';
import { isEmailConfigured, sendEmail } from '../services/emailService.js';

const router = express.Router();
const logger = createLogger('contact');

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// POST /api/contact - Store contact form submissions
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, captchaToken } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof subject !== 'string' ||
      typeof message !== 'string'
    ) {
      return res.status(400).json({ error: 'All fields must be valid text strings' });
    }

    // Strip carriage returns and newlines from single-line fields to prevent header injection
    const cleanName = name.replace(/[\r\n]+/g, ' ').trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.replace(/[\r\n]+/g, ' ').trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Length and format validation (J1 & J6)
    if (cleanName.length > 100) {
      return res.status(400).json({ error: 'Name must be 100 characters or fewer' });
    }

    if (
      cleanEmail.length > 254 ||
      !EMAIL_REGEX.test(cleanEmail) ||
      /[\r\n]/.test(cleanEmail)
    ) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (cleanSubject.length > 200) {
      return res.status(400).json({ error: 'Subject must be 200 characters or fewer' });
    }

    if (cleanMessage.length > 5000) {
      return res.status(400).json({ error: 'Message must be 5000 characters or fewer' });
    }

    // Optional CAPTCHA verification (enabled when RECAPTCHA_SECRET_KEY is set)
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error });
    }

    // Per-email cooldown: 60 seconds between submissions from the same email
    if (isEmailCoolingDown('contact', cleanEmail)) {
      return res.status(429).json({ error: 'Please wait at least 60 seconds before sending another message.' });
    }

    // Save to database
    const { error: dbError } = await supabaseAdmin
      .from('contacts')
      .insert({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      });

    if (dbError) {
      logger.error('DB insert error', { error: dbError.message, code: dbError.code });
      return res.status(500).json({ error: 'Failed to save message. Please try again later.' });
    }

    // Try to send email notification if email delivery is configured
    if (isEmailConfigured()) {
      try {
        await sendEmail({
          from: process.env.EMAIL_FROM || process.env.SMTP_FROM || undefined,
          to: process.env.CONTACT_EMAIL || 'support@preploop.me',
          subject: `PrepLoop Contact: ${cleanSubject}`,
          text: `Name: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\n\nMessage:\n${cleanMessage}`,
          replyTo: cleanEmail,
        });
        logger.info('Email sent to support', { from: cleanEmail });
      } catch (emailError) {
        logger.error('Email sending failed (contact saved to DB)', { error: emailError.message });
      }
    }

    markEmailSent('contact', cleanEmail);
    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    logger.error('Contact form error', { error: error.message });
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

export default router;
