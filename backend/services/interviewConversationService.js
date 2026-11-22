import { maybeAddNaturalPrefix, getWeakestRubricDimension, getRubricCoachingCue } from './interviewPromptService.js';
import { MISSING_AREA_HINTS } from './ragInterviewGroundingService.js';
import { interviewTelemetryService } from './interviewTelemetryService.js';
import { isSameTopic } from './interviewStateMachine.js';
import { ProactiveSuggestionService } from './interviewSuggestionService.js';

// ── Type-specific fallback messages ──────────────────────────────────
const FALLBACK_MESSAGES = {
  dsa: {
    message: 'Good start. Walk me through the time complexity and one edge case that could break your approach.',
    encouragement: 'You are on the right track. Keep it structured.',
  },
  'system-design': {
    message: 'Good foundation. Which component would you scale first and why?',
    encouragement: 'Solid direction. Let us dig deeper into the trade-offs.',
  },
  behavioral: {
    message: 'That is a good start. Can you walk me through the specific outcome and your role in it?',
    encouragement: 'Great context. The details will make this story shine.',
  },
  hr: {
    message: 'Thanks for sharing. What specifically draws you to this direction?',
    encouragement: 'Appreciate the honesty. Let us explore that a bit more.',
  },
};

function getFallbackForType(interviewType) {
  const normalized = String(interviewType || '').toLowerCase().replace('system_design', 'system-design');
  return FALLBACK_MESSAGES[normalized] || FALLBACK_MESSAGES.dsa;
}

export class InterviewConversationService {
  static parseFollowUpContent(content = '{}') {
    const normalized = String(content || '{}');
    const jsonMatch = normalized.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(jsonMatch?.[0] || '{}');
    } catch {
      return {};
    }
  }

  static buildFallbackFollowUp(_interviewMode = 'full_realtime', interviewType = 'dsa', missingAreas = [], probedTopics = [], options = {}) {
    const typeFallback = getFallbackForType(interviewType);
    let targetedMessage = typeFallback.message;

    if (Array.isArray(missingAreas) && missingAreas.length > 0) {
      for (const area of missingAreas) {
        if (Array.isArray(probedTopics) && probedTopics.some((t) => isSameTopic(t, area))) {
          continue;
        }
        const hint = MISSING_AREA_HINTS[area] || MISSING_AREA_HINTS[String(area).toLowerCase()];
        if (hint) {
          targetedMessage = `Could you expand on the ${area}? Specifically: ${hint}`;
          break;
        }
      }
    }

    // Resolve rubric-aware coaching cue
    let coachingCue = null;
    if (options?.progressiveCoaching?.cue) {
      coachingCue = options.progressiveCoaching.cue;
    } else if (options?.weakestDimension) {
      coachingCue = getRubricCoachingCue(options.weakestDimension);
    } else if (Array.isArray(options?.rubricHistory) && options.rubricHistory.length > 0) {
      const rubricAnalysis = getWeakestRubricDimension(options.rubricHistory);
      coachingCue = rubricAnalysis.cue;
    }

    const defaultTier = typeof options?.suggestionTier === 'number'
      ? options.suggestionTier
      : (options?.progressiveCoaching?.suggestedTier ?? 0);

    const hints = [];
    if (coachingCue) {
      hints.push(coachingCue);
    }

    return {
      message: targetedMessage,
      isFollowUp: true,
      clarifications: [],
      hints,
      coachingCue: coachingCue || null,
      suggestionTier: defaultTier,
      encouragement: typeFallback.encouragement,
      continueInterview: true,
    };
  }

  static async generateFollowUp({
    groqClient,
    modelConfig,
    prompt,
    interviewMode = 'full_realtime',
    interviewType = 'dsa',
    missingAreas = [],
    probedTopics = [],
    options = {},
  }) {
    const raw = await this.requestFollowUpContent({
      groqClient,
      modelConfig,
      prompt,
    });

    const normalized = this.normalizeFollowUp({
      content: raw.content,
      interviewMode,
      interviewType,
      missingAreas,
      probedTopics,
      forceFallback: raw.fallbackTriggered,
      options,
    });

    return {
      ...normalized.followUp,
      telemetryMeta: {
        modelName: raw.modelName,
        modelLatencyMs: raw.modelLatencyMs,
        modelFallbackTriggered: raw.fallbackTriggered,
        parseFallbackTriggered: normalized.parseFallbackTriggered,
        parseSuccess: normalized.parseSuccess,
      },
    };
  }

  static async requestFollowUpContent({
    groqClient,
    modelConfig,
    prompt,
  }) {
    if (!groqClient) {
      return {
        content: '{}',
        modelName: String(modelConfig?.model || 'fallback-model'),
        modelLatencyMs: 0,
        fallbackTriggered: true,
      };
    }

    const modelStart = Date.now();

    try {
      let content = '{}';
      if (typeof groqClient?.models?.generateContent === 'function') {
        const response = await groqClient.models.generateContent({
          model: modelConfig?.model || 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: modelConfig?.temperature ?? 0.8,
            maxOutputTokens: modelConfig?.max_tokens ?? 1500,
            responseMimeType: 'application/json',
          },
        });
        content = response?.text || '{}';
      } else if (typeof groqClient?.chat?.completions?.create === 'function') {
        const signal = AbortSignal.timeout(6000);
        const response = await groqClient.chat.completions.create(
          {
            ...modelConfig,
            messages: [{ role: 'user', content: prompt }],
          },
          { signal }
        );
        content = response?.choices?.[0]?.message?.content || '{}';
      } else {
        return {
          content: '{}',
          modelName: String(modelConfig?.model || 'fallback-model'),
          modelLatencyMs: 0,
          fallbackTriggered: true,
        };
      }

      return {
        content,
        modelName: String(modelConfig?.model || 'unknown-model'),
        modelLatencyMs: Math.max(0, Date.now() - modelStart),
        fallbackTriggered: false,
      };
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        interviewTelemetryService.logEvent('interview.turn.llm_timeout', {
          model: modelConfig?.model || 'unknown-model',
          latencyMs: Date.now() - modelStart,
        });
      }
      return {
        content: '{}',
        modelName: String(modelConfig?.model || 'unknown-model'),
        modelLatencyMs: Math.max(0, Date.now() - modelStart),
        fallbackTriggered: true,
      };
    }
  }

  static normalizeFollowUp({
    content,
    interviewMode = 'full_realtime',
    interviewType = 'dsa',
    missingAreas = [],
    probedTopics = [],
    forceFallback = false,
    options = {},
  }) {
    if (forceFallback) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType, missingAreas, probedTopics, options),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    let parsed;

    try {
      parsed = this.parseFollowUpContent(content || '{}');
    } catch {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType, missingAreas, probedTopics, options),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.message) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType, missingAreas, probedTopics, options),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    // Filter already-probed topics if LLM targeted an already probed area
    const candidateTopic = parsed.topic || parsed.missingArea;
    if (candidateTopic && Array.isArray(probedTopics) && probedTopics.some((t) => isSameTopic(t, candidateTopic))) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType, missingAreas, probedTopics, options),
        parseSuccess: true,
        parseFallbackTriggered: true,
      };
    }

    const fallback = this.buildFallbackFollowUp(interviewMode, interviewType, missingAreas, probedTopics, options);
    const baseFollowUp = {
      ...fallback,
      ...parsed,
    };

    if (parsed.coachingCue) {
      baseFollowUp.coachingCue = parsed.coachingCue;
    } else if (fallback.coachingCue) {
      baseFollowUp.coachingCue = fallback.coachingCue;
    }

    if (typeof parsed.suggestionTier === 'number') {
      baseFollowUp.suggestionTier = parsed.suggestionTier;
    } else if (typeof fallback.suggestionTier === 'number') {
      baseFollowUp.suggestionTier = fallback.suggestionTier;
    }

    if (parsed.proactiveSuggestion) {
      baseFollowUp.proactiveSuggestion = parsed.proactiveSuggestion;
    }

    if (interviewMode === 'full_realtime' && typeof baseFollowUp.message === 'string') {
      baseFollowUp.message = maybeAddNaturalPrefix(baseFollowUp.message);
    }

    return {
      followUp: baseFollowUp,
      parseSuccess: true,
      parseFallbackTriggered: false,
    };
  }
}
