import { useState, useEffect, useCallback } from 'react';
import { TRACKS, TRACK_LABELS, STORAGE_KEY } from '../data/advancedLearningPathData';

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDateISO(d) { return d.toISOString().slice(0, 10); }

function mondayISO(dateObj = new Date()) {
  const date = new Date(dateObj);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date.toISOString().slice(0, 10);
}

function daysBetweenISO(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
}

const DEFAULT_STATE = {
  checked: {},
  activeTrack: 'dsa',
  weeklyGoal: 12,
  weekDone: 0,
  weekStartISO: '',
  streakDays: 0,
  lastActionISO: '',
  aiSelectedTracks: ['dsa','apt','sql','sys'],
  aiLastPlanText: '',
  aiDaysPerWeek: 5,
  aiCompanyMode: 'balanced',
  aiDailyBlockMin: 90,
  aiLastPlanWeeks: [],
  aiTaskDone: {},
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const p = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...p };
  } catch { return { ...DEFAULT_STATE }; }
}

export function useAdvancedLearningPath() {
  const [state, setState] = useState(loadState);

  const save = useCallback((next) => {
    setState(prev => {
      const merged = typeof next === 'function' ? next(prev) : { ...prev, ...next };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
      return merged;
    });
  }, []);

  // Ensure week window on mount
  useEffect(() => {
    const cm = mondayISO();
    setState(prev => {
      if (!prev.weekStartISO || prev.weekStartISO !== cm) {
        const updated = { ...prev, weekStartISO: cm, weekDone: prev.weekStartISO !== cm ? 0 : prev.weekDone };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      }
      return prev;
    });
  }, []);

  const toggleCheck = useCallback((key) => {
    save(prev => {
      const nowChecked = !prev.checked[key];
      const newChecked = { ...prev.checked, [key]: nowChecked };
      const today = todayISO();
      let streak = prev.streakDays;
      let lastAction = prev.lastActionISO;
      let weekDone = prev.weekDone;

      if (nowChecked) {
        weekDone += 1;
        if (!lastAction) { streak = 1; }
        else {
          const gap = daysBetweenISO(lastAction, today);
          if (gap === 1) streak += 1;
          else if (gap > 1) streak = 1;
        }
        lastAction = today;
      } else if (weekDone > 0) { weekDone -= 1; }

      return { ...prev, checked: newChecked, weekDone, streakDays: streak, lastActionISO: lastAction };
    });
  }, [save]);

  const adjustGoal = useCallback((delta) => {
    save(prev => ({ ...prev, weeklyGoal: Math.max(1, Math.min(200, prev.weeklyGoal + delta)) }));
  }, [save]);

  const resetWeek = useCallback(() => {
    save(prev => ({ ...prev, weekDone: 0, weekStartISO: mondayISO() }));
  }, [save]);

  const toggleAITrack = useCallback((track) => {
    save(prev => {
      let tracks = prev.aiSelectedTracks.includes(track)
        ? prev.aiSelectedTracks.filter(t => t !== track)
        : [...prev.aiSelectedTracks, track];
      if (!tracks.length) tracks = ['dsa'];
      return { ...prev, aiSelectedTracks: tracks };
    });
  }, [save]);

  const toggleAITaskDone = useCallback((key) => {
    save(prev => ({ ...prev, aiTaskDone: { ...prev.aiTaskDone, [key]: !prev.aiTaskDone[key] } }));
  }, [save]);

  // Progress computation
  const progress = {};
  let globalTotal = 0, globalDone = 0;
  for (const [tk, track] of Object.entries(TRACKS)) {
    let total = 0, done = 0;
    for (const topics of Object.values(track.subs)) {
      for (const t of topics) {
        t.subtopics.forEach((_, i) => { total++; if (state.checked[t.id + '-s' + i]) done++; });
        t.problems.forEach((_, i) => { total++; if (state.checked[t.id + '-p' + i]) done++; });
      }
    }
    globalTotal += total; globalDone += done;
    progress[tk] = { total, done, pct: total ? Math.round(done / total * 100) : 0 };
  }

  // Confidence
  const confidence = {};
  const diffWeight = (d) => d === 'Expert' ? 3 : d === 'Hard' ? 2 : 1;
  for (const [tk, track] of Object.entries(TRACKS)) {
    let total = 0, done = 0, remDiff = 0, remCount = 0;
    for (const topics of Object.values(track.subs)) {
      for (const t of topics) {
        [...t.subtopics.map((_, i) => ({ key: `${t.id}-s${i}`, diff: t.diff })),
         ...t.problems.map((_, i) => ({ key: `${t.id}-p${i}`, diff: t.diff }))].forEach(item => {
          total++;
          if (state.checked[item.key]) done++;
          else { remCount++; remDiff += diffWeight(item.diff); }
        });
      }
    }
    const pct = total ? Math.round(done / total * 100) : 0;
    const avg = remCount ? remDiff / remCount : 1;
    confidence[tk] = Math.round(Math.max(30, Math.min(96, 38 + pct * 0.62 - (avg - 1) * 12)));
  }

  return {
    state, save, toggleCheck, adjustGoal, resetWeek,
    toggleAITrack, toggleAITaskDone,
    progress, confidence,
    globalTotal, globalDone,
    globalPct: globalTotal ? Math.round(globalDone / globalTotal * 100) : 0,
  };
}

// AI Roadmap Generator
export function generateRoadmap(opts) {
  const { months, startDate, intensity, bufferPct, daysPerWeek, deadline, companyMode, dailyBlockMin, selectedTracks } = opts;
  const itemsPerWeek = intensity === 'light' ? 2 : intensity === 'intense' ? 4 : 3;
  const baseDate = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  let totalWeeks = Math.max(4, Math.round(months * 4.35));

  if (deadline) {
    const diff = Math.ceil((new Date(deadline + 'T00:00:00') - baseDate) / 86400000);
    if (diff > 0) totalWeeks = Math.max(1, Math.ceil(diff / 7));
  }

  const effectiveWeeks = Math.max(2, Math.round(totalWeeks * (1 - bufferPct / 100)));
  const presets = { balanced: { dsa:1,apt:1,sql:1,sys:1 }, faang: { dsa:3,apt:1,sql:1,sys:2 }, data: { dsa:1,apt:2,sql:3,sys:1 }, product: { dsa:2,apt:1,sql:2,sys:2 } };
  const w = presets[companyMode] || presets.balanced;
  const bag = [];
  selectedTracks.forEach(t => { for (let i = 0; i < Math.max(1, w[t] || 1); i++) bag.push(t); });

  const queues = {};
  selectedTracks.forEach(t => {
    queues[t] = [];
    for (const topics of Object.values(TRACKS[t].subs)) {
      for (const topic of topics) queues[t].push(topic);
    }
  });
  const pointers = Object.fromEntries(selectedTracks.map(t => [t, 0]));

  const weeks = [];
  let rr = 0;
  for (let week = 1; week <= effectiveWeeks; week++) {
    let picked = bag[rr % bag.length];
    let guard = 0;
    while (pointers[picked] >= queues[picked].length && guard < selectedTracks.length + 2) { rr++; picked = bag[rr % bag.length]; guard++; }

    const chunk = [];
    for (let i = 0; i < itemsPerWeek; i++) {
      if (pointers[picked] < queues[picked].length) { chunk.push(queues[picked][pointers[picked]]); pointers[picked]++; }
    }
    if (!chunk.length) break;

    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + (week - 1) * 7);
    const end = new Date(start); end.setDate(start.getDate() + 6);

    const dayPlan = [];
    for (let d = 0; d < daysPerWeek; d++) {
      const date = new Date(start); date.setDate(start.getDate() + d);
      if (d < chunk.length) {
        dayPlan.push({ dateISO: formatDateISO(date), task: `${chunk[d].title} (${chunk[d].diff}) - ${dailyBlockMin} min` });
      } else {
        const fillers = ['Topic revision + summary notes', 'Timed mock set + analysis', 'Weak-area drill + error log updates'];
        dayPlan.push({ dateISO: formatDateISO(date), task: `${fillers[d % fillers.length]} - ${dailyBlockMin} min` });
      }
    }

    const avgDiff = chunk.reduce((a, t) => a + (t.diff === 'Expert' ? 3 : t.diff === 'Hard' ? 2 : 1), 0) / chunk.length;
    const conf = Math.round(Math.max(35, Math.min(95, 92 - ((avgDiff - 1) / 2) * 55 - Math.max(0, (itemsPerWeek - Math.max(2, daysPerWeek - 1)) * 6))));

    weeks.push({ week, track: picked, startISO: formatDateISO(start), endISO: formatDateISO(end), chunk, dayPlan, confidence: conf });
    rr++;
  }

  const revisionWeeks = Math.max(1, totalWeeks - weeks.length);
  // Build plan text
  const lines = [`AI Generated Prep Plan (${months} months)`, `Start: ${formatDateISO(baseDate)}`, ''];
  weeks.forEach(w => {
    lines.push(`Week ${w.week} [${w.startISO} to ${w.endISO}] - ${TRACK_LABELS[w.track]}: ${w.chunk.map(c => c.title).join(' | ')}`);
    w.dayPlan.forEach((d, i) => lines.push(`  Day ${i + 1} ${d.dateISO}: ${d.task}`));
  });
  lines.push('', `Reserve ${revisionWeeks} week(s) for revision.`);

  return { weeks, planText: lines.join('\n'), revisionWeeks };
}

// Export utilities
export function exportICS(weeks) {
  const stamp = todayISO().replace(/-/g, '') + 'T000000Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PrepLoop//AI Roadmap//EN', 'CALSCALE:GREGORIAN'];
  weeks.forEach((w, wi) => {
    w.dayPlan.forEach((d, di) => {
      const next = new Date(d.dateISO + 'T00:00:00'); next.setDate(next.getDate() + 1);
      lines.push('BEGIN:VEVENT', `UID:preploop-${wi}-${di}@preploop`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${d.dateISO.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${formatDateISO(next).replace(/-/g, '')}`,
        `SUMMARY:PrepLoop ${TRACK_LABELS[w.track]} - ${d.task}`, 'END:VEVENT');
    });
  });
  lines.push('END:VCALENDAR');
  download('preploop-roadmap.ics', lines.join('\r\n'), 'text/calendar');
}

export function exportJSON(weeks) {
  download('preploop-roadmap.json', JSON.stringify({ generatedOn: todayISO(), weeks }, null, 2), 'application/json');
}

export function exportGoogleCSV(weeks) {
  const rows = [['Subject','Start Date','End Date','All Day Event','Description'].join(',')];
  weeks.forEach(w => {
    w.dayPlan.forEach(d => {
      const dt = new Date(d.dateISO + 'T00:00:00');
      const gd = `${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}/${dt.getFullYear()}`;
      rows.push([esc(`PrepLoop ${TRACK_LABELS[w.track]}: ${d.task}`), esc(gd), esc(gd), esc('True'), esc(`Week ${w.week}`)].join(','));
    });
  });
  download('preploop-roadmap-google-calendar.csv', rows.join('\n'), 'text/csv');
}

function esc(v) { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function download(name, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
