import express from 'express';
import { optionalAuth, authenticateToken } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import { callInterviewReport, callTurnScoring, ROUTER_MODELS } from '../../services/llmRouter.js';
import { quotaGuard } from '../../services/quotaGuard.js';
import { deferredJobQueue } from '../../services/deferredJobQueue.js';
import { createLogger } from '../../utils/structuredLogger.js';

const logger = createLogger('interview-evaluation');
const router = express.Router();

// ─── Evaluate overall interview session ───
function clampScore(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function averageScore(values = []) {
  const numericValues = values.map(Number).filter(Number.isFinite);
  if (numericValues.length === 0) return null;
  return Math.round(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length);
}

function buildSpeechAnalysis(speechHistory = []) {
  if (!Array.isArray(speechHistory) || speechHistory.length === 0) return null;

  return {
    overallWPM: averageScore(speechHistory.map(sample => sample.wpm || 0)) || 0,
    totalFillers: speechHistory.reduce((sum, sample) => sum + (sample.totalFillers || 0), 0),
    clarityTrend: speechHistory.map(sample => clampScore(sample.clarityScore, 80)),
    confidenceTrend: speechHistory.map(sample => clampScore(sample.confidenceScore, 75)),
  };
}

function detectQuestionCategory(questionMeta = {}, stage = '', question = '') {
  const tags = Array.isArray(questionMeta?.tags) ? questionMeta.tags.join(' ') : '';
  const normalized = `${stage} ${tags} ${question}`.toLowerCase();

  if (normalized.includes('system design') || normalized.includes('system-design') || normalized.includes('design a ')) {
    return 'system-design';
  }

  if (
    normalized.includes('behavior') ||
    normalized.includes('behaviour') ||
    normalized.includes('culture') ||
    normalized.includes('team') ||
    normalized.includes('tell me about') ||
    normalized.includes('conflict')
  ) {
    return 'behavioral';
  }

  if (
    normalized.includes('coding') ||
    normalized.includes('code') ||
    normalized.includes('implement') ||
    normalized.includes('algorithm') ||
    normalized.includes('leetcode')
  ) {
    return 'coding';
  }

  if (normalized.includes('hr') || normalized.includes('recruiter')) {
    return 'hr';
  }

  return 'technical';
}

function extractInterviewQaPairs(conversation = []) {
  const qaPairs = [];
  let currentQuestion = null;

  for (const message of (conversation || [])) {
    if (message.role === 'interviewer' && !currentQuestion) {
      currentQuestion = {
        question: message.content,
        questionSource: message.questionSource,
        questionMeta: message.questionMeta,
        timestamp: message.timestamp,
      };
      continue;
    }

    if (message.role === 'candidate' && (currentQuestion || message.question)) {
      const candidateQuestion = message.question
        ? {
            question: message.question,
            questionSource: message.questionSource,
            questionMeta: message.questionMeta,
            timestamp: message.questionTimestamp || message.timestamp,
          }
        : currentQuestion;
      qaPairs.push({
        ...candidateQuestion,
        answer: message.content,
        answerTimestamp: message.timestamp,
        questionNumber: message.questionNumber,
        questionId: message.questionId,
        stage: message.stage,
      });
      currentQuestion = null;
      continue;
    }

    if (message.role === 'interviewer' && currentQuestion) {
      currentQuestion = {
        question: message.content,
        questionSource: message.questionSource,
        questionMeta: message.questionMeta,
        timestamp: message.timestamp,
      };
      continue;
    }

    if (message.role === 'feedback' && qaPairs.length > 0) {
      const latestPair = qaPairs[qaPairs.length - 1];
      latestPair.inlineScore = message.score;
      latestPair.strengths = Array.isArray(message.strengths) ? message.strengths : [];
      latestPair.improvements = Array.isArray(message.improvements) ? message.improvements : [];
      latestPair.feedback = message.content;
      latestPair.evalProvider = message.evalProvider || (message.evalModelUsed?.includes('gemini') ? 'gemini' : (message.evalModelUsed?.includes('openrouter') ? 'openrouter' : 'groq'));
      latestPair.evalModelUsed = message.evalModelUsed || null;
      latestPair.isFallbackModel = message.isFallbackModel === true || latestPair.evalProvider !== 'groq';
      latestPair.isEstimated = message.isEstimated === true || message.status === 'estimated' || message.evalModelUsed === 'heuristic-estimated';
      latestPair.status = message.status || (latestPair.isEstimated ? 'estimated' : 'scored');
      latestPair.isUnscored = message.isUnscored === true || message.status === 'not_scored' || (message.score === null && !latestPair.isEstimated);
    }
  }

  return qaPairs;
}

function collectTopItems(groups = [], limit = 4) {
  const counts = new Map();

  for (const group of groups) {
    for (const item of (group || [])) {
      const key = String(item || '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([item]) => item);
}

function defaultIdealAnswerPoints(category) {
  switch (category) {
    case 'system-design':
      return ['Clarify scale and constraints', 'Explain architecture trade-offs', 'Discuss reliability and latency'];
    case 'behavioral':
      return ['Use a clear STAR structure', 'Describe your specific actions', 'Quantify the result or lesson learned'];
    case 'coding':
      return ['State the approach before coding', 'Cover complexity and edge cases', 'Explain how you would test the solution'];
    case 'hr':
      return ['Answer directly and authentically', 'Connect the answer to the role', 'Show a mature reason for your decision'];
    default:
      return ['Lead with the core idea', 'Support it with a concrete example', 'Mention trade-offs or edge cases'];
  }
}

export function buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores = [], speechHistory = [] }) {
  const questionBreakdown = qaPairs.map((qa, index) => {
    const answer = String(qa.answer || '').trim();
    const category = detectQuestionCategory(qa.questionMeta, stage, qa.question);

    const isSkippedTurn = qa.isSkipped === true || qa.status === 'skipped' || qa.submissionType === 'voluntary_skip';
    const isEstimatedTurn = !isSkippedTurn && (qa.isEstimated === true || qa.status === 'estimated' || (qa.inlineScore === null && !qa.isUnscored));

    if (qa.isUnscored || isEstimatedTurn || isSkippedTurn) {
      return {
        questionNumber: index + 1,
        question: qa.question?.substring(0, 300),
        candidateAnswer: answer.substring(0, 600),
        score: null, // Numerical score is null: estimated and skipped turns are excluded from numeric averages
        status: isSkippedTurn ? 'skipped' : (isEstimatedTurn ? 'estimated' : 'not_scored'),
        isEstimated: isEstimatedTurn,
        isSkipped: isSkippedTurn,
        category,
        feedback: qa.feedback || (isSkippedTurn ? 'Question skipped by candidate (not scored).' : (isEstimatedTurn ? 'Estimated answer recording (AI evaluation temporarily unavailable).' : 'Not scored (evaluation timed out).')),
        strengths: qa.strengths?.length ? qa.strengths : [],
        improvements: qa.improvements?.length ? qa.improvements : [],
        idealAnswerPoints: defaultIdealAnswerPoints(category),
        questionSource: qa.questionSource,
        questionMeta: qa.questionMeta,
        evalProvider: qa.evalProvider || (isEstimatedTurn ? 'heuristic-estimated' : null),
        evalModelUsed: qa.evalModelUsed || (isEstimatedTurn ? 'heuristic-estimated' : null),
        isFallbackModel: qa.isFallbackModel ?? true,
      };
    }
    
    // Use evaluateFresherAnswer if inlineScore and sessionScore are missing
    let fallbackScore = 0;
    if ((qa.inlineScore === null || qa.inlineScore === undefined) && (sessionScores[index] === null || sessionScores[index] === undefined)) {
      fallbackScore = evaluateFresherAnswer(answer, category === 'coding' || category === 'system-design' ? 'Technical' : 'HR').score;
    }

    const heuristicsScore = clampScore(
      qa.inlineScore ?? sessionScores[index] ?? fallbackScore,
      60
    );

    const strengths = qa.strengths?.length
      ? qa.strengths
      : [
        answer.length > 160 ? 'Provided enough detail to communicate the main idea' : 'Answered directly without going off track',
        category === 'behavioral' ? 'Showed self-awareness in the example' : 'Kept the explanation understandable'
      ].slice(0, answer.length > 80 ? 2 : 1);

    const improvements = qa.improvements?.length
      ? qa.improvements
      : [
        answer.length < 120 ? 'Add more depth and concrete supporting detail' : 'Tighten the answer so the main point lands faster',
        category === 'coding' ? 'Call out complexity and edge cases explicitly' : 'Use one concrete example or measurable outcome'
      ].slice(0, 2);

    const feedback = qa.feedback || (
      heuristicsScore >= 80
        ? 'This answer was solid and relevant. The next step is making the reasoning even sharper with one concrete example or trade-off.'
        : heuristicsScore >= 60
          ? 'The answer covered the basics, but it stayed too general in places. Add more specifics and structure to make the response more convincing.'
          : 'The answer did not yet demonstrate enough depth for this question. Slow down, structure the response, and cover the core concepts more explicitly.'
    );

    return {
      questionNumber: index + 1,
      question: qa.question?.substring(0, 300),
      candidateAnswer: answer.substring(0, 600),
      score: heuristicsScore,
      status: 'scored',
      isEstimated: false,
      category,
      feedback,
      strengths,
      improvements,
      idealAnswerPoints: defaultIdealAnswerPoints(category),
      questionSource: qa.questionSource,
      questionMeta: qa.questionMeta,
      evalProvider: qa.evalProvider || 'groq',
      evalModelUsed: qa.evalModelUsed || null,
      isFallbackModel: qa.isFallbackModel === true || qa.evalProvider !== 'groq',
      isRescoredWithFinalModel: qa.isRescoredWithFinalModel === true,
    };
  });

  const scoredItems = questionBreakdown.filter(item =>
    typeof item.score === 'number' && Number.isFinite(item.score) && !item.isEstimated && item.status !== 'estimated' && !item.isSkipped && item.status !== 'skipped'
  );
  const scoredSessionScores = (sessionScores || []).filter(s => typeof s === 'number' && Number.isFinite(s));
  const overallScore = scoredItems.length > 0
    ? averageScore(scoredItems.map(item => item.score))
    : (scoredSessionScores.length > 0 ? averageScore(scoredSessionScores) : null);

  const categoryBuckets = {
    technicalSkills: [],
    communication: scoredItems.map(item => Math.min(100, item.score + (item.candidateAnswer?.length > 120 ? 6 : -4))),
    problemSolving: [],
    cultureFit: [],
  };

  for (const question of questionBreakdown) {
    if (question.isEstimated || question.status === 'estimated' || question.isSkipped || question.status === 'skipped' || typeof question.score !== 'number') continue;
    if (['technical', 'coding', 'system-design'].includes(question.category)) {
      categoryBuckets.technicalSkills.push(question.score);
      categoryBuckets.problemSolving.push(Math.min(100, question.score + (question.category === 'coding' ? 4 : 0)));
    }

    if (['behavioral', 'hr'].includes(question.category)) {
      categoryBuckets.cultureFit.push(question.score);
      categoryBuckets.communication.push(Math.min(100, question.score + 4));
    }
  }

  const categoryScores = {
    technicalSkills: averageScore(categoryBuckets.technicalSkills) ?? Math.max(55, overallScore - 3),
    communication: averageScore(categoryBuckets.communication) ?? overallScore,
    problemSolving: averageScore(categoryBuckets.problemSolving) ?? Math.max(50, overallScore - 2),
    cultureFit: averageScore(categoryBuckets.cultureFit) ?? Math.max(55, overallScore + 2),
  };

  const strengths = collectTopItems(questionBreakdown.map(item => item.strengths), 4);
  const improvements = collectTopItems(questionBreakdown.map(item => item.improvements), 4);

  const weakestCategory = Object.entries(categoryScores).sort((left, right) => left[1] - right[1])[0]?.[0] || 'technicalSkills';
  const weakestCategoryLabel = weakestCategory
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase());

  const skippedCount = questionBreakdown.filter(item => item.isSkipped || item.status === 'skipped').length;
  const isPartiallyScored = skippedCount >= 2;
  const isEstimatedSession = overallScore === null || overallScore === undefined;

  let verdict;
  let verdictEmoji;
  let sessionStatus = 'completed';

  if (isEstimatedSession) {
    verdict = 'Estimated Assessment';
    verdictEmoji = '📊';
    sessionStatus = 'estimated';
  } else if (isPartiallyScored) {
    verdict = 'Partially Scored';
    verdictEmoji = '⚖️';
    sessionStatus = 'partially_scored';
  } else {
    verdict = overallScore >= 85
      ? 'Strong Hire'
      : overallScore >= 70
        ? 'Would Advance'
        : overallScore >= 55
          ? 'Borderline'
          : 'Would Not Advance';
    verdictEmoji = overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎';
  }

  let summary = `You completed ${qaPairs.length} ${stage || 'interview'} questions for the ${role || 'role'} at ${company || 'the company'}. The clearest pattern was ${strengths[0] || 'solid baseline communication'}, while the biggest gap was ${improvements[0] || 'adding more depth to answers'}.`;
  if (isPartiallyScored) {
    summary = `You completed ${scoredItems.length} of ${qaPairs.length} questions (${skippedCount} questions skipped) for the ${role || 'role'} at ${company || 'the company'}. This session is partially scored based on answered questions only. The clearest pattern in your answered questions was ${strengths[0] || 'solid baseline communication'}.`;
  }

  let recommendation = `Prioritize ${weakestCategoryLabel.toLowerCase()} practice in your next mock session and make each answer more specific.`;
  if (isPartiallyScored) {
    recommendation = `Practice answering full sets of questions under timed conditions to build familiarity and confidence.`;
  }

  return {
    overallScore,
    summary,
    verdict,
    verdictEmoji,
    status: sessionStatus,
    strengths,
    improvements,
    recommendation,
    questionBreakdown,
    categoryScores,
    detailedBreakdown: categoryScores,
    recommendations: [
      {
        area: weakestCategoryLabel,
        action: `Spend one focused session improving ${weakestCategoryLabel.toLowerCase()} with question-by-question review.`
      }
    ],
    companyFitScore: clampScore(Math.round((categoryScores.communication + categoryScores.cultureFit) / 2), overallScore),
    companyFitNotes: `Your fit improves when your answers are concrete and structured; right now the main opportunity is stronger specificity in weaker areas.`,
    suggestedTopics: [
      { topic: weakestCategoryLabel, priority: 'high', reason: `This was your lowest scoring area in the interview.` },
      { topic: 'Answer structure and specificity', priority: 'medium', reason: 'Several answers would benefit from clearer supporting detail.' },
      { topic: stage || 'Interview fundamentals', priority: 'medium', reason: `Practice more questions in the ${stage || 'current'} format.` }
    ],
    practiceQuestions: [
      `Redo the weakest answer from this ${stage || 'interview'} round and make it 30% more specific.`,
      `Practice one ${weakestCategoryLabel.toLowerCase()} question and explain your reasoning out loud.`,
      `Answer a follow-up question that forces you to discuss trade-offs and edge cases.`,
      `Give the same answer again, but this time include a concrete example or metric.`,
      `Record one mock answer and critique its structure, clarity, and completeness.`
    ],
    studyPlan: [
      { day: 'Day 1-2', focus: weakestCategoryLabel, tasks: ['Review the weakest answers', 'Rewrite them with more specifics', 'Practice them aloud once'] },
      { day: 'Day 3-4', focus: 'Question structure', tasks: ['Use a repeatable framework', 'Add trade-offs and edge cases', 'Tighten long explanations'] },
      { day: 'Day 5', focus: stage || 'Interview practice', tasks: ['Run one timed mock round', 'Compare answers to ideal points'] },
      { day: 'Day 6', focus: 'Communication', tasks: ['Record 3 answers', 'Remove filler and tighten openings'] },
      { day: 'Day 7', focus: 'Review & Practice', tasks: ['Redo the full mock', 'Check progress against the weakest category'] }
    ],
    speechAnalysis: buildSpeechAnalysis(speechHistory),
  };
}

export function normalizeInterviewReport(rawReport, { company, role, stage, qaPairs, sessionScores = [], speechHistory = [] }) {
  const report = rawReport || {};
  const baseQuestionBreakdown = Array.isArray(report.questionBreakdown) ? report.questionBreakdown : [];

  const questionBreakdown = (baseQuestionBreakdown.length > 0 ? baseQuestionBreakdown : buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores, speechHistory }).questionBreakdown)
    .map((item, index) => {
      const qa = qaPairs[index] || {};
      const isSkippedTurn = qa.isSkipped === true || qa.status === 'skipped' || item.isSkipped === true || item.status === 'skipped' || qa.submissionType === 'voluntary_skip';
      const isEstimatedTurn = !isSkippedTurn && (qa.isEstimated === true || qa.status === 'estimated' || item.isEstimated === true || item.status === 'estimated' || (qa.inlineScore === null && !qa.isUnscored));

      let score = null;
      if (!isSkippedTurn && !isEstimatedTurn) {
        score = clampScore(item.score, clampScore(qa.inlineScore ?? sessionScores[index], 70));
      }

      return {
        ...item,
        questionNumber: item.questionNumber || index + 1,
        question: item.question || qa.question?.substring(0, 300) || `Question ${index + 1}`,
        score,
        status: isSkippedTurn ? 'skipped' : (isEstimatedTurn ? 'estimated' : (score !== null ? 'scored' : 'not_scored')),
        isSkipped: isSkippedTurn,
        isEstimated: isEstimatedTurn,
        category: item.category || detectQuestionCategory(qa.questionMeta, stage, qa.question),
        feedback: item.feedback || qa.feedback || (isSkippedTurn ? 'Question skipped by candidate (not scored).' : (isEstimatedTurn ? 'Estimated answer recording (AI evaluation temporarily unavailable).' : 'The answer addressed part of the question, but more specificity would strengthen it.')),
        strengths: Array.isArray(item.strengths) && item.strengths.length > 0 ? item.strengths : (qa.strengths || []),
        improvements: Array.isArray(item.improvements) && item.improvements.length > 0 ? item.improvements : (qa.improvements || []),
        idealAnswerPoints: Array.isArray(item.idealAnswerPoints) && item.idealAnswerPoints.length > 0 ? item.idealAnswerPoints : defaultIdealAnswerPoints(item.category || detectQuestionCategory(qa.questionMeta, stage, qa.question)),
        candidateAnswer: item.candidateAnswer || String(qa.answer || '').substring(0, 600),
        questionSource: item.questionSource || qa.questionSource,
        questionMeta: item.questionMeta || qa.questionMeta,
      };
    });

  const scoredItems = questionBreakdown.filter(item =>
    typeof item.score === 'number' && Number.isFinite(item.score) && !item.isEstimated && item.status !== 'estimated' && !item.isSkipped && item.status !== 'skipped'
  );

  const derivedCategoryScores = {
    technicalSkills: averageScore(scoredItems.filter(item => ['technical', 'coding', 'system-design'].includes(item.category)).map(item => item.score)) ?? averageScore(sessionScores) ?? 70,
    communication: averageScore(scoredItems.map(item => Math.min(100, item.score + (item.candidateAnswer?.length > 120 ? 5 : -3)))) ?? averageScore(sessionScores) ?? 70,
    problemSolving: averageScore(scoredItems.filter(item => ['technical', 'coding', 'system-design'].includes(item.category)).map(item => Math.min(100, item.score + 3))) ?? averageScore(sessionScores) ?? 68,
    cultureFit: averageScore(scoredItems.filter(item => ['behavioral', 'hr'].includes(item.category)).map(item => item.score)) ?? averageScore(sessionScores) ?? 72,
  };

  const categoryScores = report.categoryScores || report.detailedBreakdown || derivedCategoryScores;
  const normalizedCategoryScores = {
    technicalSkills: clampScore(categoryScores.technicalSkills, derivedCategoryScores.technicalSkills),
    communication: clampScore(categoryScores.communication, derivedCategoryScores.communication),
    problemSolving: clampScore(categoryScores.problemSolving, derivedCategoryScores.problemSolving),
    cultureFit: clampScore(categoryScores.cultureFit, derivedCategoryScores.cultureFit),
  };

  const overallScore = scoredItems.length > 0
    ? clampScore(
        report.overallScore,
        averageScore(scoredItems.map(item => item.score)) ?? averageScore(sessionScores) ?? 70
      )
    : null;

  const strengths = Array.isArray(report.strengths) && report.strengths.length > 0
    ? report.strengths
    : collectTopItems(questionBreakdown.map(item => item.strengths), 4);

  const improvements = Array.isArray(report.improvements) && report.improvements.length > 0
    ? report.improvements
    : collectTopItems(questionBreakdown.map(item => item.improvements), 4);

  const skippedCount = questionBreakdown.filter(item => item.isSkipped || item.status === 'skipped').length;
  const isPartiallyScored = skippedCount >= 2;
  const isEstimatedSession = overallScore === null || overallScore === undefined;

  let verdict = report.verdict;
  let verdictEmoji = report.verdictEmoji;
  let sessionStatus = report.status || 'completed';

  if (isEstimatedSession) {
    verdict = 'Estimated Assessment';
    verdictEmoji = '📊';
    sessionStatus = 'estimated';
  } else if (isPartiallyScored) {
    verdict = 'Partially Scored';
    verdictEmoji = '⚖️';
    sessionStatus = 'partially_scored';
  } else if (!verdict) {
    verdict = overallScore >= 85 ? 'Strong Hire' : overallScore >= 70 ? 'Would Advance' : overallScore >= 55 ? 'Borderline' : 'Would Not Advance';
    verdictEmoji = overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎';
  }

  let summary = report.summary;
  if (isPartiallyScored) {
    summary = `You completed ${scoredItems.length} of ${questionBreakdown.length} questions (${skippedCount} questions skipped) for the ${role || 'role'} at ${company || 'the company'}. This session is partially scored based on answered questions only. The clearest pattern in your answered questions was ${strengths[0] || 'communication and structure'}.`;
  } else if (!summary) {
    summary = `You completed ${questionBreakdown.length} questions for the ${role || 'role'} at ${company || 'the company'}, with the clearest strengths in ${strengths.slice(0, 2).join(' and ') || 'communication and structure'}.`;
  }

  let recommendation = report.recommendation;
  if (isPartiallyScored) {
    recommendation = `Practice answering full sets of questions under timed conditions to build familiarity and confidence.`;
  } else if (!recommendation) {
    recommendation = improvements[0] ? `Focus on ${improvements[0].toLowerCase()} before your next mock.` : 'Rework your weakest answers with more technical depth and concrete metrics.';
  }

  return {
    ...report,
    overallScore,
    isEstimated: isEstimatedSession,
    status: sessionStatus,
    hasMixedScorers: report.hasMixedScorers === true,
    scorerTransitionTurn: report.scorerTransitionTurn || null,
    summary,
    verdict,
    verdictEmoji,
    strengths,
    improvements,
    recommendation,
    questionBreakdown,
    categoryScores: normalizedCategoryScores,
    detailedBreakdown: normalizedCategoryScores,
    recommendations: Array.isArray(report.recommendations) && report.recommendations.length > 0
      ? report.recommendations
      : [{ area: 'Next Focus', action: recommendation }],
    companyFitScore: clampScore(report.companyFitScore, Math.round((normalizedCategoryScores.communication + normalizedCategoryScores.cultureFit) / 2)),
    companyFitNotes: report.companyFitNotes || `Your fit for ${company || 'this company'} improves when you make strong answers more concrete and consistent.`,
    suggestedTopics: Array.isArray(report.suggestedTopics) && report.suggestedTopics.length > 0
      ? report.suggestedTopics
      : [{ topic: 'Specific answer depth', priority: 'high', reason: 'Several answers need clearer supporting detail.' }],
    practiceQuestions: Array.isArray(report.practiceQuestions) && report.practiceQuestions.length > 0
      ? report.practiceQuestions
      : ['Redo one weak answer and make it more specific.', 'Practice one follow-up question on your weakest topic.'],
    studyPlan: Array.isArray(report.studyPlan) && report.studyPlan.length > 0
      ? report.studyPlan
      : [{ day: 'Day 1', focus: 'Review', tasks: ['Rework the weakest answers from this mock interview'] }],
    speechAnalysis: report.speechAnalysis || buildSpeechAnalysis(speechHistory),
  };
}

async function maybeRescoreEarlierTurnsWithFinalScorer({ qaPairs, sessionId }) {
  if (!Array.isArray(qaPairs) || qaPairs.length < 2) return { hasMixedScorers: false };

  const scoredTurns = qaPairs.filter(qa => !qa.isEstimated && !qa.isUnscored && qa.inlineScore !== null && qa.inlineScore !== undefined && qa.evalProvider);
  if (scoredTurns.length < 2) return { hasMixedScorers: false };

  const finalTurn = scoredTurns[scoredTurns.length - 1];
  const finalProvider = finalTurn.evalProvider;
  const finalModel = finalTurn.evalModelUsed;

  const discordantTurns = scoredTurns.filter(qa => qa.evalProvider !== finalProvider && qa.evalProvider !== 'heuristic-estimated');
  if (discordantTurns.length === 0) {
    return { hasMixedScorers: false, finalProvider, finalModel };
  }

  const transitionTurn = scoredTurns.findIndex(qa => qa.evalProvider === finalProvider) + 1;
  logger.info(`[Evaluation] Mid-session cascade detected: Turns 1-${transitionTurn - 1} scored by ${discordantTurns[0].evalProvider}, final scorer is ${finalProvider}.`);

  const tokensNeeded = discordantTurns.length * 350;
  const budgetCheck = quotaGuard.canUseModel(finalModel || ROUTER_MODELS.GEMINI_FLASH, tokensNeeded);

  if (budgetCheck.allowed) {
    logger.info(`[Evaluation] Budget allows re-scoring ${discordantTurns.length} earlier turns with final scorer ${finalModel || finalProvider}...`);
    for (const qa of discordantTurns) {
      try {
        const rescored = await callTurnScoring({
          previousQuestion: qa.question,
          userAnswer: qa.answer,
          stage: qa.stage || 'Technical',
          sessionId,
        });
        if (rescored && rescored.score !== null && rescored.score !== undefined && !rescored.isEstimated) {
          qa.inlineScore = rescored.score;
          qa.evalProvider = rescored.evalProvider;
          qa.evalModelUsed = rescored.evalModelUsed;
          qa.isRescoredWithFinalModel = true;
          qa.feedback = rescored.feedback;
        }
      } catch (err) {
        logger.warn(`[Evaluation] Re-scoring turn Q${qa.questionNumber} skipped:`, err.message);
      }
    }
  } else {
    logger.info(`[Evaluation] Budget tight; enqueuing deferred re-scoring for discordant turns.`);
    for (const qa of discordantTurns) {
      deferredJobQueue.enqueueScoreTurn({
        sessionId,
        questionNumber: qa.questionNumber,
        previousQuestion: qa.question,
        userAnswer: qa.answer,
      });
    }
  }

  return {
    hasMixedScorers: true,
    transitionTurn,
    discordantCount: discordantTurns.length,
    finalProvider,
    finalModel,
  };
}

async function generateInterviewReport({ company, role, stage, conversation, sessionScores = [], speechHistory = [], sessionId = null }) {
  const qaPairs = extractInterviewQaPairs(conversation);
  const cascadeInfo = await maybeRescoreEarlierTurnsWithFinalScorer({ qaPairs, sessionId });
  const fallbackReport = buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores, speechHistory });
  fallbackReport.hasMixedScorers = cascadeInfo.hasMixedScorers;
  fallbackReport.scorerTransitionTurn = cascadeInfo.transitionTurn || null;

  if (qaPairs.length === 0) {
    return normalizeInterviewReport(
      { ...fallbackReport, aiGenerated: false, analysisMode: 'heuristic' },
      { company, role, stage, qaPairs, sessionScores, speechHistory }
    );
  }

  try {
    const reportData = await callInterviewReport({
      company,
      role,
      stage,
      qaPairs,
      sessionScores,
      speechHistory,
      sessionId,
    });

    if (reportData?.isDeferred) {
      return normalizeInterviewReport(
        { ...fallbackReport, aiGenerated: false, analysisMode: 'deferred', jobId: reportData.jobId },
        { company, role, stage, qaPairs, sessionScores, speechHistory }
      );
    }

    if (reportData) {
      return normalizeInterviewReport(
        {
          ...fallbackReport,
          ...reportData,
          aiGenerated: true,
          analysisMode: 'ai',
          reportModelUsed: reportData.reportModelUsed,
          reportProvider: reportData.reportProvider,
        },
        { company, role, stage, qaPairs, sessionScores, speechHistory }
      );
    }
  } catch (error) {
    console.error('Interview report generation error:', error.message);
  }

  return normalizeInterviewReport(
    { ...fallbackReport, aiGenerated: false, analysisMode: 'heuristic' },
    { company, role, stage, qaPairs, sessionScores, speechHistory }
  );
}

router.post('/evaluate', optionalAuth, async (req, res) => {
  const { company, role, stage, conversation, sessionScores, speechHistory } = req.body;

  try {
    const report = await generateInterviewReport({ company, role, stage, conversation, sessionScores, speechHistory });
    res.json(report);
  } catch (error) {
    console.error('Evaluation error:', error.message);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});


// ─── Detailed per-question report ───
router.post('/detailed-report', optionalAuth, async (req, res) => {
  const { company, role, stage, conversation, sessionScores, speechHistory } = req.body;

  try {
    const report = await generateInterviewReport({ company, role, stage, conversation, sessionScores, speechHistory });
    res.json(report);
  } catch (error) {
    console.error('Detailed report error:', error.message);
    res.status(500).json({ error: 'Failed to generate detailed report' });
  }
});


// ─── Analytics Aggregation ───
router.get('/analytics', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const { data: dbSessions, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, interview_score, company_focus, interview_type, difficulty_level, performance_metrics, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: true });

    if (error) throw error;

    let sessions = (dbSessions || []).map(s => {
      const pm = s.performance_metrics || {};
      return {
        overall_score: s.interview_score ?? pm.overallScore ?? 0,
        company: s.company_focus || pm.company || 'General',
        stage: pm.stage || s.interview_type || 'Technical',
        difficulty: s.difficulty_level || pm.difficulty || 'medium',
        completed_at: s.completed_at || s.created_at,
      };
    });

    if (sessions.length === 0) {
      const { data: mockData } = await supabaseAdmin
        .from('mock_interviews')
        .select('overall_score, company, interview_type, difficulty, completed_at, started_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: true });

      if (Array.isArray(mockData) && mockData.length > 0) {
        sessions = mockData.map(m => ({
          overall_score: m.overall_score || 0,
          company: m.company || 'General',
          stage: m.interview_type || 'Technical',
          difficulty: m.difficulty || 'medium',
          completed_at: m.completed_at || m.started_at,
        }));
      }
    }

    const totalSessions = sessions.length;
    if (totalSessions === 0) {
      return res.json({
        totalSessions: 0, averageScore: 0, scoreTrend: [],
        companyBreakdown: {}, stageBreakdown: {}, recentImprovement: 0
      });
    }

    const scores = sessions.map(s => s.overall_score || 0);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Score trend over time
    const scoreTrend = sessions.map(s => ({
      date: s.completed_at,
      score: s.overall_score || 0,
      company: s.company,
      stage: s.stage
    }));

    // Breakdown by company
    const companyBreakdown = {};
    sessions.forEach(s => {
      const comp = s.company || 'General';
      if (!companyBreakdown[comp]) companyBreakdown[comp] = { count: 0, totalScore: 0 };
      companyBreakdown[comp].count++;
      companyBreakdown[comp].totalScore += s.overall_score || 0;
    });
    Object.keys(companyBreakdown).forEach(k => {
      companyBreakdown[k].avgScore = Math.round(companyBreakdown[k].totalScore / companyBreakdown[k].count);
    });

    // Breakdown by stage
    const stageBreakdown = {};
    sessions.forEach(s => {
      const stg = s.stage || 'Technical';
      if (!stageBreakdown[stg]) stageBreakdown[stg] = { count: 0, totalScore: 0 };
      stageBreakdown[stg].count++;
      stageBreakdown[stg].totalScore += s.overall_score || 0;
    });
    Object.keys(stageBreakdown).forEach(k => {
      stageBreakdown[k].avgScore = Math.round(stageBreakdown[k].totalScore / stageBreakdown[k].count);
    });

    // Recent improvement (last 5 vs first 5)
    const first5 = scores.slice(0, Math.min(5, scores.length));
    const last5 = scores.slice(Math.max(0, scores.length - 5));
    const recentImprovement = Math.round(
      (last5.reduce((a, b) => a + b, 0) / last5.length) -
      (first5.reduce((a, b) => a + b, 0) / first5.length)
    );

    res.json({
      totalSessions,
      averageScore,
      scoreTrend,
      companyBreakdown,
      stageBreakdown,
      recentImprovement
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});



export default router;
