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

export function getInterviewerReaction(score, type = null, difficulty = null) {
    const normalizedType = String(type || '').toLowerCase().replace('system_design', 'system-design');
    const typeReactions = TYPE_REACTIONS[normalizedType];

    const rawDiff = typeof difficulty === 'object' && difficulty !== null
        ? (difficulty.level || difficulty.difficulty || difficulty.difficultyLevel || '')
        : difficulty;
    const normDiff = String(rawDiff || '').toLowerCase().trim();

    // Thresholds default to medium (>= 78) when difficulty is omitted or medium
    let highThreshold = 78;
    let midThreshold = 60;

    if (normDiff === 'easy') {
        highThreshold = 65;
        midThreshold = 48;
    } else if (
        normDiff === 'hard' ||
        normDiff === 'staff' ||
        normDiff === 'staff_architectural' ||
        normDiff === 'staff-architectural' ||
        normDiff === 'staff architectural' ||
        normDiff === 'hard/staff' ||
        normDiff === 'hard_staff'
    ) {
        highThreshold = 82;
        midThreshold = 62;
    } else {
        // 'medium' or default fallback
        highThreshold = 78;
        midThreshold = 60;
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

export const SILENCE_PROMPT_COOLDOWN_MS = 15000;

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

/**
 * Get the estimated interview duration based on question count and stage.
 * @param {number} totalQuestions
 * @param {string} stage
 * @returns {string} e.g. "~18 min"
 */
export function getEstimatedInterviewDuration(totalQuestions = 5, stage = 'Technical') {
    const qCount = Number.isFinite(Number(totalQuestions)) && Number(totalQuestions) > 0 ? Number(totalQuestions) : 5;
    const timeLimitSec = getQuestionTimeLimit(stage);
    const estSec = Math.round(qCount * (timeLimitSec + 30));
    const mins = Math.max(1, Math.round(estSec / 60));
    return `~${mins} min`;
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

// ── Structure & Filler Words Heuristics for Communication ─────────
export const FILLER_WORDS_REGEX = /\b(?:um|uh|uhh|umm|er|like|you know|i mean|basically|actually|sort of|kind of)\b/gi;

export function countFillerWords(text = '') {
    if (!text || typeof text !== 'string') return 0;
    const matches = text.match(FILLER_WORDS_REGEX);
    return matches ? matches.length : 0;
}

export function detectStructureBonus(text = '') {
    if (!text || typeof text !== 'string') return 0;
    const lower = text.toLowerCase();
    let bonus = 0;

    // STAR method: explicit STAR mention or combination of components
    const hasExplicitStar = /\bstar\s+(?:method|framework|approach|format|technique)\b/i.test(text);
    const starComponents = [
        /\b(?:situation|context|background)\b/i.test(lower),
        /\b(?:task|goal|objective|challenge)\b/i.test(lower),
        /\b(?:action|implemented|executed|built|developed|initiated|resolved)\b/i.test(lower),
        /\b(?:result|outcome|impact|achieved|improved|delivered)\b/i.test(lower),
    ].filter(Boolean).length;

    if (hasExplicitStar || starComponents >= 3) {
        bonus = Math.max(bonus, 2);
    } else if (starComponents === 2) {
        bonus = Math.max(bonus, 1);
    }

    // Sequential structure: first/second/finally enumeration
    const hasFirst = /\b(?:first|firstly|to start|initially)\b/i.test(lower);
    const hasSecond = /\b(?:second|secondly|next|then|furthermore)\b/i.test(lower);
    const hasFinally = /\b(?:finally|lastly|in conclusion|to summarize|in summary)\b/i.test(lower);

    if (hasFirst && (hasSecond || hasFinally)) {
        const sequentialBonus = (hasFirst && hasSecond && hasFinally) ? 2 : 1.5;
        bonus = Math.max(bonus, sequentialBonus);
    }

    return Math.min(2.5, bonus);
}

export function detectFillerPenalty(text = '') {
    if (!text || typeof text !== 'string') return 0;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;
    const fillers = countFillerWords(text);
    const fillerRatio = fillers / words.length;

    if (fillers >= 6 || (words.length >= 10 && fillerRatio > 0.12)) {
        return 2;
    }
    if (fillers >= 3 || (words.length >= 10 && fillerRatio > 0.06)) {
        return 1;
    }
    return 0;
}

/**
 * Compute deterministic communication score (0–10).
 * Factors: average response length, number of responses vs questions asked,
 * structure bonus (STAR, first/second/finally), and excessive filler word penalty.
 */
export function communicationScore(avgResponseLength, userMsgCount, questionCount, textOrOptions = null) {
    let length = avgResponseLength;
    let msgCount = userMsgCount;
    let qCount = questionCount;
    let text = '';

    if (typeof avgResponseLength === 'object' && avgResponseLength !== null) {
        const options = avgResponseLength;
        length = options.avgResponseLength ?? 0;
        msgCount = options.userMsgCount ?? 0;
        qCount = options.questionCount ?? 1;
        text = options.text || options.transcript || (Array.isArray(options.answers) ? options.answers.join(' ') : '');
    } else if (typeof textOrOptions === 'string') {
        text = textOrOptions;
    } else if (Array.isArray(textOrOptions)) {
        text = textOrOptions.join(' ');
    } else if (textOrOptions && typeof textOrOptions === 'object') {
        const options = textOrOptions;
        text = options.text || options.transcript || (Array.isArray(options.answers) ? options.answers.join(' ') : '');
    }

    const lengthPart = Math.min(3, (Number(length || 0) / 50) * 3);
    const engagementPart = Math.min(4, (Number(msgCount || 0) / Math.max(Number(qCount || 1), 1)) * 4);
    const jitter = stableJitter(`comm-${length}-${msgCount}`) * 1.5;
    const baseScore = lengthPart + engagementPart + jitter;

    const structureBonus = detectStructureBonus(text);
    const fillerPenalty = detectFillerPenalty(text);

    return Math.max(0, Math.min(10, Math.round(baseScore + structureBonus - fillerPenalty)));
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
export const HIGH_TRANSITIONS = [
    "Yeah, that's a really solid answer.",
    "Nice, I like that approach.",
    "Good thinking — that makes a lot of sense.",
    "That's exactly the kind of depth I was looking for.",
    "Great, you touched on the key points there.",
    "Spot on — your reasoning is very clear.",
    "Excellent breakdown, that covers the core trade-offs nicely.",
    "Really well articulated, especially on the edge cases.",
    "Terrific, that demonstrates a strong grasp of the fundamentals.",
    "Love that insight — exactly right.",
    "Solid analysis, that shows deep practical intuition.",
    "Very crisp explanation, right to the point.",
    "Impressive attention to detail in that walkthrough.",
    "That's a thorough answer, hits all the right notes.",
    "Outstanding — clear, structured, and technically sound."
];

export const MID_TRANSITIONS = [
    "Got it, thanks for walking me through that.",
    "Okay, I see where you're going with that.",
    "Alright, fair enough — that gives me good context.",
    "Understood, I appreciate you explaining that.",
    "Right, okay — let me follow up on that.",
    "Makes sense — let's look at another angle here.",
    "Good start — let's take that thought a step further.",
    "I see the intuition there; let me probe into that slightly.",
    "Okay, helpful context — let's dig into that detail.",
    "Fair points — let's see how that holds up under different conditions.",
    "Understood — let's expand on one aspect of that.",
    "Got your point — let's explore the practical implications.",
    "That gives me a solid foundation to ask about next.",
    "I follow your thinking — let's see where that leads.",
    "Alright, noted — let's pivot to the next part of the problem."
];

export const LOW_TRANSITIONS = [
    "Okay, let's try a slightly different angle on this.",
    "Alright, let me rephrase that a bit.",
    "Got it — let's explore this from another direction.",
    "Sure, let's dig into this a bit more.",
    "Okay, let me ask you about this differently.",
    "No worries at all — let's step back and look at the bigger picture.",
    "That's alright — let's break this down into smaller steps.",
    "Fair enough — let's tackle this from a simpler starting point.",
    "Understood — let's refocus on the primary requirement here.",
    "That's completely fine — let me provide a quick hint to guide us.",
    "Okay, let's pause there and look at an alternative perspective.",
    "No problem — let's reset and approach this from first principles.",
    "Got it — let me narrow the scope so we can zoom in.",
    "Alright, let's see if we can unpack that concept together.",
    "Fair enough — let's shift focus to another relevant area."
];

export function getConversationalTransition(score = 70, stage = 'Technical', questionIndex = 1, sessionOrOptions = null) {
    const list = score >= 80 ? HIGH_TRANSITIONS : (score >= 60 ? MID_TRANSITIONS : LOW_TRANSITIONS);
    let sessionOffset = 0;
    let recentTransitions = null;

    if (typeof sessionOrOptions === 'number' && Number.isFinite(sessionOrOptions)) {
        sessionOffset = Math.abs(Math.floor(sessionOrOptions));
    } else if (typeof sessionOrOptions === 'string' && sessionOrOptions.length > 0) {
        let hash = 0;
        for (let i = 0; i < sessionOrOptions.length; i++) {
            hash = ((hash << 5) - hash + sessionOrOptions.charCodeAt(i)) | 0;
        }
        sessionOffset = Math.abs(hash);
    } else if (sessionOrOptions && typeof sessionOrOptions === 'object') {
        const rawSeed = sessionOrOptions.sessionId || sessionOrOptions.sessionSeed || sessionOrOptions.id;
        if (typeof rawSeed === 'number' && Number.isFinite(rawSeed)) {
            sessionOffset = Math.abs(Math.floor(rawSeed));
        } else if (typeof rawSeed === 'string' && rawSeed.length > 0) {
            let hash = 0;
            for (let i = 0; i < rawSeed.length; i++) {
                hash = ((hash << 5) - hash + rawSeed.charCodeAt(i)) | 0;
            }
            sessionOffset = Math.abs(hash);
        }
        recentTransitions = sessionOrOptions.recentTransitions || sessionOrOptions.lruHistory || null;
    }

    const baseIndex = Math.abs(questionIndex + Math.round(score) + sessionOffset) % list.length;
    let chosenPhrase = list[baseIndex];

    if (recentTransitions) {
        const historyArray = Array.isArray(recentTransitions)
            ? recentTransitions
            : (recentTransitions instanceof Set ? Array.from(recentTransitions) : []);
        const historySet = new Set(historyArray);

        // Try to pick the first candidate starting from baseIndex that was not recently used
        let foundUnused = false;
        for (let i = 0; i < list.length; i++) {
            const candidate = list[(baseIndex + i) % list.length];
            if (!historySet.has(candidate)) {
                chosenPhrase = candidate;
                foundUnused = true;
                break;
            }
        }

        // If all phrases in the pool have been used, pick the least recently used one
        if (!foundUnused && historyArray.length > 0) {
            let oldestIndex = Infinity;
            let oldestCandidate = chosenPhrase;
            for (const candidate of list) {
                const lastIdx = historyArray.lastIndexOf(candidate);
                if (lastIdx < oldestIndex) {
                    oldestIndex = lastIdx;
                    oldestCandidate = candidate;
                }
            }
            chosenPhrase = oldestCandidate;
        }

        // Update tracking history if mutable
        if (Array.isArray(recentTransitions)) {
            recentTransitions.push(chosenPhrase);
            if (recentTransitions.length > 30) {
                recentTransitions.shift();
            }
        } else if (typeof recentTransitions.add === 'function') {
            recentTransitions.add(chosenPhrase);
        }
    }

    return chosenPhrase;
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
        nudgeMs: 12_000,          // ~12s real silence -> offer hint
        checkInMs: 25_000,        // ~25s real silence -> check in
        autoAdvanceMs: 40_000,     // ~40s real silence -> "Let's move on" and advance
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

// ── Stage Silence Thresholds & Proactive Thought Starters ──────────
export const STAGE_SILENCE_THRESHOLDS = {
    intake: 12000,
    warmup: 14000,
    technical: 20000,
    coding: 20000,
    dsa: 20000,
    'system-design': 22000,
    followup: 14000,
    challenge: 22000,
    default: 15000,
};

export function getStageSilenceThreshold(stage = '', interviewType = '', pacingMode = 'realistic') {
    const norm = String(stage || interviewType || '').toLowerCase();
    let baseMs = STAGE_SILENCE_THRESHOLDS.default;
    if (norm.includes('intake')) baseMs = STAGE_SILENCE_THRESHOLDS.intake;
    else if (norm.includes('warmup') || norm.includes('warm-up')) baseMs = STAGE_SILENCE_THRESHOLDS.warmup;
    else if (norm.includes('challenge')) baseMs = STAGE_SILENCE_THRESHOLDS.challenge;
    else if (norm.includes('followup') || norm.includes('follow-up')) baseMs = STAGE_SILENCE_THRESHOLDS.followup;
    else if (norm.includes('system') || norm.includes('design')) baseMs = STAGE_SILENCE_THRESHOLDS['system-design'];
    else if (norm.includes('coding') || norm.includes('dsa')) baseMs = STAGE_SILENCE_THRESHOLDS.coding;
    else if (norm.includes('technical') || norm.includes('tech')) baseMs = STAGE_SILENCE_THRESHOLDS.technical;

    if (pacingMode === 'relaxed') return Math.round(baseMs * 1.3);
    if (pacingMode === 'fast') return Math.round(baseMs * 0.8);
    return baseMs;
}

// ── Real-Time Speaking Pace Coach Evaluation ─────────────────────────
export function evaluateSpeakingPace({ wordCount = 0, durationSecs = 0, isListening = true } = {}) {
    if (!isListening || durationSecs < 3) return null;
    const minutes = durationSecs / 60;
    const wpm = minutes > 0 && wordCount >= 2 ? Math.round(wordCount / minutes) : null;

    // Sparse / terse detection: candidate microphone active for >= 10s but gave very short answer (<= 7 words)
    if (durationSecs >= 10 && wordCount > 0 && wordCount <= 7) {
        return {
            status: 'sparse',
            label: 'Elaborate',
            message: 'Brief response — feel free to elaborate with an example or trade-offs',
            wpm,
        };
    }

    if (wpm == null) return null;

    if (wpm > 175) {
        return {
            status: 'fast',
            label: 'Too fast',
            message: 'Pacing fast — slow down slightly so your points land clearly',
            wpm,
        };
    }
    if (wpm > 160) {
        return {
            status: 'fast',
            label: 'Brisk pace',
            message: 'Good tempo — consider pausing between key thoughts',
            wpm,
        };
    }
    if (wpm < 95 && wordCount >= 6) {
        return {
            status: 'slow',
            label: 'Too slow',
            message: 'Pacing slow — pick up momentum to cover your full solution',
            wpm,
        };
    }
    if (wpm < 115 && wordCount >= 6) {
        return {
            status: 'slow',
            label: 'Deliberate',
            message: 'Deliberate tempo — feel free to pick up momentum',
            wpm,
        };
    }
    return {
        status: 'good',
        label: 'Optimal pace',
        message: 'Optimal pace — clear, steady, and easy to follow',
        wpm,
    };
}

export const STAGE_THOUGHT_STARTERS = {
    intake: {
        message: "Start with a 1-minute snapshot: your background, current focus, and what drew you to this opportunity.",
        bullets: [
            "Brief introduction and current role or university background",
            "Key technical strengths and primary tech stack",
            "Why this company and role excite you",
        ],
    },
    warmup: {
        message: "Anchor your response in a real project you've worked on recently.",
        bullets: [
            "What was the goal of the project?",
            "What was your individual contribution?",
            "What was the outcome or takeaway?",
        ],
    },
    technical: {
        message: "Break the problem down step by step before diving into code or implementation.",
        bullets: [
            "Clarify input formats, constraints, and edge cases",
            "Mention a simple brute-force approach first",
            "Identify optimal data structure (e.g. Hash Map, Two Pointers, Heap)",
        ],
    },
    coding: {
        message: "Start by articulating your approach and edge cases before writing code.",
        bullets: [
            "Consider edge cases: empty input, duplicates, single element",
            "State target time & space complexity",
            "Walk through a quick 2-element example",
        ],
    },
    'system-design': {
        message: "Start by scoping requirements and high-level architectural components.",
        bullets: [
            "Scope functional requirements (read vs write paths)",
            "Estimate scale & throughput (QPS, storage)",
            "Outline core components: API gateway, database, cache",
        ],
    },
    followup: {
        message: "Structure your follow-up using the STAR framework to keep it concrete.",
        bullets: [
            "Situation & Task: context and challenge you faced",
            "Action: technical decisions and trade-offs you made",
            "Result: measurable impact (latency, throughput, user metrics)",
        ],
    },
    challenge: {
        message: "Think through system limits and bottleneck failure modes under extreme load.",
        bullets: [
            "Identify the single point of failure or bottleneck",
            "Evaluate trade-offs between consistency, availability, and latency",
            "Propose mitigation (sharding, caching, queue backpressure)",
        ],
    },
    default: {
        message: "Take a moment to structure your thoughts: state your approach, then walk through your reasoning.",
        bullets: [
            "Clarify any assumptions",
            "Outline your core approach or architecture",
            "Discuss trade-offs and alternative solutions",
        ],
    },
};

// ── P0-A Answer Classification Heuristics ───────────────────────────
export const DONT_KNOW_REGEX = /\b(?:i\s*(?:don'?t|do\s*not)(?:\s+(?:really|actually|quite))?\s*know|not\s+(?:sure|quite\s+sure|certain|familiar)|no\s+idea|haven'?t\s+used|don'?t\s+remember|do\s*not\s+remember|can'?t\s+recall|cannot\s+recall|do\s*not\s+recall|don'?t\s+recall|no\s+clue|haven'?t\s+(?:implemented|worked)|have\s+not\s+(?:implemented|worked)|not\s+(?:very\s+)?familiar|blanking\s+on|drawing\s+a\s+blank|look\s+that\s+up|haven'?t\s+encountered|pass\s+on\s+this|not\s+sure\s+how\s+to\s+approach|skip\s+this\s+question)\b/i;

export const CLARIFICATION_REGEX = /^(?:could\s+you|can\s+you|can\s+we|are\s+we|should\s+this|does\s+the|can\s+it|do\s+you\s+mean|what\s+do\s+you\s+mean|would\s+you|repeat|please\s+clarify|could\s+you\s+repeat|could\s+you\s+explain|what\s+are\s+the\s+constraints|what\s+is\s+the\s+expected\s+input|can\s+i\s+assume|should\s+i\s+assume)\b/i;

export const OFF_TOPIC_REGEX = /\b(?:hiking|crypto|bitcoin|ethereum|laptop\s+battery|professor\s+was|vacation|weather|order\s+pizza|sports\s+score)\b/i;

export const NON_LATIN_SCRIPT_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Devanagari}\p{Script=Hebrew}\p{Script=Thai}\p{Script=Bengali}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Greek}]/u;

export const CONTRADICTORY_FACT_REGEX = /(?:\bqueues?\s+(?:is|are)\s+(?:a\s+)?lifo\b|\bqueues?\s+(?:is|are)\s+last\s+in\s+first\s+out\b|\bstacks?\s+(?:is|are)\s+(?:a\s+)?fifo\b|\bstacks?\s+(?:is|are)\s+first\s+in\s+first\s+out\b|\b(?:hash\s*map|hash\s*table|hashmap)\b[^.!?\n]{0,40}?\b(?:lookup|search|access|takes|has|is)\b[^.!?\n]{0,20}?o\(n\^2\)|\b(?:binary\s+search)\b[^.!?\n]{0,40}?\b(?:takes|is|has|complexity)\b[^.!?\n]{0,20}?o\(n\^2\)|\barrays?\s+(?:has|allows?)\s+o\(1\)\s+(?:arbitrary\s+insertion|insert\s+at\s+index)|\b(?:http|https)\s+is\s+(?:a\s+)?(?:(?:layer\s*4\s+)?transport|layer\s*4)\s+protocol\b|\b(?:tcp|udp)\s+is\s+(?:a\s+)?(?:(?:layer\s*7\s+)?application|layer\s*7)\s+protocol\b)/i;

/**
 * Classifies candidate answers into distinct turn routing categories:
 * - 'skipped'
 * - 'timed_out'
 * - 'stuck_silence'
 * - 'code_only'
 * - 'clarification'
 * - 'dont_know'
 * - 'off_topic'
 * - 'repeated'
 * - 'strong_complete'
 * - 'wrong'
 * - 'verbose_shallow'
 * - 'needs_translation'
 * - 'partial' (accurate fallback, not blind default)
 */
export function classifyCandidateAnswer(answerText = '', options = {}) {
    const {
        code = '',
        meta = {},
        isAutoSkip = false,
        previousAnswers = [],
        returnDetails = false,
    } = options;

    const trimmedText = String(answerText || '').trim();
    const trimmedCode = String(code || '').trim();

    function wrapResult(type, confidence = 0.85, details = {}) {
        if (returnDetails) {
            return {
                type,
                confidence: Number(confidence.toFixed(2)),
                details: {
                    ...details,
                    wordCount: details.wordCount ?? (trimmedText ? trimmedText.split(/\s+/).filter(Boolean).length : 0),
                },
            };
        }
        return type;
    }

    if (meta?.answerType) {
        return wrapResult(meta.answerType, 1.0, { reason: 'Explicit meta answerType' });
    }

    if (meta?.submissionType === 'voluntary_skip' || (isAutoSkip && meta?.reason === 'user_skipped')) {
        return wrapResult('skipped', 1.0, { reason: 'User explicitly skipped question' });
    }

    if (meta?.submissionType === 'timeout_empty' || (isAutoSkip && !trimmedText && meta?.reason === 'silence_timeout')) {
        return wrapResult('stuck_silence', 0.95, { reason: 'Silence timeout with no answer' });
    }

    if (meta?.submissionType === 'timeout_partial' || meta?.answerType === 'timed_out') {
        return wrapResult('timed_out', 0.95, { reason: 'Answer timed out' });
    }

    const isDefaultNoResponse = !trimmedText ||
        trimmedText === 'I do not have a response to this question.' ||
        trimmedText === '[Code submitted]';

    if (isDefaultNoResponse && trimmedCode.length > 0) {
        return wrapResult('code_only', 0.9, { codeLength: trimmedCode.length });
    }

    if (isDefaultNoResponse) {
        return wrapResult(isAutoSkip ? 'stuck_silence' : 'partial', 0.8, { reason: 'No response submitted' });
    }

    // Check for unexpected / non-Latin scripts requiring translation
    if (NON_LATIN_SCRIPT_REGEX.test(trimmedText)) {
        return wrapResult('needs_translation', 0.95, {
            reason: 'Non-Latin or unexpected script text detected',
        });
    }

    // Clarification question
    if (CLARIFICATION_REGEX.test(trimmedText) || (trimmedText.endsWith('?') && /\b(clarify|repeat|constraints?|rephrase|mean by)\b/i.test(trimmedText))) {
        return wrapResult('clarification', 0.9, { reason: 'Candidate requested clarification' });
    }

    // Don't know / surrender / pass
    if (DONT_KNOW_REGEX.test(trimmedText)) {
        return wrapResult('dont_know', 0.95, { reason: 'Candidate expressed uncertainty or surrender' });
    }

    // Off-topic response
    if (OFF_TOPIC_REGEX.test(trimmedText)) {
        return wrapResult('off_topic', 0.9, { reason: 'Response is off-topic' });
    }

    // Explicit wrong marking in meta or contradicting explicit facts
    const lower = trimmedText.toLowerCase();
    const matchesContradictionList = (list) => {
        if (!Array.isArray(list)) return false;
        return list.some(item => {
            if (!item) return false;
            if (item instanceof RegExp) return item.test(trimmedText);
            const str = String(item).toLowerCase().trim();
            if (lower.includes(str)) return true;
            const words = str.split(/\s+/).filter(Boolean);
            return words.length > 1 && words.every(w => lower.includes(w));
        });
    };

    const contradictsFacts =
        meta?.isWrong === true ||
        meta?.contradictsFacts === true ||
        meta?.isFactuallyIncorrect === true ||
        options?.isWrong === true ||
        options?.contradictsFacts === true ||
        options?.isFactuallyIncorrect === true ||
        CONTRADICTORY_FACT_REGEX.test(trimmedText) ||
        matchesContradictionList(options?.factualContradictions) ||
        matchesContradictionList(meta?.factualContradictions) ||
        matchesContradictionList(options?.contradictions);

    if (contradictsFacts) {
        return wrapResult('wrong', 0.9, { reason: 'Contradicts explicit facts' });
    }

    // Repeated answer detection
    if (Array.isArray(previousAnswers) && previousAnswers.length > 0) {
        const isRepeated = previousAnswers.some(prev => {
            if (!prev || typeof prev !== 'string') return false;
            const prevLower = prev.trim().toLowerCase();
            return prevLower.length > 15 && (prevLower === lower || (lower.length > 25 && prevLower.includes(lower)) || (prevLower.length > 25 && lower.includes(prevLower)));
        });
        if (isRepeated || /\b(?:as\s+i\s+(?:already\s+)?(?:said|mentioned)|like\s+i\s+said\s+before|i\s+already\s+answered)\b/i.test(lower)) {
            return wrapResult('repeated', 0.9, { reason: 'Candidate repeated previous answer' });
        }
    }

    const words = trimmedText.split(/\s+/).filter(Boolean);
    const techHits = countKeywordHits(trimmedText);
    const structBonus = detectStructureBonus(trimmedText);
    const hasStructurePattern = /\b(first(?:ly)?|second(?:ly)?|finally|situation|task|action|result)\b/i.test(trimmedText);
    const hasStructure = structBonus > 0 || hasStructurePattern;

    // Verbose shallow detection: wordCount >= 70 with <= 1 technical keyword hit and no structure
    if (words.length >= 70 && techHits <= 1 && !hasStructure) {
        return wrapResult('verbose_shallow', 0.85, {
            reason: 'Verbose answer lacking technical substance and structure',
            wordCount: words.length,
            techKeywordHits: techHits,
            hasStructure: false,
        });
    }

    // Substantive complete answer with depth, trade-offs, or structure
    const hasTechnicalKeywords = TECHNICAL_KEYWORDS.some(kw => lower.includes(kw));
    const hasTradeOffs = /\b(trade-off|tradeoff|complexity|O\([1nlog\s]+\)|in terms of space|in terms of time|bottleneck|scalab|edge case)\b/i.test(trimmedText);

    if (words.length >= 35 || (words.length >= 12 && (hasTradeOffs || hasStructure || hasTechnicalKeywords) && (trimmedCode.length > 0 || hasTradeOffs))) {
        return wrapResult('strong_complete', 0.9, {
            wordCount: words.length,
            hasTechnicalKeywords,
            hasTradeOffs,
            hasStructure,
        });
    }

    return wrapResult('partial', 0.75, { wordCount: words.length });
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

    // verbose_shallow: candidate spoke a lot of words without technical substance or structure
    if (answerType === 'verbose_shallow') {
        if (topicFollowUpCount < 1) {
            return {
                action: 'follow_up',
                nextTopicFollowUpCount: topicFollowUpCount + 1,
                needsRedirect: true,
                noScore: false,
                neutralReaction: true,
                promptCue: 'Can you focus specifically on the concrete technical implementation and trade-offs?',
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

    // needs_translation: non-Latin or unexpected script text detected
    if (answerType === 'needs_translation') {
        return {
            action: 'follow_up',
            nextTopicFollowUpCount: topicFollowUpCount,
            needsRedirect: true,
            noScore: true,
            neutralReaction: true,
            promptCue: 'Please respond in English so we can evaluate your response.',
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

export const CONSECUTIVE_SILENT_THRESHOLD = 3;

export function isConsecutiveSilenceLimitReached(count = 0) {
    return Number(count) >= CONSECUTIVE_SILENT_THRESHOLD;
}

// ── Semantic Silence & Turn-Taking Threshold Engine ────────────────
// Scales required silence duration based on interview stage and word count.
// Uses adaptive silence (1.5s - 3.6s cap), the filler allowance, and the 2s resume window.
export function getSemanticSilenceThreshold({
    stage = 'Technical',
    wordCount = 0,
    text = '',
    candidatePacingOffset = 0,
    isCodingActive = false,
    lastKeystrokeTimestamp = null,
    keystrokeActiveTime = 2000,
    confidence = null,
} = {}) {
    const trimmed = String(text || '').trim();

    const activeWindow = Number.isFinite(keystrokeActiveTime) && keystrokeActiveTime > 0 ? keystrokeActiveTime : 2000;
    const hasRecentKeystroke = Number.isFinite(lastKeystrokeTimestamp) &&
        (Date.now() - lastKeystrokeTimestamp >= -500) &&
        (Date.now() - lastKeystrokeTimestamp < activeWindow);

    // Definitively finished turns trigger immediate snappy 1500ms submission,
    // unless candidate is actively coding or typing
    if (isFinishedTurn(trimmed) && !isCodingActive && !hasRecentKeystroke) {
        return 1500;
    }

    const unfinishedBonus = isUnfinishedTurn(trimmed) ? 1000 : 0;
    const fillerBonus = isTrailingFiller(trimmed) ? 1200 : 0;

    // Detect mid-list or trailing enumeration (e.g. "first...", "secondly...", "also,", trailing comma)
    const isMidList = /(?:\b(?:firstly|first|secondly|second|third|also|additionally|plus)\b[^.!?]*$|,\s*$)/i.test(trimmed);
    const listMomentumBonus = isMidList ? 500 : 0;

    // Substantive pause tolerance: if candidate has articulated a substantial answer (>25 words)
    // and paused with a hanging connector or comma, grant extra thinking buffer (+800ms)
    const midThoughtBonus = (wordCount >= 25 && isUnfinishedTurn(trimmed)) ? 800 : 0;

    // Low confidence speech buffer: give candidate extra 500ms before auto-submitting unclear speech
    const lowConfidenceBonus = (Number.isFinite(confidence) && confidence > 0 && confidence < 0.75 && wordCount < 10) ? 500 : 0;

    // Active coding/typing buffer: allows thought and typing without auto-submitting
    const codingBonus = isCodingActive ? 1400 : 0;
    const keystrokeBonus = hasRecentKeystroke ? 2000 : 0;

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

    // Clamped up to 3600ms for voice-only (or 4200ms with mid-thought/low-confidence), or 5000ms when candidate is actively coding or typing
    const maxThreshold = (isCodingActive || hasRecentKeystroke) ? 5000 : (midThoughtBonus > 0 || lowConfidenceBonus > 0 ? 4200 : 3600);
    const totalBonus = Math.max(fillerBonus, unfinishedBonus, listMomentumBonus, codingBonus, keystrokeBonus) + midThoughtBonus + lowConfidenceBonus;
    return Math.min(maxThreshold, Math.max(1500, threshold + totalBonus + clampedOffset));
}

// ── Speculative Abort Controller Utilities & Transcript Hash Validator ──
export function hashTranscript(transcript = '') {
    const normalized = String(transcript || '').trim().toLowerCase().replace(/\s+/g, ' ');
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) {
        hash ^= normalized.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
}

export function createSpeculativeAbortController(options = {}) {
    const controller = new AbortController();
    const transcript = typeof options === 'string' ? options : (options?.transcript || '');
    const hash = options?.hash || (transcript ? hashTranscript(transcript) : null);
    const id = options?.id || options?.requestId || `spec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
        id,
        controller,
        signal: controller.signal,
        transcript,
        hash,
        createdAt: Date.now(),
        isAborted: false,
        abort(reason = 'speculative_aborted') {
            if (!this.isAborted) {
                this.isAborted = true;
                try {
                    controller.abort(reason);
                } catch {
                    // Ignore already aborted
                }
            }
        },
    };
}

export function abortSpeculativeRequest(controllerOrHolder, reason = 'speculative_aborted') {
    if (!controllerOrHolder) return false;
    try {
        if (typeof controllerOrHolder.abort === 'function') {
            controllerOrHolder.abort(reason);
            if ('isAborted' in controllerOrHolder) {
                controllerOrHolder.isAborted = true;
            }
            return true;
        }
        if (controllerOrHolder.controller && typeof controllerOrHolder.controller.abort === 'function') {
            controllerOrHolder.controller.abort(reason);
            controllerOrHolder.isAborted = true;
            return true;
        }
        if (controllerOrHolder.current) {
            return abortSpeculativeRequest(controllerOrHolder.current, reason);
        }
    } catch {
        return false;
    }
    return false;
}

export function validateTranscriptHash(expectedHashOrObj, currentTranscriptOrHash) {
    if (!expectedHashOrObj || !currentTranscriptOrHash) return false;
    const expectedHash = typeof expectedHashOrObj === 'object' && expectedHashOrObj !== null
        ? (expectedHashOrObj.hash || expectedHashOrObj.transcriptHash || (expectedHashOrObj.transcript ? hashTranscript(expectedHashOrObj.transcript) : ''))
        : String(expectedHashOrObj);

    if (!expectedHash) return false;

    let currentHash;
    if (typeof currentTranscriptOrHash === 'object' && currentTranscriptOrHash !== null) {
        currentHash = currentTranscriptOrHash.hash || currentTranscriptOrHash.transcriptHash || (currentTranscriptOrHash.transcript ? hashTranscript(currentTranscriptOrHash.transcript) : '');
    } else {
        const str = String(currentTranscriptOrHash).trim();
        // If already a hex hash string (1-8 chars, no spaces)
        if (/^[0-9a-f]{1,8}$/i.test(str) && !str.includes(' ')) {
            currentHash = str.toLowerCase();
        } else {
            currentHash = hashTranscript(str);
        }
    }

    return String(expectedHash).trim().toLowerCase() === String(currentHash).trim().toLowerCase();
}

export const isValidTranscriptHash = validateTranscriptHash;
