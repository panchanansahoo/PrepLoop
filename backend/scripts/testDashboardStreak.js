import assert from 'node:assert/strict';
import { calculateDashboardStreak } from '../utils/dashboardStreak.js';

function toDateKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function run() {
  const today = toDateKey(0);
  const yesterday = toDateKey(-1);
  const twoDaysAgo = toDateKey(-2);

  // Mixed input format should still count as a continuous streak.
  const result = calculateDashboardStreak({
    submissionDateKeys: [yesterday, twoDaysAgo],
    activityDateValues: [`${today}T07:30:00.000Z`],
  });

  assert.equal(result.currentStreak, 3, 'current streak should include timestamp-formatted activity dates');
  assert.ok(result.bestStreak >= 3, 'best streak should be at least current streak for continuous dates');
  assert.equal(result.weekProgress.length, 7, 'weekProgress should always include 7 days');

  // Streak should begin from yesterday when there is no activity today.
  const fromYesterday = calculateDashboardStreak({
    submissionDateKeys: [yesterday],
    activityDateValues: [],
  });

  assert.equal(fromYesterday.currentStreak, 1, 'current streak should count from yesterday if today is missing');

  // Gapped activity should break streak growth.
  const broken = calculateDashboardStreak({
    submissionDateKeys: [today, twoDaysAgo],
    activityDateValues: [],
  });

  assert.equal(broken.currentStreak, 1, 'gap in consecutive days must break current streak');

  console.log('testDashboardStreak passed');
}

run();
