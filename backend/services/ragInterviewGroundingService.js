import { getFilteredQuestions } from './companyQuestionService.js';

const STAGE_TO_COMPANY_STAGE = {
  intake: 'Technical',
  warmup: 'Technical',
  technical: 'Technical',
  followup: 'Technical',
  challenge: 'Technical',
  feedback: 'HR',
};

const MISSING_AREA_HINTS = {
  'complexity analysis': 'Quantify time and space complexity before concluding the answer.',
  'edge cases': 'Call out at least two edge cases and explain behavior for each.',
  'trade-off discussion': 'Compare at least two approaches and justify the final choice.',
};

const normalizeText = (value) => String(value || '').trim();

const normalizeList = (...values) => values
  .flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(/[\n,|]/g);
    return [];
  })
  .map((item) => normalizeText(item))
  .filter(Boolean);

const normalizeResumeContext = (resumeContext = {}) => {
  if (!resumeContext || typeof resumeContext !== 'object') {
    return {};
  }

  const candidateHeadline = normalizeText(
    resumeContext.candidateHeadline ||
    resumeContext.headline ||
    resumeContext.title
  );
  const summary = normalizeText(
    resumeContext.summary ||
    resumeContext.experienceSummary ||
    resumeContext.bio
  );
  const coreSkills = Array.from(new Set(normalizeList(resumeContext.coreSkills, resumeContext.skills))).slice(0, 12);
  const projectHighlights = Array.from(new Set(normalizeList(resumeContext.projectHighlights, resumeContext.projects))).slice(0, 8);
  const likelyQuestionAreas = Array.from(new Set(normalizeList(resumeContext.likelyQuestionAreas, resumeContext.questionAreas))).slice(0, 8);

  return {
    ...resumeContext,
    candidateHeadline,
    summary,
    coreSkills,
    projectHighlights,
    likelyQuestionAreas,
  };
};

const normalizeDifficulty = (difficulty) => {
  const value = String(difficulty || 'medium').toLowerCase();
  if (value === 'easy') return 'Easy';
  if (value === 'hard') return 'Hard';
  return 'Medium';
};

const buildHintPatterns = (missingAreas = [], resumeContext = {}) => {
  const hints = [];
  const normalizedResumeContext = normalizeResumeContext(resumeContext);

  for (const area of missingAreas) {
    if (MISSING_AREA_HINTS[area]) {
      hints.push(MISSING_AREA_HINTS[area]);
    }
  }

  const skills = [
    ...(Array.isArray(normalizedResumeContext?.coreSkills) ? normalizedResumeContext.coreSkills : []),
  ].slice(0, 3);

  for (const skill of skills) {
    hints.push(`Anchor one example using ${skill} to make the answer concrete.`);
  }

  if (normalizedResumeContext.candidateHeadline) {
    hints.push(`Reference the candidate headline "${normalizedResumeContext.candidateHeadline}" when tailoring the follow-up.`);
  }

  if (normalizedResumeContext.projectHighlights.length > 0) {
    hints.push(`Ask about the strongest project evidence: ${normalizedResumeContext.projectHighlights[0]}.`);
  }

  return Array.from(new Set(hints)).slice(0, 6);
};

const buildFallbackQuestions = ({ company, stage, interviewType, missingAreas = [], limit = 5 }) => {
  const stageName = String(stage || 'technical');
  const typeName = String(interviewType || 'dsa');
  const areaPrompt = missingAreas.length > 0 ? missingAreas[0] : 'trade-offs';
  const prompts = [
    `Walk through your ${stageName} approach step-by-step and justify each decision.`,
    `What constraints would you clarify first for this ${typeName} problem?`,
    `Which edge cases are most likely to break your current approach?`,
    `How would your approach change at 10x scale?`,
    `What is the time and space complexity, and why is it acceptable?`,
    `Give one alternative solution and compare trade-offs against your current plan.`,
    `You mentioned ${areaPrompt}. Expand on it with a concrete example.`,
  ];

  return prompts.slice(0, limit).map((question, index) => ({
    id: `fallback_${index + 1}`,
    company: String(company || 'general').toLowerCase().replace(/\s+/g, '_'),
    role: 'SDE',
    stage: 'Technical',
    difficulty: 'Medium',
    question,
    tags: ['fallback'],
  }));
};

export class InterviewGroundingService {
  static async fetchGroundingContext({
    company,
    role = 'SDE',
    difficulty = 'medium',
    stage = 'technical',
    interviewType = 'dsa',
    missingAreas = [],
    resumeContext = {},
    limit = 5,
  } = {}) {
    const startedAt = Date.now();
    const safeLimit = Math.min(8, Math.max(1, Number(limit) || 5));
    const normalizedStage = STAGE_TO_COMPANY_STAGE[stage] || 'Technical';
    const normalizedDifficulty = normalizeDifficulty(difficulty);
    const normalizedResumeContext = normalizeResumeContext(resumeContext);

    let results = getFilteredQuestions(company, role, normalizedStage, normalizedDifficulty);

    if (results.length === 0) {
      // Relax stage and difficulty if the initial query is too strict.
      results = getFilteredQuestions(company, role, null, null);
    }

    if (results.length === 0) {
      // Fallback to role-wide samples to guarantee non-empty retrieval for known roles.
      results = getFilteredQuestions(null, role, 'Technical', null);
    }

    if (results.length === 0) {
      results = buildFallbackQuestions({
        company,
        stage,
        interviewType,
        missingAreas,
        limit: safeLimit,
      });
    }

    const selected = results
      .sort((a, b) => (Number(b.frequencyScore) || 0) - (Number(a.frequencyScore) || 0))
      .slice(0, safeLimit);

    const retrievedQuestions = selected.map((item) => ({
      id: item.id,
      company: item.company,
      role: item.role,
      stage: item.stage,
      difficulty: item.difficulty,
      question: item.question,
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));

    const retrievedExamples = selected
      .map((item) => item.answer || item.theory)
      .filter(Boolean)
      .slice(0, safeLimit);

    const hintPatterns = buildHintPatterns(missingAreas, normalizedResumeContext);

    return {
      source: selected[0]?.id?.startsWith('fallback_') ? 'fallback_templates' : 'company_question_bank',
      query: {
        company: company || null,
        role,
        stage,
        interviewType,
        normalizedStage,
        difficulty: normalizedDifficulty,
        resumeHeadline: normalizedResumeContext.candidateHeadline || null,
        resumeSkills: normalizedResumeContext.coreSkills.slice(0, 5),
      },
      retrievedQuestions,
      retrievedExamples,
      hintPatterns,
      count: retrievedQuestions.length,
      retrievalLatencyMs: Date.now() - startedAt,
    };
  }
}

export default InterviewGroundingService;
