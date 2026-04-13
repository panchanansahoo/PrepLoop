import { InterviewOrchestratorService } from './interviewOrchestrator.js';

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
    const missingAreas = (interviewContext.missingAreas || []).slice(0, 3);
    const currentStage = interviewContext.stage || interviewContext.interviewState?.stage || 'intake';
    const stageDirective = InterviewOrchestratorService.buildStageDirective(currentStage, interviewType);

    const hasGrounding = Boolean(
      ragContext && Array.isArray(ragContext.retrievedQuestions) && ragContext.retrievedQuestions.length > 0,
    );

    const groundingSection = hasGrounding
      ? `\nREFERENCE PATTERNS FROM COMPANY INTERVIEW HISTORY:\n${ragContext.retrievedQuestions
          .slice(0, 3)
          .map((entry, index) => `${index + 1}. ${entry.question}`)
          .join('\n')}\nGrounding hints: ${(ragContext.hintPatterns || []).slice(0, 2).join(' | ') || 'none'}`
      : '';

    return `You are a senior interviewer at a top product company. Generate a natural, realistic follow-up as if spoken by a human interviewer.

PROBLEM: ${problemStatement}
CANDIDATE JUST SAID: "${candidateResponse}"

INTERVIEW HISTORY (last 2 exchanges):
${transcript.slice(-4).map((t) => `${t.role}: ${t.text}`).join('\n')}

INTERVIEW CONTEXT:
- Type: ${interviewType}
- Runtime mode: ${interviewMode}
- Turns completed: ${interviewContext.turns || 0}
- Current stage: ${currentStage}
- Stage directive: ${stageDirective}
- Candidate likely missing: ${missingAreas.join(', ') || 'none'}
- Last candidate summary: ${interviewContext.lastCandidateSummary || 'n/a'}
${groundingSection}

VOICE AND STYLE RULES:
- Keep the interviewer message concise: 1-2 sentences, max 38 words.
- If runtime mode is full_realtime, target <= 24 words and avoid long preambles.
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
