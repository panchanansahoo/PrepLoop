import { hrAuthService } from '../services/hrAuthService.js';
import { getAccessToken } from './auth.js';

/**
 * HR Authentication Middleware
 *
 * Validates HR JWT tokens signed with JWT_SECRET.
 * Unlike candidate tokens which authenticate against Supabase Auth, HR identities
 * are stored in the application's PostgreSQL user table with role 'hr'.
 *
 * Attaches the verified principal to req.hrUser and mirrors it to req.user for
 * compatibility with shared route handlers.
 */
export const hrAuth = (req, res, next) => {
  const token = getAccessToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'ACCESS_TOKEN_REQUIRED',
    });
  }

  try {
    const principal = hrAuthService.verifyToken(token);
    if (!principal || (principal.role !== 'hr' && principal.role !== 'admin')) {
      return res.status(403).json({
        error: 'HR access required',
        code: 'FORBIDDEN',
      });
    }

    req.hrUser = principal;
    req.user = {
      id: principal.id,
      email: principal.email,
      role: principal.role,
      fullName: principal.fullName,
    };

    next();
  } catch (error) {
    if (error.statusCode === 403 || error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message || 'HR access required',
        code: 'FORBIDDEN',
      });
    }

    if (error.name === 'TokenExpiredError' || error.code === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        details: 'Please log in again',
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      details: error.message,
    });
  }
};

/**
 * Role Guard enforcing that the authenticated principal is an HR representative or Admin.
 */
export const requireHRRole = (req, res, next) => {
  const principal = req.hrUser || req.user;
  if (!principal || (principal.role !== 'hr' && principal.role !== 'admin')) {
    return res.status(403).json({
      error: 'HR or Admin access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

export const authenticateHR = hrAuth;
export default hrAuth;
