const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const fromIso = trimmed.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromIso)) return fromIso;

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

export const calculateDashboardStreak = ({ submissionDateKeys = [], activityDateValues = [] } = {}) => {
  const normalizedSubmissionDates = submissionDateKeys
    .map((value) => toDateKey(value))
    .filter(Boolean);
  const normalizedActivityDates = activityDateValues
    .map((value) => toDateKey(value))
    .filter(Boolean);

  const allActivityDates = [...new Set([...normalizedSubmissionDates, ...normalizedActivityDates])]
    .sort()
    .reverse();

  let currentStreak = 0;
  let bestStreak = 0;
  const weekProgress = [false, false, false, false, false, false, false];

  if (allActivityDates.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - DAY_MS).toISOString().split('T')[0];

    if (allActivityDates[0] === today || allActivityDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < allActivityDates.length; i += 1) {
        const prev = new Date(allActivityDates[i - 1]);
        const curr = new Date(allActivityDates[i]);
        const diffDays = Math.round((prev - curr) / DAY_MS);

        if (diffDays === 1) currentStreak += 1;
        else break;
      }
    }

    let tempStreak = 1;
    const allDatesAscending = [...allActivityDates].sort();

    for (let i = 1; i < allDatesAscending.length; i += 1) {
      const prev = new Date(allDatesAscending[i - 1]);
      const curr = new Date(allDatesAscending[i]);
      const diffDays = Math.round((curr - prev) / DAY_MS);

      if (diffDays === 1) tempStreak += 1;
      else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak);

    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;

    for (let i = 0; i < 7; i += 1) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() - mondayOffset + i);
      const dateKey = checkDate.toISOString().split('T')[0];
      weekProgress[i] = allActivityDates.includes(dateKey);
    }
  }

  return {
    currentStreak,
    bestStreak,
    weekProgress,
  };
};
