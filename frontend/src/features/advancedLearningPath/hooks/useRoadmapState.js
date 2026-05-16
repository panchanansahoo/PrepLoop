import { useState, useEffect, useCallback } from 'react';
import { TRACKS, TRACK_LABELS } from '../utils/roadmapData.js';
import { todayISO, mondayISO, daysBetweenISO } from '../utils/roadmapDateUtils.js';

const STORAGE_KEY = 'preploop_advanced_learning_path_v1';

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function useRoadmapState() {
  const [checked, setChecked] = useState(() => loadInitialState()?.checked || {});
  const [activeTrack, setActiveTrack] = useState(() => loadInitialState()?.activeTrack || 'dsa');
  const [weeklyGoal, setWeeklyGoal] = useState(() => loadInitialState()?.weeklyGoal || 12);
  const [weekDone, setWeekDone] = useState(() => loadInitialState()?.weekDone || 0);
  const [weekStartISO, setWeekStartISO] = useState(() => loadInitialState()?.weekStartISO || mondayISO());
  const [streakDays, setStreakDays] = useState(() => loadInitialState()?.streakDays || 0);
  const [lastActionISO, setLastActionISO] = useState(() => loadInitialState()?.lastActionISO || '');
  const [aiSelectedTracks, setAiSelectedTracks] = useState(() => loadInitialState()?.aiSelectedTracks || ['dsa', 'apt', 'sql', 'sys']);
  const [aiLastPlanText, setAiLastPlanText] = useState(() => loadInitialState()?.aiLastPlanText || '');
  const [aiDaysPerWeek, setAiDaysPerWeek] = useState(() => loadInitialState()?.aiDaysPerWeek || 5);
  const [aiCompanyMode, setAiCompanyMode] = useState(() => loadInitialState()?.aiCompanyMode || 'balanced');
  const [aiDailyBlockMin, setAiDailyBlockMin] = useState(() => loadInitialState()?.aiDailyBlockMin || 90);
  const [aiLastPlanWeeks, setAiLastPlanWeeks] = useState(() => loadInitialState()?.aiLastPlanWeeks || []);
  const [aiTaskDone, setAiTaskDone] = useState(() => loadInitialState()?.aiTaskDone || {});

  useEffect(() => {
    const currentMonday = mondayISO();
    if (weekStartISO !== currentMonday) {
      setWeekStartISO(currentMonday);
      setWeekDone(0);
    }
  }, []);

  const saveState = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        checked, activeTrack, weeklyGoal, weekDone, weekStartISO,
        streakDays, lastActionISO, aiSelectedTracks, aiLastPlanText,
        aiDaysPerWeek, aiCompanyMode, aiDailyBlockMin, aiLastPlanWeeks, aiTaskDone,
      }));
    } catch { }
  }, [checked, activeTrack, weeklyGoal, weekDone, weekStartISO, streakDays, lastActionISO, aiSelectedTracks, aiLastPlanText, aiDaysPerWeek, aiCompanyMode, aiDailyBlockMin, aiLastPlanWeeks, aiTaskDone]);

  useEffect(() => { saveState(); }, [saveState]);

  const registerDailyAction = useCallback(() => {
    const today = todayISO();
    setLastActionISO(prev => {
      if (!prev) { setStreakDays(1); return today; }
      const gap = daysBetweenISO(prev, today);
      if (gap === 0) return prev;
      if (gap === 1) setStreakDays(s => s + 1);
      else setStreakDays(1);
      return today;
    });
  }, []);

  const toggleCheck = useCallback((key, topicId) => {
    setChecked(prev => {
      const nowChecked = !prev[key];
      const currentMonday = mondayISO();
      setWeekStartISO(prevMonday => {
        if (prevMonday !== currentMonday) {
          setWeekDone(0);
          return currentMonday;
        }
        return prevMonday;
      });
      if (nowChecked) {
        setWeekDone(w => w + 1);
        registerDailyAction();
      } else {
        setWeekDone(w => Math.max(0, w - 1));
      }
      return { ...prev, [key]: nowChecked };
    });
  }, [registerDailyAction]);

  const toggleAIDayTask = useCallback((key) => {
    setAiTaskDone(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const computeProgress = useCallback(() => {
    let globalTotal = 0;
    let globalDone = 0;
    const trackPcts = {};

    for (const [trackKey, track] of Object.entries(TRACKS)) {
      let total = 0, done = 0;
      for (const topics of Object.values(track.subs)) {
        for (const t of topics) {
          t.subtopics.forEach((_, i) => { total++; if (checked[t.id + '-s' + i]) done++; });
          t.problems.forEach((_, i) => { total++; if (checked[t.id + '-p' + i]) done++; });
        }
      }
      globalTotal += total;
      globalDone += done;
      trackPcts[trackKey] = total ? Math.round(done / total * 100) : 0;
    }

    return {
      globalTotal,
      globalDone,
      overallPct: globalTotal ? Math.round(globalDone / globalTotal * 100) : 0,
      trackPcts,
      activeTrackLabel: TRACK_LABELS[activeTrack] || 'DSA',
    };
  }, [checked, activeTrack]);

  const computeConfidence = useCallback(() => {
    const trackOrder = ['dsa', 'apt', 'sql', 'sys'];
    return trackOrder.map(trackKey => {
      const track = TRACKS[trackKey];
      let total = 0, done = 0, remDiff = 0, remCount = 0;
      for (const topics of Object.values(track.subs)) {
        for (const t of topics) {
          const keys = [
            ...t.subtopics.map((_, i) => ({ key: `${t.id}-s${i}`, diff: t.diff })),
            ...t.problems.map((_, i) => ({ key: `${t.id}-p${i}`, diff: t.diff })),
          ];
          keys.forEach(item => {
            total++;
            if (checked[item.key]) done++;
            else { remCount++; remDiff += item.diff === 'Expert' ? 3 : item.diff === 'Hard' ? 2 : 1; }
          });
        }
      }
      const pct = total ? Math.round((done / total) * 100) : 0;
      const avgRemaining = remCount ? remDiff / remCount : 1;
      const confidence = Math.round(Math.max(30, Math.min(96, 38 + pct * 0.62 - ((avgRemaining - 1) * 12))));
      return { trackKey, confidence, label: TRACK_LABELS[trackKey] };
    });
  }, [checked]);

  const setAIRoadmapResult = useCallback((planText, weeks) => {
    setAiLastPlanText(planText);
    setAiLastPlanWeeks(weeks);
  }, []);

  return {
    checked, activeTrack, setActiveTrack,
    weeklyGoal, setWeeklyGoal, weekDone, setWeekDone,
    weekStartISO, setWeekStartISO, streakDays,
    aiSelectedTracks, setAiSelectedTracks,
    aiLastPlanText, aiLastPlanWeeks,
    aiDaysPerWeek, setAiDaysPerWeek,
    aiCompanyMode, setAiCompanyMode,
    aiDailyBlockMin, setAiDailyBlockMin,
    aiTaskDone, setAiTaskDone,
    toggleCheck, toggleAIDayTask,
    computeProgress, computeConfidence,
    setAIRoadmapResult,
    registerDailyAction,
  };
}
