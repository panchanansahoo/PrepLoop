export class InterviewConversationService {
  static parseFollowUpContent(content = '{}') {
    const normalized = String(content || '{}');
    const jsonMatch = normalized.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] || '{}');
  }

  static buildFallbackFollowUp(interviewMode = 'full_realtime') {
    const message = 'Good start. Give complexity, then one edge case that could break your approach.';

    return {
      message,
      isFollowUp: true,
      clarifications: [],
      hints: [],
      encouragement: 'You are on the right track. Keep it structured.',
      continueInterview: true,
    };
  }

  static async generateFollowUp({
    groqClient,
    modelConfig,
    prompt,
    interviewMode = 'full_realtime',
  }) {
    const raw = await this.requestFollowUpContent({
      groqClient,
      modelConfig,
      prompt,
    });

    const normalized = this.normalizeFollowUp({
      content: raw.content,
      interviewMode,
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
    forceFallback = false,
  }) {
    if (forceFallback) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    let parsed = null;

    try {
      parsed = this.parseFollowUpContent(content || '{}');
    } catch {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.message) {
      return {
        followUp: this.buildFallbackFollowUp(interviewMode),
        parseSuccess: false,
        parseFallbackTriggered: true,
      };
    }

    return {
      followUp: {
        ...this.buildFallbackFollowUp(interviewMode),
        ...parsed,
      },
      parseSuccess: true,
      parseFallbackTriggered: false,
    };
  }
}
