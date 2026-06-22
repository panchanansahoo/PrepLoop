import { diffLines, diffChars } from 'diff';

export function computeDiff(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') {
    return { changed: expected !== actual, segments: [] };
  }
  const changes = diffLines(expected, actual);
  const segments = [];
  let changed = false;
  for (const part of changes) {
    if (part.added || part.removed) changed = true;
    segments.push({
      value: part.value,
      type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
      count: part.count || 0,
    });
  }
  return { changed, segments };
}

export function computeCharDiff(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') {
    return { changed: expected !== actual, segments: [] };
  }
  const changes = diffChars(expected, actual);
  const segments = [];
  let changed = false;
  for (const part of changes) {
    if (part.added || part.removed) changed = true;
    segments.push({
      value: part.value,
      type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    });
  }
  return { changed, segments };
}

export function formatExpected(expected, actual) {
  const expStr = typeof expected === 'object' ? JSON.stringify(expected, null, 2) : String(expected);
  const actStr = typeof actual === 'object' ? JSON.stringify(actual, null, 2) : String(actual);
  return {
    expected: expStr,
    actual: actStr,
    match: expStr === actStr,
    diff: computeDiff(expStr, actStr),
  };
}

export function formatTestResult(tc) {
  if (tc.passed === true) return { verdict: '✅ Passed', color: '#22c55e', icon: 'check' };
  if (tc.passed === false) {
    if (tc.error?.toLowerCase().includes('time')) return { verdict: '⏱ TLE', color: '#f59e0b', icon: 'clock' };
    if (tc.error?.toLowerCase().includes('memory')) return { verdict: '💾 MLE', color: '#f97316', icon: 'memory' };
    if (tc.error) return { verdict: `💥 ${tc.error.slice(0, 40)}`, color: '#ef4444', icon: 'error' };
    return { verdict: '❌ Wrong Answer', color: '#ef4444', icon: 'x' };
  }
  return { verdict: '○ Untested', color: '#6b7280', icon: 'circle' };
}
