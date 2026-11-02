import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(backendDir, relativePath), 'utf8');
}

describe('Security Fixes Regression Unit Tests', () => {
  const hrRoutes = read('routes/hr.js');
  const voiceRoutes = read('routes/voice.js');
  const authMiddleware = read('middleware/auth.js');

  it('ensures hr.js has no hardcoded JWT fallback secrets', () => {
    expect(hrRoutes).not.toMatch(/preploop-jwt-secret-key/);
  });

  it('ensures requireHR middleware is exported from auth.js', () => {
    expect(authMiddleware).toMatch(/export const requireHR\s*=\s*\(/);
  });

  it('ensures all privileged HR mutations require authenticateToken and requireHR', () => {
    const protectedHrRoutes = [
      /router\.post\('\/slots',\s*authenticateToken,\s*requireHR,\s*async/s,
      /router\.delete\('\/slots\/:id',\s*authenticateToken,\s*requireHR,\s*async/s,
      /router\.put\('\/complete\/:bookingId',\s*authenticateToken,\s*requireHR,\s*async/s,
      /router\.post\('\/jobs',\s*authenticateToken,\s*requireHR,\s*async/s,
      /router\.delete\('\/jobs\/:id',\s*authenticateToken,\s*requireHR,\s*async/s,
    ];

    for (const pattern of protectedHrRoutes) {
      expect(hrRoutes).toMatch(pattern);
    }
  });

  it('enforces consistent req.user.id usage in hr.js', () => {
    expect(hrRoutes).not.toMatch(/req\.user\.userId/);
  });

  it('enforces HR ownership in interview completion queries', () => {
    expect(hrRoutes).toMatch(
      /UPDATE\s+interview_bookings[\s\S]*FROM\s+interview_slots[\s\S]*s\.hr_id\s*=\s*\$4/s
    );
  });

  it('ensures voice analyze-answer endpoint requires authenticateToken', () => {
    expect(voiceRoutes).toMatch(
      /router\.post\('\/analyze-answer',\s*authenticateToken,\s*async/s
    );
  });
});

