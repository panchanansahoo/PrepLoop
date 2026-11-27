const test = require('node:test');
const assert = require('node:assert/strict');
const { registerHooks } = require('node:module');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const mockApiCalls = [];
let mockHandler = async () => ({ data: {} });

const apiClientUrl = pathToFileURL(path.resolve(__dirname, '../apiClient.js')).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './apiClient' && context.parentURL?.includes('userApi.js')) {
      return { shortCircuit: true, url: 'mock://apiClient' };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock://apiClient') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          export default {
            async get(endpoint, config) { return globalThis.__userApiTestMock('GET', endpoint, config); },
            async put(endpoint, body) { return globalThis.__userApiTestMock('PUT', endpoint, body); },
            async delete(endpoint, config) { return globalThis.__userApiTestMock('DELETE', endpoint, config); },
          };
        `,
      };
    }
    return nextLoad(url, context);
  },
});

globalThis.__userApiTestMock = (method, endpoint, arg) => {
  mockApiCalls.push({ method, endpoint, arg });
  return mockHandler(method, endpoint, arg);
};

async function loadUserApi() {
  const userApiUrl = pathToFileURL(path.resolve(__dirname, '../userApi.js')).href;
  return import(userApiUrl);
}

test('userApi.getDashboardStats maps backend /api/user/dashboard response accurately', async () => {
  const { userApi } = await loadUserApi();
  mockApiCalls.length = 0;
  mockHandler = async () => ({
    data: {
      stats: { mockInterviews: 4, problemsSolved: 42, avgScore: 88 },
      streak: 3,
    },
  });

  const stats = await userApi.getDashboardStats();
  assert.equal(mockApiCalls[0].endpoint, '/api/user/dashboard');
  assert.deepEqual(stats, {
    totalInterviews: 4,
    currentStreak: 3,
    problemsSolved: 42,
    avgScore: 88,
  });
});

test('userApi.getDashboardStats rejects degraded or missing payloads', async () => {
  const { userApi } = await loadUserApi();
  mockHandler = async () => ({ data: { degraded: true } });
  await assert.rejects(() => userApi.getDashboardStats(), /unavailable/i);
});

test('calculateConsecutiveStreak does not count scattered nonconsecutive days as a multi-day streak', async () => {
  const { calculateConsecutiveStreak } = await loadUserApi();
  const ref = new Date('2026-11-27T12:00:00.000Z');

  // Three nonconsecutive days: today, 2 days ago, 4 days ago => streak is 1, not 3
  const scattered = [
    { date: '2026-11-27', seconds_active: 300 },
    { date: '2026-11-25', seconds_active: 600 },
    { date: '2026-11-23', seconds_active: 900 },
  ];
  assert.equal(calculateConsecutiveStreak(scattered, ref), 1);

  // Three consecutive days ending yesterday => streak is 3
  const endingYesterday = [
    { date: '2026-11-26', seconds_active: 300 },
    { date: '2026-11-25', seconds_active: 400 },
    { date: '2026-11-24', seconds_active: 500 },
  ];
  assert.equal(calculateConsecutiveStreak(endingYesterday, ref), 3);

  // Three consecutive days ending 2 days ago => streak broken (0)
  const brokenStreak = [
    { date: '2026-11-25', seconds_active: 300 },
    { date: '2026-11-24', seconds_active: 400 },
    { date: '2026-11-23', seconds_active: 500 },
  ];
  assert.equal(calculateConsecutiveStreak(brokenStreak, ref), 0);

  // Zero-second days do not extend streak; timezone-offset ISO strings normalize to UTC day
  const tzAndZero = [
    { date: '2026-11-27T01:30:00+05:30', seconds_active: 120 }, // 2026-11-26 UTC (yesterday)
    { date: '2026-11-25', seconds_active: 120 },
    { date: '2026-11-24', seconds_active: 0 },
  ];
  assert.equal(calculateConsecutiveStreak(tzAndZero, ref), 2);
});
