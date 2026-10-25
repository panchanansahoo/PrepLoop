import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authLoginLimiter, forgotPasswordLimiter, verificationLimiter, isEmailCoolingDown, markEmailSent } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../utils/captcha.js';
import nodemailer from 'nodemailer';
import { generateVerificationToken, getTokenExpirationTime, isTokenExpired, getVerificationEmailHTML } from '../utils/emailVerification.js';

const router = express.Router();

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const setSessionCookies = (res, session) => {
  if (!session?.access_token || !session?.refresh_token) return;
  res.cookie('preploop_access', session.access_token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('preploop_refresh', session.refresh_token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearSessionCookies = (res) => {
  res.clearCookie('preploop_access', SESSION_COOKIE_OPTIONS);
  res.clearCookie('preploop_refresh', SESSION_COOKIE_OPTIONS);
};

// SECURITY: Common weak passwords blocklist (top entries from breach databases)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  '1234567890', 'qwerty', 'abc123', 'monkey', 'master', 'dragon',
  'login', 'princess', 'qwerty123', 'solo', 'passw0rd', 'starwars',
  'admin', 'welcome', 'hello', 'charlie', 'donald', 'football',
  'shadow', 'sunshine', 'trustno1', 'iloveyou', 'batman', 'access',
  'letmein', '696969', 'mustang', 'michael', 'ashley', 'baseball',
  'test123', 'pass123', 'qwerty1', 'welcome1', 'Password1', 'password1!',
]);

/**
 * Validate password meets security requirements:
 * - At least 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 * - Not in common passwords list
 * Returns null if valid, or an error message string.
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'This password is too common. Please choose a stronger password';
  }
  return null;
}

// Reuse a single transporter instance (connection pooling — fix #17)
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || process.env.RESEND_API_KEY,
  },
});

const getFromAddress = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER && process.env.SMTP_USER.includes('@') && !process.env.SMTP_USER.endsWith('@smtp-brevo.com')) {
    return `"PrepLoop" <${process.env.SMTP_USER}>`;
  }
  return '"PrepLoop" <support@preploop.me>';
};

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

  // SECURITY: Enforce strong password policy
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // Determine whether email verification is strictly required (defaults to false in dev or unless explicit)
  const shouldRequireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: !shouldRequireVerification,
      user_metadata: { full_name: fullName }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      console.error('Signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    const verificationToken = shouldRequireVerification ? generateVerificationToken() : null;
    const tokenExpiresAt = shouldRequireVerification ? getTokenExpirationTime() : null;

    let legacyMode = !shouldRequireVerification;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt ? tokenExpiresAt.toISOString() : null,
        verification_sent_at: shouldRequireVerification ? new Date().toISOString() : null,
        email_verified: !shouldRequireVerification
      })
      .eq('id', data.user.id);

    if (profileError && shouldRequireVerification) {
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

    if (profileError && !legacyMode && shouldRequireVerification) {
      console.error('Error storing verification token:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      return res.status(500).json({ error: 'Failed to process signup' });
    }

    if (shouldRequireVerification && !legacyMode) {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('----------------------------------------------------');
        console.log(`🔗 [DEV] Email Verification Link for ${email}:`);
        console.log(verificationUrl);
        console.log('----------------------------------------------------');
      }

      // Send verification email in the background so signup responds in <200ms
      transporter.sendMail({
        from: getFromAddress(),
        to: email,
        subject: 'Confirm Your Email - PrepLoop',
        html: getVerificationEmailHTML(verificationUrl, email)
      }).then(() => {
        markEmailSent('signup', email);
      }).catch((emailError) => {
        console.error('Error sending verification email in background:', emailError?.message);
      });
    }

    res.status(201).json({
      message: (!shouldRequireVerification || legacyMode)
        ? 'User created successfully.'
        : 'User created successfully. Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: fullName,
        emailVerified: !shouldRequireVerification || legacyMode
      },
      ...(process.env.NODE_ENV !== 'production' && {
        devVerificationUrl: shouldRequireVerification && verificationToken
          ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
          : null
      })
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// SECURITY: Account lockout — track failed login attempts per email+IP
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map(); // key: "email:ip" => { count, firstAttempt, lockedUntil }

function checkLoginLockout(email, ip) {
  const key = `${email.toLowerCase()}:${ip}`;
  const record = loginAttempts.get(key);
  if (!record) return { locked: false };

  // Auto-expire old lockouts
  if (record.lockedUntil && Date.now() > record.lockedUntil) {
    loginAttempts.delete(key);
    return { locked: false };
  }

  // Check if currently locked
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingMs = record.lockedUntil - Date.now();
    return { locked: true, remainingMinutes: Math.ceil(remainingMs / 60000) };
  }

  // Reset if outside the tracking window
  if (Date.now() - record.firstAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key);
    return { locked: false };
  }

  return { locked: false };
}

function recordFailedLogin(email, ip) {
  const key = `${email.toLowerCase()}:${ip}`;
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };

  // Reset if outside the tracking window
  if (Date.now() - record.firstAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
    record.count = 0;
    record.firstAttempt = Date.now();
  }

  record.count += 1;

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_ATTEMPT_WINDOW_MS;
  }

  loginAttempts.set(key, record);

  // Prune old entries every so often
  if (loginAttempts.size > 5000) {
    const now = Date.now();
    for (const [k, v] of loginAttempts) {
      if (now - v.firstAttempt > LOGIN_ATTEMPT_WINDOW_MS * 2) {
        loginAttempts.delete(k);
      }
    }
  }
}

function clearLoginAttempts(email, ip) {
  loginAttempts.delete(`${email.toLowerCase()}:${ip}`);
}

router.post('/login', authLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // SECURITY: Check account lockout before attempting authentication
  const lockout = checkLoginLockout(email, req.ip);
  if (lockout.locked) {
    return res.status(429).json({
      error: `Account temporarily locked due to too many failed attempts. Try again in ${lockout.remainingMinutes} minute(s).`,
      code: 'ACCOUNT_LOCKED'
    });
  }

  try {
    const authResult = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    let data = authResult.data;
    let error = authResult.error;

    if (error) {
      if (error.message === 'Email not confirmed') {
        const shouldRequireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
        if (!shouldRequireVerification) {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const user = usersData?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (user) {
            try {
              await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
              await supabaseAdmin.from('profiles').update({ email_verified: true, verification_token: null }).eq('id', user.id);
            } catch (confirmErr) {
              console.warn('Auto-confirm retry warning:', confirmErr?.message);
            }
            const retry = await supabaseAdmin.auth.signInWithPassword({ email, password });
            if (!retry.error) {
              data = retry.data;
              error = null;
            }
          }
        }
      }

      if (error) {
        // Record the failed attempt
        recordFailedLogin(email, req.ip);

        if (error.message === 'Email not confirmed') {
          return res.status(403).json({
            error: 'Please verify your email before logging in',
            code: 'EMAIL_NOT_VERIFIED',
            email: email
          });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Clear failed attempts on successful login
    clearLoginAttempts(email, req.ip);

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
    const shouldRequireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    if (shouldRequireVerification && !shouldBypassVerification && !profile?.email_verified) {
      // Fix #3: return a distinct 403 code so the frontend interceptor can skip retry
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        userId: data.user.id,
        email: data.user.email
      });
    }

    if (!shouldRequireVerification && !profile?.email_verified) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, { email_confirm: true });
        await supabaseAdmin.from('profiles').update({ email_verified: true, verification_token: null }).eq('id', data.user.id);
      } catch (confirmErr) {
        console.warn('Auto-confirm login profile warning:', confirmErr?.message);
      }
    }

    supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(({ error: updateError }) => {
        if (updateError) console.error('Failed to update last_login:', updateError.message || updateError);
      })
      .catch((updateErr) => {
        console.error('Failed to update last_login:', updateErr.message || updateErr);
      });

    setSessionCookies(res, data.session);
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
        emailVerified: shouldBypassVerification ? true : (profile?.email_verified || true)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/activate-account', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email' });
    }
    await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    await supabaseAdmin.from('profiles').update({ email_verified: true, verification_token: null }).eq('id', user.id);
    return res.json({ message: 'Account activated successfully! You can now log in.' });
  } catch (err) {
    console.error('Activate account error:', err);
    return res.status(500).json({ error: 'Failed to activate account' });
  }
});

router.post('/verify-email', verificationLimiter, async (req, res) => {
  const { token, email } = req.body;

  if (!token || !email) {
    return res.status(400).json({ error: 'Token and email are required' });
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (profileError || !profile) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (typeof profile.email === 'string' && profile.email.length > 0 && profile.email !== email) {
      return res.status(400).json({ error: 'Email does not match token' });
    }

    if (isTokenExpired(profile.token_expires_at)) {
      return res.status(400).json({
        error: 'Verification token has expired. Please request a new one.',
        email: profile.email
      });
    }

    if (profile.email_verified) {
      return res.status(400).json({ error: 'Email already verified. You can log in now.' });
    }

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

    await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      email_confirm: true
    }).catch(err => {
      console.error('Error confirming email in auth:', err);
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

router.post(['/resend-verification-email', '/resend-verification'], verificationLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (isEmailCoolingDown('resend-verification-email', email)) {
    return res.status(429).json({ error: 'Please wait at least 60 seconds before requesting another verification email.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.json({ message: 'If an account with that email exists and is unverified, we have sent a verification email.' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email_verified')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.email_verified) {
      return res.json({ message: 'If an account with that email exists and is unverified, we have sent a verification email.' });
    }

    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = getTokenExpirationTime();

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

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    if (process.env.NODE_ENV !== 'production') {
      console.log('----------------------------------------------------');
      console.log(`🔗 [DEV] Resent Email Verification Link for ${email}:`);
      console.log(verificationUrl);
      console.log('----------------------------------------------------');
    }

    transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: 'Confirm Your Email - PrepLoop',
      html: getVerificationEmailHTML(verificationUrl, email)
    }).then(() => {
      markEmailSent('resend-verification-email', email);
    }).catch((emailError) => {
      console.error('Error sending verification email in background:', emailError?.message);
    });

    res.json({
      message: 'If an account with that email exists and is unverified, we have sent a verification email.',
      ...(process.env.NODE_ENV !== 'production' && { devVerificationUrl: verificationUrl })
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/refresh', async (req, res) => {
  const cookieHeader = req.headers.cookie || '';
  const cookieRefreshToken = cookieHeader.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('preploop_refresh='))
    ?.slice('preploop_refresh='.length);
  const { refreshToken = cookieRefreshToken } = req.body || {};

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

    setSessionCookies(res, data.session);
    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

router.post('/logout', (_req, res) => {
  clearSessionCookies(res);
  res.json({ success: true });
});

router.post('/resend-verification', verificationLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

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
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

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
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      }
    });

    if (error) {
      console.error('Generate link error:', error.message);
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetLink = data?.properties?.action_link;
    if (!resetLink) {
      console.error('Forgot password: action_link missing from Supabase response');
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    console.log('----------------------------------------------------');
    console.log(`🔗 Password Reset Link for ${normalizedEmail}:`);
    console.log(resetLink);
    console.log('----------------------------------------------------');

    let emailSent = false;
    let mailErrorMessage = null;

    const hasSmtpConfig = Boolean(
      (process.env.SMTP_PASS || process.env.RESEND_API_KEY) &&
      (process.env.SMTP_USER || !process.env.SMTP_HOST || process.env.SMTP_HOST.includes('resend'))
    );

    if (hasSmtpConfig) {
      try {
        await transporter.sendMail({
          from: getFromAddress(),
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
        console.error('SMTP sendMail error for password reset:', mailError.message);
      }
    } else {
      console.warn('SMTP credentials not configured. Skipping email send.');
    }

    if (!emailSent) {
      console.error('Password reset email was not sent:', mailErrorMessage || 'SMTP credentials are not configured');
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: 'Password reset email is temporarily unavailable. Please try again later.',
          code: 'EMAIL_SERVICE_UNAVAILABLE',
        });
      }
    }

    return res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && {
        resetLink,
        devResetLink: resetLink,
        emailSent,
        mailError: mailErrorMessage,
      }),
    });
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
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
