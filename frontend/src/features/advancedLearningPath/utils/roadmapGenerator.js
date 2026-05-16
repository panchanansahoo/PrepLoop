import { TRACKS, TRACK_LABELS } from './roadmapData.js';
import { formatDateISO, datesBetween } from './roadmapDateUtils.js';

export function buildTrackTopicQueue(trackKey) {
  const track = TRACKS[trackKey];
  const out = [];
  for (const topics of Object.values(track.subs)) {
    for (const t of topics) {
      out.push({
        topicId: t.id,
        track: trackKey,
        title: t.title,
        diff: t.diff,
      });
    }
  }
  return out;
}

export function getItemsPerWeek(intensity) {
  if (intensity === 'light') return 2;
  if (intensity === 'intense') return 4;
  return 3;
}

export function getWeightedTracks(selectedTracks, mode) {
  const presets = {
    balanced: { dsa: 1, apt: 1, sql: 1, sys: 1 },
    faang: { dsa: 3, apt: 1, sql: 1, sys: 2 },
    data: { dsa: 1, apt: 2, sql: 3, sys: 1 },
    product: { dsa: 2, apt: 1, sql: 2, sys: 2 },
  };
  const w = presets[mode] || presets.balanced;
  const bag = [];
  selectedTracks.forEach(t => {
    const count = Math.max(1, w[t] || 1);
    for (let i = 0; i < count; i++) bag.push(t);
  });
  return bag.length ? bag : selectedTracks;
}

export function difficultyWeight(diff) {
  if (diff === 'Expert') return 3;
  if (diff === 'Hard') return 2;
  return 1;
}

export function weekConfidence(weekChunk, daysPerWeek, itemsPerWeek) {
  if (!weekChunk.length) return 50;
  const avgDifficulty = weekChunk.reduce((acc, t) => acc + difficultyWeight(t.diff), 0) / weekChunk.length;
  const difficultyPenalty = ((avgDifficulty - 1) / 2) * 55;
  const loadPenalty = Math.max(0, (itemsPerWeek - Math.max(2, daysPerWeek - 1)) * 6);
  return Math.round(Math.max(35, Math.min(95, 92 - difficultyPenalty - loadPenalty)));
}

export function isFillerTask(task) {
  const t = String(task || '').toLowerCase();
  return t.includes('revision') || t.includes('timed mock') || t.includes('weak-area');
}

export function taskKey(dateISO, task) {
  return `${dateISO}::${task}`;
}

const FILLERS = [
  'Review previous topics + summary notes',
  'Timed mock test + detailed analysis',
  'Focus on weak areas + update error log',
];

export function generateAIRoadmap({
  months,
  baseDate,
  deadlineInput,
  intensity,
  bufferPct,
  daysPerWeek,
  companyMode,
  dailyBlockMin,
  selectedTracks,
}) {
  const weightedBag = getWeightedTracks(selectedTracks, companyMode);

  const rawWeeksFromMonths = Math.max(4, Math.round(months * 4.35));
  let totalWeeks = rawWeeksFromMonths;
  if (deadlineInput) {
    const deadlineDate = new Date(deadlineInput + 'T00:00:00');
    const diffDays = Math.ceil((deadlineDate - baseDate) / 86400000);
    if (diffDays > 0) {
      totalWeeks = Math.max(1, Math.ceil(diffDays / 7));
    } else {
      return null;
    }
  }

  const effectiveWeeks = Math.max(2, Math.round(totalWeeks * (1 - bufferPct / 100)));
  const itemsPerWeek = getItemsPerWeek(intensity);
  const safeDaysPerWeek = Math.max(1, Math.min(7, daysPerWeek));

  const queues = {};
  selectedTracks.forEach(t => { queues[t] = buildTrackTopicQueue(t); });
  const pointers = Object.fromEntries(selectedTracks.map(t => [t, 0]));

  const weeks = [];
  let rr = 0;
  for (let week = 1; week <= effectiveWeeks; week++) {
    let pickedTrack = weightedBag[rr % weightedBag.length];
    let guard = 0;
    while (pointers[pickedTrack] >= queues[pickedTrack].length && guard < selectedTracks.length + 2) {
      rr += 1;
      pickedTrack = weightedBag[rr % weightedBag.length];
      guard += 1;
    }

    const chunk = [];
    for (let i = 0; i < itemsPerWeek; i++) {
      if (pointers[pickedTrack] < queues[pickedTrack].length) {
        chunk.push(queues[pickedTrack][pointers[pickedTrack]]);
        pointers[pickedTrack] += 1;
      }
    }

    if (!chunk.length) break;

    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const studyDates = datesBetween(start, safeDaysPerWeek);
    const dayPlan = studyDates.map((d, index) => {
      if (index < chunk.length) {
        const topic = chunk[index];
        return {
          dateISO: formatDateISO(d),
          task: `${topic.title} (${topic.diff}) - ${dailyBlockMin} min`,
          topicId: topic.topicId,
          track: topic.track,
        };
      }
      return {
        dateISO: formatDateISO(d),
        task: `${FILLERS[index % FILLERS.length]} - ${dailyBlockMin} min`,
      };
    });

    const confidence = weekConfidence(chunk, safeDaysPerWeek, itemsPerWeek);

    weeks.push({
      week,
      track: pickedTrack,
      startISO: formatDateISO(start),
      endISO: formatDateISO(end),
      chunk,
      dayPlan,
      confidence,
    });

    rr += 1;
  }

  const revisionWeeks = Math.max(1, totalWeeks - weeks.length);

  return { weeks, revisionWeeks, totalWeeks };
}

export function rebuildPlanTextFromWeeks(weeks, months, baseDate, deadlineInput, revisionWeeks, daysPerWeek, companyMode, dailyBlockMin) {
  const lines = [];
  lines.push(`AI Generated Prep Plan (${months} months)`);
  lines.push(`Start Date: ${formatDateISO(baseDate)}`);
  if (deadlineInput) {
    lines.push(`Interview Date: ${deadlineInput}`);
  }
  lines.push(`Execution Weeks: ${weeks.length}, Revision Weeks: ${revisionWeeks}`);
  lines.push(`Study Days/Week: ${daysPerWeek}`);
  lines.push(`Company Mode: ${companyMode}`);
  lines.push(`Daily Block: ${dailyBlockMin} minutes`);
  lines.push('');

  weeks.forEach(w => {
    const topics = w.chunk.map(c => `${c.title} (${c.diff})`).join(' | ');
    lines.push(`Week ${w.week} [${w.startISO} to ${w.endISO}] - ${TRACK_LABELS[w.track]}: ${topics}`);
    lines.push(`  Confidence: ${w.confidence}%`);
    w.dayPlan.forEach((d, idx) => {
      lines.push(`  Day ${idx + 1} ${d.dateISO}: ${d.task}`);
    });
  });

  lines.push('');
  lines.push(`Reserve ${revisionWeeks} week(s) for revision and mock interviews.`);
  return lines.join('\n');
}
