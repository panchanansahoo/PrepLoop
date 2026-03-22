import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { forgotPasswordLimiter, verificationLimiter, isEmailCoolingDown, markEmailSent } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../utils/captcha.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      console.error('Signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Sign in to get a session token (admin client with persistSession:false works server-side)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Auto sign-in error:', signInError);
      return res.status(201).json({
        message: 'User created successfully. Please log in.',
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: fullName
        }
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      token: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: fullName,
        subscriptionTier: 'free',
        experienceLevel: 'beginner',
        role: 'user'
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

    // Update last_login in profiles
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    // Get profile data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

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
        role: profile?.role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetLink = data?.properties?.action_link;

    await transporter.sendMail({
      from: `"PrepLoop" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your PrepLoop password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #0a0a1a; border-radius: 16px; color: #f1f5f9;">
          <h2 style="color: #c084fc; margin-bottom: 16px;">Reset your password</h2>
          <p style="color: #94a3b8; line-height: 1.6;">We received a request to reset the password for your PrepLoop account.</p>
          <p style="color: #94a3b8; line-height: 1.6;">Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 14px 28px; background: linear-gradient(135deg, #a855f7, #c026d3); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px;">Reset Password</a>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
          <p style="color: #475569; font-size: 12px;">PrepLoop - AI Interview Prep Platform</p>
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
