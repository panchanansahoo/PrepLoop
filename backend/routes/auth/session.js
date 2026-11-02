import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { setSessionCookies, clearSessionCookies } from './helpers.js';

const router = express.Router();

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

export default router;

