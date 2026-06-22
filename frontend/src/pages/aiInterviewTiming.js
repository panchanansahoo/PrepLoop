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
export function getThinkingDelayMs(text = '') {
    const length = String(text || '').trim().length;
    const base = Math.min(800, 200 + length * 1.5);
    // Add ±30% randomness to avoid predictable timing
    const jitter = base * 0.3 * (Math.random() * 2 - 1);
    return Math.round(Math.min(1000, Math.max(200, base + jitter)));
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

export function getInterviewerReaction(score, interviewType = null) {
    const normalizedType = String(interviewType || '').toLowerCase().replace('system_design', 'system-design');
    const typeReactions = TYPE_REACTIONS[normalizedType];

    if (typeReactions) {
        if (score >= 80) return typeReactions.high;
        if (score >= 60) return typeReactions.mid;
        return typeReactions.low;
    }

    // Default (generic) reactions — backward compatible
    if (score >= 80) return { emoji: '👍', text: "That's a strong answer." };
    if (score >= 60) return { emoji: '🤔', text: 'Let me follow up on that.' };
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
