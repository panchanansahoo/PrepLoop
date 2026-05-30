/**
 * Evaluates fresher interview answers based on actual content quality.
 * Replaces deterministicScore() which only used question number, not answer quality.
 */

const TECHNICAL_KEYWORDS = {
    oop: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'class', 'object', 'interface', 'extends', 'implements'],
    database: ['primary key', 'foreign key', 'index', 'normalization', 'join', 'query', 'sql', 'table', 'schema', 'acid'],
    web: ['http', 'get', 'post', 'rest', 'api', 'request', 'response', 'client', 'server', 'protocol'],
    os: ['process', 'thread', 'memory', 'concurrency', 'parallelism', 'scheduling', 'deadlock', 'semaphore'],
    ds: ['array', 'linked list', 'stack', 'queue', 'tree', 'hash', 'graph', 'sorting', 'recursion', 'complexity'],
};

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
    if(/\b(because|since|therefore|hence|as a result)\b/.test(lower)) score += 1;
    if(/\b(first|second|third|finally|additionally|moreover)\b/.test(lower)) score += 1;
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
    const lines = codeText.split('\n').length;
    let score = 2;
    if (lines > 5) score += 1;
    if (lines > 15) score += 1;
    if (/function|def|class|const|let|var/.test(codeText)) score += 1;
    if (/return/.test(codeText)) score += 1;
    if (/\/\/|\/\*|#/.test(codeText)) score += 0.5;
    if (/for|while|if|switch/.test(codeText)) score += 0.5;
    return Math.min(Math.round(score), 5);
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
        if (!/\b(trade-off|alternative|pros and cons)\b/.test(answer.toLowerCase())) {
            improvements.push('Discuss trade-offs and alternatives');
        }
    }

    if (stage === 'HR' || stage === 'Behavioral') {
        if (!/\b(example|instance|situation|project)\b/.test(answer.toLowerCase())) {
            improvements.push('Use a real experience or example');
        }
        if (!/\b(result|outcome|impact|achieved)\b/.test(answer.toLowerCase())) {
            improvements.push('Share the outcome or result of your actions');
        }
    }

    if (!improvements.length) improvements.push('Consider structuring your answer with a clear framework');

    return improvements.slice(0, 3);
}

/**
 * Evaluate a fresher answer based on actual content quality.
 * @param {string} userAnswer - The candidate's answer text
 * @param {string} stage - Interview stage (HR, Technical, etc.)
 * @param {string} codeText - Any code submitted
 * @returns {{ score: number, strengths: string[], improvements: string[] }}
 */
export function evaluateFresherAnswer(userAnswer, stage, codeText = '') {
    const answer = String(userAnswer || '').trim();
    if (!answer) {
        return {
            score: 25,
            strengths: ['Attempted to answer'],
            improvements: ['Provide a complete response with examples and reasoning'],
        };
    }

    const lengthScore = evaluateAnswerLength(answer);
    const structureScore = evaluateStructure(answer);
    const concreteScore = evaluateConcreteness(answer);
    const keywordScore = Math.min(countTechnicalKeywords(answer), 5);
    const codeScore = evaluateCodeQuality(codeText);

    const stageWeights = stage === 'Technical' || stage === 'DSA / Coding'
        ? { length: 2, structure: 2, concrete: 1.5, keywords: 2.5, code: 2 }
        : stage === 'HR' || stage === 'Behavioral'
            ? { length: 2, structure: 2, concrete: 3, keywords: 1, code: 0 }
            : { length: 2.5, structure: 2, concrete: 2, keywords: 1.5, code: 1 };

    const totalWeight = Object.values(stageWeights).reduce((a, b) => a + b, 0);
    const rawScore = (
        lengthScore * stageWeights.length +
        structureScore * stageWeights.structure +
        concreteScore * stageWeights.concrete +
        keywordScore * stageWeights.keywords +
        codeScore * stageWeights.code
    ) / totalWeight;

    const maxPerCategory = 5;
    const maxRawScore = maxPerCategory * totalWeight / totalWeight;
    const normalizedScore = Math.round((rawScore / maxRawScore) * 100);

    const clampedScore = Math.max(25, Math.min(98, normalizedScore));

    const strengths = pickStrengths(answer, stage);
    const improvements = pickImprovements(answer, stage);

    return {
        score: clampedScore,
        strengths,
        improvements,
    };
}

// Backwards-compatible alias
export const _evaluateFresherAnswer = evaluateFresherAnswer;
