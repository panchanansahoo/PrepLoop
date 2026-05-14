/**
 * SpeechAnalyzer — Real-time speech analytics for mock interviews
 * Detects fillers, tracks pace (WPM), scores confidence & clarity
 */

const FILLER_WORDS = [
  'um', 'uh', 'erm', 'ah',
  'like', 'you know', 'basically', 'actually',
  'literally', 'so', 'right', 'i mean',
  'kind of', 'sort of', 'well', 'okay so',
];

const FILLER_REGEXES = FILLER_WORDS.map(fw => ({
  word: fw,
  regex: new RegExp(`\\b${fw.replace(/\s+/g, '\\s+')}\\b`, 'gi'),
}));

export default class SpeechAnalyzer {
  constructor() {
    this.reset();
  }

  reset() {
    this.history = [];          // rolling window of { timestamp, wordCount, fillers }
    this.totalFillerMap = {};
    this.totalWords = 0;
    this.totalFillers = 0;
    this.lastTranscript = '';
    this.sentenceCount = 0;
  }

  /**
   * Analyze a cumulative transcript and return live metrics.
   * Call this on every speech-recognition result event.
   * @param {string} transcript — full cumulated transcript so far
   * @param {number} durationSecs — total seconds since user started speaking
   * @returns {object} metrics
   */
  analyze(transcript, durationSecs) {
    if (!transcript || durationSecs <= 0) {
      return this._emptyResult();
    }

    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lowerTranscript = transcript.toLowerCase();

    // ── Filler detection ──
    const fillerCount = {};
    let totalFillers = 0;
    for (const { word, regex } of FILLER_REGEXES) {
      regex.lastIndex = 0;
      const matches = lowerTranscript.match(regex);
      if (matches && matches.length > 0) {
        fillerCount[word] = matches.length;
        totalFillers += matches.length;
      }
    }

    // ── Pace (WPM) ──
    const wpm = durationSecs > 0 ? Math.round((wordCount / durationSecs) * 60) : 0;

    // ── Pace assessment ──
    let paceStatus = 'good';
    let paceLabel = 'Good pace';
    if (wpm < 100) { paceStatus = 'slow'; paceLabel = 'Speak a bit faster'; }
    else if (wpm > 180) { paceStatus = 'fast'; paceLabel = 'Slow down slightly'; }
    else if (wpm >= 130 && wpm <= 160) { paceStatus = 'excellent'; paceLabel = 'Excellent pace!'; }

    // ── Filler rate ──
    const fillerRate = wordCount > 0 ? ((totalFillers / wordCount) * 100) : 0;

    // ── Vocabulary complexity (avg word length) ──
    const avgWordLen = words.length > 0
      ? words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.length
      : 0;

    // ── Sentence detection ──
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 3);
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

    // ── Confidence Score (0–100) ──
    let confidenceScore = 70;
    if (wpm >= 120 && wpm <= 170) confidenceScore += 10;
    else if (wpm < 90) confidenceScore -= 10;
    else if (wpm > 190) confidenceScore -= 5;

    if (totalFillers <= 2) confidenceScore += 10;
    else if (totalFillers >= 8) confidenceScore -= 15;
    else if (totalFillers >= 5) confidenceScore -= 8;

    if (avgWordLen > 4.5) confidenceScore += 5;
    if (wordCount > 50) confidenceScore += 5;
    if (sentenceCount >= 3 && avgWordsPerSentence < 30) confidenceScore += 5;
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));

    // ── Repeated Words detection ──
    let repeatedWordsCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
        // basic normalization to ignore case and simple punctuation connected to words
        const w1 = words[i].toLowerCase().replace(/[^a-z0-9]/g, '');
        const w2 = words[i + 1].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (w1 && w2 && w1 === w2) {
            repeatedWordsCount++;
        }
    }

    // ── Clarity Score (0–100) ──
    let clarityScore = 85;
    if (totalFillers > 5) clarityScore -= totalFillers * 2;
    if (wpm < 90 || wpm > 190) clarityScore -= 10;
    if (avgWordsPerSentence > 35) clarityScore -= 8; // run-on sentences
    if (repeatedWordsCount > 0) clarityScore -= (repeatedWordsCount * 3); // penalize repeated words
    clarityScore = Math.max(0, Math.min(100, clarityScore));

    // ── Real-time nudges ──
    const nudges = [];
    if (fillerRate > 5) nudges.push({ type: 'filler', text: `Reduce filler words — ${Object.keys(fillerCount).slice(0, 3).join(', ')}` });
    if (wpm < 100 && durationSecs > 5) nudges.push({ type: 'pace', text: 'Speak with more confidence and energy' });
    if (wpm > 180) nudges.push({ type: 'pace', text: 'Slow down for better clarity' });
    if (wordCount > 20 && sentenceCount < 2) nudges.push({ type: 'structure', text: 'Break your answer into clear points' });
    if (repeatedWordsCount >= 2) nudges.push({ type: 'repetition', text: 'Take a breath to avoid repeating words' });
    if (wordCount > 10 && !transcript.match(/because|since|therefore|however|although/i)) {
      nudges.push({ type: 'depth', text: 'Add reasoning — explain WHY' });
    }

    // ── Tips generation ──
    const tips = this._generateTips(wpm, totalFillers, fillerCount, confidenceScore, sentenceCount);

    return {
      wordCount,
      wpm,
      paceStatus,
      paceLabel,
      fillerCount,
      totalFillers,
      fillerRate: Math.round(fillerRate * 10) / 10,
      confidenceScore,
      clarityScore,
      avgWordLen: Math.round(avgWordLen * 10) / 10,
      sentenceCount,
      repeatedWordsCount,
      nudges,
      tips,
    };
  }

  /**
   * Analyze a completed answer for the post-answer summary card.
   * Returns a richer analysis with highlights.
   */
  analyzeComplete(transcript, durationSecs) {
    const base = this.analyze(transcript, durationSecs);
    if (!transcript) return { ...base, highlights: [] };

    const highlights = [];
    const words = transcript.split(/\s+/);
    const segmentSize = Math.ceil(words.length / 5); // 5 segments

    for (let i = 0; i < 5 && i * segmentSize < words.length; i++) {
      const segment = words.slice(i * segmentSize, (i + 1) * segmentSize).join(' ');
      const segmentLower = segment.toLowerCase();
      let segmentFillers = 0;
      for (const { regex } of FILLER_REGEXES) {
        regex.lastIndex = 0;
        const m = segmentLower.match(regex);
        if (m) segmentFillers += m.length;
      }

      const timeStart = Math.round((i * segmentSize / words.length) * durationSecs);
      const timeEnd = Math.round(((i + 1) * segmentSize / words.length) * durationSecs);

      if (segmentFillers >= 3) {
        highlights.push({
          type: 'filler_spike',
          label: `Filler spike (${segmentFillers} fillers)`,
          timeStart,
          timeEnd,
          severity: 'warning',
        });
      } else if (segmentFillers === 0 && segment.split(/\s+/).length > 10) {
        highlights.push({
          type: 'confident',
          label: 'Confident delivery',
          timeStart,
          timeEnd,
          severity: 'good',
        });
      }
    }

    return { ...base, highlights };
  }

  _generateTips(wpm, totalFillers, fillerCount, confidenceScore, sentenceCount) {
    const tips = [];
    if (totalFillers > 3) {
      const topFillers = Object.entries(fillerCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => `"${w}"`)
        .join(', ');
      tips.push(`Reduce filler words (found ${totalFillers}× — mainly ${topFillers})`);
    } else {
      tips.push('Great job minimizing filler words!');
    }

    if (wpm < 120) tips.push('Try speaking a bit faster to maintain engagement');
    else if (wpm > 170) tips.push('Slow down slightly for better audience comprehension');
    else tips.push('Your speaking pace is in the ideal range');

    if (confidenceScore < 70) tips.push('Project more assertiveness — own your answers!');
    tips.push('Pause briefly between key points for emphasis');

    return tips;
  }

  _emptyResult() {
    return {
      wordCount: 0, wpm: 0, paceStatus: 'waiting', paceLabel: 'Start speaking...',
      fillerCount: {}, totalFillers: 0, fillerRate: 0,
      confidenceScore: 0, clarityScore: 0, avgWordLen: 0, sentenceCount: 0, repeatedWordsCount: 0,
      nudges: [], tips: [],
    };
  }
}

/**
 * Format seconds as mm:ss
 */
export function formatTimestamp(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
