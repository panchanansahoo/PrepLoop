import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { forgotPasswordLimiter, verificationLimiter, isEmailCoolingDown, markEmailSent } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../utils/captcha.js';
import nodemailer from 'nodemailer';
import { generateVerificationToken, getTokenExpirationTime, isTokenExpired, getVerificationEmailHTML } from '../utils/emailVerification.js';

const router = express.Router();

const isMissingEmailVerificationSchema = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  const missingVerificationField = [
    'email_verified',
    'verification_token',
    'token_expires_at',
    'verification_sent_at',
  ].some((field) => message.includes(field));

  return (code === 'PGRST204' || code === '42703') && missingVerificationField;
};

router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Create user with email NOT confirmed
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User must verify email before full access
      user_metadata: { full_name: fullName }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      console.error('Signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = getTokenExpirationTime();

    // Store verification token in profiles table
    let legacyMode = false;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        verification_sent_at: new Date().toISOString(),
        email_verified: false
      })
      .eq('id', data.user.id);

    if (profileError) {
      if (isMissingEmailVerificationSchema(profileError)) {
        legacyMode = true;
        console.warn('Email verification columns missing; continuing signup in legacy mode.');
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        }).catch((confirmError) => {
          console.error('Error auto-confirming email in legacy mode:', confirmError);
        });
      }
    }

    if (profileError && !legacyMode) {
      console.error('Error storing verification token:', profileError);
      // Delete the user if we can't store verification token
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      return res.status(500).json({ error: 'Failed to process signup' });
    }

    if (!legacyMode) {
      // Send verification email
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
          port: process.env.SMTP_PORT || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        await transporter.sendMail({
          from: `"PrepLoop" <support@preploop.me>`,
          to: email,
          subject: 'Confirm Your Email - PrepLoop',
          html: getVerificationEmailHTML(verificationUrl, email)
        });

        markEmailSent('signup', email);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Don't fail signup if email fails, but log it
      }
    }

    res.status(201).json({
      message: legacyMode
        ? 'User created successfully.'
        : 'User created successfully. Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: fullName,
        emailVerified: legacyMode
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch profile once for verification + response payload
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, subscription_tier, experience_level, role, email_verified')
      .eq('id', data.user.id)
      .single();

    if (profileError && !isMissingEmailVerificationSchema(profileError)) {
      console.error('Login profile query error:', profileError);
      return res.status(500).json({ error: 'Login failed' });
    }

    const shouldBypassVerification = isMissingEmailVerificationSchema(profileError);

    if (!shouldBypassVerification && !profile?.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        userId: data.user.id,
        email: data.user.email
      });
    }

    // Update last_login asynchronously so login response is not blocked.
    supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error('Failed to update last_login:', updateError.message || updateError);
        }
      })
      .catch((updateErr) => {
        console.error('Failed to update last_login:', updateErr.message || updateErr);
      });

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || data.user.user_metadata?.full_name || '',
        subscriptionTier: profile?.subscription_tier || 'free',
        experienceLevel: profile?.experience_level || 'beginner',
        role: profile?.role || 'user',
        emailVerified: shouldBypassVerification ? true : (profile?.email_verified || false)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify email endpoint - validates verification token and marks email as verified
router.post('/verify-email', verificationLimiter, async (req, res) => {
  const { token, email } = req.body;

  if (!token || !email) {
    return res.status(400).json({ error: 'Token and email are required' });
  }

  try {
    // Find profile by verification token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (profileError || !profile) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Some deployments do not have profiles.email. Enforce match only when available.
    if (typeof profile.email === 'string' && profile.email.length > 0 && profile.email !== email) {
      return res.status(400).json({ error: 'Email does not match token' });
    }

    // Check if token has expired
    if (isTokenExpired(profile.token_expires_at)) {
      return res.status(400).json({ 
        error: 'Verification token has expired. Please request a new one.',
        email: profile.email
      });
    }

    // Check if already verified
    if (profile.email_verified) {
      return res.status(400).json({ error: 'Email already verified. You can log in now.' });
    }

    // Mark email as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email_verified: true,
        verification_token: null,
        token_expires_at: null
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Also confirm the email in Supabase Auth if not already confirmed
    // This is optional but recommended for additional security
    await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      email_confirm: true
    }).catch(err => {
      console.error('Error confirming email in auth:', err);
      // Don't fail if this step fails
    });

    res.json({
      message: 'Email verified successfully. You can now log in.',
      email,
      verified: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email endpoint
router.post('/resend-verification-email', verificationLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Per-email cooldown: 60 seconds between resends
  if (isEmailCoolingDown('resend-verification-email', email)) {
    return res.status(429).json({ error: 'Please wait at least 60 seconds before requesting another verification email.' });
  }

  try {
    // Find unverified profile with this email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('email_verified', false)
      .single();

    if (profileError || !profile) {
      // For security, don't reveal whether email exists or is already verified
      return res.json({ message: 'If an account with that email exists and is unverified, we has sent a verification email.' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = getTokenExpirationTime();

    // Update verification token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        verification_sent_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating verification token:', updateError);
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }

    // Send verification email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      await transporter.sendMail({
        from: `"PrepLoop" <support@preploop.me>`,
        to: email,
        subject: 'Confirm Your Email - PrepLoop',
        html: getVerificationEmailHTML(verificationUrl, email)
      });

      markEmailSent('resend-verification-email', email);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the endpoint if email fails to send
    }

    res.json({ message: 'If an account with that email exists and is unverified, we has sent a verification email.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

router.post('/resend-verification', verificationLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Per-email cooldown: 60 seconds between resends for the same email
  if (isEmailCoolingDown('resend-verification', email)) {
    return res.status(429).json({ error: 'Please wait at least 60 seconds before requesting another verification email.' });
  }

  try {
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    markEmailSent('resend-verification', email);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email, captchaToken } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Optional CAPTCHA verification (enabled when RECAPTCHA_SECRET_KEY is set)
  const captchaResult = await verifyCaptcha(captchaToken);
  if (!captchaResult.success) {
    return res.status(400).json({ error: captchaResult.error });
  }

  // Per-email cooldown: 60 seconds between resets for the same email
  if (isEmailCoolingDown('forgot-password', email)) {
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  try {
    // Use admin.generateLink - this generates a link WITHOUT sending email (no rate limit!)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      }
    });

    if (error) {
      console.error('Generate link error:', error.message);
      // Always return success to prevent email enumeration
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Send the email ourselves using Nodemailer
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetLink = data?.properties?.action_link;

    await transporter.sendMail({
      from: `"PrepLoop" <support@preploop.me>`,
      to: email,
      subject: 'Reset your PrepLoop password',
      html: `
        <div style="background-color: #020617; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
          <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <!-- Logo / Brand Header -->
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <h1 style="margin: 0; color: #f8fafc; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PrepLoop</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #f8fafc; font-size: 18px; font-weight: 600;">Reset your password</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                We received a request to reset the password for your PrepLoop account. Click the button below to set a new password.
              </p>
              
              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #9333ea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; line-height: 100%;">Reset Password</a>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Footer -->
            <div style="padding: 24px 32px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">This link will expire in 1 hour.</p>
              <p style="margin: 0; color: #475569; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      `
    });

    markEmailSent('forgot-password', email);
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { accessToken, newPassword } = req.body;
  if (!accessToken || !newPassword) {
    return res.status(400).json({ error: 'Access token and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
