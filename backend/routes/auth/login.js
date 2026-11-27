import { getSubscriptionState } from '../../utils/subscriptionTier.js';
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
import { generateCsrfToken } from '../../middleware/csrf.js';

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

    let profile = null;
    let shouldBypassVerification = false;

    try {
      let { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('full_name, subscription_tier, subscription_expires_at, subscription_billing_cycle, subscription_status, subscription_cancelled_at, experience_level, role, email_verified')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError && (String(profileError?.code || '') === '42703' || String(profileError?.message || '').toLowerCase().includes('does not exist'))) {
        ({ data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('full_name, subscription_tier, experience_level, role, email_verified')
          .eq('id', data.user.id)
          .maybeSingle());
      }

      if (profileError) {
        console.warn('Login profile query warning:', profileError);
        shouldBypassVerification = isMissingEmailVerificationSchema(profileError);
      } else if (profileData) {
        profile = profileData;
      } else {
        // Self-heal: create missing profile row gracefully
        const newProfile = {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
          role: 'user',
          subscription_tier: 'free',
          experience_level: 'beginner',
          email_verified: true,
        };
        const { data: createdProfile, error: createErr } = await supabaseAdmin
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select('full_name, subscription_tier, subscription_expires_at, subscription_billing_cycle, subscription_status, subscription_cancelled_at, experience_level, role, email_verified')
          .maybeSingle();

        profile = (!createErr && createdProfile) ? createdProfile : newProfile;
      }
    } catch (profileFetchErr) {
      console.warn('Profile fetch exception in login (non-fatal):', profileFetchErr?.message || profileFetchErr);
    }

    const shouldRequireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    if (shouldRequireVerification && !shouldBypassVerification && profile && !profile.email_verified) {
      // Return a distinct 403 code so the frontend interceptor can skip retry
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        userId: data.user.id,
        email: data.user.email
      });
    }

    if (!shouldRequireVerification && profile && !profile.email_verified) {
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
        console.warn('Failed to update last_login (non-fatal):', updateErr.message || updateErr);
      }
    } catch (updateErr) {
      console.warn('Failed to update last_login (non-fatal):', updateErr?.message || updateErr);
    }

    setSessionCookies(res, data.session);
    const csrfToken = generateCsrfToken(req, res);
    const subscriptionState = getSubscriptionState(profile);
    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      csrfToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
        subscriptionTier: subscriptionState.tier,
        subscriptionExpiresAt: subscriptionState.expiresAt,
        subscriptionBillingCycle: subscriptionState.billingCycle,
        subscriptionStatus: subscriptionState.status,
        subscriptionCancelledAt: subscriptionState.cancelledAt,
        cancelAtPeriodEnd: subscriptionState.cancelAtPeriodEnd,
        experienceLevel: profile?.experience_level || 'beginner',
        role: profile?.role || 'user',
        emailVerified: shouldBypassVerification ? true : (profile?.email_verified ?? true)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;

