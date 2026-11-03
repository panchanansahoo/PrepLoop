import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { HrAuthService } from '../../services/hrAuthService.js';
import { hrAuth, requireHRRole } from '../../middleware/hrAuth.js';

describe('HR Authentication Unit Tests', () => {
  const JWT_SECRET = 'test-hr-secret-key-that-is-long-enough-32-chars';
  let service: HrAuthService;
  let mockPool: any;

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    mockPool = {
      query: vi.fn(),
    };
    service = new HrAuthService(mockPool);
  });

  describe('Token Issuance & Verification', () => {
    it('issues and verifies a valid HR token', () => {
      const user = { id: 'hr_123', email: 'recruiter@company.com', full_name: 'Jane Recruiter' };
      const token = service.issueToken(user);
      const principal = service.verifyToken(token);

      expect(principal).toEqual({
        id: 'hr_123',
        email: 'recruiter@company.com',
        role: 'hr',
        fullName: undefined,
      });
    });

    it('rejects an expired token with TOKEN_EXPIRED', () => {
      const expiredToken = jwt.sign(
        { userId: 'hr_old', email: 'old@company.com', role: 'hr' },
        JWT_SECRET,
        { expiresIn: -10 }
      );

      expect(() => service.verifyToken(expiredToken)).toThrowError();
      try {
        service.verifyToken(expiredToken);
      } catch (err: any) {
        expect(err.code).toBe('TOKEN_EXPIRED');
        expect(err.statusCode).toBe(401);
      }
    });

    it('rejects an invalid token signature', () => {
      const tamperedToken = jwt.sign(
        { userId: 'hr_fake', email: 'fake@company.com', role: 'hr' },
        'wrong-secret'
      );

      expect(() => service.verifyToken(tamperedToken)).toThrowError();
      try {
        service.verifyToken(tamperedToken);
      } catch (err: any) {
        expect(err.code).toBe('INVALID_TOKEN');
        expect(err.statusCode).toBe(401);
      }
    });

    it('rejects a token without HR or Admin role', () => {
      const candidateToken = jwt.sign(
        { userId: 'cand_123', email: 'user@preploop.com', role: 'candidate' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      try {
        service.verifyToken(candidateToken);
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('hrAuth Middleware', () => {
    it('attaches req.hrUser and req.user on valid bearer token', () => {
      const token = service.issueToken({ id: 'hr_555', email: 'hr555@firm.com' });
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      hrAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.hrUser.id).toBe('hr_555');
      expect(req.user.id).toBe('hr_555');
      expect(req.user.role).toBe('hr');
    });

    it('returns 401 when authorization token is missing', () => {
      const req: any = { headers: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      hrAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ACCESS_TOKEN_REQUIRED' })
      );
    });

    it('returns 401 when token is expired', () => {
      const expiredToken = jwt.sign(
        { userId: 'hr_exp', email: 'exp@hr.com', role: 'hr' },
        JWT_SECRET,
        { expiresIn: -5 }
      );
      const req: any = {
        headers: { authorization: `Bearer ${expiredToken}` },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      hrAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'TOKEN_EXPIRED' })
      );
    });
  });

  describe('requireHRRole Middleware', () => {
    it('allows access for HR users', () => {
      const req: any = { hrUser: { id: 'hr_1', role: 'hr' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      requireHRRole(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows access for Admin users', () => {
      const req: any = { hrUser: { id: 'admin_1', role: 'admin' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      requireHRRole(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies access for standard users', () => {
      const req: any = { hrUser: { id: 'u_1', role: 'user' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      requireHRRole(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Payload and Validation Checks', () => {
    it('rejects registration with missing mandatory fields', async () => {
      await expect(service.register({ fullName: '', email: 'hr@test.com', password: 'secretpassword' }))
        .rejects.toThrow('Full name, email, and password are required');
    });

    it('rejects registration with invalid email format', async () => {
      await expect(service.register({ fullName: 'HR Jane', email: 'invalid-email', password: 'secretpassword' }))
        .rejects.toThrow('Invalid email format');
    });

    it('rejects registration with short password', async () => {
      await expect(service.register({ fullName: 'HR Jane', email: 'hr@test.com', password: 'short' }))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('rejects login with missing email or password', async () => {
      await expect(service.login('', 'pass')).rejects.toThrow('Email and password are required');
      await expect(service.login('hr@test.com', '')).rejects.toThrow('Email and password are required');
    });
  });
});

