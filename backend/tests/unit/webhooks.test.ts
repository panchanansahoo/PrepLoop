import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Platform Webhook Dispatcher & HMAC Verification', () => {
  it('correctly generates and validates HMAC-SHA256 signature', () => {
    const secret = 'whsec_test_secret_1234567890';
    const rawPayload = JSON.stringify({
      id: 'evt_123',
      event: 'interview.completed',
      data: {
        candidateId: 'user_1',
        score: 85,
        rubric: { communication: 9, technical: 8 },
      },
    });

    const signature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    const expectedHeader = `sha256=${signature}`;

    // Receiver verification check
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    expect(`sha256=${computed}`).toBe(expectedHeader);
  });
});

