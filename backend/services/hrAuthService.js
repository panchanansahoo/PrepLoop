import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
};

export class HrAuthService {
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }

  toPublicUser(user) {
    return {
      id: user.id,
      fullName: user.full_name || user.fullName,
      email: user.email,
      role: 'hr',
      ...(user.company ? { company: user.company } : {}),
      ...(user.designation ? { designation: user.designation } : {}),
      ...(user.experience_years !== undefined || user.experience !== undefined
        ? { experience: user.experience_years ?? user.experience }
        : {}),
    };
  }

  issueToken(user, expiresIn = '7d') {
    const payload = {
      userId: user.id,
      email: user.email,
      role: 'hr',
    };
    return jwt.sign(payload, getJwtSecret(), { expiresIn });
  }

  verifyToken(token) {
    if (!token) {
      const err = new Error('Token is required');
      err.statusCode = 401;
      err.code = 'ACCESS_TOKEN_REQUIRED';
      throw err;
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret());
      if (!decoded || !decoded.userId || (decoded.role !== 'hr' && decoded.role !== 'admin')) {
        const err = new Error('Invalid HR token payload');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      return {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        fullName: decoded.fullName,
      };
    } catch (err) {
      if (err.statusCode) {
        throw err;
      }
      if (err.name === 'TokenExpiredError') {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        error.statusCode = 401;
        error.code = 'TOKEN_EXPIRED';
        throw error;
      }
      const error = new Error(err.message || 'Invalid token');
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }
  }

  async register({ fullName, email, password, company, designation, experience }) {
    if (!fullName || !email || !password) {
      const err = new Error('Full name, email, and password are required');
      err.statusCode = 400;
      throw err;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      const err = new Error('Invalid email format');
      err.statusCode = 400;
      throw err;
    }

    if (password.length < 8) {
      const err = new Error('Password must be at least 8 characters long');
      err.statusCode = 400;
      throw err;
    }

    // Check if HR email already exists
    const existing = await this.pool.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (existing.rows && existing.rows.length > 0) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await this.pool.query(
      `INSERT INTO users (full_name, email, password, role, company, designation, experience_years, created_at)
       VALUES ($1, $2, $3, 'hr', $4, $5, $6, NOW())
       RETURNING id, full_name, email, role, company, designation, experience_years`,
      [
        fullName.trim(),
        trimmedEmail,
        hashedPassword,
        company ? String(company).trim() : null,
        designation ? String(designation).trim() : null,
        experience ? Number(experience) : null,
      ]
    );

    const user = result.rows[0];

    // Optional Supabase profile synchronization
    try {
      if (supabaseAdmin?.from) {
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: 'hr',
            updated_at: new Date().toISOString(),
          })
          .catch(() => {});
      }
    } catch (_sbErr) {
      // Non-blocking sync
    }

    const token = this.issueToken(user);
    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  async login(email, password) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const result = await this.pool.query(
      `SELECT id, full_name, email, password, role, company, designation, experience_years
       FROM users
       WHERE email = $1 AND role = 'hr'`,
      [trimmedEmail]
    );

    if (!result.rows || result.rows.length === 0) {
      const err = new Error('Invalid HR credentials');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const err = new Error('Invalid HR credentials');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const token = this.issueToken(user);
    return {
      token,
      user: this.toPublicUser(user),
    };
  }
}

export const hrAuthService = new HrAuthService();
export const registerHR = (payload) => hrAuthService.register(payload);
export const loginHR = (email, password) => hrAuthService.login(email, password);
export const verifyHRToken = (token) => hrAuthService.verifyToken(token);
export default hrAuthService;
