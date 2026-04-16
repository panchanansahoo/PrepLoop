/**
 * aiInterviewTiming.js
 *
 * Deterministic utilities for the AI interview UX:
 *  – thinking delays (human-like pause before AI responds)
 *  – deterministic scoring heuristics (replaces Math.random())
 *  – per-question time budgets
 *  – interviewer reactions
 */

// ── Thinking Delay ──────────────────────────────────────────────────
// Returns a deterministic delay in ms that scales with answer length,
// simulating the interviewer "reading" the response. Capped at 2 000 ms.
export function getThinkingDelayMs(text = '') {
    const length = String(text || '').trim().length;
    return Math.min(2000, 600 + length * 3);
}

// ── Interviewer Reaction ────────────────────────────────────────────
// Pick a reaction emoji + phrase based on the score (0-100).
export function getInterviewerReaction(score) {
    if (score >= 80) return { emoji: '👍', text: "That's a strong answer." };
    if (score >= 60) return { emoji: '🤔', text: 'Let me follow up on that.' };
    return { emoji: '😐', text: "Let's explore that further." };
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
