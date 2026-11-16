import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectDangerousCode, executeCode } from '../../utils/executeCode.js';
import { sanitizePublicCandidateSettings } from '../../routes/interview/customSets.js';
import { HrAuthService } from '../../services/hrAuthService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(backendDir, relativePath), 'utf8');
}

describe('Backend Security Audit Remediation Suite', () => {
  describe('1. Code Execution Sandboxing & Route Protection (CRIT-01)', () => {
    it('detects and blocks dangerous Python system and process calls', () => {
      const dangerousPythonSnippets = [
        'import os\nos.system("id")',
        'from subprocess import Popen',
        'import socket\ns = socket.socket()',
        'import urllib.request',
        'eval("__import__(\'os\').system(\'whoami\')")',
        'exec("import sys")',
        'open("/etc/passwd", "r")',
      ];

      for (const snippet of dangerousPythonSnippets) {
        const error = detectDangerousCode(snippet, 'python');
        expect(error).toContain('Security violation');
      }
    });

    it('allows safe algorithmic Python code to pass guard', () => {
      const safeCode = `
import math
from collections import deque, Counter
import heapq

def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`;
      expect(detectDangerousCode(safeCode, 'python')).toBeNull();
    });

    it('detects dangerous JavaScript child process and filesystem calls', () => {
      expect(detectDangerousCode('const cp = require("child_process"); cp.execSync("whoami");', 'javascript')).toBeTruthy();
      expect(detectDangerousCode('import fs from "fs";', 'javascript')).toBeTruthy();
      expect(detectDangerousCode('process.exit(1);', 'javascript')).toBeTruthy();
    });

    it('detects dangerous C / C++ system / unistd calls', () => {
      expect(detectDangerousCode('#include <unistd.h>\nint main() { fork(); return 0; }', 'c')).toBeTruthy();
      expect(detectDangerousCode('#include <windows.h>\nint main() { return 0; }', 'cpp')).toBeTruthy();
      expect(detectDangerousCode('int main() { system("ls"); return 0; }', 'c')).toBeTruthy();
    });

    it('detects dangerous Java Runtime / ProcessBuilder calls', () => {
      expect(detectDangerousCode('class Main { public static void main(String[] args) { Runtime.getRuntime().exec("calc"); } }', 'java')).toBeTruthy();
      expect(detectDangerousCode('import java.net.Socket;', 'java')).toBeTruthy();
    });

    it('executeCode rejects dangerous code immediately without executing', async () => {
      const res = await executeCode('import os\nprint(os.listdir("."))', 'python');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Security violation');
      expect(res.executionTime).toBe(0);
    });

    it('verifies practice.js route definitions require authenticateToken and codeExecutionLimiter', () => {
      const practiceCode = read('routes/practice.js');
      expect(practiceCode).toMatch(/router\.post\('\/execute',\s*authenticateToken,\s*codeExecutionLimiter/);
      expect(practiceCode).toMatch(/router\.post\('\/execute-batch',\s*authenticateToken,\s*codeExecutionLimiter/);
    });
  });

  describe('2. Question Set Candidate Public Exposure Protection (CRIT-06)', () => {
    it('strips webhookSecret, candidateInvites, webhookUrl and non-whitelisted fields', () => {
      const mockSettings = {
        companyName: 'Acme Corp',
        roleName: 'Lead Architect',
        scheduledDurationMinutes: 60,
        instructions: 'Do your best',
        probingMode: true,
        webhookSecret: 'super-confidential-secret-key-123',
        webhookUrl: 'https://internal.acme.com/webhook',
        candidateInvites: {
          inv_token_1: { email: 'victim1@acme.com', name: 'Alice' },
          inv_token_2: { email: 'victim2@acme.com', name: 'Bob' },
        },
        internalAdminNotes: 'Do not hire if answers poorly on concurrency',
      };

      const sanitized = sanitizePublicCandidateSettings(mockSettings);

      expect(sanitized.companyName).toBe('Acme Corp');
      expect(sanitized.roleName).toBe('Lead Architect');
      expect(sanitized.scheduledDurationMinutes).toBe(60);
      expect(sanitized.instructions).toBe('Do your best');
      expect(sanitized.probingMode).toBe(true);

      expect((sanitized as any).webhookSecret).toBeUndefined();
      expect((sanitized as any).webhookUrl).toBeUndefined();
      expect((sanitized as any).candidateInvites).toBeUndefined();
      expect((sanitized as any).internalAdminNotes).toBeUndefined();
    });

    it('handles empty or non-object settings gracefully', () => {
      expect(sanitizePublicCandidateSettings(null)).toEqual({});
      expect(sanitizePublicCandidateSettings(undefined)).toEqual({});
      expect(sanitizePublicCandidateSettings('invalid' as any)).toEqual({});
    });
  });

  describe('3. PostgREST Filter Injection and IDOR Prevention (HIGH-03 & HIGH-04)', () => {
    it('verifies feedbackPortal.js queries attempt_id directly without sequential id OR lookup', () => {
      const portalCode = read('routes/interview/feedbackPortal.js');
      expect(portalCode).not.toContain('.or(`attempt_id.eq.${token},id.eq.${token}`)');
      expect(portalCode).toContain(".eq('attempt_id', token)");
      expect(portalCode).toContain('VALID_FEEDBACK_TOKEN_REGEX');
    });

    it('verifies admin.js sanitizes search query before .or()', () => {
      const adminCode = read('routes/admin.js');
      expect(adminCode).toMatch(/search\.trim\(\)\.replace\(\/\[,\.\(\):;"'%_\\\\\]\/g/);
    });

    it('verifies interview session routes validate session ID format before querying', () => {
      const sessionCode = read('routes/interview/session.js');
      expect(sessionCode).toMatch(/\/\^\[a-zA-Z0-9_-\]\{1,128\}\$\/\.test\(rawId\)/);
      expect(sessionCode).not.toContain('.or(`session_id.eq.${cleanId},session_id.eq.${rawId}`)');

      const companySessionCode = read('routes/company-interview/session.js');
      expect(companySessionCode).toMatch(/\/\^\[a-zA-Z0-9_-\]\{1,128\}\$\/\.test\(rawId\)/);
      expect(companySessionCode).not.toContain('.or(`session_id.eq.${cleanId},session_id.eq.${rawId}`)');
    });
  });

  describe('4. HR Registration Privilege Escalation Hardening (HIGH-02)', () => {
    let mockPool: any;
    let hrService: HrAuthService;

    beforeEach(() => {
      process.env.JWT_SECRET = 'a-super-secret-jwt-key-with-at-least-32-chars';
      delete process.env.HR_INVITE_SECRET;
      delete process.env.HR_REQUIRE_APPROVAL;

      mockPool = {
        query: vi.fn(),
      };
      hrService = new HrAuthService(mockPool);
    });

    it('assigns hr_pending role and omits token when HR_INVITE_SECRET is configured but incorrect', async () => {
      process.env.HR_INVITE_SECRET = 'top-secret-hr-code';

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // existing email check
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'hr_user_1',
              full_name: 'Mallory Attacker',
              email: 'mallory@evil.com',
              role: 'hr_pending',
              company: 'Evil Corp',
            },
          ],
        });

      const res = await hrService.register({
        fullName: 'Mallory Attacker',
        email: 'mallory@evil.com',
        password: 'securePassword123',
        company: 'Evil Corp',
        inviteCode: 'wrong-code',
      });

      expect(res.pendingApproval).toBe(true);
      expect((res as any).token).toBeUndefined();
      expect(res.user.role).toBe('hr_pending');
      expect(res.message).toContain('Awaiting administrator approval');
    });

    it('assigns hr role and issues token when correct HR_INVITE_SECRET is provided', async () => {
      process.env.HR_INVITE_SECRET = 'valid-hr-invite-token';

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // existing email check
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'hr_user_2',
              full_name: 'Good Recruiter',
              email: 'recruiter@company.com',
              role: 'hr',
              company: 'Good Corp',
            },
          ],
        });

      const res = await hrService.register({
        fullName: 'Good Recruiter',
        email: 'recruiter@company.com',
        password: 'securePassword123',
        company: 'Good Corp',
        inviteCode: 'valid-hr-invite-token',
      });

      expect(res.pendingApproval).toBeUndefined();
      expect(res.token).toBeDefined();
      expect(res.user.role).toBe('hr');
    });

    it('rejects login for users in hr_pending state with 403 HR_PENDING_APPROVAL', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'hr_user_pending',
            full_name: 'Pending User',
            email: 'pending@company.com',
            role: 'hr_pending',
            password: 'some-hashed-password',
          },
        ],
      });

      await expect(
        hrService.login('pending@company.com', 'password123')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'HR_PENDING_APPROVAL',
      });
    });
  });
});
