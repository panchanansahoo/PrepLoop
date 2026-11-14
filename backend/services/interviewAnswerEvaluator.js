/**
 * Evaluates fresher interview answers based on actual content quality.
 * Enhanced with semantic rubric dimensions (Clarity, Depth, Correctness, STAR structure, Specificity).
 */

import { detectAIGeneratedSpeech } from '../utils/llmSpeechDetector.js';

const TECHNICAL_KEYWORDS = {
    oop: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'class', 'object', 'interface', 'extends', 'implements'],
    database: ['primary key', 'foreign key', 'index', 'normalization', 'join', 'query', 'sql', 'table', 'schema', 'acid', 'transaction', 'sharding'],
    web: ['http', 'get', 'post', 'rest', 'api', 'request', 'response', 'client', 'server', 'protocol', 'jwt', 'cors', 'caching'],
    os: ['process', 'thread', 'memory', 'concurrency', 'parallelism', 'scheduling', 'deadlock', 'semaphore', 'mutex', 'cpu'],
    ds: ['array', 'linked list', 'stack', 'queue', 'tree', 'hash', 'graph', 'sorting', 'recursion', 'complexity', 'binary search'],
    system: ['load balancer', 'cache', 'redis', 'cdn', 'microservice', 'partition', 'replication', 'scalability', 'throughput', 'latency'],
};

const STAR_PATTERNS = {
    situation: /\b(in that situation|the context was|we were facing|at that time|when we|the problem was|the challenge was|our company|our team|at my previous|during my project|in my college)\b/i,
    task: /\b(my task was|i was responsible for|my role was|i needed to|i had to|was assigned to|my objective was|the goal was|i was tasked with)\b/i,
    action: /\b(i took the action|i decided to|i implemented|i led|i created|i built|i organized|i initiated|the action i took|i worked on|i designed|i architected|i investigated|i refactored|i fixed)\b/i,
    result: /\b(the result was|as a result|the outcome|this led to|we achieved|we reduced|we improved|the impact|this resulted in|uptime|latency|saved|increased by|reduced by|\b\d+%\b)\b/i,
};

const METRICS_PATTERN = /\b(\d+(?:\.\d+)?%|\$\d+(?:[kmbt])?|\b\d+\s*(?:ms|seconds|minutes|hours|days|requests|rps|qps|users|gb|mb|tb|servers|instances))\b/i;
const COMPLEXITY_PATTERN = /\b(o\(|big[-\s]?o|time complexity|space complexity|linear time|constant time|logarithmic|quadratic|trade[-\s]?off|amortized)\b/i;
const EDGE_CASES_PATTERN = /\b(edge case|boundary|null|undefined|empty|overflow|concurrency|race condition|deadlock|timeout|fallback)\b/i;
const REASONING_PATTERN = /\b(because|therefore|hence|since|as a result|in order to|trade[-\s]?off|the reason why|consequently|compromise|alternatively)\b/i;

function countKeywordMatches(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.filter(kw => lower.includes(kw)).length;
}

function countTechnicalKeywords(text) {
    const lower = text.toLowerCase();
    const allKeywords = Object.values(TECHNICAL_KEYWORDS).flat();
    return countKeywordMatches(lower, allKeywords);
}

function evaluateAnswerLength(text) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 60) return 5;
    if (wordCount >= 40) return 4;
    if (wordCount >= 20) return 3;
    if (wordCount >= 10) return 2;
    return 1;
}

function evaluateStructure(text) {
    const lower = text.toLowerCase();
    let score = 0;
    if (/\b(for example|for instance|such as)\b/.test(lower)) score += 1;
    if (/\b(because|since|therefore|hence|as a result)\b/.test(lower)) score += 1;
    if (/\b(first|second|third|finally|additionally|moreover)\b/.test(lower)) score += 1;
    return Math.min(score, 3);
}

function evaluateConcreteness(text) {
    const lower = text.toLowerCase();
    let score = 0;
    if (/\b(project|coursework|assignment|internship|hackathon)\b/.test(lower)) score += 2;
    if (/\b(i built|i created|i developed|i implemented|i worked)\b/.test(lower)) score += 2;
    if (/\b(team|group|collaborated|together)\b/.test(lower)) score += 1;
    if (/\b(learned|learnt|discovered|improved|grew)\b/.test(lower)) score += 1;
    return Math.min(score, 4);
}

function evaluateCodeQuality(codeText) {
    if (!codeText || !codeText.trim()) return 2;
    const trimmed = codeText.trim();
    const lines = trimmed.split('\n').filter((l) => l.trim().length > 0).length;
    let score = 2;

    // Structural elements (function, class, arrow func, lambda)
    if (/function\b|def\s+\w+|class\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)|function)|\bfunc\b/i.test(trimmed)) {
        score += 1;
    }
    if (/\breturn\b/.test(trimmed)) {
        score += 0.5;
    }

    // Boundary conditions, guards and error handling
    if (/\b(?:if\s*\([^)]*===?\s*(?:null|undefined|0|-1|""|\[\]|\{\})|if\s+not\s+\w+|try\s*\{|except\b|catch\s*\(|throw\s+new)\b/i.test(trimmed)) {
        score += 1;
    }

    // Complexity annotations or thoughtful algorithm comments
    if (/(?:time|space)\s*complexity|O\([1nlogk]+\)|\/\/\s*O\(|#\s*O\(/i.test(trimmed)) {
        score += 1;
    }

    // Control flow, data structure methods, or recursion
    if (/\b(?:for|while|forEach|map|filter|reduce|switch|recursion|recurse)\b/i.test(trimmed)) {
        score += 0.5;
    }

    // Comments / documentation
    if (/\/\/|\/\*|#|"""/.test(trimmed)) {
        score += 0.5;
    }

    // Penalty for empty shells
    if (/^\s*(?:pass|\/\/.*TODO)\s*$/im.test(trimmed) && lines <= 3) {
        score -= 1;
    }

    return Math.max(1, Math.min(5, Math.round(score)));
}

export function detectStarBreakdown(text) {
    const answer = String(text || '');
    const situation = STAR_PATTERNS.situation.test(answer);
    const task = STAR_PATTERNS.task.test(answer);
    const action = STAR_PATTERNS.action.test(answer);
    const result = STAR_PATTERNS.result.test(answer);
    const presentCount = [situation, task, action, result].filter(Boolean).length;
    return {
        situation,
        task,
        action,
        result,
        score: presentCount === 4 ? 10 : presentCount === 3 ? 8 : presentCount === 2 ? 6 : presentCount === 1 ? 4 : 2,
        isComplete: presentCount >= 3,
    };
}

function calculateRubric(answer, stage, codeText = '') {
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    const techCount = countTechnicalKeywords(answer);
    const hasMetrics = METRICS_PATTERN.test(answer);
    const hasComplexity = COMPLEXITY_PATTERN.test(answer);
    const hasEdgeCases = EDGE_CASES_PATTERN.test(answer);
    const hasReasoning = REASONING_PATTERN.test(answer);
    const star = detectStarBreakdown(answer);

    // 1. Clarity (1 - 10)
    let clarity = 3;
    if (wordCount >= 20) clarity += 2;
    if (wordCount >= 45) clarity += 2;
    if (evaluateStructure(answer) >= 2) clarity += 2;
    if (!/\b(um|uh|maybe like|i don't know really)\b/i.test(answer)) clarity += 1;
    clarity = Math.max(2, Math.min(10, clarity));

    // 2. Depth (1 - 10)
    let depth = 3;
    if (stage === 'Technical' || stage === 'DSA / Coding') {
        if (techCount >= 2) depth += 2;
        if (techCount >= 5) depth += 2;
        if (hasComplexity) depth += 2;
        if (hasEdgeCases) depth += 1;
    } else {
        if (hasReasoning) depth += 2;
        if (hasMetrics) depth += 2;
        if (star.result) depth += 2;
        if (wordCount >= 50) depth += 1;
    }
    depth = Math.max(2, Math.min(10, depth));

    // 3. Correctness (1 - 10)
    let correctness = 4;
    if (codeText && codeText.trim().length > 15) {
        const codeQuality = evaluateCodeQuality(codeText);
        correctness += Math.round(codeQuality);
    } else {
        if (techCount >= 3 || (stage !== 'Technical' && star.action)) correctness += 2;
        if (hasReasoning) correctness += 2;
        if (hasEdgeCases || hasMetrics) correctness += 1;
    }
    correctness = Math.max(2, Math.min(10, correctness));

    // 4. STAR Structure (1 - 10)
    const starStructure = star.score;

    // 5. Specificity (1 - 10)
    let specificity = 3;
    if (evaluateConcreteness(answer) >= 2) specificity += 2;
    if (hasMetrics) specificity += 3;
    if (/\b(e\.g\.|specifically|such as|for instance)\b/i.test(answer)) specificity += 1;
    if (wordCount >= 35) specificity += 1;
    specificity = Math.max(2, Math.min(10, specificity));

    return {
        clarity,
        depth,
        correctness,
        starStructure,
        specificity,
    };
}

function pickStrengths(answer, stage) {
    const strengths = [];
    const wordCount = answer.split(/\s+/).filter(Boolean).length;

    if (wordCount >= 40) strengths.push('Provided a detailed response');
    else if (wordCount >= 20) strengths.push('Gave a reasonably detailed answer');
    else strengths.push('Answered directly');

    const lower = answer.toLowerCase();
    if (/\b(for example|for instance|such as|specifically)\b/.test(lower)) {
        strengths.push('Used concrete examples');
    }
    if (/\b(because|since|therefore|as a result)\b/.test(lower)) {
        strengths.push('Showed reasoning and logic');
    }
    if (/\b(first|second|finally|additionally)\b/.test(lower)) {
        strengths.push('Structured response well');
    }
    if (COMPLEXITY_PATTERN.test(answer)) {
        strengths.push('Addressed algorithmic complexity and trade-offs');
    }
    if (METRICS_PATTERN.test(answer)) {
        strengths.push('Quantified business or performance impact');
    }
    if (stage === 'Technical' || stage === 'DSA / Coding') {
        const techCount = countTechnicalKeywords(answer);
        if (techCount >= 3) strengths.push('Demonstrated technical knowledge');
        if (techCount >= 5) strengths.push('Showed strong technical depth');
    }

    if (stage === 'HR' || stage === 'Behavioral') {
        if (/\b(i learned|i grew|i improved|i realized)\b/.test(lower)) {
            strengths.push('Showed self-awareness and growth mindset');
        }
        if (/\b(team|group|collaborated|helped|supported)\b/.test(lower)) {
            strengths.push('Demonstrated teamwork and collaboration');
        }
    }

    return strengths.slice(0, 3);
}

function pickImprovements(answer, stage) {
    const improvements = [];
    const wordCount = answer.split(/\s+/).filter(Boolean).length;

    if (wordCount < 20) {
        improvements.push('Provide more detail in your response');
        improvements.push('Add a concrete example to support your point');
    } else if (wordCount < 40) {
        improvements.push('Add more specific examples to strengthen your answer');
    }

    if (stage === 'Technical' || stage === 'DSA / Coding') {
        const techCount = countTechnicalKeywords(answer);
        if (techCount < 3) improvements.push('Use more technical terminology');
        if (!COMPLEXITY_PATTERN.test(answer)) {
            improvements.push('State time and space complexity explicitly');
        }
        if (!/\b(trade-off|alternative|pros and cons)\b/.test(answer.toLowerCase())) {
            improvements.push('Discuss trade-offs and alternatives');
        }
    }

    if (stage === 'HR' || stage === 'Behavioral') {
        const star = detectStarBreakdown(answer);
        if (!star.result) {
            improvements.push('Share the measurable outcome or impact of your actions');
        }
        if (!star.situation && !star.task) {
            improvements.push('Set the initial situation and task clearly before diving into actions');
        }
    }

    if (!improvements.length) improvements.push('Consider structuring your answer with a clear framework');

    return improvements.slice(0, 3);
}

function generateFeedbackSummary(score, strengths, improvements, _stage) {
    const tone = score >= 80 ? 'Strong answer.' : score >= 60 ? 'Solid attempt with growth areas.' : 'Needs deeper development.';
    const strengthPart = strengths.length > 0 ? ` Well done on: ${strengths.join(', ')}.` : '';
    const improvementPart = improvements.length > 0 ? ` Focus on: ${improvements[0]}.` : '';
    return `${tone}${strengthPart}${improvementPart}`;
}

/**
 * Evaluate a fresher answer based on actual content quality and semantic rubric.
 * @param {string} userAnswer - The candidate's answer text
 * @param {string} stage - Interview stage (HR, Technical, etc.)
 * @param {string} codeText - Any code submitted
 * @returns {{ score: number, rubric: Object, strengths: string[], improvements: string[], feedbackSummary: string }}
 */
export function evaluateFresherAnswer(userAnswer, stage, codeText = '') {
    const answer = String(userAnswer || '').trim();
    if (!answer) {
        return {
            score: 25,
            rubric: {
                clarity: 2,
                depth: 2,
                correctness: 2,
                starStructure: 2,
                specificity: 2,
            },
            strengths: ['Attempted to answer'],
            improvements: ['Provide a complete response with examples and reasoning'],
            feedbackSummary: 'No answer provided. Please provide a substantive response with reasoning.',
        };
    }

    const lengthScore = evaluateAnswerLength(answer);
    const structureScore = evaluateStructure(answer);
    const concreteScore = evaluateConcreteness(answer);
    const keywordScore = Math.min(countTechnicalKeywords(answer), 5);
    const codeScore = evaluateCodeQuality(codeText);

    const hasCode = Boolean(codeText && codeText.trim().length > 0);
    const stageWeights = stage === 'Technical' || stage === 'DSA / Coding'
        ? { length: 2, structure: 2, concrete: 1.5, keywords: 2.5, code: hasCode ? 2 : 0 }
        : stage === 'HR' || stage === 'Behavioral'
            ? { length: 2, structure: 2, concrete: 3, keywords: 1, code: 0 }
            : { length: 2.5, structure: 2, concrete: 2, keywords: 1.5, code: hasCode ? 1 : 0 };

    const totalWeight = Object.values(stageWeights).reduce((a, b) => a + b, 0);
    const rawScore = (
        lengthScore * stageWeights.length +
        structureScore * stageWeights.structure +
        concreteScore * stageWeights.concrete +
        keywordScore * stageWeights.keywords +
        (hasCode ? codeScore * stageWeights.code : 0)
    ) / totalWeight;

    const maxPerCategory = 5;
    const maxRawScore = maxPerCategory;
    let normalizedScore = Math.round((rawScore / maxRawScore) * 100);

    const rubric = calculateRubric(answer, stage, codeText);

    // Reward exceptional rubric attributes (metrics, complexity, strong star structure)
    if (rubric.depth >= 7) normalizedScore += 4;
    if (rubric.specificity >= 7) normalizedScore += 4;
    if (rubric.starStructure >= 8) normalizedScore += 3;

    const clampedScore = Math.max(25, Math.min(98, normalizedScore));
    const strengths = pickStrengths(answer, stage);
    const improvements = pickImprovements(answer, stage);
    const feedbackSummary = generateFeedbackSummary(clampedScore, strengths, improvements, stage);

    return {
        score: clampedScore,
        rubric,
        strengths,
        improvements,
        feedbackSummary,
    };
}

/**
 * Asynchronously evaluates an answer with multi-provider LLM scoring if available,
 * seamlessly falling back to the enhanced deterministic semantic rubric.
 */
export async function evaluateAnswerWithSemanticRubric({
    userAnswer,
    stage = 'Technical',
    question = '',
    codeText = '',
    company = 'Tech Company',
    role = 'Software Engineer',
    difficultyTag = 'medium',
    sessionId = null,
    userId = null,
    ip = null,
    options: _options = {}
}) {
    const baseEvaluation = evaluateFresherAnswer(userAnswer, stage, codeText);

    try {
        const { callTurnScoring } = await import('./llmRouter.js');
        if (typeof callTurnScoring === 'function') {
            const llmResult = await callTurnScoring({
                previousQuestion: question,
                userAnswer,
                code: codeText,
                company,
                role,
                stage,
                difficultyTag,
                sessionId,
                userId,
                ip,
            });

            if (llmResult && Number.isFinite(llmResult.score)) {
                const combinedScore = Math.round((llmResult.score * 0.7) + (baseEvaluation.score * 0.3));
                return {
                    score: Math.max(25, Math.min(98, combinedScore)),
                    rubric: {
                        clarity: Math.round(Number(llmResult.dimensions?.communication || (baseEvaluation.rubric.clarity / 2)) * 2),
                        depth: Math.round(Number(llmResult.dimensions?.depth || (baseEvaluation.rubric.depth / 2)) * 2),
                        correctness: Math.round(Number(llmResult.dimensions?.correctness || (baseEvaluation.rubric.correctness / 2)) * 2),
                        starStructure: baseEvaluation.rubric.starStructure,
                        specificity: baseEvaluation.rubric.specificity,
                    },
                    strengths: Array.isArray(llmResult.strengths) && llmResult.strengths.length > 0 ? llmResult.strengths : baseEvaluation.strengths,
                    improvements: Array.isArray(llmResult.improvements) && llmResult.improvements.length > 0 ? llmResult.improvements : baseEvaluation.improvements,
                    feedbackSummary: llmResult.feedback || baseEvaluation.feedbackSummary,
                    evalModelUsed: llmResult.evalModelUsed || 'semantic-rubric',
                    evalProvider: llmResult.evalProvider || 'heuristic',
                    reaction: llmResult.reaction || 'neutral',
                };
            }
        }
    } catch (_err) {
        // Safe fallback to deterministic rubric
    }

    return baseEvaluation;
}

// Backwards-compatible alias
export const _evaluateFresherAnswer = evaluateFresherAnswer;

/**
 * Generates a concise, high-signal 3-bullet executive summary for recruiters:
 * 1. Key Strengths
 * 2. Growth Areas
 * 3. Hiring Recommendation
 *
 * @param {Object|Array} optionsOrBreakdown - Evaluation details or breakdown array
 * @param {number} [maybeOverallScore] - Overall score (when first arg is breakdown array)
 * @param {number} [maybePassingScore=70] - Target passing score
 * @returns {{ keyStrengths: string, growthAreas: string, hiringRecommendation: string, bullets: string[], text: string }}
 */
export function generateExecutiveSummary(optionsOrBreakdown = {}, maybeOverallScore, maybePassingScore) {
    let opts = {};
    if (Array.isArray(optionsOrBreakdown)) {
        opts = {
            breakdown: optionsOrBreakdown,
            overallScore: typeof maybeOverallScore === 'number' ? maybeOverallScore : undefined,
            passingScore: typeof maybePassingScore === 'number' ? maybePassingScore : 70,
        };
    } else if (optionsOrBreakdown && typeof optionsOrBreakdown === 'object') {
        opts = { ...optionsOrBreakdown };
    }

    const breakdown = Array.isArray(opts.breakdown) ? opts.breakdown : [];
    const passingScore = Number(opts.passingScore) || 70;
    const integrity = opts.integrity || {};

    // Compute overall score if not explicitly passed
    let overallScore = typeof opts.overallScore === 'number'
        ? Math.round(opts.overallScore)
        : (typeof opts.score === 'number' ? Math.round(opts.score) : null);

    if (overallScore === null) {
        if (breakdown.length > 0) {
            const validScores = breakdown.map((b) => Number(b.score)).filter((s) => Number.isFinite(s));
            overallScore = validScores.length > 0
                ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                : 50;
        } else {
            overallScore = 50;
        }
    }

    // 1. Synthesize Key Strengths
    const coveredTopics = [...new Set(breakdown.flatMap((b) => Array.isArray(b.coveredTopics) ? b.coveredTopics : []))];
    const passedQuestions = breakdown.filter((b) => (b.score || 0) >= passingScore);
    const explicitStrengths = Array.isArray(opts.strengths) ? opts.strengths.filter(Boolean) : [];

    let keyStrengths = '';
    if (explicitStrengths.length > 0) {
        keyStrengths = explicitStrengths.slice(0, 2).join('; ') + (coveredTopics.length > 0 ? ` with solid coverage of ${coveredTopics.slice(0, 3).join(', ')}.` : '.');
    } else if (coveredTopics.length > 0 && passedQuestions.length > 0) {
        keyStrengths = `Demonstrated solid domain competence on ${passedQuestions.length} of ${breakdown.length} questions, effectively covering core topics such as ${coveredTopics.slice(0, 3).join(', ')}.`;
    } else if (overallScore >= 75) {
        keyStrengths = 'Demonstrated strong foundational knowledge, articulate reasoning, and structured responses across evaluated questions.';
    } else if (overallScore >= 55) {
        keyStrengths = 'Displayed basic technical comprehension and addressed initial concepts with clear communication.';
    } else {
        keyStrengths = 'Engaged with assessment prompts and made an attempt to articulate responses under timed conditions.';
    }

    // 2. Synthesize Growth Areas
    const missedTopics = [...new Set(breakdown.flatMap((b) => Array.isArray(b.missedTopics) ? b.missedTopics : []))];
    const explicitImprovements = Array.isArray(opts.improvements) ? opts.improvements.filter(Boolean) : [];

    let growthAreas = '';
    if (explicitImprovements.length > 0) {
        growthAreas = explicitImprovements.slice(0, 2).join('; ') + (missedTopics.length > 0 ? ` (notably missed: ${missedTopics.slice(0, 3).join(', ')})` : '.');
    } else if (missedTopics.length > 0) {
        growthAreas = `Could demonstrate deeper technical rigor by addressing key omitted topics including ${missedTopics.slice(0, 3).join(', ')}, and expanding on production trade-offs.`;
    } else if (overallScore < 60) {
        growthAreas = 'Needs more technical depth, concrete architectural trade-offs, and elaboration on edge cases rather than brief generalizations.';
    } else {
        growthAreas = 'Could further strengthen responses with concrete system metrics, real-world failure modes, and optimization trade-offs.';
    }

    // 3. Synthesize Hiring Recommendation
    let decision = opts.decision;
    if (!decision) {
        if (integrity.flagged || overallScore < passingScore - 15) {
            decision = 'rejected';
        } else if (overallScore < passingScore) {
            decision = 'review_needed';
        } else {
            decision = 'qualified';
        }
    }

    let hiringRecommendation = '';
    if (integrity.flagged) {
        const flagDetails = [];
        if ((integrity.tabSwitchCount || 0) > 0) {
            flagDetails.push(`${integrity.tabSwitchCount} tab switch${integrity.tabSwitchCount > 1 ? 'es' : ''}`);
        }
        if ((integrity.pasteCount || 0) > 0) {
            flagDetails.push(`${integrity.pasteCount} paste${integrity.pasteCount > 1 ? 's' : ''}`);
        }
        if (integrity.secondaryVoiceDetected || (integrity.secondVoiceCount || 0) > 0) {
            flagDetails.push(`secondary voice interference (${integrity.secondVoiceCount || 1} instance(s))`);
        }
        if (integrity.whisperDetected || (integrity.whisperCount || 0) > 0) {
            flagDetails.push(`background whispering (${integrity.whisperCount || 1} instance(s))`);
        }
        if (integrity.llmSpeechDetected || (Number(integrity.llmSpeechConfidence) >= 0.6)) {
            const confPct = Math.round((Number(integrity.llmSpeechConfidence) || 0.85) * 100);
            flagDetails.push(`AI-generated speech patterns (${confPct}% confidence)`);
        }

        const detailsText = flagDetails.length > 0 ? flagDetails.join(', ') : `${integrity.tabSwitchCount || 0} tab switches`;
        hiringRecommendation = `Do Not Proceed (Integrity Alert) - Candidate achieved ${overallScore}%, but assessment telemetry flagged elevated off-tab or paste anomalies (${detailsText}).`;
    } else if (decision === 'qualified' || overallScore >= passingScore + 10) {
        hiringRecommendation = `Strong Hire / Advance - Performance comfortably cleared the ${passingScore}% benchmark with an overall score of ${overallScore}%. Recommended for final team matching.`;
    } else if (overallScore >= passingScore) {
        hiringRecommendation = `Hire / Advance - Candidate met the target qualification threshold with ${overallScore}% (pass mark: ${passingScore}%). Proceed to next technical round.`;
    } else if (decision === 'review_needed' || overallScore >= passingScore - 15) {
        hiringRecommendation = `Review Needed - Borderline score of ${overallScore}% against the ${passingScore}% bar. Recommend recruiter review of specific growth areas before advancing.`;
    } else {
        hiringRecommendation = `Do Not Advance - Overall score of ${overallScore}% did not satisfy the minimum required passing score (${passingScore}%).`;
    }

    const bullets = [
        `Key Strengths: ${keyStrengths}`,
        `Growth Areas: ${growthAreas}`,
        `Hiring Recommendation: ${hiringRecommendation}`,
    ];

    return {
        keyStrengths,
        growthAreas,
        hiringRecommendation,
        bullets,
        text: bullets.map((b) => `• ${b}`).join('\n'),
    };
}

/**
 * Categorizes and diagnoses test runner failures or successes, providing
 * actionable developer feedback, complexity insights, and live interviewer cues.
 *
 * @param {Object} results - Test runner output
 * @param {Array<Object>} [results.testResults] - Array of test case execution outcomes
 * @param {number} [results.passed] - Number of passing test cases
 * @param {number} [results.total] - Total number of test cases
 * @param {string} [results.code] - Candidate's source code
 * @param {string} [results.language] - Language identifier (javascript, python, java, cpp)
 * @param {string} [results.error] - Top-level runtime or compilation error
 * @param {number} [results.executionTime] - Total execution time in milliseconds
 * @param {Object} [options] - Optional settings { problemTitle, timeLimitMs, difficulty }
 * @returns {Object} Contextual feedback with category, summary, edge cases, complexity notes, hints, and interviewer cues
 */
export function generateTestRunnerFeedback(results = {}, options = {}) {
    const rawResults = Array.isArray(results) ? { testResults: results } : (results || {});
    const testCases = Array.isArray(rawResults.testResults) ? rawResults.testResults : [];
    const passedCount = typeof rawResults.passed === 'number'
        ? rawResults.passed
        : (typeof rawResults.testsPassed === 'number'
            ? rawResults.testsPassed
            : testCases.filter((tc) => Boolean(tc && tc.passed)).length);
    const totalCount = typeof rawResults.total === 'number'
        ? rawResults.total
        : (typeof rawResults.totalTests === 'number'
            ? rawResults.totalTests
            : (testCases.length || (rawResults.success ? 1 : 1)));
    const code = String(rawResults.code || '').trim();
    const language = String(rawResults.language || 'javascript').toLowerCase();
    const topError = String(rawResults.error || '').trim();
    const executionTime = Number(rawResults.executionTime) || 0;
    const timeLimitMs = Number(options.timeLimitMs) || 3000;
    const problemTitle = options.problemTitle || 'Coding Problem';

    const passRate = totalCount > 0 ? passedCount / totalCount : 0;
    const allPassed = totalCount > 0 && passedCount === totalCount && !topError;

    // Detect Timeout / TLE
    const isTimeout = /timed?\s*out|timeout|sigterm|time\s*limit\s*exceeded|\btle\b/i.test(topError) ||
        testCases.some((tc) => /timed?\s*out|timeout|sigterm|time\s*limit\s*exceeded|\btle\b/i.test(String(tc?.error || tc?.actual || ''))) ||
        (executionTime >= timeLimitMs && !allPassed);

    // Detect Syntax / Compilation Error
    const isSyntaxError = /syntaxerror|compile\s*error|compilation\s*error|unexpected\s*token|parse\s*error|cannot\s*find\s*symbol/i.test(topError) ||
        testCases.some((tc) => /syntaxerror|compile\s*error|unexpected\s*token/i.test(String(tc?.error || '')));

    // Detect Runtime Errors / Exceptions
    const isRuntimeError = !isTimeout && !isSyntaxError && (
        Boolean(topError) ||
        testCases.some((tc) => Boolean(tc?.error) || /error|exception|segmentation\s*fault|sigsegv/i.test(String(tc?.actual || '')))
    );

    // Detect Edge Case Failures
    const edgeCasesDetected = [];
    const failingCases = testCases.filter((tc) => !tc.passed);

    for (const tc of failingCases) {
        const inputStr = typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input || '');
        const actualStr = String(tc.actual ?? tc.error ?? '');
        const expectedStr = typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : String(tc.expected ?? '');

        // 1. Empty / null collection edge cases
        if (/^(\[\]|\{\}|""|''|null|undefined|None)$/i.test(inputStr.trim()) || /\b(null|undefined|None|empty)\b/i.test(inputStr)) {
            edgeCasesDetected.push({
                type: 'empty_or_null_input',
                input: inputStr,
                expected: expectedStr,
                actual: actualStr,
                description: 'Failed on empty or null input collection.',
                hint: 'Add an early guard clause: verify input existence and non-zero length before indexing.',
            });
        }
        // 2. Zero or negative value boundary
        else if (/\b(?:0|-1|-\d+)\b/.test(inputStr) && !/\b[2-9]\d*\b/.test(inputStr)) {
            edgeCasesDetected.push({
                type: 'zero_or_negative_boundary',
                input: inputStr,
                expected: expectedStr,
                actual: actualStr,
                description: 'Failed on zero or negative integer boundary.',
                hint: 'Verify loop conditions and mathematical assumptions for zero and negative integers.',
            });
        }
        // 3. Single-element boundary
        else if (/^\[\s*[^,\]]+\s*\]$/.test(inputStr.trim()) || /^"[^"]"$/.test(inputStr.trim())) {
            edgeCasesDetected.push({
                type: 'single_element_boundary',
                input: inputStr,
                expected: expectedStr,
                actual: actualStr,
                description: 'Failed on single-element input boundary.',
                hint: 'Ensure algorithms with pointer steps (e.g. left < right) correctly evaluate single-element arrays without early termination.',
            });
        }
        // 4. Duplicate values
        else if (/\bduplicate\b/i.test(inputStr) || /(.)\1{2,}/.test(inputStr)) {
            edgeCasesDetected.push({
                type: 'duplicate_values',
                input: inputStr,
                expected: expectedStr,
                actual: actualStr,
                description: 'Failed on inputs containing duplicate items.',
                hint: 'Consider whether duplicate values need to be skipped or aggregated in frequency sets.',
            });
        }
    }

    // Complexity heuristic analysis
    let hasNestedLoops = false;
    let hasRecursion = false;
    if (code) {
        hasNestedLoops = /(?:for|while)\s*\([^)]*\)\s*\{[^}]*(?:for|while)\s*\(|for\s+\w+\s+in[^:\n]+:[^:\n]*(?:\n\s+)+for\s+\w+\s+in/s.test(code);
        const fnNames = [...code.matchAll(/(?:function|def)\s+([A-Za-z0-9_$]+)/g)].map((m) => m[1]);
        if (fnNames.length > 0) {
            hasRecursion = fnNames.some((name) => {
                const re = new RegExp(`\\b${name}\\s*\\(`, 'g');
                const matches = code.match(re);
                return matches && matches.length > 1;
            });
        }
    }

    // Build category, headline, summary, and interviewer prompts
    let category = 'partial_passed';
    let status = 'failed';
    let headline = '';
    let summary = '';
    const actionableHints = [];
    let interviewerQuestionCue = '';
    let timeComplexityObservation = '';
    let spaceComplexityObservation = '';
    let recommendedFix = '';

    if (allPassed) {
        category = 'all_passed';
        status = 'passed';
        headline = 'All Test Cases Passed (100%)';
        summary = `Excellent execution on ${problemTitle}! All ${totalCount} test cases completed successfully in ${executionTime ? `${executionTime}ms` : 'optimal time'}.`;
        
        if (hasNestedLoops) {
            timeComplexityObservation = 'Current implementation exhibits O(N²) time complexity due to nested loops. While passing current test cases, larger production workloads may require linear scaling.';
            actionableHints.push('Consider if an auxiliary hash table or frequency map could reduce time complexity from O(N²) to O(N).');
        } else {
            timeComplexityObservation = 'Time complexity appears linear or logarithmic, efficiently processing all provided test boundaries.';
            actionableHints.push('Great job maintaining clean, performant logic.');
        }

        spaceComplexityObservation = code.includes('new Map') || code.includes('new Set') || code.includes('dict(') || code.includes('{}')
            ? 'Auxiliary space is O(N) to store lookup tables.'
            : 'Auxiliary space is O(1) in-place memory usage.';

        actionableHints.push('Articulate your complexity trade-offs clearly to the interviewer.');
        interviewerQuestionCue = `Great work passing all test cases! How would your solution handle a real-time unbounded stream where inputs exceed available memory?`;
        recommendedFix = 'No functional changes needed. You can discuss scalability optimizations or edge-case trade-offs with the interviewer.';
    } else if (isTimeout) {
        category = 'timeout';
        status = 'timeout';
        headline = 'Time Limit Exceeded (Execution Timeout)';
        summary = `Your solution timed out after ${executionTime || timeLimitMs}ms. It likely exceeded the allowable time limit on larger or intensive test inputs.`;

        if (hasNestedLoops) {
            timeComplexityObservation = 'O(N²) quadratic nested loop detected. Inner iterations cause exponential cycle counts on large datasets.';
            actionableHints.push('Replace inner linear search with an O(1) hash map or two-pointer technique to achieve O(N) overall time complexity.');
        } else if (hasRecursion) {
            timeComplexityObservation = 'Unmemoized recursion detected (potential O(2^N) exponential call tree).';
            actionableHints.push('Add memoization (caching) or convert recursive calls to an iterative dynamic programming approach.');
        } else {
            timeComplexityObservation = 'Execution took longer than allowed; check for non-terminating while loops or redundant computations.';
            actionableHints.push('Verify loop termination conditions and ensure index variables are incremented toward termination on every step.');
        }

        interviewerQuestionCue = `Your implementation times out on larger test inputs. Can you walk me through the time complexity and how you could eliminate redundant operations?`;
        recommendedFix = 'Refactor nested iterations into single-pass linear scans with dictionary lookups, or introduce memoization on recursive branches.';
    } else if (isSyntaxError) {
        category = 'syntax_error';
        status = 'error';
        headline = 'Compilation / Syntax Error';
        summary = `Syntax error encountered during execution: ${topError || 'Code could not be compiled.'}`;
        actionableHints.push('Check for unclosed brackets, missing semicolons, or invalid keywords.');
        actionableHints.push(`Verify correct syntax for ${language.toUpperCase()}.`);
        interviewerQuestionCue = `It looks like there's a syntax or compilation issue. Take a moment to inspect the compiler output and fix any bracket or syntax mismatches.`;
        recommendedFix = 'Correct syntax errors indicated in the compiler trace before running test cases.';
    } else if (isRuntimeError) {
        category = 'runtime_error';
        status = 'error';
        const errDetail = topError || testCases.find((tc) => tc.error)?.error || 'Runtime error during evaluation';
        headline = 'Runtime Exception Encountered';
        summary = `Runtime exception: ${errDetail}`;

        if (/cannot\s*read\s*properties|nullpointer|typeerror|undefined/i.test(errDetail)) {
            actionableHints.push('Null or undefined property access. Check that variables and arrays are populated before dereferencing.');
            recommendedFix = 'Add null checks at function entry: e.g. if (!arr || arr.length === 0) return ...;';
        } else if (/indexerror|out\s*of\s*bounds/i.test(errDetail)) {
            actionableHints.push('Array index out of bounds. Verify 0-based boundary index conditions (use < length instead of <= length).');
            recommendedFix = 'Guard array index bounds: ensure 0 <= index < array.length before accessing elements.';
        } else if (/recursion|call\s*stack/i.test(errDetail)) {
            actionableHints.push('Maximum recursion depth exceeded. Your recursive function lacks an accessible base case.');
            recommendedFix = 'Define an explicit base condition that terminates recursion before making recursive invocations.';
        } else {
            actionableHints.push('Defend against unexpected argument types or state transitions.');
            recommendedFix = 'Review the stack trace and add defensive checks for edge case inputs.';
        }

        interviewerQuestionCue = `We hit a runtime exception on one of the test runs. What edge input might have triggered this condition, and how can we safeguard against it?`;
    } else if (edgeCasesDetected.length > 0) {
        category = 'edge_case_failure';
        status = 'failed';
        headline = `Edge Case Failure (${passedCount}/${totalCount} Passed)`;
        const primaryEdge = edgeCasesDetected[0];
        summary = `Code works on standard cases but failed on edge boundary conditions (${primaryEdge.description}).`;

        for (const ec of edgeCasesDetected) {
            actionableHints.push(ec.hint);
        }

        interviewerQuestionCue = `Your approach handles the general case well, but faltered on ${primaryEdge.description.toLowerCase()}. How should the function react when given this boundary input?`;
        recommendedFix = primaryEdge.hint;
    } else {
        category = 'partial_passed';
        status = 'failed';
        headline = `Test Cases Partially Passed (${passedCount}/${totalCount})`;
        summary = `Passed ${passedCount} of ${totalCount} test cases. Output did not match expected values on remaining tests.`;

        if (failingCases.length > 0) {
            const firstFail = failingCases[0];
            actionableHints.push(`Check logic on input: ${typeof firstFail.input === 'object' ? JSON.stringify(firstFail.input) : firstFail.input}`);
            actionableHints.push(`Expected output: ${firstFail.expected}, but your code returned: ${firstFail.actual}`);
        }
        actionableHints.push('Walk through your algorithm step-by-step with a pencil-and-paper trace on the failing test case.');
        interviewerQuestionCue = `We have ${passedCount} of ${totalCount} test cases passing. Let's trace through the first failing case together to see where the output diverges.`;
        recommendedFix = 'Trace the variable states on the failing test input to isolate the discrepancy.';
    }

    return {
        category,
        status,
        headline,
        summary,
        passedCount,
        totalCount,
        passRate: Math.round(passRate * 100) / 100,
        edgeCasesDetected,
        actionableHints: actionableHints.slice(0, 4),
        interviewerQuestionCue,
        timeComplexityObservation,
        spaceComplexityObservation,
        recommendedFix,
        executionTime,
    };
}

// Backwards-compatible alias
export const evaluateTestRunnerResults = generateTestRunnerFeedback;

/**
 * Calculates integrity telemetry metrics based on candidate session behavior:
 * - Off-tab switches and clipboard pastes
 * - Audio proctoring secondary voice / whisper detection during think-time
 * - AI-generated / LLM speech patterns and teleprompter reading cadence
 *
 * Fully backwards-compatible with (rawInput, rawPastes) signature.
 *
 * @param {number|Object} rawInput - Number of tab switches or a telemetry object
 * @param {number} [rawPastes=0] - Number of clipboard pastes
 * @param {Object} [rawAudioTelemetry={}] - Secondary voice / whisper detection telemetry
 * @param {Object} [rawLlmTelemetry={}] - AI speech detection telemetry
 * @returns {{
 *   tabSwitchCount: number,
 *   pasteCount: number,
 *   integrityRating: 'clean'|'moderate'|'flagged',
 *   integrityScore: number,
 *   flagged: boolean,
 *   secondaryVoiceDetected: boolean,
 *   secondVoiceCount: number,
 *   whisperDetected: boolean,
 *   whisperCount: number,
 *   llmSpeechDetected: boolean,
 *   llmSpeechConfidence: number,
 *   llmSpeechRiskLevel: string,
 *   violations: Array<{ type: string, severity: string, count?: number, confidence?: number, message: string }>,
 *   flagsSummary: string[],
 * }}
 */
export function evaluateAssessmentIntegrity(rawInput = 0, rawPastes = 0, rawAudioTelemetry = {}, rawLlmTelemetry = {}) {
    let rawSwitches = rawInput;
    let pastes = rawPastes;
    let audio = rawAudioTelemetry || {};
    let llm = rawLlmTelemetry || {};

    if (typeof rawInput === 'object' && rawInput !== null) {
        rawSwitches = rawInput.tabSwitchCount ?? rawInput.tabSwitches ?? 0;
        pastes = rawInput.pasteCount ?? rawInput.pastes ?? 0;
        audio = {
            secondaryVoiceDetected: rawInput.secondaryVoiceDetected ?? rawInput.secondVoiceDetected ?? rawInput.secondVoiceFlags?.detected ?? audio.secondaryVoiceDetected,
            secondVoiceCount: rawInput.secondVoiceCount ?? rawInput.secondaryVoiceCount ?? rawInput.secondVoiceFlags?.count ?? audio.secondVoiceCount,
            whisperDetected: rawInput.whisperDetected ?? rawInput.whisperingDetected ?? audio.whisperDetected,
            whisperCount: rawInput.whisperCount ?? audio.whisperCount,
            violations: rawInput.audioViolations ?? rawInput.violations ?? audio.violations,
            ...audio,
        };
        llm = {
            isAIGenerated: rawInput.llmSpeechDetected ?? rawInput.aiSpeechDetected ?? rawInput.isAIGenerated ?? llm.isAIGenerated,
            confidence: rawInput.llmSpeechConfidence ?? rawInput.llmConfidence ?? rawInput.confidence ?? llm.confidence,
            riskLevel: rawInput.llmSpeechRiskLevel ?? rawInput.llmRiskLevel ?? rawInput.riskLevel ?? llm.riskLevel,
            transcript: rawInput.transcript ?? rawInput.answer ?? rawInput.userAnswer ?? llm.transcript,
            indicators: rawInput.llmSpeechIndicators ?? rawInput.llmIndicators ?? llm.indicators,
            reasons: rawInput.llmReasons ?? rawInput.reasons ?? llm.reasons,
            ...llm,
        };
    }

    const parsedSwitches = Number(rawSwitches);
    const parsedPastes = Number(pastes);
    const tabSwitchCount = Number.isFinite(parsedSwitches) ? Math.max(0, Math.min(999, Math.round(parsedSwitches))) : 0;
    const pasteCount = Number.isFinite(parsedPastes) ? Math.max(0, Math.min(999, Math.round(parsedPastes))) : 0;

    // Secondary Voice / Whisper Audio Telemetry
    const rawSecondVoiceCount = Number(audio.secondVoiceCount ?? (audio.secondaryVoiceDetected ? 1 : 0));
    const secondVoiceCount = Number.isFinite(rawSecondVoiceCount) ? Math.max(0, Math.round(rawSecondVoiceCount)) : 0;
    const secondaryVoiceDetected = Boolean(audio.secondaryVoiceDetected || secondVoiceCount > 0);

    const rawWhisperCount = Number(audio.whisperCount ?? (audio.whisperDetected ? 1 : 0));
    const whisperCount = Number.isFinite(rawWhisperCount) ? Math.max(0, Math.round(rawWhisperCount)) : 0;
    const whisperDetected = Boolean(audio.whisperDetected || whisperCount > 0);

    // LLM Speech Telemetry
    let llmSpeechDetected = Boolean(llm.isAIGenerated || llm.llmSpeechDetected || (Number(llm.confidence) >= 0.60));
    let llmSpeechConfidence = Number(llm.confidence || (llmSpeechDetected ? 0.8 : 0));
    if (!Number.isFinite(llmSpeechConfidence)) llmSpeechConfidence = 0;
    let llmSpeechRiskLevel = llm.riskLevel || (llmSpeechDetected ? (llmSpeechConfidence >= 0.8 ? 'critical' : 'high') : 'clean');

    // If an unanalyzed text/transcript was provided, analyze with detectAIGeneratedSpeech
    if (!llmSpeechDetected && typeof llm.transcript === 'string' && llm.transcript.trim().length > 30) {
        try {
            const detected = detectAIGeneratedSpeech(llm.transcript);
            if (detected.isAIGenerated) {
                llmSpeechDetected = true;
                llmSpeechConfidence = detected.confidence;
                llmSpeechRiskLevel = detected.riskLevel;
            }
        } catch (_e) {
            // Safe fallback
        }
    }

    // Scoring & Penalty Breakdown
    let penalty = (tabSwitchCount * 15) + (pasteCount * 10);
    if (secondaryVoiceDetected) {
        penalty += Math.max(25, secondVoiceCount * 25);
    }
    if (whisperDetected) {
        penalty += Math.max(15, whisperCount * 15);
    }
    if (llmSpeechDetected) {
        penalty += llmSpeechConfidence >= 0.8 ? 40 : 25;
    }

    const integrityScore = Math.max(0, 100 - penalty);

    // Infractions & Flag Determination
    const totalOffscreenInfractions = tabSwitchCount + pasteCount;
    const audioFlagged = secondaryVoiceDetected || whisperCount >= 2;
    const isFlagged = tabSwitchCount > 2 ||
        pasteCount > 3 ||
        totalOffscreenInfractions >= 4 ||
        audioFlagged ||
        llmSpeechDetected;

    let integrityRating = 'clean';
    if (isFlagged) {
        integrityRating = 'flagged';
    } else if (totalOffscreenInfractions > 0 || whisperDetected || llmSpeechConfidence >= 0.35) {
        integrityRating = 'moderate';
    }

    const violations = [];
    const flagsSummary = [];

    if (tabSwitchCount > 0) {
        const sev = tabSwitchCount > 2 ? 'high' : 'medium';
        violations.push({ type: 'tab_switch', severity: sev, count: tabSwitchCount, message: `${tabSwitchCount} off-screen tab switch(es) detected` });
        flagsSummary.push(`${tabSwitchCount} tab switch(es)`);
    }
    if (pasteCount > 0) {
        const sev = pasteCount > 3 ? 'high' : 'medium';
        violations.push({ type: 'clipboard_paste', severity: sev, count: pasteCount, message: `${pasteCount} clipboard paste event(s) detected` });
        flagsSummary.push(`${pasteCount} clipboard paste(s)`);
    }
    if (secondaryVoiceDetected) {
        violations.push({ type: 'secondary_voice', severity: 'high', count: secondVoiceCount, message: `Secondary voice interference detected (${secondVoiceCount} incident(s))` });
        flagsSummary.push(`Secondary voice (${secondVoiceCount})`);
    }
    if (whisperDetected) {
        violations.push({ type: 'whispering', severity: 'medium', count: whisperCount, message: `Background whispering detected (${whisperCount} incident(s))` });
        flagsSummary.push(`Background whispering (${whisperCount})`);
    }
    if (llmSpeechDetected) {
        violations.push({ type: 'ai_generated_speech', severity: 'critical', confidence: llmSpeechConfidence, riskLevel: llmSpeechRiskLevel, message: `AI-generated speech detected (${Math.round(llmSpeechConfidence * 100)}% confidence)` });
        flagsSummary.push(`AI-generated speech (${Math.round(llmSpeechConfidence * 100)}%)`);
    }

    return {
        tabSwitchCount,
        pasteCount,
        integrityRating,
        integrityScore,
        flagged: isFlagged,
        secondaryVoiceDetected,
        secondVoiceCount,
        whisperDetected,
        whisperCount,
        llmSpeechDetected,
        llmSpeechConfidence,
        llmSpeechRiskLevel,
        violations,
        flagsSummary,
    };
}



