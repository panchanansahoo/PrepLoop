import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { markEmailSent, signupLimiter } from '../../middleware/rateLimiter.js';
import { sendEmail, isEmailConfigured } from '../../services/emailService.js';
import {
  generateVerificationToken,
  getTokenExpirationTime,
  getVerificationEmailHTML,
} from '../../utils/emailVerification.js';
import {
  validatePasswordStrength,
  isMissingEmailVerificationSchema,
} from './helpers.js';

const router = express.Router();

router.post('/signup', signupLimiter, async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  if (typeof email !== 'string' || typeof fullName !== 'string') {
    return res.status(400).json({ error: 'Email and full name must be text' });
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
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('----------------------------------------------------');
        console.log(`🔗 [DEV] Email Verification Link for ${normalizedEmail}:`);
        console.log(verificationUrl);
        console.log('----------------------------------------------------');
      }

      if (isEmailConfigured()) {
        // Send verification email in the background so signup responds in <200ms
        sendEmail({
          to: normalizedEmail,
          subject: 'Confirm Your Email - PrepLoop',
          html: getVerificationEmailHTML(verificationUrl, normalizedEmail)
        }).then(() => {
          markEmailSent('signup', normalizedEmail);
        }).catch((emailError) => {
          console.error('Error sending verification email in background:', emailError?.message);
        });
      } else {
        console.warn('Verification email not sent: email delivery is not configured.');
      }
    }

    res.status(201).json({
      message: (!shouldRequireVerification || legacyMode)
        ? 'User created successfully.'
        : 'User created successfully. Please check your email to verify your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: trimmedFullName,
        emailVerified: !shouldRequireVerification || legacyMode
      },
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

export default router;

