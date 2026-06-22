import { aiCallWithRetry } from '../utils/aiClient.js';
import { safeJsonParse } from './interviewPersonaService.js';

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

    if (message.role === 'candidate' && currentQuestion) {
      qaPairs.push({
        ...currentQuestion,
        answer: message.content,
        answerTimestamp: message.timestamp,
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

function buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores = [], speechHistory = [] }) {
  const questionBreakdown = qaPairs.map((qa, index) => {
    const answer = String(qa.answer || '').trim();
    const category = detectQuestionCategory(qa.questionMeta, stage, qa.question);
    const answerLength = answer.length;
    const heuristicsScore = clampScore(
      qa.inlineScore ?? sessionScores[index] ?? (answerLength === 0 ? 25 : 45 + Math.min(35, Math.round(answerLength / 18))),
      60
    );

    const strengths = qa.strengths?.length
      ? qa.strengths
      : [
        answerLength > 160 ? 'Provided enough detail to communicate the main idea' : 'Answered directly without going off track',
        category === 'behavioral' ? 'Showed self-awareness in the example' : 'Kept the explanation understandable'
      ].slice(0, answerLength > 80 ? 2 : 1);

    const improvements = qa.improvements?.length
      ? qa.improvements
      : [
        answerLength < 120 ? 'Add more depth and concrete supporting detail' : 'Tighten the answer so the main point lands faster',
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
      category,
      feedback,
      strengths,
      improvements,
      idealAnswerPoints: defaultIdealAnswerPoints(category),
      questionSource: qa.questionSource,
      questionMeta: qa.questionMeta,
    };
  });

  const overallScore = averageScore(questionBreakdown.map(item => item.score)) ?? averageScore(sessionScores) ?? 70;

  const categoryBuckets = {
    technicalSkills: [],
    communication: questionBreakdown.map(item => Math.min(100, item.score + (item.candidateAnswer?.length > 120 ? 6 : -4))),
    problemSolving: [],
    cultureFit: [],
  };

  for (const question of questionBreakdown) {
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

  const verdict = overallScore >= 85
    ? 'Strong Hire'
    : overallScore >= 70
      ? 'Would Advance'
      : overallScore >= 55
        ? 'Borderline'
        : 'Would Not Advance';

  const verdictEmoji = overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎';

  return {
    overallScore,
    summary: `You completed ${qaPairs.length} ${stage || 'interview'} questions for the ${role || 'role'} at ${company || 'the company'}. The clearest pattern was ${strengths[0] || 'solid baseline communication'}, while the biggest gap was ${improvements[0] || 'adding more depth to answers'}.`,
    verdict,
    verdictEmoji,
    strengths,
    improvements,
    recommendation: `Prioritize ${weakestCategoryLabel.toLowerCase()} practice in your next mock session and make each answer more specific.`,
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

function normalizeInterviewReport(rawReport, { company, role, stage, qaPairs, sessionScores = [], speechHistory = [] }) {
  const report = rawReport || {};
  const baseQuestionBreakdown = Array.isArray(report.questionBreakdown) ? report.questionBreakdown : [];

  const questionBreakdown = (baseQuestionBreakdown.length > 0 ? baseQuestionBreakdown : buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores, speechHistory }).questionBreakdown)
    .map((item, index) => {
      const qa = qaPairs[index] || {};
      return {
        ...item,
        questionNumber: item.questionNumber || index + 1,
        question: item.question || qa.question?.substring(0, 300) || `Question ${index + 1}`,
        score: clampScore(item.score, clampScore(qa.inlineScore ?? sessionScores[index], 70)),
        category: item.category || detectQuestionCategory(qa.questionMeta, stage, qa.question),
        feedback: item.feedback || qa.feedback || 'The answer addressed part of the question, but more specificity would strengthen it.',
        strengths: Array.isArray(item.strengths) && item.strengths.length > 0 ? item.strengths : (qa.strengths || []),
        improvements: Array.isArray(item.improvements) && item.improvements.length > 0 ? item.improvements : (qa.improvements || []),
        idealAnswerPoints: Array.isArray(item.idealAnswerPoints) && item.idealAnswerPoints.length > 0 ? item.idealAnswerPoints : defaultIdealAnswerPoints(item.category || detectQuestionCategory(qa.questionMeta, stage, qa.question)),
        candidateAnswer: item.candidateAnswer || String(qa.answer || '').substring(0, 600),
        questionSource: item.questionSource || qa.questionSource,
        questionMeta: item.questionMeta || qa.questionMeta,
      };
    });

  const derivedCategoryScores = {
    technicalSkills: averageScore(questionBreakdown.filter(item => ['technical', 'coding', 'system-design'].includes(item.category)).map(item => item.score)) ?? averageScore(sessionScores) ?? 70,
    communication: averageScore(questionBreakdown.map(item => Math.min(100, item.score + (item.candidateAnswer?.length > 120 ? 5 : -3)))) ?? averageScore(sessionScores) ?? 70,
    problemSolving: averageScore(questionBreakdown.filter(item => ['technical', 'coding', 'system-design'].includes(item.category)).map(item => Math.min(100, item.score + 3))) ?? averageScore(sessionScores) ?? 68,
    cultureFit: averageScore(questionBreakdown.filter(item => ['behavioral', 'hr'].includes(item.category)).map(item => item.score)) ?? averageScore(sessionScores) ?? 72,
  };

  const categoryScores = report.categoryScores || report.detailedBreakdown || derivedCategoryScores;
  const normalizedCategoryScores = {
    technicalSkills: clampScore(categoryScores.technicalSkills, derivedCategoryScores.technicalSkills),
    communication: clampScore(categoryScores.communication, derivedCategoryScores.communication),
    problemSolving: clampScore(categoryScores.problemSolving, derivedCategoryScores.problemSolving),
    cultureFit: clampScore(categoryScores.cultureFit, derivedCategoryScores.cultureFit),
  };

  const overallScore = clampScore(
    report.overallScore,
    averageScore(questionBreakdown.map(item => item.score)) ?? averageScore(sessionScores) ?? 70
  );

  const strengths = Array.isArray(report.strengths) && report.strengths.length > 0
    ? report.strengths
    : collectTopItems(questionBreakdown.map(item => item.strengths), 4);

  const improvements = Array.isArray(report.improvements) && report.improvements.length > 0
    ? report.improvements
    : collectTopItems(questionBreakdown.map(item => item.improvements), 4);

  const recommendation = report.recommendation || report.recommendations?.[0]?.action || improvements[0] || 'Review the weaker answers and make them more specific.';
  const verdict = report.verdict || (overallScore >= 85 ? 'Strong Hire' : overallScore >= 70 ? 'Would Advance' : overallScore >= 55 ? 'Borderline' : 'Would Not Advance');
  const verdictEmoji = report.verdictEmoji || (overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎');

  return {
    ...report,
    overallScore,
    summary: report.summary || `You completed ${questionBreakdown.length} questions for the ${role || 'role'} at ${company || 'the company'}, with the clearest strengths in ${strengths.slice(0, 2).join(' and ') || 'communication and structure'}.`,
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

async function generateInterviewReport({ company, role, stage, conversation, sessionScores = [], speechHistory = [] }, groq) {
  const qaPairs = extractInterviewQaPairs(conversation);
  const fallbackReport = buildDeterministicInterviewReport({ company, role, stage, qaPairs, sessionScores, speechHistory });

  if (!groq || qaPairs.length === 0) {
    return normalizeInterviewReport(fallbackReport, { company, role, stage, qaPairs, sessionScores, speechHistory });
  }

  const qaText = qaPairs.map((qa, index) => {
    const tags = Array.isArray(qa.questionMeta?.tags) ? qa.questionMeta.tags.join(', ') : 'none';
    return [
      `Question ${index + 1}`,
      `Source: ${qa.questionSource || 'ai'}`,
      `Difficulty: ${qa.questionMeta?.difficulty || 'unknown'}`,
      `Tags: ${tags}`,
      `Question: ${qa.question?.substring(0, 400) || 'N/A'}`,
      `Candidate Answer: ${String(qa.answer || '').substring(0, 900) || 'No answer provided'}`,
      `Inline Score: ${qa.inlineScore ?? sessionScores[index] ?? 'N/A'}`,
      `Inline Strengths: ${(qa.strengths || []).join('; ') || 'N/A'}`,
      `Inline Improvements: ${(qa.improvements || []).join('; ') || 'N/A'}`
    ].join('\n');
  }).join('\n\n');

  try {
    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a senior interview panel creating the final report for a ${stage} interview at ${company} for the ${role} role.
Evaluate the candidate fairly for their experience level. Ground every judgment in the ACTUAL question-answer pairs provided. Do not invent strengths or weaknesses that are not supported by the transcript.

Return valid JSON with this shape:
{
  "overallScore": 0-100,
  "summary": "3-4 sentence accurate summary tied to what the candidate actually said",
  "verdict": "Strong Hire / Would Advance / Borderline / Would Not Advance",
  "verdictEmoji": "🌟 or 👍 or 🤔 or 👎",
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "recommendation": "One practical next recommendation",
  "questionBreakdown": [
    {
      "questionNumber": 1,
      "question": "The original question",
      "score": 0-100,
      "category": "technical|behavioral|system-design|hr|coding",
      "feedback": "2-3 sentence explanation tied to this specific answer",
      "strengths": ["Specific strength"],
      "improvements": ["Specific improvement"],
      "idealAnswerPoints": ["Point they should have covered", "Another point"]
    }
  ],
  "categoryScores": {
    "technicalSkills": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100,
    "cultureFit": 0-100
  },
  "recommendations": [
    { "area": "Area name", "action": "Specific actionable next step" }
  ],
  "companyFitScore": 0-100,
  "companyFitNotes": "1-2 sentences on fit for this company/role",
  "suggestedTopics": [
    { "topic": "Topic", "priority": "high|medium|low", "reason": "Why this topic matters based on the transcript" }
  ],
  "practiceQuestions": [
    "Five targeted practice questions based on weak areas"
  ],
  "studyPlan": [
    { "day": "Day 1-2", "focus": "Focus area", "tasks": ["Task 1", "Task 2"] }
  ]
}`
            },
            {
              role: 'user',
              content: `Analyze this interview using only the evidence below:\n\n${qaText}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!parsed) throw new Error('Failed to parse interview report');
    return normalizeInterviewReport(
      {
        ...fallbackReport,
        ...parsed,
        questionBreakdown: parsed.questionBreakdown || fallbackReport.questionBreakdown,
        categoryScores: parsed.categoryScores || parsed.detailedBreakdown || fallbackReport.categoryScores,
        detailedBreakdown: parsed.detailedBreakdown || parsed.categoryScores || fallbackReport.detailedBreakdown,
        strengths: parsed.strengths || fallbackReport.strengths,
        improvements: parsed.improvements || fallbackReport.improvements,
        recommendation: parsed.recommendation || fallbackReport.recommendation,
        recommendations: parsed.recommendations || fallbackReport.recommendations,
        suggestedTopics: parsed.suggestedTopics || fallbackReport.suggestedTopics,
        practiceQuestions: parsed.practiceQuestions || fallbackReport.practiceQuestions,
        studyPlan: parsed.studyPlan || fallbackReport.studyPlan,
      },
      { company, role, stage, qaPairs, sessionScores, speechHistory }
    );
  } catch (error) {
    console.error('Interview report generation error:', error.message);
    return normalizeInterviewReport(fallbackReport, { company, role, stage, qaPairs, sessionScores, speechHistory });
  }
}

export {
  clampScore,
  averageScore,
  buildSpeechAnalysis,
  detectQuestionCategory,
  extractInterviewQaPairs,
  collectTopItems,
  defaultIdealAnswerPoints,
  buildDeterministicInterviewReport,
  normalizeInterviewReport,
  generateInterviewReport,
};
