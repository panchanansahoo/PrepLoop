import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';
import hrRouter from '../../routes/hr.js';

describe('HR Auth and Route Integration Flow', () => {
  const JWT_SECRET = 'test-hr-secret-key-that-is-long-enough-32-chars';
  let app: express.Application;
  let server: Server | null = null;
  let baseUrl = '';

  beforeEach(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.restoreAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/hr', hrRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server?.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = null;
    }
  });

  it('completes HR registration and issues valid JWT', async () => {
    vi.spyOn(pool, 'query').mockImplementation((text: string) => {
      if (text.includes('SELECT id FROM users')) {
        return Promise.resolve({ rows: [] }) as any;
      }
      if (text.includes('INSERT INTO users')) {
        return Promise.resolve({
          rows: [
            {
              id: 'hr_new_1',
              full_name: 'Alice Recruiter',
              email: 'alice@talent.com',
              role: 'hr',
              company: 'Acme Corp',
              designation: 'Tech Recruiter',
              experience_years: 5,
            },
          ],
        }) as any;
      }
      return Promise.resolve({ rows: [] }) as any;
    });

    const res = await fetch(`${baseUrl}/api/hr/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alice Recruiter',
        email: 'alice@talent.com',
        password: 'securePassword123',
        company: 'Acme Corp',
        designation: 'Tech Recruiter',
        experience: 5,
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('alice@talent.com');
    expect(body.user.role).toBe('hr');
  });

  it('completes HR login with correct password', async () => {
    const hashedPassword = await bcrypt.hash('correctPassword123', 10);
    vi.spyOn(pool, 'query').mockImplementation((text: string) => {
      if (text.includes('SELECT id, full_name, email, password, role')) {
        return Promise.resolve({
          rows: [
            {
              id: 'hr_existing_2',
              full_name: 'Bob HR',
              email: 'bob@enterprise.com',
              password: hashedPassword,
              role: 'hr',
              company: 'Enterprise Inc',
            },
          ],
        }) as any;
      }
      return Promise.resolve({ rows: [] }) as any;
    });

    const res = await fetch(`${baseUrl}/api/hr/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@enterprise.com',
        password: 'correctPassword123',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.token).toBeDefined();
    expect(body.user.id).toBe('hr_existing_2');
    expect(body.user.role).toBe('hr');
  });

  it('creates interview slot when authenticated as HR', async () => {
    const validHrToken = jwt.sign(
      { userId: 'hr_slot_creator', email: 'slots@talent.com', role: 'hr' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    vi.spyOn(pool, 'query').mockImplementation((text: string) => {
      if (text.includes('INSERT INTO interview_slots')) {
        return Promise.resolve({
          rows: [
            {
              id: 'slot_99',
              hr_id: 'hr_slot_creator',
              slot_date: '2026-12-01',
              start_time: '14:00',
              end_time: '15:00',
              max_bookings: 1,
              status: 'available',
            },
          ],
        }) as any;
      }
      return Promise.resolve({ rows: [] }) as any;
    });

    const res = await fetch(`${baseUrl}/api/hr/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validHrToken}`,
      },
      body: JSON.stringify({
        slotDate: '2026-12-01',
        startTime: '14:00',
        endTime: '15:00',
        maxBookings: 1,
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.id).toBe('slot_99');
    expect(body.hr_id).toBe('hr_slot_creator');
  });

  it('rejects slot creation when token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: 'hr_expired', email: 'exp@talent.com', role: 'hr' },
      JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await fetch(`${baseUrl}/api/hr/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expiredToken}`,
      },
      body: JSON.stringify({
        slotDate: '2026-12-01',
        startTime: '14:00',
        endTime: '15:00',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects slot creation when token signature is invalid', async () => {
    const tamperedToken = jwt.sign(
      { userId: 'hr_fake', email: 'fake@talent.com', role: 'hr' },
      'wrong-secret'
    );

    const res = await fetch(`${baseUrl}/api/hr/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tamperedToken}`,
      },
      body: JSON.stringify({
        slotDate: '2026-12-01',
        startTime: '14:00',
        endTime: '15:00',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.code).toBe('INVALID_TOKEN');
  });

  it('rejects slot creation when non-HR role is provided', async () => {
    const candidateToken = jwt.sign(
      { userId: 'cand_123', email: 'cand@preploop.com', role: 'candidate' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${baseUrl}/api/hr/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candidateToken}`,
      },
      body: JSON.stringify({
        slotDate: '2026-12-01',
        startTime: '14:00',
        endTime: '15:00',
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.code).toBe('FORBIDDEN');
  });
});

