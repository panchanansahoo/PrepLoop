import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { verificationLimiter, isEmailCoolingDown, markEmailSent } from '../../middleware/rateLimiter.js';
import { sendEmail, isEmailConfigured } from '../../services/emailService.js';
import {
  generateVerificationToken,
  getTokenExpirationTime,
  isTokenExpired,
  getVerificationEmailHTML,
} from '../../utils/emailVerification.js';

const router = express.Router();

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

    if (isEmailConfigured()) {
      sendEmail({
        to: email,
        subject: 'Confirm Your Email - PrepLoop',
        html: getVerificationEmailHTML(verificationUrl, email)
      }).then(() => {
        markEmailSent('resend-verification-email', email);
      }).catch((emailError) => {
        console.error('Error sending verification email in background:', emailError?.message);
      });
    } else {
      console.warn('Verification email not sent: email delivery is not configured.');
    }

    res.json({
      message: 'If an account with that email exists and is unverified, we have sent a verification email.',
      ...(process.env.NODE_ENV !== 'production' && { devVerificationUrl: verificationUrl })
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;

