/**
 * aiInterviewTiming.js
 *
 * Deterministic utilities for the AI interview UX:
 *  – thinking delays (human-like pause before AI responds)
 *  – deterministic scoring heuristics (replaces Math.random())
 *  – per-question time budgets
 *  – interviewer reactions (type-aware)
 *  – stage-specific silence encouragement
 */

// ── Thinking Delay ──────────────────────────────────────────────────
// Returns a deterministic delay in ms that scales with answer length,
// simulating the interviewer "reading" the response. Capped at 800 ms
// for snappy conversational feel.
function stableDelayJitter(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
        hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % 1000) / 1000;
}

export function getThinkingDelayMs(text = '', options = {}) {
    const length = String(text || '').trim().length;
    // Bounded 400ms - 900ms natural conversational pause after confirmed speech silence (Part B Section 3)
    // Instant replies (<400ms) feel robotic; over 2s feels broken.
    const base = Math.min(850, 420 + length * 0.8);
    const jitterRatio = typeof options?.jitterRatio === 'number' ? options.jitterRatio : 0.08;
    const rand = typeof options?.random === 'number'
        ? options.random
        : (options?.deterministic ? stableDelayJitter(text) : Math.random());
    const jitter = base * jitterRatio * (rand * 2 - 1);
    return Math.round(Math.min(900, Math.max(400, base + jitter)));
}

// ── Interviewer Reaction ────────────────────────────────────────────
// Pick a reaction emoji + phrase based on the score (0-100) and
// optionally the interview type for richer, contextual feedback.
const TYPE_REACTIONS = {
    dsa: {
        high: { emoji: '🎯', text: 'Clean approach with solid complexity analysis.' },
        mid: { emoji: '🤔', text: 'Good direction — let me probe deeper on trade-offs.' },
        low: { emoji: '💡', text: "Let's think through the approach step by step." },
    },
    'system-design': {
        high: { emoji: '🏗️', text: 'Strong architecture with clear trade-offs.' },
        mid: { emoji: '🤔', text: 'Interesting approach — how would it handle scale?' },
        low: { emoji: '💡', text: "Let's break the system into smaller components." },
    },
    behavioral: {
        high: { emoji: '⭐', text: 'Great example with clear impact.' },
        mid: { emoji: '🤔', text: 'Good story — can you share the specific outcome?' },
        low: { emoji: '💡', text: 'Can you recall a concrete situation to illustrate?' },
    },
    hr: {
        high: { emoji: '👏', text: 'Authentic answer — that resonates well.' },
        mid: { emoji: '😊', text: "That's a good start — let me follow up." },
        low: { emoji: '💬', text: "Let's explore that a bit more." },
    },
    technical: {
        high: { emoji: '👍', text: 'Solid technical understanding.' },
        mid: { emoji: '🤔', text: 'Let me follow up on that.' },
        low: { emoji: '💡', text: "Let's explore that further." },
    },
};

export function getInterviewerReaction(score, interviewType = null, difficulty = null) {
    const normalizedType = String(interviewType || '').toLowerCase().replace('system_design', 'system-design');
    const typeReactions = TYPE_REACTIONS[normalizedType];

    const normDiff = String(difficulty || '').toLowerCase().trim();
    let highThreshold = 80;
    let midThreshold = 60;
    if (normDiff === 'easy') {
        highThreshold = 65;
        midThreshold = 48;
    } else if (normDiff === 'hard' || normDiff === 'staff_architectural') {
        highThreshold = 82;
        midThreshold = 62;
    }

    if (typeReactions) {
        if (score >= highThreshold) return typeReactions.high;
        if (score >= midThreshold) return typeReactions.mid;
        return typeReactions.low;
    }

    // Default (generic) reactions — backward compatible
    if (score >= highThreshold) return { emoji: '👍', text: "That's a strong answer." };
    if (score >= midThreshold) return { emoji: '🤔', text: 'Let me follow up on that.' };
    return { emoji: '😐', text: "Let's explore that further." };
}

// ── Stage-Specific Silence Encouragement ────────────────────────────
// Used by the silence handler to show type-appropriate prompts instead
// of the generic "Take your time, no rush..."
const SILENCE_PROMPTS = {
    dsa: [
        'Feel free to think out loud about your approach...',
        'You can start by describing your thought process...',
        'Take a moment to consider the data structure...',
    ],
    'system-design': [
        'Consider starting with the high-level architecture...',
        'Think about what components you would need...',
        'You could start with the data flow...',
    ],
    behavioral: [
        'Take a moment to recall a specific example...',
        'Think of a situation where you faced a similar challenge...',
        'A concrete story would work well here...',
    ],
    hr: [
        'Take your time — there is no wrong answer here...',
        'Feel free to share what comes to mind naturally...',
        'You can start with what motivates you...',
    ],
    technical: [
        'Take your time to think through the approach...',
        'Feel free to start with what you know...',
        'You can walk through it step by step...',
    ],
};

/**
 * Get a stage-appropriate silence encouragement prompt.
 * @param {string} interviewType - e.g., 'dsa', 'behavioral', 'hr'
 * @param {number} silenceIndex - which silence prompt to show (cycles through available prompts)
 */
export function getSilencePrompt(interviewType = 'technical', silenceIndex = 0) {
    const normalizedType = String(interviewType || '').toLowerCase().replace('system_design', 'system-design');
    const prompts = SILENCE_PROMPTS[normalizedType] || SILENCE_PROMPTS.technical;
    return prompts[Math.abs(silenceIndex) % prompts.length];
}

// ── Deterministic Scoring Heuristics ────────────────────────────────
// These replace the old Math.random() fallback in the summary analysis.
// They produce consistent scores from the same input each time.

const TECHNICAL_KEYWORDS = [
    'algorithm', 'complexity', 'O(n)', 'O(1)', 'O(log', 'hash', 'tree',
    'graph', 'stack', 'queue', 'heap', 'sort', 'search', 'dynamic programming',
    'recursion', 'iteration', 'pointer', 'array', 'linked list', 'binary',
    'edge case', 'trade-off', 'scalab', 'latency', 'throughput', 'cache',
    'database', 'index', 'api', 'rest', 'microservice', 'component',
    'interface', 'abstract', 'pattern', 'optimize', 'refactor',
];

function countKeywordHits(text) {
    const lower = text.toLowerCase();
    return TECHNICAL_KEYWORDS.reduce(
        (hits, kw) => hits + (lower.includes(kw) ? 1 : 0),
        0,
    );
}

// Simple deterministic hash of a string to [0, 1) — used as a stable
// "jitter" factor instead of Math.random().
function stableJitter(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % 1000) / 1000;           // 0.000 – 0.999
}

/**
 * Compute deterministic communication score (0–10).
 * Factors: average response length, number of responses vs questions asked.
 */
export function communicationScore(avgResponseLength, userMsgCount, questionCount) {
    const lengthPart = Math.min(3, (avgResponseLength / 50) * 3);
    const engagementPart = Math.min(4, (userMsgCount / Math.max(questionCount, 1)) * 4);
    const jitter = stableJitter(`comm-${avgResponseLength}-${userMsgCount}`) * 1.5;
    return Math.min(10, Math.round(lengthPart + engagementPart + jitter));
}

/**
 * Compute deterministic technical score (0–10).
 * Factors: code length, line count, keyword presence.
 */
export function technicalScore(codeText, lineCount) {
    const baseScore = 3;
    const codeLengthBonus = (codeText || '').length > 100 ? 3 : 1;
    const lineBonus = lineCount > 5 ? 2 : 0;
    const keywordBonus = Math.min(2, countKeywordHits(codeText || '') * 0.4);
    return Math.min(10, Math.round(baseScore + codeLengthBonus + lineBonus + keywordBonus));
}

/**
 * Compute deterministic problem-solving score (0–10).
 * Factors: question depth reached, engagement.
 */
export function problemSolvingScore(questionIndex, userMsgCount) {
    const base = 2;
    const depthBonus = questionIndex > 2 ? 3 : 1;
    const engagementBonus = userMsgCount > 3 ? 2 : 0;
    const jitter = stableJitter(`ps-${questionIndex}-${userMsgCount}`) * 1.5;
    return Math.min(10, Math.round(base + depthBonus + engagementBonus + jitter));
}

/**
 * Compute deterministic code-quality score (0–10).
 * Factors: line count, keyword depth (patterns, edge cases, etc.).
 */
export function codeQualityScore(codeText, lineCount) {
    const base = 3;
    const lineBonus = lineCount > 10 ? 3 : 1;
    const keywordBonus = Math.min(3, countKeywordHits(codeText || '') * 0.5);
    return Math.min(10, Math.round(base + lineBonus + keywordBonus));
}

// ── Per-Question Time Budgets (seconds) ─────────────────────────────
// Total interview time: 20 minutes (1200 seconds) for 13 questions = ~92 seconds per question
export const QUESTION_TIME_LIMITS = {
    'DSA / Coding': 120,       // 2 min
    'System Design': 150,      // 2.5 min
    'Behavioral': 90,          // 1.5 min
    'Technical': 90,           // 1.5 min
    'HR': 75,                  // 1.25 min
    default: 90,               // 1.5 min fallback
};

export function getQuestionTimeLimit(stage) {
    return QUESTION_TIME_LIMITS[stage] || QUESTION_TIME_LIMITS.default;
}


// ── Conversational Transitions ──────────────────────────────────────
// Generates natural, varied interviewer transition phrases so the interviewer
// feels like an attentive human, avoiding robotic repetitions.
const HIGH_TRANSITIONS = [
    "Yeah, that's a really solid answer.",
    "Nice, I like that approach.",
    "Good thinking — that makes a lot of sense.",
    "That's exactly the kind of depth I was looking for.",
    "Great, you touched on the key points there."
];

const MID_TRANSITIONS = [
    "Got it, thanks for walking me through that.",
    "Okay, I see where you're going with that.",
    "Alright, fair enough — that gives me good context.",
    "Understood, I appreciate you explaining that.",
    "Right, okay — let me follow up on that."
];

const LOW_TRANSITIONS = [
    "Okay, let's try a slightly different angle on this.",
    "Alright, let me rephrase that a bit.",
    "Got it — let's explore this from another direction.",
    "Sure, let's dig into this a bit more.",
    "Okay, let me ask you about this differently."
];

export function getConversationalTransition(score = 70, stage = 'Technical', questionIndex = 1) {
    const list = score >= 80 ? HIGH_TRANSITIONS : (score >= 60 ? MID_TRANSITIONS : LOW_TRANSITIONS);
    const index = Math.abs(questionIndex + Math.round(score)) % list.length;
    return list[index];
}


// ── Pacing Modes & Deterministic Silence Timing ─────────────────────
export const PACING_MODES = {
    relaxed: {
        key: 'relaxed',
        label: 'Relaxed (Practice)',
        badge: 'Practice Mode',
        description: 'More think time and generous pauses. Ideal for practicing complex problem solving.',
        nudgeMs: 20_000,
        checkInMs: 40_000,
        autoAdvanceMs: 60_000,
        postSpeechSubmitMs: 5_000,
        fillerExtensionMs: 25_000,
        needAMomentMs: 30_000,
        maxNeedAMoment: 3,
        maxAnswerWaitMs: 180_000, // 3 minutes
        softWrapUpMs: 150_000,    // 2.5 minutes (30s warning)
    },
    realistic: {
        key: 'realistic',
        label: 'Realistic (Timed)',
        badge: 'Interview Mode',
        description: 'Standard interview pacing closer to real-time company interview conditions.',
        nudgeMs: 20_000,          // ~20s real silence -> offer hint
        checkInMs: 32_000,
        autoAdvanceMs: 45_000,     // ~45s real silence -> "Let's move on" and advance
        postSpeechSubmitMs: 3_500,
        fillerExtensionMs: 20_000,
        needAMomentMs: 30_000,
        maxNeedAMoment: 2,
        maxAnswerWaitMs: 180_000, // 3 minutes
        softWrapUpMs: 150_000,    // 2.5 minutes (30s warning)
    },
};

export function getModeConfig(mode = 'realistic') {
    return PACING_MODES[mode] || PACING_MODES.realistic;
}

// ── Turn Routing Decision Engine ───────────────────────────────────
// Decides whether to ask a follow-up vs move to the next planned question.
//
// Follow-up caps per answerType:
//   strong_complete   → 1 follow-up (0 if tradeOffsCovered=true)
//   partial           → up to 2 follow-ups
//   wrong             → 1 neutral-hint follow-up
//   stuck_silence     → 1 hint follow-up, then next_question
//   clarification     → clarification_response (not scored, no follow-up count)
//   dont_know         → next_question after gentle redirect (no score change)
//   off_topic         → next_question after gentle redirect
//   skipped           → next_question, not scored
//   isLastQuestion    → complete
export function decideNextTurnAction({
    topicFollowUpCount = 0,
    answerType = 'partial',
    isLastQuestion = false,
    tradeOffsCovered = false,
} = {}) {
    if (isLastQuestion) {
        return {
            action: 'complete',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: false,
            neutralReaction: false,
        };
    }

    // Skipped turns: advance immediately, do not score
    if (answerType === 'skipped') {
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: true,
            neutralReaction: false,
        };
    }

    // Timed out: candidate ran over question time budget, advance with gentle redirect
    if (answerType === 'timed_out') {
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: true,
            noScore: true,
            neutralReaction: true,
        };
    }

    // Code only: candidate wrote code without verbal answer, prompt once to explain
    if (answerType === 'code_only') {
        if (topicFollowUpCount < 1) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: false,
                noScore: false,
                neutralReaction: false,
                promptCue: 'Walk me through what this code does.',
            };
        }
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: false,
            neutralReaction: false,
        };
    }

    // Repeated answer: avoid repetitive loops, redirect to another perspective
    if (answerType === 'repeated') {
        if (topicFollowUpCount < 1) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: true,
                noScore: false,
                neutralReaction: true,
                promptCue: 'You mentioned that earlier — can you share another angle or trade-off?',
            };
        }
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: true,
            noScore: false,
            neutralReaction: true,
        };
    }

    // Clarification: answer or repeat question, never scored, never counts as follow-up
    if (answerType === 'clarification') {
        return {
            action: 'clarification_response',
            nextTopicFollowUpCount: topicFollowUpCount, // unchanged
            needsRedirect: false,
            noScore: true,
            neutralReaction: false,
        };
    }

    // dont_know and off_topic: gentle redirect then move on; reaction must be neutral
    if (answerType === 'dont_know' || answerType === 'off_topic') {
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: true,
            noScore: false,
            neutralReaction: true,
        };
    }

    // wrong: neutral hint, one follow-up within cap (cap = 1)
    if (answerType === 'wrong') {
        if (topicFollowUpCount < 1) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: false,
                noScore: false,
                neutralReaction: true, // reaction must be neutral for wrong answers
            };
        }
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: false,
            neutralReaction: true,
        };
    }

    // stuck_silence: one hint follow-up, then move on
    if (answerType === 'stuck_silence') {
        if (topicFollowUpCount < 1) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: false,
                noScore: false,
                neutralReaction: false,
            };
        }
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: false,
            neutralReaction: false,
        };
    }

    // strong_complete: at most 1 follow-up; skip entirely if trade-offs already covered
    if (answerType === 'strong_complete') {
        const cap = tradeOffsCovered ? 0 : 1;
        if (topicFollowUpCount < cap) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: false,
                noScore: false,
                neutralReaction: false,
            };
        }
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: false,
            neutralReaction: false,
        };
    }

    // partial: up to 2 follow-ups
    if (answerType === 'partial') {
        if (topicFollowUpCount < 2) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: false,
                noScore: false,
                neutralReaction: false,
            };
        }
        return {
            action: 'next_question',
            nextTopicFollowUpCount: 0,
            needsRedirect: false,
            noScore: false,
            neutralReaction: false,
        };
    }

    // Fallback: unrecognized answerType → move to next question
    return {
        action: 'next_question',
        nextTopicFollowUpCount: 0,
        needsRedirect: false,
        noScore: false,
        neutralReaction: false,
    };
}

// ── Terminal Filler Phrase Engine ──────────────────────────────────
// Only matches when word count is small (<15 words) and phrase is at the VERY END.
// Prevents false positives like "in second normal form".
export const TERMINAL_FILLER_REGEX = /\b(let me think|give me a second|one moment|hold on|give me a moment|let me see)\s*[.?!]*$/i;
export const MAX_FILLER_WORD_COUNT = 15;

export function detectTerminalFiller(transcript) {
    if (!transcript || typeof transcript !== 'string') return false;
    const trimmed = transcript.trim();
    if (!trimmed) return false;
    const words = trimmed.split(/\s+/);
    if (words.length > MAX_FILLER_WORD_COUNT) return false;
    return TERMINAL_FILLER_REGEX.test(trimmed);
}

// ── Lightweight Telemetry Logger ───────────────────────────────────
export const interviewTelemetryLog = [];

export function clearInterviewTelemetryLog() {
    interviewTelemetryLog.length = 0;
}

export function logInterviewTelemetry(event, payload = {}) {
    try {
        const telemetryRecord = {
            event,
            timestamp: Date.now(),
            ...payload,
        };
        interviewTelemetryLog.push(telemetryRecord);
        if (interviewTelemetryLog.length > 500) {
            interviewTelemetryLog.shift();
        }
        if (typeof window !== 'undefined' && window.localStorage?.getItem('debugTelemetry') === 'true') {
            console.info('[Telemetry:InterviewTiming]', telemetryRecord);
        }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('preploop:interview_telemetry', { detail: telemetryRecord }));
        }
    } catch {
        /* Telemetry must never crash the UI */
    }
}

export function getInterviewTelemetrySummary() {
    const latencyEvents = interviewTelemetryLog.filter(e => e.event === 'last_speech_to_first_audio_latency');
    const latencies = latencyEvents.map(e => e.latencyMs).filter(n => typeof n === 'number' && Number.isFinite(n)).sort((a, b) => a - b);
    const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)] : null;
    const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : null;
    const latestResumeEvent = [...interviewTelemetryLog].reverse().find(e => e.event === 'turn_resume_rate');
    return {
        samples: latencies.length,
        p50,
        p95,
        min: latencies[0] ?? null,
        max: latencies[latencies.length - 1] ?? null,
        resumeRate: latestResumeEvent?.resumeRate ?? 0,
        resumedTurns: latestResumeEvent?.resumedTurns ?? 0,
        totalTurns: latestResumeEvent?.totalTurns ?? 0,
        allEvents: [...interviewTelemetryLog],
        turnTimelines: [...turnTimelines],
    };
}


// ── Per-Turn Timeline Recorder & Filler Word Detector ─────────────────
export const turnTimelines = [];

export function clearTurnTimelines() {
    turnTimelines.length = 0;
}

export function recordTurnEvent(turnIndex, eventName, metadata = {}) {
    const now = Date.now();
    let turnObj = turnTimelines.find(t => t.turnIndex === turnIndex);
    if (!turnObj) {
        turnObj = { turnIndex, startedAt: now, events: [] };
        turnTimelines.push(turnObj);
        if (turnTimelines.length > 50) turnTimelines.shift();
    }
    const prevEvent = turnObj.events[turnObj.events.length - 1];
    turnObj.events.push({
        name: eventName,
        timestamp: now,
        deltaFromPrevMs: prevEvent ? now - prevEvent.timestamp : 0,
        deltaFromStartMs: now - turnObj.startedAt,
        ...metadata,
    });
}

export function isTrailingFiller(text = '') {
    const trimmed = String(text || '').trim();
    return /(?:\b(?:um|uh|uhh|umm|so|like|well|you know|and|or|but|i mean|basically|actually)\b[.?!,\s]*$|\.{2,}$)/i.test(trimmed);
}

// ── Turn-Taking State Analysis (Part A Section 2) ───────────────────
// Detects whether a spoken candidate turn is clearly finished vs unfinished.
// Unfinished: trailing "and", "so", "because", trailing prepositions, or incomplete half-sentence.
// Finished: complete clause with terminal punctuation or explicit "that's it" / "that's all".
export const UNFINISHED_CONNECTOR_REGEX = /\b(?:and|so|because|or|but|like|which|then|specifically|for example|for instance|if|when|where|while|since|with|to|from|about)\s*[,.]*$/i;
export const DEFINITIVE_ENDING_REGEX = /(?:that's all|that is all|i'm done|i am done|that's it|my approach|concludes my answer|done)[.?!]*$/i;

export function isUnfinishedTurn(text = '') {
    const trimmed = String(text || '').trim();
    if (!trimmed) return true;
    if (UNFINISHED_CONNECTOR_REGEX.test(trimmed)) return true;
    // Trailing comma or open clause indicator
    if (/,\s*$/.test(trimmed) || /\.{2,}$/.test(trimmed)) return true;
    return false;
}

export function isFinishedTurn(text = '') {
    const trimmed = String(text || '').trim();
    if (!trimmed) return false;
    if (DEFINITIVE_ENDING_REGEX.test(trimmed)) return true;
    // Complete clause ending with terminal punctuation and without a hanging connector
    const words = trimmed.split(/\s+/).filter(Boolean);
    const hasPunctuation = /[.!?]$/.test(trimmed);
    return hasPunctuation && words.length >= 4 && !isUnfinishedTurn(trimmed);
}

// ── Semantic Silence & Turn-Taking Threshold Engine ────────────────
// Scales required silence duration based on interview stage and word count.
// Uses adaptive silence (1.5s - 3.6s cap), the filler allowance, and the 2s resume window.
export function getSemanticSilenceThreshold({ stage = 'Technical', wordCount = 0, text = '', candidatePacingOffset = 0, isCodingActive = false } = {}) {
    const trimmed = String(text || '').trim();

    // Definitively finished turns trigger immediate snappy 1500ms submission
    if (isFinishedTurn(trimmed) && !isCodingActive) {
        return 1500;
    }

    const unfinishedBonus = isUnfinishedTurn(trimmed) ? 1000 : 0;
    const fillerBonus = isTrailingFiller(trimmed) ? 1200 : 0;

    // Detect mid-list or trailing enumeration (e.g. "first...", "secondly...", "also,", trailing comma)
    const isMidList = /(?:\b(?:firstly|first|secondly|second|third|also|additionally|plus)\b[^.!?]*$|,\s*$)/i.test(trimmed);
    const listMomentumBonus = isMidList ? 500 : 0;

    // Active coding/typing buffer: allows thought and typing without auto-submitting
    const codingBonus = isCodingActive ? 1400 : 0;

    const baseOffset = Number.isFinite(candidatePacingOffset) ? candidatePacingOffset : 0;
    // Clamp individual pacing offset to [-300ms, +500ms]
    const clampedOffset = Math.max(-300, Math.min(500, baseOffset));

    const isTechnical = /tech|dsa|coding|system[-_\s]?design/i.test(stage || '');
    const isBehavioral = /behavioral|hr/i.test(stage || '');

    let threshold = 2000;
    if (isTechnical) {
        threshold = wordCount < 15 ? 2500 : 2000;
    } else if (isBehavioral) {
        threshold = wordCount < 12 ? 2200 : 1800;
    } else {
        threshold = wordCount < 10 ? 2200 : 1800;
    }

    // Clamped up to 3600ms for voice-only, or 5000ms when candidate is actively coding
    const maxThreshold = isCodingActive ? 5000 : 3600;
    const totalBonus = Math.max(fillerBonus, unfinishedBonus, listMomentumBonus, codingBonus);
    return Math.min(maxThreshold, Math.max(1500, threshold + totalBonus + clampedOffset));
}
