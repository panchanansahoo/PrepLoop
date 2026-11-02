const test = require('node:test');
const assert = require('node:assert/strict');

// Extracted dashboard stats aggregator logic from userApi.js
function calculateDashboardStats({ historyResult, activityResult, progressResult }) {
  let totalInterviews = null;
  if (historyResult && historyResult.status === 'fulfilled') {
    const d = historyResult.value?.data;
    const list = Array.isArray(d) ? d : d?.interviews || d?.data || [];
    totalInterviews = list.length;
  }

  let currentStreak = null;
  if (activityResult && activityResult.status === 'fulfilled') {
    const d = activityResult.value?.data;
    if (Array.isArray(d)) {
      currentStreak = d.filter((day) => (day.seconds_active || 0) > 0).length;
    } else {
      currentStreak = d?.streak ?? d?.currentStreak ?? null;
    }
  }

  let problemsSolved = null;
  if (progressResult && progressResult.status === 'fulfilled') {
    const d = progressResult.value?.data;
    problemsSolved =
      d?.stats?.total_solved ??
      d?.stats?.problems_solved ??
      d?.total_solved ??
      null;
  }

  return { totalInterviews, currentStreak, problemsSolved };
}

test('calculateDashboardStats extracts accurate stats from standard backend envelopes', () => {
  const stats = calculateDashboardStats({
    historyResult: {
      status: 'fulfilled',
      value: { data: { interviews: [{ id: 1 }, { id: 2 }, { id: 3 }] } },
    },
    activityResult: {
      status: 'fulfilled',
      value: {
        data: [
          { date: '2026-11-01', seconds_active: 1200 },
          { date: '2026-11-02', seconds_active: 3600 },
          { date: '2026-11-03', seconds_active: 0 },
        ],
      },
    },
    progressResult: {
      status: 'fulfilled',
      value: { data: { stats: { total_solved: 42, easy_solved: 20 } } },
    },
  });

  assert.equal(stats.totalInterviews, 3);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.problemsSolved, 42);
});

test('calculateDashboardStats degrades gracefully with partial failures', () => {
  const stats = calculateDashboardStats({
    historyResult: {
      status: 'rejected',
      reason: new Error('Network timeout'),
    },
    activityResult: {
      status: 'fulfilled',
      value: { data: { streak: 5 } },
    },
    progressResult: {
      status: 'fulfilled',
      value: { data: { total_solved: 15 } },
    },
  });

  assert.equal(stats.totalInterviews, null);
  assert.equal(stats.currentStreak, 5);
  assert.equal(stats.problemsSolved, 15);
});

