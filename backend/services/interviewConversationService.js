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
    return JSON.parse(jsonMatch?.[0] || '{}');
  }

  static buildFallbackFollowUp(_interviewMode = 'full_realtime', interviewType = 'dsa') {
    const typeFallback = getFallbackForType(interviewType);

    return {
      message: typeFallback.message,
      isFollowUp: true,
      clarifications: [],
      hints: [],
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
      forceFallback: raw.fallbackTriggered,
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
      const response = await groqClient.chat.completions.create({
        ...modelConfig,
        messages: [{ role: 'user', content: prompt }],
      });

      return {
        content: response?.choices?.[0]?.message?.content || '{}',
        modelName: String(modelConfig?.model || 'unknown-model'),
        modelLatencyMs: Math.max(0, Date.now() - modelStart),
        fallbackTriggered: false,
      };
    } catch {
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
    forceFallback = false,
  }) {
    if (forceFallback) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    let parsed;

    try {
      parsed = this.parseFollowUpContent(content || '{}');
    } catch {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.message) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode, interviewType),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    return {
      followUp: {
        ...this.buildFallbackFollowUp(interviewMode, interviewType),
        ...parsed,
      },
      parseSuccess: true,
      parseFallbackTriggered: false,
    };
  }
}
