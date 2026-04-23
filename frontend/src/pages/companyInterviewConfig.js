/**
 * Interview configuration labels, presets, and utility functions.
 * Extracted from CompanyInterview.jsx to reduce component complexity.
 */

export const INTERVIEW_LABELS = {
    company: 'Company',
    role: 'Role',
    stage: 'Stage',
    difficulty: 'Difficulty',
    format: 'Format',
    interviewerVoice: 'Interviewer Voice (Groq API)',
    tonePersona: 'Tone / Persona',
    questionSource: 'Question Source',
    resumePersonalization: 'Resume-Based Personalization',
    resumeMode: 'Resume Interview Mode',
    advancedControls: 'Advanced AI Controls',
    runtimeMode: 'Runtime Mode',
    interviewerStyle: 'Interviewer Style',
    followUpDepth: 'Follow-up Depth',
    pacing: 'Pacing',
    questions: 'Questions',
    focusTopics: 'Focus Topics (optional)',
    realInterviewerMode: 'Real Interviewer Mode',
};

export const INTERVIEW_PRESETS = [
    {
        id: 'real_interviewer',
        label: 'Real Interviewer',
        blurb: 'Closest to actual interview behavior: concise prompts, rigorous follow-ups, minimal coaching.',
        options: {
            interviewerIntensity: 'challenging',
            followUpDepth: 'deep',
            answerPace: 'balanced',
            realInterviewerMode: true,
            focusTopics: 'clarity, trade-offs, edge cases, decision making',
            questionCount: 8,
        },
    },
    {
        id: 'faang_loop',
        label: 'FAANG Loop',
        blurb: 'Sharper probing, deeper follow-ups, and longer loops for high-bar rounds.',
        options: {
            interviewerIntensity: 'challenging',
            followUpDepth: 'deep',
            answerPace: 'fast',
            realInterviewerMode: false,
            focusTopics: 'trade-offs, scalability, edge cases, optimization',
            questionCount: 10,
        },
    },
    {
        id: 'startup_rapid_fire',
        label: 'Startup Rapid-Fire',
        blurb: 'Fast pace, practical questioning, and shipping-focused conversations.',
        options: {
            interviewerIntensity: 'challenging',
            followUpDepth: 'standard',
            answerPace: 'fast',
            realInterviewerMode: false,
            focusTopics: 'MVP thinking, execution speed, prioritization, product sense',
            questionCount: 8,
        },
    },
    {
        id: 'campus_placement',
        label: 'Campus Placement',
        blurb: 'Supportive structure for fresher-style technical and behavioral rounds.',
        options: {
            interviewerIntensity: 'supportive',
            followUpDepth: 'standard',
            answerPace: 'balanced',
            realInterviewerMode: false,
            focusTopics: 'fundamentals, clarity, structured answers, confidence',
            questionCount: 6,
        },
    },
    {
        id: 'service_it_fresher',
        label: 'Service IT Fresher',
        blurb: 'HR introduction first, then realistic HR + technical fundamentals based on your CV.',
        options: {
            interviewerIntensity: 'supportive',
            followUpDepth: 'standard',
            answerPace: 'balanced',
            realInterviewerMode: false,
            resumeInterviewMode: 'fresher-hr-tech',
            focusTopics: 'hr basics, cs fundamentals, confidence, communication',
            questionCount: 12,
        },
    },
    {
        id: 'behavioral_coach',
        label: 'Behavioral Coach',
        blurb: 'Lower-pressure mode optimized for STAR stories and communication quality.',
        options: {
            interviewerIntensity: 'supportive',
            followUpDepth: 'deep',
            answerPace: 'slow',
            realInterviewerMode: false,
            focusTopics: 'STAR method, ownership, teamwork, conflict resolution',
            questionCount: 8,
        },
    },
];

export function clampInterviewScore(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function buildInterviewSummaryFallback(avg, config, questionCount, speechHistory = []) {
    const overallScore = clampInterviewScore(avg, 70);
    const detailedBreakdown = {
        technicalSkills: clampInterviewScore(overallScore - 4, overallScore),
        communication: clampInterviewScore(overallScore + 3, overallScore),
        problemSolving: clampInterviewScore(overallScore - 1, overallScore),
        cultureFit: clampInterviewScore(overallScore + 2, overallScore),
    };

    return {
        overallScore,
        summary: `You completed ${questionCount || 0} questions for the ${config.role} role at ${config.company}. Your baseline communication held up, but the next gain will come from making answers more specific and structured.`,
        strengths: ['Stayed engaged across the session', 'Answered directly instead of stalling', 'Maintained a usable structure in most responses'],
        improvements: ['Add more specific examples and trade-offs', 'State the core answer earlier', 'Close answers with a concrete takeaway'],
        recommendation: 'Review the weakest answers from this mock and re-answer them with more depth.',
        verdict: overallScore >= 85 ? 'Strong Hire' : overallScore >= 70 ? 'Would Advance' : overallScore >= 55 ? 'Borderline' : 'Would Not Advance',
        verdictEmoji: overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎',
        detailedBreakdown,
        categoryScores: detailedBreakdown,
        suggestedTopics: [
            { topic: 'Answer specificity', priority: 'high', reason: 'The session needs more concrete examples and clearer support.' },
            { topic: `${config.stage} interview practice`, priority: 'medium', reason: 'Practicing the exact interview format will improve consistency.' },
            { topic: 'Follow-up question handling', priority: 'medium', reason: 'Stronger follow-up depth usually improves overall interview performance.' }
        ],
        practiceQuestions: [
            'Repeat one weak answer and make it twice as concrete.',
            'Answer a follow-up question that asks for trade-offs or edge cases.',
            `Practice one ${config.stage} interview question under a time limit.`,
            'Explain one solution and then summarize it in two crisp sentences.',
            'Record one answer and critique clarity, depth, and structure.'
        ],
        studyPlan: [
            { day: 'Day 1-2', focus: 'Weakest answers', tasks: ['Rewrite the weakest responses', 'Add one concrete example to each'] },
            { day: 'Day 3-4', focus: 'Structure', tasks: ['Practice clear openings', 'Add trade-offs and outcomes'] },
            { day: 'Day 5', focus: config.stage, tasks: ['Run a timed mock round', 'Review missed details'] },
            { day: 'Day 6', focus: 'Communication', tasks: ['Record 3 answers', 'Tighten pacing and clarity'] },
            { day: 'Day 7', focus: 'Review & Practice', tasks: ['Redo the mock', 'Compare against the prior round'] }
        ],
        questionBreakdown: [],
        recommendations: [{ area: 'Next Focus', action: 'Make each answer more specific and concrete.' }],
        speechAnalysis: speechHistory?.length > 0 ? {
            overallWPM: Math.round(speechHistory.reduce((sum, sample) => sum + (sample.wpm || 0), 0) / speechHistory.length),
            totalFillers: speechHistory.reduce((sum, sample) => sum + (sample.totalFillers || 0), 0),
            clarityTrend: speechHistory.map(sample => sample.clarityScore || 80),
            confidenceTrend: speechHistory.map(sample => sample.confidenceScore || 75),
        } : null,
    };
}

export function normalizeFeedbackList(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(item => String(item));
    if (typeof value === 'string' && value.trim().length > 0) return [value.trim()];
    return [];
}
