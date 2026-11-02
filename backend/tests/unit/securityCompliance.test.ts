import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security Compliance & Hardening Verification', () => {
  const backendDir = path.resolve(__dirname, '../..');

  function read(relativePath: string) {
    return fs.readFileSync(path.join(backendDir, relativePath), 'utf8');
  }

  it('ensures no hardcoded insecure JWT fallback secrets exist in routes', () => {
    const hrRoutes = read('routes/hr.js');
    expect(hrRoutes).not.toMatch(/preploop-jwt-secret-key/);
  });

  it('verifies HR RBAC role gate exists and is enforced on privileged endpoints', () => {
    const hrRoutes = read('routes/hr.js');
    const authMiddleware = read('middleware/auth.js');

    expect(authMiddleware).toMatch(/export const requireHR\s*=\s*\(/);

    const protectedHrPatterns = [
      /router\.post\('\/slots',\s*authenticateToken,\s*requireHR/s,
      /router\.delete\('\/slots\/:id',\s*authenticateToken,\s*requireHR/s,
      /router\.put\('\/complete\/:bookingId',\s*authenticateToken,\s*requireHR/s,
      /router\.post\('\/jobs',\s*authenticateToken,\s*requireHR/s,
      /router\.delete\('\/jobs\/:id',\s*authenticateToken,\s*requireHR/s,
    ];

    for (const pattern of protectedHrPatterns) {
      expect(hrRoutes).toMatch(pattern);
    }
  });

  it('ensures routes use req.user.id consistently instead of req.user.userId', () => {
    const hrRoutes = read('routes/hr.js');
    expect(hrRoutes).not.toMatch(/req\.user\.userId/);
  });

  it('verifies admin emails are read from environment rather than hardcoded', () => {
    const authMiddleware = read('middleware/auth.js');
    expect(authMiddleware).toMatch(/DEFAULT_ADMIN_EMAILS\s*=\s*\[\s*\]/);
    expect(authMiddleware).toMatch(/process\.env\.ADMIN_EMAILS/);
  });
});
