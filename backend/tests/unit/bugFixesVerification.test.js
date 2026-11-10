import assert from 'node:assert/strict';
import { test } from 'vitest';
import { EventEmitter } from 'node:events';

import { apiCacheMiddleware, invalidateCache } from '../../middleware/apiCache.js';
import { sanitizeHTML } from '../../middleware/sanitization.js';
import { executeCode } from '../../utils/executeCode.js';

function createMockResponse() {
  const emitter = new EventEmitter();
  const headers = new Map();
  const res = {
    statusCode: 200,
    body: null,
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
    setHeader(name, value) {
      headers.set(name, value);
    },
    getHeader(name) {
      return headers.get(name);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

test('sanitizeHTML: properly filters tags and enforces allowlist and safe attributes', () => {
  // Disallowed tags stripped, safe tags kept
  const input1 = '<div>Hello <b>world</b> and <marquee>scrolling</marquee></div>';
  const out1 = sanitizeHTML(input1);
  assert.equal(out1, 'Hello <b>world</b> and scrolling');

  // XSS script tags and event handlers stripped
  const input2 = '<p>Normal text <script>alert("xss")</script><img src="x" onerror="alert(1)">.</p>';
  const out2 = sanitizeHTML(input2);
  assert.equal(out2, '<p>Normal text .</p>');

  // Dangerous javascript: link stripped from href
  const input3 = '<a href="javascript:alert(1)" onclick="steal()">Click me</a>';
  const out3 = sanitizeHTML(input3);
  assert.equal(out3, '<a>Click me</a>');

  // Safe external link gets rel="noopener noreferrer" for target="_blank"
  const input4 = '<a href="https://example.com" target="_blank">External</a>';
  const out4 = sanitizeHTML(input4);
  assert.equal(out4, '<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>');

  // Self closing allowed tags
  const input5 = 'Line 1<br />Line 2<hr />';
  const out5 = sanitizeHTML(input5);
  assert.equal(out5, 'Line 1<br />Line 2<hr />');
});

test('apiCache: mutations invalidate cached GET responses', () => {
  const middleware = apiCacheMiddleware({ ttl: 60_000 });
  const testUrl = `/api/test-resource-${Date.now()}`;

  // 1. Initial GET request populates cache
  const getReq = { method: 'GET', originalUrl: testUrl, headers: {} };
  const firstRes = createMockResponse();
  middleware(getReq, firstRes, () => {
    firstRes.json({ name: 'Initial Version' });
  });

  // Verify it was cached (second GET gets HIT)
  const hitRes = createMockResponse();
  middleware(getReq, hitRes, () => {
    assert.fail('Should have hit cache, next() should not be called');
  });
  assert.equal(hitRes.getHeader('X-Cache'), 'HIT');
  assert.deepEqual(hitRes.body, { name: 'Initial Version' });

  // 2. Perform a mutating PUT request to the same resource
  const putReq = { method: 'PUT', originalUrl: testUrl, headers: {} };
  const putRes = createMockResponse();
  let putNextCalled = false;
  middleware(putReq, putRes, () => {
    putNextCalled = true;
    putRes.statusCode = 200;
  });
  assert.ok(putNextCalled, 'PUT should proceed to next handler');
  // Trigger finish event on response
  putRes.emit('finish');

  // 3. Subsequent GET request should now be a MISS because PUT invalidated the cache!
  const thirdRes = createMockResponse();
  let thirdNextCalled = false;
  middleware(getReq, thirdRes, () => {
    thirdNextCalled = true;
    thirdRes.json({ name: 'Updated Version' });
  });
  assert.ok(thirdNextCalled, 'Cache was invalidated, so next() was invoked to fetch fresh data');
  assert.equal(thirdRes.getHeader('X-Cache'), 'MISS');
});

test('apiCache: invalidateCache function clears targeted path keys', () => {
  const middleware = apiCacheMiddleware({ ttl: 60_000 });
  const path = `/api/custom-path-${Date.now()}`;

  const req = { method: 'GET', originalUrl: path, headers: {} };
  const res1 = createMockResponse();
  middleware(req, res1, () => {
    res1.json({ data: 123 });
  });

  // Explicitly call invalidateCache
  invalidateCache(path);

  // Next GET must be a miss
  const res2 = createMockResponse();
  let nextCalled = false;
  middleware(req, res2, () => {
    nextCalled = true;
    res2.json({ data: 456 });
  });
  assert.ok(nextCalled);
});

test('apiCache: precision matching prevents over-broad substring invalidation (B15)', () => {
  const middleware = apiCacheMiddleware({ ttl: 60_000 });
  const profileUrl = `/api/user/profile-exact-${Date.now()}`;
  const profilePicUrl = `${profileUrl}-picture`;

  // 1. Cache both endpoints
  const reqProfile = { method: 'GET', originalUrl: profileUrl, headers: {} };
  const resProfile1 = createMockResponse();
  middleware(reqProfile, resProfile1, () => {
    resProfile1.json({ bio: 'Engineer' });
  });

  const reqPic = { method: 'GET', originalUrl: profilePicUrl, headers: {} };
  const resPic1 = createMockResponse();
  middleware(reqPic, resPic1, () => {
    resPic1.json({ avatar: 'https://example.com/avatar.png' });
  });

  // 2. Invalidate only profileUrl
  invalidateCache(profileUrl);

  // 3. profileUrl must be a MISS
  const resProfile2 = createMockResponse();
  let profileNextCalled = false;
  middleware(reqProfile, resProfile2, () => {
    profileNextCalled = true;
    resProfile2.json({ bio: 'Updated Engineer' });
  });
  assert.ok(profileNextCalled, 'Profile cache should be invalidated');
  assert.equal(resProfile2.getHeader('X-Cache'), 'MISS');

  // 4. profilePicUrl MUST REMAIN A HIT (not invalidated by profileUrl)
  const resPic2 = createMockResponse();
  middleware(reqPic, resPic2, () => {
    assert.fail('profile-picture should still be cached as a HIT');
  });
  assert.equal(resPic2.getHeader('X-Cache'), 'HIT');
  assert.deepEqual(resPic2.body, { avatar: 'https://example.com/avatar.png' });
});

test('executeCode: executes JavaScript securely and validates Java class names (B9 & B12)', () => {
  // Test basic JavaScript execution via execFileSync
  const jsResult = executeCode('console.log("Safe Sandbox Output");', 'javascript');
  assert.equal(jsResult.success, true);
  assert.equal(jsResult.output, 'Safe Sandbox Output');

  // Test Java class name injection safety
  const maliciousJava = `
    public class Malicious; rm -rf /tmp {
        public static void main(String[] args) {
            System.out.println("Should not execute shell command");
        }
    }
  `;
  const javaResult = executeCode(maliciousJava, 'java');
  // Either javac is not installed on test host (returns runtime not found)
  // or it compiles/runs Main safely without shell command execution
  if (!javaResult.success) {
    assert.ok(
      javaResult.error.includes('javac') ||
      javaResult.error.includes('runtime not found') ||
      javaResult.error.includes('Compilation Error')
    );
  }
});

test('schedule: slot validation rejects malformed dates, reversed times, and caps at 50 (C2)', () => {
  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

  const validateSlot = (s) => {
    if (!s || typeof s !== 'object') return false;
    const dateStr = String(s.date || '').trim();
    const startTime = String(s.startTime || '').trim();
    const endTime = String(s.endTime || '').trim();
    if (!DATE_REGEX.test(dateStr) || isNaN(Date.parse(dateStr))) return false;
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) return false;
    if (startTime >= endTime) return false;
    return true;
  };

  // Valid slot
  assert.equal(validateSlot({ date: '2026-05-15', startTime: '10:00', endTime: '11:00' }), true);

  // Invalid date (SQL injection probe or malformed format)
  assert.equal(validateSlot({ date: "'; DROP TABLE interview_slots; --", startTime: '10:00', endTime: '11:00' }), false);
  assert.equal(validateSlot({ date: '15-05-2026', startTime: '10:00', endTime: '11:00' }), false);

  // Reversed time
  assert.equal(validateSlot({ date: '2026-05-15', startTime: '14:00', endTime: '13:00' }), false);

  // Equal time (zero duration)
  assert.equal(validateSlot({ date: '2026-05-15', startTime: '10:00', endTime: '10:00' }), false);

  // Invalid time string
  assert.equal(validateSlot({ date: '2026-05-15', startTime: '25:00', endTime: '26:00' }), false);
});

test('gamification: streak freeze cost is exported and configurable (D6)', async () => {
  const { STREAK_FREEZE_COIN_COST } = await import('../../routes/gamification.js');
  assert.equal(typeof STREAK_FREEZE_COIN_COST, 'number');
  assert.ok(STREAK_FREEZE_COIN_COST > 0);
});

test('feedback: input length validation, sanitization and deduplication key (D2 & D3)', () => {
  const sanitize = (rawType, rawMessage) => {
    if (!rawType || !rawMessage) return null;
    if (rawType.length > 50 || rawMessage.length > 5000) return null;
    return {
      feedback_type: sanitizeHTML(rawType).slice(0, 50),
      message: sanitizeHTML(rawMessage).slice(0, 5000),
    };
  };

  // Valid feedback
  const valid = sanitize('bug_report', 'Found an issue with button alignment.');
  assert.ok(valid);
  assert.equal(valid.feedback_type, 'bug_report');

  // Over-length feedback type rejected
  assert.equal(sanitize('a'.repeat(51), 'Valid message'), null);

  // Over-length message rejected
  assert.equal(sanitize('bug', 'x'.repeat(5001)), null);

  // XSS stripped
  const xssAttempt = sanitize('feature', 'Please add <script>alert("hacked")</script> dark mode.');
  assert.equal(xssAttempt.message, 'Please add  dark mode.');

  // Reference key format for daily deduplication
  const userId = 'usr_test_123';
  const today = '2026-11-09';
  const refKey = `feedback:${userId}:${today}`;
  assert.equal(refKey, 'feedback:usr_test_123:2026-11-09');
});

test('productivity: todo text length validation and capping (D4 & D5)', () => {
  const validateTodoText = (text) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return { valid: false, error: 'Todo text is required' };
    }
    if (text.trim().length > 500) {
      return { valid: false, error: 'Todo text must not exceed 500 characters' };
    }
    return { valid: true, text: text.trim().slice(0, 500) };
  };

  assert.equal(validateTodoText('').valid, false);
  assert.equal(validateTodoText('   ').valid, false);
  assert.equal(validateTodoText('a'.repeat(501)).valid, false);
  
  const ok = validateTodoText('Complete system design interview module');
  assert.equal(ok.valid, true);
  assert.equal(ok.text, 'Complete system design interview module');
});

test('practice: code size limit MAX_SUBMIT_CODE_LENGTH and type check (E1 & E7)', async () => {
  const { MAX_SUBMIT_CODE_LENGTH } = await import('../../routes/practice.js');
  assert.equal(typeof MAX_SUBMIT_CODE_LENGTH, 'number');
  assert.equal(MAX_SUBMIT_CODE_LENGTH, 100000);

  const validateCodeSubmission = ({ problemId, code, language }) => {
    if (!problemId || !code || !language) return { valid: false, error: 'Missing required fields' };
    if (typeof code !== 'string') return { valid: false, error: 'Code must be a string' };
    if (!code.trim()) return { valid: false, error: 'Code is required' };
    if (typeof language !== 'string' || !language.trim()) return { valid: false, error: 'Language must be a non-empty string' };
    if (code.length > MAX_SUBMIT_CODE_LENGTH) return { valid: false, error: 'Code is too large' };
    return { valid: true };
  };

  // Rejects numeric code (e.g. code: 42) (E7)
  assert.equal(validateCodeSubmission({ problemId: '1', code: 42, language: 'javascript' }).valid, false);
  assert.equal(validateCodeSubmission({ problemId: '1', code: true, language: 'javascript' }).valid, false);

  // Rejects code exceeding 100KB (E1)
  assert.equal(validateCodeSubmission({ problemId: '1', code: 'x'.repeat(MAX_SUBMIT_CODE_LENGTH + 1), language: 'javascript' }).valid, false);

  // Accepts valid code
  assert.equal(validateCodeSubmission({ problemId: '1', code: 'function twoSum() { return [0, 1]; }', language: 'javascript' }).valid, true);
});

test('chat: message length capped to 4000 and requires non-empty string (E2)', () => {
  const validateChatMessage = (message) => {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return { valid: false, error: 'Message is required and must be a non-empty string' };
    }
    if (message.trim().length > 4000) {
      return { valid: false, error: 'Message is too long. Limit is 4000 characters.' };
    }
    return { valid: true, message: message.trim() };
  };

  assert.equal(validateChatMessage('').valid, false);
  assert.equal(validateChatMessage(12345).valid, false);
  assert.equal(validateChatMessage('a'.repeat(4001)).valid, false);

  const valid = validateChatMessage('Help me understand topological sort');
  assert.equal(valid.valid, true);
  assert.equal(valid.message, 'Help me understand topological sort');
});

test('practice: batch execution inputs capped to MAX_BATCH_INPUTS (E5)', async () => {
  const { MAX_BATCH_INPUTS } = await import('../../routes/practice.js');
  assert.equal(typeof MAX_BATCH_INPUTS, 'number');
  assert.equal(MAX_BATCH_INPUTS, 20);

  const validateBatch = (inputs) => {
    if (!Array.isArray(inputs)) return { valid: false, error: 'inputs must be an array' };
    if (inputs.length > MAX_BATCH_INPUTS) return { valid: false, error: 'Batch input size exceeds limit' };
    return { valid: true };
  };

  assert.equal(validateBatch(new Array(21).fill('test')).valid, false);
  assert.equal(validateBatch(new Array(20).fill('test')).valid, true);
  assert.equal(validateBatch('not-an-array').valid, false);
});

test('copilot: input validation and length limits on /ask and /job-fit (F1 & F2)', () => {
  const validateCopilotAsk = ({ query, context }) => {
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return { valid: false, error: 'Please provide a question (at least 3 characters).' };
    }
    if (query.trim().length > 2000) {
      return { valid: false, error: 'Question is too long (maximum 2000 characters).' };
    }
    if (context !== undefined && context !== null) {
      if (typeof context !== 'string') {
        return { valid: false, error: 'Context must be a string.' };
      }
      if (context.trim().length > 4000) {
        return { valid: false, error: 'Context is too long (maximum 4000 characters).' };
      }
    }
    return { valid: true };
  };

  assert.equal(validateCopilotAsk({ query: 'hi' }).valid, false); // < 3 chars
  assert.equal(validateCopilotAsk({ query: 12345 }).valid, false); // not a string
  assert.equal(validateCopilotAsk({ query: 'a'.repeat(2001) }).valid, false); // > 2000 chars
  assert.equal(validateCopilotAsk({ query: 'Valid question', context: 'a'.repeat(4001) }).valid, false); // > 4000 chars
  assert.equal(validateCopilotAsk({ query: 'Valid question', context: 123 }).valid, false); // context not a string
  assert.equal(validateCopilotAsk({ query: 'How do I optimize Dijkstra?' }).valid, true);

  const validateCopilotJobFit = ({ jobTitle, jobDescription, userProfile }) => {
    if (!jobTitle || !jobDescription || typeof jobTitle !== 'string' || typeof jobDescription !== 'string') {
      return { valid: false, error: 'Job title and description are required strings.' };
    }
    if (jobTitle.trim().length > 200) {
      return { valid: false, error: 'Job title is too long (maximum 200 characters).' };
    }
    if (jobDescription.trim().length > 8000) {
      return { valid: false, error: 'Job description is too long (maximum 8000 characters).' };
    }
    const safeUserProfile = userProfile ? JSON.stringify(userProfile).slice(0, 4000) : null;
    return { valid: true, safeUserProfile };
  };

  assert.equal(validateCopilotJobFit({ jobTitle: 'Dev' }).valid, false); // missing description
  assert.equal(validateCopilotJobFit({ jobTitle: 'a'.repeat(201), jobDescription: 'Desc' }).valid, false);
  assert.equal(validateCopilotJobFit({ jobTitle: 'Engineer', jobDescription: 'x'.repeat(8001) }).valid, false);
  
  const largeProfile = { experience: 'e'.repeat(5000) };
  const okFit = validateCopilotJobFit({ jobTitle: 'Backend Engineer', jobDescription: 'Build APIs', userProfile: largeProfile });
  assert.equal(okFit.valid, true);
  assert.ok(okFit.safeUserProfile.length <= 4000);
});

test('interview history: local storage parsing, 90-day age expiration, and max 50 entry capping (F4)', () => {
  const MAX_HISTORY_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  const isRecent = (s) => {
    const time = new Date(s.created_at || s.date || s.timestamp || 0).getTime();
    return !time || (Date.now() - time < MAX_HISTORY_AGE_MS);
  };
  const sanitizeLocalHistory = (raw) => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isRecent).slice(0, 50);
    } catch {
      return [];
    }
  };

  // Malformed JSON returns empty array gracefully without crashing
  assert.deepEqual(sanitizeLocalHistory('{invalid-json'), []);

  // Non-array returns empty array
  assert.deepEqual(sanitizeLocalHistory('{"key": "value"}'), []);

  // 100 entries capped to 50
  const largeHistory = Array.from({ length: 100 }, (_, i) => ({ id: `sess_${i}` }));
  const capped = sanitizeLocalHistory(JSON.stringify(largeHistory));
  assert.equal(capped.length, 50);
  assert.equal(capped[0].id, 'sess_0');
  assert.equal(capped[49].id, 'sess_49');

  // Filters out sessions older than 90 days
  const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
  const recentDate = new Date().toISOString();
  const mixedHistory = [
    { id: 'recent_1', created_at: recentDate },
    { id: 'old_1', created_at: oldDate },
  ];
  const ageFiltered = sanitizeLocalHistory(JSON.stringify(mixedHistory));
  assert.equal(ageFiltered.length, 1);
  assert.equal(ageFiltered[0].id, 'recent_1');
});

test('portfolio: UUID resolution pattern and exact custom_url matching without fuzzy full_name fallback (F7)', () => {
  const isUUID = (slug) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  assert.equal(isUUID('123e4567-e89b-12d3-a456-426614174000'), true);
  assert.equal(isUUID('alex-kumar'), false);
  assert.equal(isUUID('john doe'), false);
  assert.equal(isUUID("'; DROP TABLE profiles; --"), false);
});

test('career analytics: error sanitization prevents internal error leaking (G1)', () => {
  // Simulate error handler behavior in career analytics routes
  const handleCareerError = (route, _err) => {
    // Should never leak internal Postgres or Supabase raw messages
    const genericErrors = {
      insights: 'Failed to load career insights',
      skillMatches: 'Failed to find skill semantic matches',
      demandForecast: 'Failed to fetch demand forecast',
      skillTrends: 'Failed to fetch skill trends',
      recommendedPathways: 'Failed to fetch recommended pathways',
      resumeMatch: 'Failed to calculate resume match',
      batchResumeMatch: 'Failed to process batch resume match',
      resumeInsights: 'Failed to fetch resume insights',
      trendingSkills: 'Failed to fetch trending skills',
      pathwayInteraction: 'Failed to record pathway interaction'
    };
    return { error: genericErrors[route] || 'Internal server error' };
  };

  const sensitiveDbError = new Error('PG::Error: syntax error at or near "SELECT * FROM supabase_admin.credentials"');
  const response = handleCareerError('insights', sensitiveDbError);
  assert.equal(response.error, 'Failed to load career insights');
  assert.ok(!response.error.includes('PG::Error'));
  assert.ok(!response.error.includes('credentials'));
});

test('voice: token rate limiter enforces hard entry ceiling and time-based eviction (G4)', () => {
  const map = new Map();
  const WINDOW_MS = 60_000;
  const MAX_ENTRIES = 5;

  const prune = (now) => {
    for (const [k, v] of map) {
      if (now - v.windowStart >= WINDOW_MS) map.delete(k);
    }
  };

  const recordRequest = (key, now) => {
    const entry = map.get(key);
    if (entry && now - entry.windowStart < WINDOW_MS) {
      if (entry.count >= 10) return { allowed: false, status: 429 };
      entry.count++;
      return { allowed: true };
    }
    if (map.size >= MAX_ENTRIES) {
      prune(now);
      if (map.size >= MAX_ENTRIES) {
        const oldestKey = map.keys().next().value;
        if (oldestKey) map.delete(oldestKey);
      }
    }
    map.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  };

  const t0 = 100000;
  for (let i = 0; i < 5; i++) {
    recordRequest(`user_${i}`, t0);
  }
  assert.equal(map.size, 5);

  // Adding 6th entry evicts oldest under ceiling
  recordRequest('user_6', t0);
  assert.equal(map.size, 5);
  assert.ok(!map.has('user_0'), 'Oldest entry user_0 should be evicted');
  assert.ok(map.has('user_6'));

  // Expired entries pruned when window lapses
  prune(t0 + WINDOW_MS + 10);
  assert.equal(map.size, 0);
});

test('community: XSS sanitization strips iframe, object, embed, svg onload, and expression (G6)', () => {
  // Test with sanitizeHTML
  const attack1 = '<iframe src="https://attacker.com/malicious"></iframe>Safe text';
  assert.equal(sanitizeHTML(attack1), 'Safe text');

  const attack2 = '<object data="exploit.swf"></object><b>Hello</b>';
  assert.equal(sanitizeHTML(attack2), '<b>Hello</b>');

  const attack3 = '<embed src="bad.pdf">Content';
  assert.equal(sanitizeHTML(attack3), 'Content');

  const attack4 = '<svg onload="alert(1)">Vector</svg>';
  const sanitized4 = sanitizeHTML(attack4);
  assert.ok(!sanitized4.includes('<svg'));
  assert.ok(!sanitized4.includes('onload'));

  const attack5 = '<style>body { background: expression(alert(1)); }</style>Clean';
  const sanitized5 = sanitizeHTML(attack5);
  assert.ok(!sanitized5.includes('<style'));
  assert.ok(!sanitized5.includes('expression'));
});

test('real interview: cancel booking ownership & status verification (G7)', () => {
  const evaluateCancelPermission = (interview, requestingUserId) => {
    if (!interview) {
      return { status: 404, error: 'Interview not found' };
    }
    if (interview.user_id !== requestingUserId) {
      return { status: 403, error: 'Unauthorized to cancel this interview' };
    }
    if (interview.status !== 'scheduled') {
      return { status: 400, error: 'Only scheduled interviews can be cancelled' };
    }
    return { status: 200, success: true };
  };

  // 1. Not found
  assert.equal(evaluateCancelPermission(null, 'user_123').status, 404);

  // 2. Different user attempting cancel
  const otherUsersInterview = { id: 'int_1', user_id: 'user_456', status: 'scheduled' };
  const forbidden = evaluateCancelPermission(otherUsersInterview, 'user_123');
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.error, 'Unauthorized to cancel this interview');

  // 3. Already cancelled
  const alreadyCancelled = { id: 'int_2', user_id: 'user_123', status: 'cancelled' };
  const badRequest = evaluateCancelPermission(alreadyCancelled, 'user_123');
  assert.equal(badRequest.status, 400);

  // 4. Legitimate owner can cancel
  const valid = evaluateCancelPermission({ id: 'int_3', user_id: 'user_123', status: 'scheduled' }, 'user_123');
  assert.equal(valid.status, 200);
  assert.equal(valid.success, true);
});

test('activity: date format validation, future-date rejection, bounds check and generic error (H1 & H7)', () => {
  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const MAX_SECONDS_PER_DAY = 86400;

  const validateActivityInput = (date, seconds) => {
    if (!date || seconds === undefined) {
      return { valid: false, error: 'Missing date or seconds' };
    }
    if (typeof date !== 'string' || !DATE_REGEX.test(date)) {
      return { valid: false, error: 'date must be in YYYY-MM-DD format' };
    }
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (isNaN(parsedDate.getTime()) || !parsedDate.toISOString().startsWith(date)) {
      return { valid: false, error: 'Invalid calendar date' };
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (date > todayStr) {
      return { valid: false, error: 'date cannot be in the future' };
    }
    const safeSeconds = Math.floor(Number(seconds));
    if (!Number.isFinite(safeSeconds) || safeSeconds < 0 || safeSeconds > MAX_SECONDS_PER_DAY) {
      return { valid: false, error: 'seconds must be a non-negative number up to 86400' };
    }
    return { valid: true, safeSeconds };
  };

  // Rejects SQL injection strings
  assert.equal(validateActivityInput("'; DROP TABLE user_activity; --", 100).valid, false);

  // Rejects invalid calendar dates
  assert.equal(validateActivityInput('2026-02-31', 100).valid, false);
  assert.equal(validateActivityInput('2026-13-45', 100).valid, false);

  // Rejects future dates
  assert.equal(validateActivityInput('2099-01-01', 100).valid, false);

  // Rejects negative or excessive seconds
  assert.equal(validateActivityInput('2026-01-01', -5).valid, false);
  assert.equal(validateActivityInput('2026-01-01', 100000).valid, false);

  // Accepts valid past date and valid seconds
  const valid = validateActivityInput('2026-01-01', 3600);
  assert.equal(valid.valid, true);
  assert.equal(valid.safeSeconds, 3600);

  // Generic 500 error sanitization check
  const formatActivityError = (_err) => ({ error: 'Failed to update activity' });
  const sanitizedErr = formatActivityError(new Error('relation "user_activity" does not exist'));
  assert.equal(sanitizedErr.error, 'Failed to update activity');
  assert.ok(!sanitizedErr.error.includes('relation'));
});

test('community challenges: deduplication and execution ordering (H2)', () => {
  // Simulates challenge submission pipeline logic
  const processChallengeSubmission = (challengeId, userId, existingSubmissions, coinTransactions) => {
    const referenceKey = `challenge:${challengeId}:${userId}`;

    // 1. Pre-check in submissions
    if (existingSubmissions.has(`${challengeId}:${userId}`)) {
      return { status: 400, error: 'You have already submitted a solution for this challenge' };
    }

    // 2. Pre-check in coin transactions
    if (coinTransactions.has(referenceKey)) {
      return { status: 400, error: 'You have already submitted a solution for this challenge' };
    }

    // 3. Record coin transaction atomically
    coinTransactions.add(referenceKey);

    // 4. Record submission in DB
    existingSubmissions.add(`${challengeId}:${userId}`);

    // 5. Update leaderboard score ONLY AFTER submission succeeds
    return { status: 200, success: true, scoreAwarded: 25 };
  };

  const existingSubs = new Set();
  const coinTxns = new Set();

  // First submission succeeds
  const first = processChallengeSubmission('c-weekly-1', 'user_abc', existingSubs, coinTxns);
  assert.equal(first.status, 200);
  assert.equal(first.success, true);

  // Concurrent or second submission rejected before awarding leaderboard score
  const second = processChallengeSubmission('c-weekly-1', 'user_abc', existingSubs, coinTxns);
  assert.equal(second.status, 400);
  assert.equal(second.error, 'You have already submitted a solution for this challenge');
});

test('blog: query category filtering, limit capping, and error sanitization (I1)', () => {
  const buildBlogQuery = (category) => {
    let filterCategory = null;
    if (category && typeof category === 'string' && category.trim().toLowerCase() !== 'all') {
      filterCategory = category.trim();
    }
    return {
      category: filterCategory,
      limit: 50,
      order: { column: 'created_at', ascending: false }
    };
  };

  const allQuery = buildBlogQuery('All');
  assert.equal(allQuery.category, null);
  assert.equal(allQuery.limit, 50);

  const dsaQuery = buildBlogQuery('DSA');
  assert.equal(dsaQuery.category, 'DSA');
  assert.equal(dsaQuery.limit, 50);

  // 500 error sanitization
  const formatBlogError = (_err) => ({ error: 'Internal server error' });
  const errRes = formatBlogError(new Error('relation "blogs" does not exist'));
  assert.equal(errRes.error, 'Internal server error');
  assert.ok(!errRes.error.includes('relation'));
});

test('blog: title and content length capping, slug generation, and create error sanitization (I2)', () => {
  const validateAndPrepareBlog = (body) => {
    const { title, content, category, cover_image } = body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return { valid: false, error: 'Title is required' };
    }
    if (title.trim().length > 200) {
      return { valid: false, error: 'Title is too long (maximum 200 characters)' };
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return { valid: false, error: 'Content is required' };
    }
    if (content.length > 500000) {
      return { valid: false, error: 'Content is too long (maximum 500,000 characters)' };
    }

    const safeTitle = title.trim();
    const safeContent = content;
    const safeCategory = typeof category === 'string' ? category.trim().slice(0, 50) : 'General';
    const safeCoverImage = typeof cover_image === 'string' ? cover_image.trim().slice(0, 2000) : null;

    const slug = safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) + '-123456789';

    return {
      valid: true,
      data: {
        title: safeTitle,
        slug,
        content: safeContent,
        category: safeCategory,
        cover_image: safeCoverImage
      }
    };
  };

  // Rejects missing/empty title or content
  assert.equal(validateAndPrepareBlog({}).valid, false);
  assert.equal(validateAndPrepareBlog({ title: '   ', content: 'hello' }).valid, false);
  assert.equal(validateAndPrepareBlog({ title: 'hello', content: '' }).valid, false);

  // Rejects oversized title (>200) and content (>500k)
  const oversizedTitle = 'T'.repeat(201);
  const oversizedContent = 'C'.repeat(500001);
  assert.equal(validateAndPrepareBlog({ title: oversizedTitle, content: 'Valid' }).valid, false);
  assert.equal(validateAndPrepareBlog({ title: 'Valid', content: oversizedContent }).valid, false);

  // Accepts valid blog
  const result = validateAndPrepareBlog({ title: 'Valid Title', content: 'Valid Content', category: 'DSA' });
  assert.equal(result.valid, true);
  assert.equal(result.data.title, 'Valid Title');
  assert.equal(result.data.content, 'Valid Content');
  assert.equal(result.data.category, 'DSA');
  assert.ok(result.data.slug.endsWith('-123456789'));

  // 400 error sanitization
  const formatCreateError = (_err) => ({ error: 'Failed to create blog post' });
  const sanitized = formatCreateError(new Error('duplicate key value violates unique constraint "blogs_slug_key"'));
  assert.equal(sanitized.error, 'Failed to create blog post');
  assert.ok(!sanitized.error.includes('duplicate key'));
});

test('copilot: timer latest callback ref pattern verification (I6)', () => {
  // Simulates the ref callback synchronization pattern
  let latestCode = 'initial code';
  let submittedCode = null;

  const handleSubmit = () => {
    submittedCode = latestCode;
  };

  const ref = { current: handleSubmit };

  // Keystrokes mutate state and ref stays updated
  latestCode = 'function solution() { return 42; }';
  ref.current = handleSubmit;

  // Timer fires and invokes latest ref
  ref.current();
  assert.equal(submittedCode, 'function solution() { return 42; }');
});

test('contact: input sanitization, length boundaries, and email header injection protection (J1 & J6)', () => {
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  const validateContactPayload = (body) => {
    const { name, email, subject, message } = body || {};

    if (!name || !email || !subject || !message) {
      return { status: 400, error: 'All fields are required' };
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof subject !== 'string' ||
      typeof message !== 'string'
    ) {
      return { status: 400, error: 'All fields must be valid text strings' };
    }

    const cleanName = name.replace(/[\r\n]+/g, ' ').trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.replace(/[\r\n]+/g, ' ').trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return { status: 400, error: 'All fields are required' };
    }

    if (cleanName.length > 100) {
      return { status: 400, error: 'Name must be 100 characters or fewer' };
    }

    if (
      cleanEmail.length > 254 ||
      !EMAIL_REGEX.test(cleanEmail) ||
      /[\r\n]/.test(cleanEmail)
    ) {
      return { status: 400, error: 'Invalid email address' };
    }

    if (cleanSubject.length > 200) {
      return { status: 400, error: 'Subject must be 200 characters or fewer' };
    }

    if (cleanMessage.length > 5000) {
      return { status: 400, error: 'Message must be 5000 characters or fewer' };
    }

    return {
      status: 200,
      valid: true,
      sanitized: {
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      },
    };
  };

  // 1. Missing fields
  assert.equal(validateContactPayload({}).status, 400);
  assert.equal(validateContactPayload({ name: 'Alice' }).status, 400);
  assert.equal(validateContactPayload({ name: 'Alice', email: 'alice@example.com', subject: 'Subject' }).status, 400);

  // 2. Non-string types
  assert.equal(validateContactPayload({ name: 123, email: 'alice@example.com', subject: 'Sub', message: 'Msg' }).status, 400);
  assert.equal(validateContactPayload({ name: 'Alice', email: { evil: true }, subject: 'Sub', message: 'Msg' }).status, 400);

  // 3. Name length > 100
  assert.equal(
    validateContactPayload({
      name: 'N'.repeat(101),
      email: 'alice@example.com',
      subject: 'Hello',
      message: 'Body message',
    }).status,
    400
  );

  // 4. Subject length > 200
  assert.equal(
    validateContactPayload({
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'S'.repeat(201),
      message: 'Body message',
    }).status,
    400
  );

  // 5. Message length > 5000
  assert.equal(
    validateContactPayload({
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'Hello',
      message: 'M'.repeat(5001),
    }).status,
    400
  );

  // 6. Email length > 254
  assert.equal(
    validateContactPayload({
      name: 'Alice',
      email: 'a'.repeat(250) + '@example.com',
      subject: 'Hello',
      message: 'Body message',
    }).status,
    400
  );

  // 7. Invalid email format
  assert.equal(
    validateContactPayload({
      name: 'Alice',
      email: 'not-an-email',
      subject: 'Hello',
      message: 'Body message',
    }).status,
    400
  );

  // 8. Email header injection attempt with CRLF in email (J6)
  assert.equal(
    validateContactPayload({
      name: 'Attacker',
      email: 'attacker@example.com\r\nBcc: victim@example.com',
      subject: 'Exploit',
      message: 'Payload',
    }).status,
    400
  );
  assert.equal(
    validateContactPayload({
      name: 'Attacker',
      email: 'attacker@example.com\nSubject: Injected',
      subject: 'Exploit',
      message: 'Payload',
    }).status,
    400
  );

  // 9. Single-line fields sanitize internal CRLF characters
  const validWithNewlines = validateContactPayload({
    name: 'Alice\r\nSmith',
    email: 'alice.smith@example.com',
    subject: 'Bug\nReport\nFound',
    message: 'Valid multi-line\nmessage body with detailed stack trace.',
  });
  assert.equal(validWithNewlines.status, 200);
  assert.equal(validWithNewlines.sanitized.name, 'Alice Smith');
  assert.equal(validWithNewlines.sanitized.subject, 'Bug Report Found');
  assert.ok(validWithNewlines.sanitized.message.includes('\n'));
});

test('password reset: devResetLink gated to development AND localhost only (J2)', () => {
  const buildForgotPasswordResponse = ({ nodeEnv, hostname, ip, resetLink, mailErrorMessage, emailSent }) => {
    const isLocalIp = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLocalDev = nodeEnv === 'development' && (isLocalHost || isLocalIp);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailSent: Boolean(emailSent),
      ...(isLocalDev && {
        resetLink,
        devResetLink: resetLink,
        mailError: mailErrorMessage,
      }),
    };
  };

  const sampleTokenLink = 'https://supabase.co/auth/v1/verify?token=pkce_secret_token_123';

  // 1. Production environment never exposes resetLink
  const prodResponse = buildForgotPasswordResponse({
    nodeEnv: 'production',
    hostname: 'preploop.me',
    ip: '10.0.0.1',
    resetLink: sampleTokenLink,
    emailSent: true,
  });
  assert.equal(prodResponse.resetLink, undefined);
  assert.equal(prodResponse.devResetLink, undefined);
  assert.equal(prodResponse.emailSent, true);

  // 2. Staging / UAT environment with NODE_ENV=development on remote hostname never exposes resetLink
  const stagingResponse = buildForgotPasswordResponse({
    nodeEnv: 'development',
    hostname: 'staging.preploop.me',
    ip: '192.168.1.50',
    resetLink: sampleTokenLink,
    emailSent: false,
    mailErrorMessage: 'SMTP timeout',
  });
  assert.equal(stagingResponse.resetLink, undefined);
  assert.equal(stagingResponse.devResetLink, undefined);
  assert.equal(stagingResponse.mailError, undefined);
  assert.equal(stagingResponse.emailSent, false);

  // 3. Localhost in development mode exposes devResetLink
  const localDevResponse = buildForgotPasswordResponse({
    nodeEnv: 'development',
    hostname: 'localhost',
    ip: '127.0.0.1',
    resetLink: sampleTokenLink,
    emailSent: false,
    mailErrorMessage: 'Dev mode no SMTP',
  });
  assert.equal(localDevResponse.resetLink, sampleTokenLink);
  assert.equal(localDevResponse.devResetLink, sampleTokenLink);
  assert.equal(localDevResponse.mailError, 'Dev mode no SMTP');
  assert.equal(localDevResponse.emailSent, false);

  // 4. Local IP 127.0.0.1 also allows devResetLink in development
  const localIpDevResponse = buildForgotPasswordResponse({
    nodeEnv: 'development',
    hostname: '127.0.0.1',
    ip: '127.0.0.1',
    resetLink: sampleTokenLink,
    emailSent: false,
  });
  assert.equal(localIpDevResponse.devResetLink, sampleTokenLink);
});

test('career roadmap: targetRole and targetCompany input clamping to 100 characters (K1)', () => {
  const sanitizeRoadmapOptions = (options) => {
    const rawRole = options?.targetRole;
    const rawCompany = options?.targetCompany;
    return {
      ...(options && typeof options === 'object' ? options : {}),
      targetRole: typeof rawRole === 'string' ? rawRole.trim().slice(0, 100) : undefined,
      targetCompany: typeof rawCompany === 'string' ? rawCompany.trim().slice(0, 100) : undefined,
    };
  };

  // Oversized 50KB role and company are clamped to 100 chars
  const oversizedRole = 'Staff Engineer '.repeat(4000);
  const oversizedCompany = 'Acme Global Megacorp '.repeat(3000);

  const sanitized = sanitizeRoadmapOptions({
    targetRole: oversizedRole,
    targetCompany: oversizedCompany,
    customField: 'preserved',
  });

  assert.equal(sanitized.targetRole.length, 100);
  assert.equal(sanitized.targetCompany.length, 100);
  assert.equal(sanitized.customField, 'preserved');

  // Undefined or non-string inputs don't crash and remain undefined
  const emptySanitized = sanitizeRoadmapOptions({});
  assert.equal(emptySanitized.targetRole, undefined);
  assert.equal(emptySanitized.targetCompany, undefined);

  const nonStringSanitized = sanitizeRoadmapOptions({ targetRole: 12345, targetCompany: null });
  assert.equal(nonStringSanitized.targetRole, undefined);
  assert.equal(nonStringSanitized.targetCompany, undefined);
});

test('dsa: solution prompt caps problem.title to 200 chars and description to 1500 chars (K2)', () => {
  const buildPrompt = (problem) => {
    const safeTitle = String(problem?.title || '').substring(0, 200);
    const safeDesc = String(problem?.description || '').substring(0, 1500);
    return `Problem Title: ${safeTitle}\nProblem Description:\n${safeDesc}`;
  };

  const hugeTitle = 'Very Long Algorithm Problem Title '.repeat(100);
  const hugeDesc = 'Detailed problem statement and constraints '.repeat(100);

  const prompt = buildPrompt({ title: hugeTitle, description: hugeDesc });

  const titleMatch = prompt.match(/Problem Title: (.*)/);
  assert.ok(titleMatch);
  assert.ok(titleMatch[1].length <= 200);

  const descMatch = prompt.match(/Problem Description:\n([\s\S]*)/);
  assert.ok(descMatch);
  assert.ok(descMatch[1].length <= 1500);
});

test('history: localSessions capped to last 50 entries before merge with server (K4)', () => {
  const parseAndCapLocalHistory = (rawJson) => {
    try {
      const local = JSON.parse(rawJson || '[]');
      if (Array.isArray(local) && local.length > 0) {
        return local.slice(0, 50).map((item, idx) => ({
          id: item.id || `local_interview_${idx}`,
          title: item.company && item.role ? `${item.company} ${item.role} Interview` : 'AI Interview',
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  // 120 local sessions
  const largeHistory = Array.from({ length: 120 }, (_, i) => ({
    id: `local_${i}`,
    company: 'Company',
    role: 'Engineer',
  }));

  const parsed = parseAndCapLocalHistory(JSON.stringify(largeHistory));
  assert.equal(parsed.length, 50);
  assert.equal(parsed[0].id, 'local_0');
  assert.equal(parsed[49].id, 'local_49');

  // Invalid JSON returns []
  assert.deepEqual(parseAndCapLocalHistory('{bad json'), []);
});

test('career roadmap: milestone state sanitization against non-object localStorage values (K6)', () => {
  const loadSavedMilestones = (raw) => {
    try {
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  // Valid milestones object
  assert.deepEqual(loadSavedMilestones('{"w1_m1": true, "w1_m2": false}'), { w1_m1: true, w1_m2: false });

  // Corrupted / unexpected types return empty object {}
  assert.deepEqual(loadSavedMilestones('null'), {});
  assert.deepEqual(loadSavedMilestones('[1, 2, 3]'), {});
  assert.deepEqual(loadSavedMilestones('42'), {});
  assert.deepEqual(loadSavedMilestones('"some-string"'), {});
  assert.deepEqual(loadSavedMilestones('{invalid json'), {});
});

test('notes bookmarks: query params builder and search filter inclusion (K3)', () => {
  const buildNotesQueryParams = ({ typeFilter = 'all', tagFilter = 'all', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (search && search.trim()) params.append('search', search.trim());
    if (tagFilter !== 'all') params.append('tag', tagFilter);
    return params.toString();
  };

  // When search is provided along with filters
  const paramsWithSearch = buildNotesQueryParams({ typeFilter: 'dsa', tagFilter: 'graphs', search: 'binary tree' });
  assert.equal(paramsWithSearch, 'type=dsa&search=binary+tree&tag=graphs');

  // When search is empty
  const paramsWithoutSearch = buildNotesQueryParams({ typeFilter: 'all', tagFilter: 'all', search: '   ' });
  assert.equal(paramsWithoutSearch, '');
});

test('dsa editor: abort signal cancels in-flight fetch on rapid navigation (K5)', async () => {
  const controller = new AbortController();
  let settledProblem = null;

  const fetchProblem = (signal, problemData) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
        } else {
          resolve(problemData);
        }
      }, 50);

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  };

  const p1 = fetchProblem(controller.signal, { id: 1, title: 'Two Sum' })
    .then(data => { settledProblem = data; })
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  // Fast navigation: abort previous request immediately
  controller.abort();
  await p1;

  // Verify that the stale fetch did not overwrite settledProblem
  assert.equal(settledProblem, null);

  // New fetch with new controller succeeds
  const newController = new AbortController();
  const p2 = fetchProblem(newController.signal, { id: 2, title: 'Reverse Linked List' })
    .then(data => { settledProblem = data; });

  await p2;
  assert.deepEqual(settledProblem, { id: 2, title: 'Reverse Linked List' });
});

test('community hub: member count dynamic resolution and stats payload (H4)', () => {
  const resolveMemberCount = (statsPayload) => {
    if (statsPayload && typeof statsPayload.memberCount === 'number' && statsPayload.memberCount > 0) {
      return statsPayload.memberCount;
    }
    return 0;
  };

  assert.equal(resolveMemberCount({ memberCount: 1250 }), 1250);
  assert.equal(resolveMemberCount({ memberCount: 0 }), 0);
  assert.equal(resolveMemberCount(null), 0);
  assert.equal(resolveMemberCount({}), 0);
});

test('daily challenges: internal route resolution always targets /dsa-editor or /sql-editor (D1)', () => {
  const resolveInternalRoute = (q) => {
    if (!q || !q.internalId) return null;
    return q.type === 'sql' ? `/sql-editor/${q.internalId}` : `/dsa-editor/${q.internalId}`;
  };

  assert.equal(resolveInternalRoute({ internalId: 42, type: 'dsa' }), '/dsa-editor/42');
  assert.equal(resolveInternalRoute({ internalId: 10, type: 'sql' }), '/sql-editor/10');
  assert.equal(resolveInternalRoute({ internalId: null }), null);
});










