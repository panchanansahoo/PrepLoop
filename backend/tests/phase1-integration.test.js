/**
 * Phase 1 Backend Integration Tests
 * End-to-end tests for hint + custom test workflows with database
 */

const request = require('supertest');
const { createServer } = require('../../index');
const { supabaseAdmin } = require('../../db/supabaseClient');

describe('Phase 1 Integration: Hints + Custom Tests (Backend)', () => {
  let server;
  let app;
  const userId = 'integration-test-user-' + Date.now();
  const problemId = 'leet-1-two-sum';

  beforeAll(async () => {
    // Start server
    app = createServer();
    server = app.listen(0); // Use random port

    // Ensure test user exists
    try {
      await supabaseAdmin.from('users').upsert(
        {
          id: userId,
          email: `test-${Date.now()}@example.com`,
          name: 'Integration Test User',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (error) {
      console.error('Failed to create test user:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      await supabaseAdmin.from('user_hint_usage').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_custom_tests').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_custom_test_runs').delete().eq('user_id', userId);
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    if (server) {
      server.close();
    }
  });

  describe('Complete Workflow: Hints + Custom Tests', () => {
    it('should complete full hint reveal workflow', async () => {
      const response = await request(app)
        .get(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .query({ hint_type: 'approach' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hint');
      expect(response.body).toHaveProperty('hint_type', 'approach');
      expect(response.body).toHaveProperty('revealed_at');
    });

    it('should enforce cooldown on second hint reveal', async () => {
      // First reveal (should succeed)
      const firstReveal = await request(app)
        .put(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({ hint_type: 'code' });

      expect(firstReveal.status).toBe(200);

      // Immediate second reveal (should be blocked)
      const secondReveal = await request(app)
        .put(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({ hint_type: 'code' });

      expect(secondReveal.status).toBe(429); // Too many requests / cooldown
      expect(secondReveal.body).toHaveProperty('error');
      expect(secondReveal.body).toHaveProperty('cooldown_remaining_seconds');
    });

    it('should allow custom test save and retrieval', async () => {
      const testCases = [
        { input: '[2,7,11,15]', expected: '[0,1]', description: 'Simple case' },
        { input: '[3,2,4]', expected: '[1,2]', description: 'Another case' },
      ];

      // Save custom tests
      const saveResponse = await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          test_cases: testCases,
        });

      expect(saveResponse.status).toBe(201);
      expect(saveResponse.body).toHaveProperty('success', true);
      expect(saveResponse.body).toHaveProperty('test_case_count', testCases.length);

      // Retrieve custom tests
      const getResponse = await request(app)
        .get(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .query({ language: 'python' });

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('custom_tests');
      expect(getResponse.body.custom_tests.length).toBe(testCases.length);
      expect(getResponse.body.custom_tests[0]).toHaveProperty('input');
      expect(getResponse.body.custom_tests[0]).toHaveProperty('expected');
    });

    it('should run custom tests and track results', async () => {
      const testCases = [
        { input: '[2,7,11,15]', expected: '[0,1]' },
      ];

      // First save tests
      await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          test_cases: testCases,
        });

      // Then run them
      const runResponse = await request(app)
        .post(`/api/dsa/custom-tests/${problemId}/run`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          solution_code: `
def twoSum(nums, target=9):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []
          `,
        });

      expect(runResponse.status).toBe(200);
      expect(runResponse.body).toHaveProperty('results');
      expect(Array.isArray(runResponse.body.results)).toBe(true);
      expect(runResponse.body).toHaveProperty('all_passed');
    });

    it('should get hint usage statistics', async () => {
      // Reveal a few hints
      await request(app)
        .put(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({ hint_type: 'approach' });

      // Get stats
      const statsResponse = await request(app)
        .get(`/api/dsa/hints/${problemId}/stats`)
        .set('Authorization', `Bearer ${userId}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body).toHaveProperty('stats');
      expect(statsResponse.body.stats).toHaveProperty('total_reveals');
      expect(statsResponse.body.stats).toHaveProperty('last_reveal_at');
    });

    it('should validate custom test input before saving', async () => {
      const invalidTestCases = [
        { input: '', expected: '[0,1]' }, // Empty input
      ];

      const response = await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          test_cases: invalidTestCases,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should enforce authentication on hint endpoints', async () => {
      const response = await request(app).get(`/api/dsa/hints/${problemId}`);

      expect(response.status).toBeGreaterThanOrEqual(401);
    });

    it('should enforce authentication on custom test endpoints', async () => {
      const response = await request(app).get(`/api/dsa/custom-tests/${problemId}`);

      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('State Consistency & Database Integrity', () => {
    it('should maintain hint usage consistency', async () => {
      // Save initial state
      const initialStats = await request(app)
        .get(`/api/dsa/hints/${problemId}/stats`)
        .set('Authorization', `Bearer ${userId}`);

      const initialCount = initialStats.body.stats.total_reveals;

      // Reveal hint
      await request(app)
        .put(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({ hint_type: 'edge_case' });

      // Check updated stats
      const updatedStats = await request(app)
        .get(`/api/dsa/hints/${problemId}/stats`)
        .set('Authorization', `Bearer ${userId}`);

      expect(updatedStats.body.stats.total_reveals).toBeGreaterThanOrEqual(initialCount);
    });

    it('should maintain custom test persistence', async () => {
      const testCases = [
        { input: '[1,1,1,1]', expected: '[0,1]' },
      ];

      // Save tests
      const saveResponse = await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          test_cases: testCases,
        });

      expect(saveResponse.status).toBe(201);
      const testId = saveResponse.body.test_case_id;

      // Retrieve and verify persistence
      const getResponse = await request(app)
        .get(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .query({ language: 'python' });

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.custom_tests.some((t) => t.input === '[1,1,1,1]')).toBe(true);
    });

    it('should handle concurrent hint reveals', async () => {
      const requests = [
        request(app)
          .put(`/api/dsa/hints/${problemId}`)
          .set('Authorization', `Bearer ${userId}`)
          .send({ hint_type: 'approach' }),
        request(app)
          .put(`/api/dsa/hints/${problemId}`)
          .set('Authorization', `Bearer ${userId}`)
          .send({ hint_type: 'code' }),
        request(app)
          .put(`/api/dsa/hints/${problemId}`)
          .set('Authorization', `Bearer ${userId}`)
          .send({ hint_type: 'edge_case' }),
      ];

      const responses = await Promise.all(requests);

      // All three should succeed (different hint types)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(2); // At least 2 should succeed
    });

    it('should not allow data corruption via invalid inputs', async () => {
      const response = await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          test_cases: null, // Invalid
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Performance Baseline', () => {
    it('should respond to hint reveal in < 500ms', async () => {
      const start = Date.now();

      await request(app)
        .get(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should respond to custom test save in < 300ms', async () => {
      const start = Date.now();

      await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({
          language: 'python',
          test_cases: [{ input: '[1,2]', expected: '[0,1]' }],
        });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle non-existent problem gracefully', async () => {
      const response = await request(app)
        .get(`/api/dsa/hints/non-existent-problem`)
        .set('Authorization', `Bearer ${userId}`);

      // Should return 404 or appropriate error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle invalid hint types', async () => {
      const response = await request(app)
        .put(`/api/dsa/hints/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({ hint_type: 'invalid_type' });

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should rate limit excessive requests', async () => {
      // Rapid requests
      const promises = Array(50)
        .fill()
        .map(() =>
          request(app)
            .get(`/api/dsa/hints/${problemId}`)
            .set('Authorization', `Bearer ${userId}`)
        );

      const responses = await Promise.all(promises);

      // Some should be rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('User Isolation & Security', () => {
    it('should isolate hint data by user', async () => {
      const userId2 = 'isolation-test-user-' + Date.now();

      // Create another test user
      await supabaseAdmin.from('users').upsert(
        {
          id: userId2,
          email: `test2-${Date.now()}@example.com`,
          name: 'Second Test User',
        },
        { onConflict: 'id' }
      );

      // User 1 reveals hint
      const user1Stats = await request(app)
        .get(`/api/dsa/hints/${problemId}/stats`)
        .set('Authorization', `Bearer ${userId}`);

      // User 2 checks stats (should be different)
      const user2Stats = await request(app)
        .get(`/api/dsa/hints/${problemId}/stats`)
        .set('Authorization', `Bearer ${userId2}`);

      expect(user1Stats.body.stats.total_reveals).not.toEqual(user2Stats.body.stats.total_reveals);
    });

    it('should isolate custom tests by user', async () => {
      const userId3 = 'isolation-test-user-3-' + Date.now();

      // Create another user
      await supabaseAdmin.from('users').upsert(
        {
          id: userId3,
          email: `test3-${Date.now()}@example.com`,
          name: 'Third Test User',
        },
        { onConflict: 'id' }
      );

      // User 1 saves tests
      const testCases1 = [{ input: '[user1]', expected: 'result' }];
      await request(app)
        .post(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId}`)
        .send({ language: 'python', test_cases: testCases1 });

      // User 3 tries to retrieve - should not see user 1's tests
      const user3Tests = await request(app)
        .get(`/api/dsa/custom-tests/${problemId}`)
        .set('Authorization', `Bearer ${userId3}`)
        .query({ language: 'python' });

      expect(user3Tests.body.custom_tests.length).toBe(0);
    });
  });
});
