import crypto from 'crypto';
import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { forgotPasswordLimiter, isEmailCoolingDown, markEmailSent } from '../../middleware/rateLimiter.js';
import { verifyCaptcha } from '../../utils/captcha.js';
import { sendEmail, isEmailConfigured } from '../../services/emailService.js';
import { validatePasswordStrength } from './helpers.js';

const router = express.Router();

if (!isEmailConfigured()) {
  console.warn(
    '[auth] Email delivery is not configured: set a real SMTP_PASS ' +
    '(Resend API key starting with "re_") or RESEND_API_KEY in the environment. ' +
    'Password reset emails will not be delivered; in development the reset link is returned in the API response and shown on the Forgot Password page.'
  );
}

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email, captchaToken } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Optional CAPTCHA verification (only run if token was provided)
  if (captchaToken) {
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return res.status(400).json({ error: captchaResult.error });
    }
  }

  if (isEmailCoolingDown('forgot-password', normalizedEmail)) {
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  try {
    const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let resolvedFrontendUrl = 'http://localhost:5173';
    try {
      const parsed = new URL(rawFrontendUrl);
      resolvedFrontendUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      console.warn(`[auth] Invalid FRONTEND_URL: "${rawFrontendUrl}". Falling back to http://localhost:5173`);
    }
    const redirectTo = `${resolvedFrontendUrl}/reset-password`;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      redirectTo
    });

    const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex').slice(0, 10);
    console.info(`[auth] Generated recovery link for email_hash=${emailHash} target=${resolvedFrontendUrl}`);

    if (error) {
      console.error('Generate link error:', error.message);
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetLink = data?.properties?.action_link;
    if (!resetLink) {
      console.error('Forgot password: action_link missing from Supabase response');
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Security: Do not log raw resetLink containing recovery tokens to console.
    // An audit log with email hash was already recorded above.

    let emailSent = false;
    let mailErrorMessage = null;

    const hasEmailConfig = isEmailConfigured();

    if (hasEmailConfig) {
      try {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Reset your PrepLoop password',
          html: `
        <div style="background-color: #020617; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <h1 style="margin: 0; color: #f8fafc; font-size: 26px; font-weight: 800;">PrepLoop</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #f8fafc; font-size: 18px; font-weight: 600;">Reset your password</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                We received a request to reset the password for your PrepLoop account. Click the button below to set a new password.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #9333ea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
                  </td>
                </tr>
              </table>
            </div>
            <div style="padding: 24px 32px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">This link will expire in 1 hour.</p>
              <p style="margin: 0; color: #475569; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      `
        });
        emailSent = true;
        markEmailSent('forgot-password', normalizedEmail);
      } catch (mailError) {
        mailErrorMessage = mailError.message;
        console.error('Email send error for password reset:', mailError.message);
      }
    } else {
      console.warn('Email credentials not configured. Skipping password reset email.');
    }

    if (!emailSent) {
      console.error('Password reset email was not sent:', mailErrorMessage || 'email delivery is not configured');
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: hasEmailConfig
            ? 'Password reset email is temporarily unavailable. Please try again later.'
            : 'Password reset email is not configured on this server. Please contact support.',
          code: hasEmailConfig ? 'EMAIL_SERVICE_UNAVAILABLE' : 'EMAIL_NOT_CONFIGURED',
        });
      }
    }

    const isLocalIp = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    const isLocalHost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const isLocalDev = process.env.NODE_ENV === 'development' && (isLocalHost || isLocalIp);

    return res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailSent: Boolean(emailSent),
      ...(isLocalDev && {
        resetLink,
        devResetLink: resetLink,
        mailError: mailErrorMessage,
      }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

router.post('/reset-password', forgotPasswordLimiter, async (req, res) => {
  const { accessToken, newPassword } = req.body;
  if (!accessToken || !newPassword) {
    return res.status(400).json({ error: 'Access token and new password are required' });
  }
  // SECURITY: Enforce strong password policy
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
  try {
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(accessToken);
    if (verifyError || !user) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });
    if (error) {
      return res.status(400).json({
        error: process.env.NODE_ENV === 'production' ? 'Failed to update password' : error.message
      });
    }
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

