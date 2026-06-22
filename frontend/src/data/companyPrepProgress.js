import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'preploop_company_prep_progress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return null;
}

function defaultProgress() {
  return {
    solved: {},       // { questionId: true }
    notes: {},        // { questionId: "user note text" }
    bookmarked: {},   // { questionId: true }
    lastAttempted: {},// { questionId: ISO date }
    targetCompanies: [], // ['google', 'amazon']
  };
}

export function useCompanyPrepProgress(questions = []) {
  const [progress, setProgress] = useState(() => loadProgress() || defaultProgress());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggleSolved = useCallback((questionId) => {
    setProgress(prev => {
      const next = { ...prev, solved: { ...prev.solved } };
      if (next.solved[questionId]) delete next.solved[questionId];
      else {
        next.solved[questionId] = true;
        next.lastAttempted = { ...prev.lastAttempted, [questionId]: new Date().toISOString() };
      }
      return next;
    });
  }, []);

  const setNote = useCallback((questionId, note) => {
    setProgress(prev => ({
      ...prev,
      notes: { ...prev.notes, [questionId]: note }
    }));
  }, []);

  const toggleBookmark = useCallback((questionId) => {
    setProgress(prev => {
      const next = { ...prev, bookmarked: { ...prev.bookmarked } };
      if (next.bookmarked[questionId]) delete next.bookmarked[questionId];
      else next.bookmarked[questionId] = true;
      return next;
    });
  }, []);

  const setTargetCompanies = useCallback((companies) => {
    setProgress(prev => ({ ...prev, targetCompanies: companies }));
  }, []);

  const stats = useMemo(() => {
    const solvedIds = Object.keys(progress.solved);
    const solvedQuestions = questions.filter(q => progress.solved[q.id]);

    const byCompany = {};
    const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
    const byTag = {};

    solvedQuestions.forEach(q => {
      byCompany[q.company] = (byCompany[q.company] || 0) + 1;
      byDifficulty[q.difficulty]++;
      q.tags.forEach(t => { byTag[t] = (byTag[t] || 0) + 1; });
    });

    // Weak areas: tags with low solve rate
    const allTagCounts = {};
    questions.forEach(q => q.tags.forEach(t => { allTagCounts[t] = (allTagCounts[t] || 0) + 1; }));
    const weakTags = Object.entries(allTagCounts)
      .map(([tag, total]) => ({ tag, total, solved: byTag[tag] || 0, rate: (byTag[tag] || 0) / total }))
      .filter(t => t.rate < 0.3 && t.total >= 3)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 8);

    return {
      totalSolved: solvedIds.length,
      totalQuestions: questions.length,
      byCompany,
      byDifficulty,
      byTag,
      weakTags,
    };
  }, [progress.solved, questions]);

  const getRecommendations = useCallback((limit = 10) => {
    const weakTagNames = stats.weakTags.map(t => t.tag);
    const targets = new Set(progress.targetCompanies);
    const unsolved = questions.filter(q => !progress.solved[q.id]);

    // Score each unsolved question
    const scored = unsolved.map(q => {
      let score = 0;
      if (targets.size > 0 && targets.has(q.company)) score += 3;
      if (q.tags.some(t => weakTagNames.includes(t))) score += 2;
      score += q.frequencyScore;
      const recency = (new Date() - new Date(q.lastReported)) / (1000 * 60 * 60 * 24);
      if (recency < 180) score += 1;
      return { ...q, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
  }, [progress.solved, progress.targetCompanies, stats.weakTags, questions]);

  return {
    progress,
    toggleSolved,
    setNote,
    toggleBookmark,
    setTargetCompanies,
    stats,
    getRecommendations,
    isSolved: (id) => !!progress.solved[id],
    isBookmarked: (id) => !!progress.bookmarked[id],
    getNote: (id) => progress.notes[id] || '',
  };
}
