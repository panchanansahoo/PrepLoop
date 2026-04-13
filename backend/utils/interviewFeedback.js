const GENERIC_FEEDBACK_PATTERNS = [
  /\bgreat response\b/i,
  /\bgood response\b/i,
  /\bthank you for that response\b/i,
  /\bthat'?s a solid approach\b/i,
  /\bthat'?s interesting\b/i,
  /\bi appreciate that\b/i,
  /\bnice\b/i,
  /\bexcellent\b/i,
  /\bgood thinking\b/i,
];

const GENERIC_HINT_PATTERNS = [
  /break(ing)? the problem into smaller parts/i,
  /try breaking it down/i,
  /keep it up/i,
  /good job/i,
  /try to be more specific/i,
];

const DEFAULT_TECHNICAL_HINT = 'Lead with the approach, then add one implementation detail or trade-off.';
const DEFAULT_BEHAVIORAL_HINT = 'Use a quick STAR structure: context, action, result, then what you learned.';
const DEFAULT_GENERAL_HINT = 'Add one concrete example and end with the impact or outcome.';

function toCleanString(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

function isGenericFeedback(text) {
  const cleaned = toCleanString(text);
  if (!cleaned) return true;
  if (cleaned.length < 30) return true;
  return GENERIC_FEEDBACK_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function hasSpecificSignal(text, signals) {
  const cleaned = toCleanString(text).toLowerCase();
  return signals.some((signal) => cleaned.includes(signal));
}

function buildSpecificFeedback({ stage = 'Technical', answer = '', question = '' }) {
  const answerText = toCleanString(answer);
  const questionText = toCleanString(question).toLowerCase();
  const answerWordCount = answerText ? answerText.split(/\s+/).length : 0;
  const isBehavioralStage = /behavioral|hr|manager/i.test(stage);
  const isTechnicalStage = /technical|coding|dsa|system design/i.test(stage);
  const needsMoreDetail = answerWordCount < 45;

  if (needsMoreDetail) {
    if (isBehavioralStage) {
      return 'This answer is a bit brief. Use a short STAR flow, then add one concrete result so the interviewer can see your impact.';
    }

    if (isTechnicalStage) {
      return 'This answer is too short for a technical interview. State the approach first, then add one concrete implementation detail or trade-off.';
    }

    return 'This answer needs one more specific example. Start with the main point, then add a concrete detail or outcome.';
  }

  if (isBehavioralStage) {
    if (hasSpecificSignal(questionText, ['leadership', 'conflict', 'team', 'mistake', 'challenge'])) {
      return 'You covered the answer clearly, but it would be stronger with a clearer STAR structure and one explicit result.';
    }

    return 'You communicated the idea well. Tighten it by naming the situation, the action you took, and the result you achieved.';
  }

  if (isTechnicalStage) {
    if (hasSpecificSignal(questionText, ['optimize', 'complexity', 'scale', 'edge case', 'trade-off'])) {
      return 'You have the right direction, but the answer needs one deeper layer: mention the trade-off, edge case, or complexity impact.';
    }

    return 'The answer is on the right track. Make it stronger by adding one implementation detail and one concrete reason for that choice.';
  }

  return 'The answer is solid, but it will land better with one concrete example and a clearer final takeaway.';
}

function normalizeStrengths(strengths, context) {
  const answerText = toCleanString(context.answer);
  const stage = context.stage || 'Technical';
  const fallbackStrengths = /behavioral|hr|manager/i.test(stage)
    ? ['Clear communication', 'Thoughtful self-reflection']
    : ['Logical structure', 'Practical reasoning'];

  const normalized = Array.isArray(strengths)
    ? strengths.map(toCleanString).filter(Boolean)
    : [];

  if (normalized.length) return normalized.slice(0, 3);

  if (answerText.length < 45) {
    return fallbackStrengths;
  }

  return stage && /technical|coding|dsa|system design/i.test(stage)
    ? ['Clear reasoning', 'Relevant technical direction']
    : fallbackStrengths;
}

function normalizeImprovements(improvements, context) {
  const stage = context.stage || 'Technical';
  const normalized = Array.isArray(improvements)
    ? improvements.map(toCleanString).filter(Boolean)
    : [];

  if (normalized.length) return normalized.slice(0, 3);

  if (/behavioral|hr|manager/i.test(stage)) {
    return ['Use one STAR example', 'End with a measurable result'];
  }

  if (/technical|coding|dsa|system design/i.test(stage)) {
    return ['Add one implementation detail', 'Mention a trade-off or edge case'];
  }

  return ['Add a concrete example', 'State the outcome more clearly'];
}

function normalizeHint(hint, context) {
  const cleanedHint = toCleanString(hint);
  if (cleanedHint && cleanedHint.length >= 20 && !isGenericFeedback(cleanedHint) && !GENERIC_HINT_PATTERNS.some((pattern) => pattern.test(cleanedHint))) {
    return cleanedHint;
  }

  const stage = context.stage || 'Technical';
  if (/behavioral|hr|manager/i.test(stage)) {
    return DEFAULT_BEHAVIORAL_HINT;
  }
  if (/technical|coding|dsa|system design/i.test(stage)) {
    return DEFAULT_TECHNICAL_HINT;
  }
  return DEFAULT_GENERAL_HINT;
}

export function buildAnswerFeedbackPrompt() {
  return `

## Feedback Quality Rules
- The feedback block is internal, but it must be genuinely useful.
- Do not use generic praise like "great response", "good answer", or "nice" by itself.
- Mention one specific thing the candidate did well and one specific thing they should improve.
- Tie the feedback to the actual answer, not a generic interview template.
- Keep the feedback to 2 sentences max, but make it concrete.
- If the answer is brief, say it needs one concrete example or detail.
- If the stage is behavioral, prefer STAR-style guidance.
- If the stage is technical, mention implementation detail, edge cases, or trade-offs.
`;
}

export function normalizeInterviewFeedback(payload = {}, context = {}) {
  const cleanedFeedback = toCleanString(payload.feedback);
  const feedback = isGenericFeedback(cleanedFeedback)
    ? buildSpecificFeedback(context)
    : cleanedFeedback;

  return {
    ...payload,
    feedback,
    strengths: normalizeStrengths(payload.strengths, context),
    improvements: normalizeImprovements(payload.improvements, context),
    hint: normalizeHint(payload.hint, context),
  };
}
