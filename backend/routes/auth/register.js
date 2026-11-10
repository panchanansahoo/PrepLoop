import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { markEmailSent, signupLimiter, verificationLimiter } from '../../middleware/rateLimiter.js';
import { sendEmail, isEmailConfigured } from '../../services/emailService.js';
import {
  generateVerificationToken,
  getTokenExpirationTime,
  getVerificationEmailHTML,
  isTokenExpired,
} from '../../utils/emailVerification.js';
import {
  validatePasswordStrength,
  isMissingEmailVerificationSchema,
} from './helpers.js';
import { verifyCaptcha } from '../../utils/captcha.js';

/**
 * Retry verification email delivery with exponential backoff
 */
async function sendVerificationEmailWithRetry(emailOptions, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      await sendEmail(emailOptions);
      markEmailSent('signup', emailOptions.to);
      console.log(`[Signup Email] Verification email successfully delivered to ${emailOptions.to} on attempt ${attempt}`);
      return { success: true, attempts: attempt };
    } catch (err) {
      console.warn(`[Signup Email] Attempt ${attempt}/${maxRetries} failed for ${emailOptions.to}: ${err?.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1500));
      } else {
        console.error(`[Signup Email] All ${maxRetries} attempts failed for ${emailOptions.to}: ${err?.message}`);
        return { success: false, attempts: attempt, error: err?.message };
      }
    }
  }
}

const router = express.Router();

router.post('/signup', signupLimiter, async (req, res) => {
  const { email, password, fullName, captchaToken } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  if (typeof email !== 'string' || typeof fullName !== 'string') {
    return res.status(400).json({ error: 'Email and full name must be text' });
  }

  // M7: Verify CAPTCHA (required when RECAPTCHA_SECRET_KEY is configured)
  const captchaResult = await verifyCaptcha(captchaToken);
  if (!captchaResult.success) {
    return res.status(400).json({ error: captchaResult.error });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedFullName = fullName.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (!trimmedFullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  if (trimmedFullName.length > 100) {
    return res.status(400).json({ error: 'Full name must be 100 characters or fewer' });
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
      email: normalizedEmail,
      password,
      email_confirm: !shouldRequireVerification,
      user_metadata: { full_name: trimmedFullName }
    });

    if (error) {
      console.error('Signup error:', error);
      const errMsg = String(error.message || '').toLowerCase();
      if (errMsg.includes('already registered') || errMsg.includes('already exists') || errMsg.includes('duplicate')) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (errMsg.includes('password') && (errMsg.includes('short') || errMsg.includes('weak') || errMsg.includes('character'))) {
        return res.status(400).json({ error: 'Password does not meet security requirements' });
      }
      // M1: Generic safe error message to prevent leaking internal database / schema details
      return res.status(400).json({ error: 'Unable to create account. Please check your details and try again.' });
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

    let emailDelivery = { sent: false, status: 'skipped', warning: null };

    if (shouldRequireVerification && !legacyMode) {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('----------------------------------------------------');
        console.log(`🔗 [DEV] Email Verification Link for ${normalizedEmail}:`);
        console.log(verificationUrl);
        console.log('----------------------------------------------------');
      }

      emailDelivery = { sent: false, status: 'unconfigured', warning: null };

      if (isEmailConfigured()) {
        const emailOptions = {
          to: normalizedEmail,
          subject: 'Confirm Your Email - PrepLoop',
          html: getVerificationEmailHTML(verificationUrl, normalizedEmail)
        };

        const initialSendPromise = sendEmail(emailOptions)
          .then(() => {
            markEmailSent('signup', normalizedEmail);
            return { sent: true };
          })
          .catch((initialErr) => {
            console.warn(`[Signup Email] Initial delivery failed for ${normalizedEmail} (${initialErr?.message}). Enqueueing background retries...`);
            void sendVerificationEmailWithRetry(emailOptions, 3);
            return { sent: false, error: initialErr?.message };
          });

        // Fast race against 1200ms timeout to keep signup response snappy while catching immediate failures
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 1200));
        const raceResult = await Promise.race([initialSendPromise, timeoutPromise]);

        if (raceResult.sent) {
          emailDelivery = { sent: true, status: 'delivered', warning: null };
        } else if (raceResult.error) {
          emailDelivery = {
            sent: false,
            status: 'retry_queued',
            warning: 'Initial verification email delivery failed. Retrying in background. If you do not receive it shortly, please click resend.'
          };
        } else {
          // Timeout reached, initial send is still working in background
          emailDelivery = { sent: false, status: 'pending', warning: null };
        }
      } else {
        console.warn('Verification email not sent: email delivery is not configured.');
        emailDelivery = {
          sent: false,
          status: 'unconfigured',
          warning: 'Email verification is required, but email delivery is not configured on the server. Please contact support.'
        };
      }
    }

    res.status(201).json({
      message: (!shouldRequireVerification || legacyMode)
        ? 'User created successfully.'
        : emailDelivery?.warning
          ? `User created successfully. ${emailDelivery.warning}`
          : 'User created successfully. Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: trimmedFullName,
        emailVerified: !shouldRequireVerification || legacyMode
      },
      emailDelivery,
      ...(emailDelivery?.warning && { emailWarning: emailDelivery.warning }),
      ...(process.env.NODE_ENV !== 'production' && {
        devVerificationUrl: shouldRequireVerification && verificationToken
          ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`
          : null
      })
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/activate-account', verificationLimiter, async (req, res) => {
  const { email, token } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  // Check for admin authorization
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7);
    try {
      const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(bearerToken);
      if (authUser && (authUser.role === 'admin' || authUser.user_metadata?.role === 'admin')) {
        isAdmin = true;
      }
    } catch { }
  }

  // Non-admin activation strictly requires signed verification token
  if (!isAdmin && (!token || typeof token !== 'string')) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  try {
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, verification_token, email_verified, token_expires_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileErr) {
      console.error('Activate account query error:', profileErr);
      return res.status(500).json({ error: 'Failed to activate account' });
    }

    if (!profile) {
      if (isAdmin) {
        return res.status(404).json({ error: 'Account not found with this email' });
      }
      return res.status(400).json({ error: 'Invalid activation token or email' });
    }

    if (!isAdmin) {
      if (!profile.verification_token || profile.verification_token !== token) {
        return res.status(400).json({ error: 'Invalid activation token or email' });
      }

      if (profile.token_expires_at && isTokenExpired(profile.token_expires_at)) {
        return res.status(400).json({ error: 'Activation token has expired. Please request a new one.' });
      }
    }

    if (profile.email_verified) {
      return res.status(400).json({ error: 'Account already activated. You can log in now.' });
    }

    await supabaseAdmin.auth.admin.updateUserById(profile.id, { email_confirm: true });
    await supabaseAdmin.from('profiles').update({
      email_verified: true,
      verification_token: null,
      token_expires_at: null,
    }).eq('id', profile.id);

    return res.json({ message: 'Account activated successfully! You can now log in.' });
  } catch (err) {
    console.error('Activate account error:', err);
    return res.status(500).json({ error: 'Failed to activate account' });
  }
});

export default router;

