import { InterviewStateMachineService } from './interviewStateMachine.js';

// ── Type-specific voice and style modifiers ─────────────────────────
const TYPE_STYLE_RULES = {
  dsa: `- Probe for time/space complexity and optimality.
- Ask about edge cases, boundary conditions, and worst-case inputs.
- If the candidate wrote code, reference specific lines or patterns.`,

  'system-design': `- Ask about scalability bottlenecks and failure modes.
- Probe trade-offs between consistency, availability, and partition tolerance.
- Ask about specific technology choices and their rationale.`,
  system_design: null, // alias — resolved at runtime

  behavioral: `- Use STAR probing: if the candidate gave a situation but no result, ask for the outcome.
- Ask for measurable impact and concrete examples.
- Probe leadership, ownership, and conflict resolution.`,

  hr: `- Keep tone supportive and conversational.
- Explore motivation, career goals, and culture fit.
- If the candidate is a fresher, focus on learning attitude and academic projects.
- Do not grill or pressure — coach toward better answers.`,
};

function getTypeStyleRules(interviewType) {
  const normalized = String(interviewType || 'dsa').toLowerCase();
  if (normalized === 'system_design') return TYPE_STYLE_RULES['system-design'];
  return TYPE_STYLE_RULES[normalized] || TYPE_STYLE_RULES.dsa;
}

// ── Company-specific interviewer personas ───────────────────────────
const COMPANY_PERSONAS = {
  'google': 'Methodical and Socratic. Loves exploring trade-offs. Asks "what if" to probe depth. Values clarity of thought over speed.',
  'amazon': 'Leadership Principles-driven. Asks "tell me about a time" frequently. Cares about ownership, customer obsession, and data.',
  'meta': 'Fast-paced and action-oriented. Prefers practical solutions. Asks "how would you ship this tomorrow?"',
  'microsoft': 'Collaborative and structured. Values growth mindset. Probes design decisions methodically.',
  'apple': 'Detail-oriented and quality-focused. Cares about craft and user experience. Asks about design rationale.',
  'netflix': 'Values independence and judgment. Probes decision-making under ambiguity. Expects context, not just answers.',
  'uber': 'Practical and systems-oriented. Cares about scale and reliability. Asks about failure modes.',
  'stripe': 'Precise and API-focused. Values correctness and developer experience. Asks about edge cases.',
  'flipkart': 'Scale-focused with e-commerce domain awareness. Probes inventory and concurrency challenges.',
  'razorpay': 'Fintech-aware. Values idempotency and consistency. Probes payment edge cases.',
  'swiggy': 'Geo and logistics-oriented. Probes real-time matching and operational scale.',
  'zomato': 'Consumer-tech focused. Cares about user experience and real-time systems.',
};

function getCompanyPersona(companyFocus) {
  if (!companyFocus) return 'Balanced senior engineer. Professional, direct, and encouraging.';
  const key = String(companyFocus).toLowerCase();
  return COMPANY_PERSONAS[key] || `Calibrated to ${companyFocus} interview expectations. Professional and direct.`;
}

// ── Natural speech prefixes (30% injection rate) ────────────────────
const NATURAL_PREFIXES = [
  'Okay, ', 'Right, ', 'Interesting — ', 'Got it. ', 'Mm-hmm. ',
  'Sure. ', 'Alright, ', 'Fair enough. ', 'Makes sense. ',
];

function deterministicHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function maybeAddNaturalPrefix(message) {
  const msgHash = deterministicHash(message);
  // 30% injection rate via hash modulus (deterministic per message text)
  if (msgHash % 100 >= 30) return message;
  const prefix = NATURAL_PREFIXES[msgHash % NATURAL_PREFIXES.length];
  if (/^(okay|right|interesting|got it|mm|sure|alright|fair|makes)/i.test(message)) return message;
  return prefix + message.charAt(0).toLowerCase() + message.slice(1);
}

// ── Conversation summary builder ────────────────────────────────────
function buildConversationSummary(turnSummaries = [], askedTopics = []) {
  const parts = [];
  if (turnSummaries.length > 0) {
    parts.push(`KEY CLAIMS FROM EARLIER TURNS:\n${turnSummaries.slice(-5).map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  }
  if (askedTopics.length > 0) {
    parts.push(`ALREADY ASKED (do not repeat these topics):\n${askedTopics.slice(-6).map(t => `- ${t}`).join('\n')}`);
  }
  return parts.length > 0 ? '\n' + parts.join('\n\n') : '';
}

// ── Code excerpt sanitizer ──────────────────────────────────────────
function extractCodeExcerpt(candidateResponse, maxLines = 15) {
  const codeMatch = candidateResponse.match(/---CODE_MARKER_[a-f0-9-]+---\n?([\s\S]*)/i) || candidateResponse.match(/---\s*Code\s*---\n?([\s\S]*)/i);
  if (!codeMatch) return null;

  const code = codeMatch[1].trim();
  if (!code || code.length < 10) return null;

  const lines = code.split('\n').slice(0, maxLines);
  return lines.join('\n') + (code.split('\n').length > maxLines ? '\n// ...(truncated)' : '');
}

// ── Resume context builder ──────────────────────────────────────────
function buildResumeSection(resumeContext) {
  if (!resumeContext || typeof resumeContext !== 'object') return '';

  const parts = [];
  if (resumeContext.candidateHeadline) {
    parts.push(`Candidate: ${resumeContext.candidateHeadline}`);
  }
  if (Array.isArray(resumeContext.coreSkills) && resumeContext.coreSkills.length > 0) {
    parts.push(`Skills: ${resumeContext.coreSkills.slice(0, 6).join(', ')}`);
  }
  if (Array.isArray(resumeContext.projectHighlights) && resumeContext.projectHighlights.length > 0) {
    parts.push(`Key projects: ${resumeContext.projectHighlights.slice(0, 3).join('; ')}`);
  }

  if (parts.length === 0) return '';
  return `\nCANDIDATE RESUME CONTEXT:\n${parts.join('\n')}`;
}

export class InterviewPromptService {
  static buildFollowUpPrompt({
    problemStatement,
    transcript = [],
    candidateResponse,
    interviewType,
    interviewContext = {},
    interviewMode = 'full_realtime',
    ragContext = null,
  }) {
    const missingAreas = (interviewContext.missingAreas || []).slice(0, 5);
    const currentStage = interviewContext.stage || interviewContext.interviewState?.stage || 'intake';
    const stageDirective = InterviewStateMachineService.buildStageDirective(currentStage, interviewType);

    const hasGrounding = Boolean(
      ragContext && Array.isArray(ragContext.retrievedQuestions) && ragContext.retrievedQuestions.length > 0,
    );

    const groundingSection = hasGrounding
      ? `\nREFERENCE PATTERNS FROM COMPANY INTERVIEW HISTORY:\n${ragContext.retrievedQuestions
          .slice(0, 3)
          .map((entry, index) => `${index + 1}. ${entry.question}`)
          .join('\n')}\nGrounding hints: ${(ragContext.hintPatterns || []).slice(0, 2).join(' | ') || 'none'}`
      : '';

    // ── Type-specific style rules ─────────────────────────────────────
    const typeRules = getTypeStyleRules(interviewType);

    // ── Code excerpt (if candidate submitted code) ────────────────────
    const codeExcerpt = extractCodeExcerpt(candidateResponse);
    const codeSection = codeExcerpt
      ? `\nCANDIDATE'S CODE:\n\`\`\`\n${codeExcerpt}\n\`\`\`\nRefer to specific code patterns, missing error handling, or optimization opportunities.`
      : '';

    // ── Resume context ────────────────────────────────────────────────
    const resumeSection = buildResumeSection(interviewContext.resumeContext);

    // ── Follow-up intelligence signals with action-specific modifiers ──
    const followUpSignals = [];
    if (interviewContext.adaptiveFollowUp) {
      const af = interviewContext.adaptiveFollowUp;

      // Action-specific prompt modifiers — these change HOW the interviewer asks,
      // not just what metadata is surfaced
      if (af.nextAction === 'volatility_scaffold') {
        followUpSignals.push('ACTION: Break the current problem into 2 smaller sub-problems. Ask the candidate to solve step 1 only. Keep it simple and structured.');
      } else if (af.nextAction === 'star_completion') {
        const missingElement = af.starAnalysis?.hasResult === false ? 'the measurable result/impact' :
          af.starAnalysis?.hasSituation === false ? 'the specific situation/context' :
          af.starAnalysis?.hasAction === false ? 'the specific actions they personally took' : 'a missing STAR element';
        followUpSignals.push(`ACTION: The candidate's STAR story is missing ${missingElement}. Ask specifically for it with one direct question.`);
      } else if (af.nextAction === 'confidence_rebuild') {
        followUpSignals.push('ACTION: Use a simpler variant of the current problem. Acknowledge what the candidate got right so far before asking the next question.');
      } else if (af.nextAction === 'targeted_correction') {
        followUpSignals.push('ACTION: Correct one specific misconception the candidate showed, then re-ask a narrower version of the question.');
      } else if (af.nextAction === 'depth_probe') {
        followUpSignals.push('ACTION: Ask "why" about one specific choice or claim the candidate made. Probe for deeper reasoning.');
      } else if (af.nextAction) {
        followUpSignals.push(`Follow-up action: ${af.nextAction}`);
      }

      if (af.improvementArc && af.improvementArc !== 'stable') {
        followUpSignals.push(`Candidate trend: ${af.improvementArc}`);
      }
      if (af.starAnalysis && !af.starAnalysis.hasResult && af.nextAction !== 'star_completion') {
        followUpSignals.push('STAR gap: missing result/impact — ask for outcome');
      }
      // Surface score trend data for LLM context
      if (af.scoreTrend) {
        const st = af.scoreTrend;
        if (st.volatility === 'volatile') {
          followUpSignals.push(`Score volatility: HIGH (stdDev=${st.stdDev}, mean=${st.mean}). Simplify and scaffold.`);
        } else if (st.trend === 'improving') {
          followUpSignals.push(`Score trend: IMPROVING (delta=+${st.delta}). Increase depth gradually.`);
        } else if (st.trend === 'declining') {
          followUpSignals.push(`Score trend: DECLINING (delta=${st.delta}). Reduce complexity and rebuild confidence.`);
        }
      }
    }
    const followUpSection = followUpSignals.length > 0
      ? `\nFOLLOW-UP INTELLIGENCE:\n${followUpSignals.map(s => `- ${s}`).join('\n')}`
      : '';

    // ── Voice constraint (relaxed for realtime: 35 words, was 24) ─────
    const wordLimit = interviewMode === 'full_realtime' ? 35 : 38;

    // ── Conversation memory: summary + anti-repetition ──────────────
    const conversationMemory = buildConversationSummary(
      interviewContext.turnSummaries || [],
      interviewContext.askedTopics || [],
    );

    // ── Interviewer persona based on company focus ────────────────────
    const persona = getCompanyPersona(interviewContext.companyFocus || null);

    return `You are a senior interviewer at a top product company. Generate a natural, realistic follow-up as if spoken by a human interviewer.

INTERVIEWER PERSONA: ${persona}

PROBLEM: ${problemStatement}
CANDIDATE JUST SAID: "${candidateResponse.slice(0, 500)}"
${codeSection}

INTERVIEW HISTORY (last 2 exchanges):
${transcript.slice(-4).map((t) => `${t.role}: ${t.text}`).join('\n')}
${resumeSection}
${conversationMemory}

INTERVIEW CONTEXT:
- Type: ${interviewType}
- Runtime mode: ${interviewMode}
- Turns completed: ${interviewContext.turns || 0}
- Current stage: ${currentStage}
- Stage directive: ${stageDirective}
- Candidate likely missing: ${missingAreas.join(', ') || 'none'}
- Current difficulty: ${interviewContext.currentDifficulty || 'medium'}
- Last candidate summary: ${interviewContext.lastCandidateSummary || 'n/a'}
- Stuck count: ${interviewContext.stuckCount || 0}${interviewContext.stuckCount >= 1 ? ` (STUCK_LEVEL=${Math.min(3, interviewContext.stuckCount)} — provide progressive hints)` : ''}
${groundingSection}
${followUpSection}

TYPE-SPECIFIC RULES:
${typeRules}

VOICE AND STYLE RULES:
- Keep the interviewer message concise: 1-2 sentences, max ${wordLimit} words.
- If runtime mode is full_realtime, target <= ${wordLimit} words and avoid long preambles.
- Sound human, direct, and calm. Avoid robotic phrases.
- Ask exactly one primary question per turn.
- If needed, add one brief coaching cue, not a full explanation.
- Do not use markdown, bullets, or labels in the message.
- Match realistic interview cadence: probe depth, then narrow scope.

Generate a JSON response:
{
  "message": "Your next question or follow-up (be natural, not robotic)",
  "isFollowUp": true/false,
  "clarifications": ["Any clarifications you need?"],
  "hints": ["Hint to provide if they're stuck"],
  "encouragement": "Positive feedback or encouragement",
  "continueInterview": true/false
}`;
  }
}

export { maybeAddNaturalPrefix };
