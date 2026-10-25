import nodemailer from 'nodemailer';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('email-service');

const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS) || 10000;

// Detect secrets that are still placeholders (e.g. "re_your_resend_api_key_here").
// Treating them as "configured" made the app attempt email delivery with an
// invalid key, so reset emails failed with a confusing provider error.
const PLACEHOLDER_SECRET_PATTERN = /(your[_-]|changeme|replace[_-]?me|placeholder|^x+$)/i;

export const isPlaceholderSecret = (value) => {
  if (!value) return true;
  const trimmed = String(value).trim();
  if (!trimmed) return true;
  if (trimmed === 're_xxxxxxxxxxxx' || trimmed === 'your_resend_api_key_here') return true;
  return PLACEHOLDER_SECRET_PATTERN.test(trimmed);
};

export const getEmailApiKey = () => (
  process.env.RESEND_API_KEY || process.env.SMTP_PASS || ''
).trim();

export const getFromAddress = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER && process.env.SMTP_USER.includes('@') && !process.env.SMTP_USER.endsWith('@smtp-brevo.com')) {
    return `"PrepLoop" <${process.env.SMTP_USER}>`;
  }
  return '"PrepLoop" <support@preploop.me>';
};

/**
 * Resend API keys start with "re_". Use the HTTPS API for those instead of
 * SMTP: some hosts (including Render) block or throttle outbound SMTP, which
 * makes password reset requests hang until the client gives up.
 */
export const getEmailProvider = () => {
  const apiKey = getEmailApiKey();
  if (isPlaceholderSecret(apiKey)) return null;

  if (apiKey.startsWith('re_')) return 'resend';

  const host = (process.env.SMTP_HOST || 'smtp.resend.com').toLowerCase();
  if (process.env.SMTP_USER || host.includes('resend')) return 'smtp';

  return null;
};

export const isEmailConfigured = () => Boolean(getEmailProvider());

let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const port = Number(process.env.SMTP_PORT) || 587;
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: getEmailApiKey(),
    },
    connectionTimeout: EMAIL_TIMEOUT_MS,
    greetingTimeout: EMAIL_TIMEOUT_MS,
    socketTimeout: EMAIL_TIMEOUT_MS + 5000,
  });

  return smtpTransporter;
};

const sendViaResend = async ({ from, to, subject, html, text, replyTo }) => {
  const recipients = Array.isArray(to) ? to : [to];
  const payload = {
    from: from || getFromAddress(),
    to: recipients,
    subject,
  };

  if (html) payload.html = html;
  if (text) payload.text = text;
  if (replyTo) payload.reply_to = replyTo;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getEmailApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let responseBody = null;
    try {
      responseBody = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      const providerMessage = responseBody?.message || responseBody?.error || rawBody.slice(0, 200);
      throw new Error(`Resend API error (${response.status}): ${providerMessage || 'Unknown error'}`);
    }

    return { provider: 'resend', id: responseBody?.id || null };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Resend API request timed out after ${EMAIL_TIMEOUT_MS}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const sendViaSmtp = async ({ from, to, subject, html, text, replyTo }) => {
  const info = await getSmtpTransporter().sendMail({
    from: from || getFromAddress(),
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { replyTo } : {}),
  });

  return { provider: 'smtp', id: info?.messageId || null };
};

/**
 * Send an email through the best available transport.
 * Resend keys use the HTTPS API; other credentials fall back to SMTP.
 */
export const sendEmail = async ({ to, subject, html, text, from, replyTo } = {}) => {
  if (!to) throw new Error('Email recipient is required');
  if (!subject) throw new Error('Email subject is required');
  if (!html && !text) throw new Error('Email content is required');

  const provider = getEmailProvider();
  if (!provider) throw new Error('Email delivery is not configured');

  const startedAt = Date.now();
  const result = provider === 'resend'
    ? await sendViaResend({ from, to, subject, html, text, replyTo })
    : await sendViaSmtp({ from, to, subject, html, text, replyTo });

  logger.info('Email sent', {
    provider: result.provider,
    recipientCount: Array.isArray(to) ? to.length : 1,
    durationMs: Date.now() - startedAt,
  });

  return result;
};
