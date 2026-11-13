import express from 'express';
import { LoginRequestSchema } from '@preploop/contracts/auth';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authLoginLimiter } from '../../middleware/rateLimiter.js';
import {
  checkLoginLockout,
  recordFailedLogin,
  clearLoginAttempts,
  setSessionCookies,
  isMissingEmailVerificationSchema,
} from './helpers.js';

const router = express.Router();

router.post('/login', authLoginLimiter, async (req, res) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    return res.status(400).json({
      error: firstIssue?.message || 'Email and password are required',
    });
  }
  const { email: normalizedEmail, password } = parsed.data;

  // SECURITY: Check account lockout before attempting authentication (multi-tier Redis + local)
  const lockout = await checkLoginLockout(normalizedEmail, req.ip);
  if (lockout.locked) {
    return res.status(429).json({
      error: `Account temporarily locked due to too many failed attempts. Try again in ${lockout.remainingMinutes} minute(s).`,
      code: 'ACCOUNT_LOCKED'
    });
  }

  try {
    const authResult = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    let data = authResult.data;
    let error = authResult.error;

    if (error) {
      if (error.message === 'Email not confirmed') {
        const shouldRequireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
        if (!shouldRequireVerification) {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const user = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
          if (user) {
            try {
              await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
              await supabaseAdmin.from('profiles').update({ email_verified: true, verification_token: null }).eq('id', user.id);
            } catch (confirmErr) {
              console.warn('Auto-confirm retry warning:', confirmErr?.message);
            }
            const retry = await supabaseAdmin.auth.signInWithPassword({ email: normalizedEmail, password });
            if (!retry.error) {
              data = retry.data;
              error = null;
            }
          }
        }
      }

      if (error) {
        // Record the failed attempt
        await recordFailedLogin(normalizedEmail, req.ip);

        if (error.message === 'Email not confirmed') {
          return res.status(403).json({
            error: 'Please verify your email before logging in',
            code: 'EMAIL_NOT_VERIFIED',
            email: normalizedEmail
          });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Clear failed attempts on successful login
    await clearLoginAttempts(normalizedEmail, req.ip);

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
      // Return a distinct 403 code so the frontend interceptor can skip retry
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

    try {
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
      if (updateErr) {
        console.error('Failed to update last_login:', updateErr.message || updateErr);
      }
    } catch (updateErr) {
      console.error('Failed to update last_login:', updateErr?.message || updateErr);
    }

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

export default router;

