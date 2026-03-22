import { supabaseAdmin } from '../db/supabaseClient.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Fetch role from profiles
    let role = 'user';
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role) {
        role = profile.role;
      }
    } catch (e) {
      // Default to 'user' if profile fetch fails
    }

    req.user = { id: user.id, email: user.email, role };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to require admin role — must be used after authenticateToken
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        // Fetch role from profiles
        let role = 'user';
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role) {
            role = profile.role;
          }
        } catch (e) {
          // Default to 'user'
        }
        req.user = { id: user.id, email: user.email, role };
      }
    } catch (error) {
      // Token invalid but continue anyway
    }
  }
  next();
};
