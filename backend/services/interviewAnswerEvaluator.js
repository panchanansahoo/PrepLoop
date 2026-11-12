/**
 * Evaluates fresher interview answers based on actual content quality.
 * Enhanced with semantic rubric dimensions (Clarity, Depth, Correctness, STAR structure, Specificity).
 */

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

