import { describe, expect, it } from 'vitest';
import {
  buildFollowUpRecoveryBundle,
  buildAdaptivePointTooltip,
  buildAdaptiveSparklineData,
  buildAdaptiveTimelineEntries,
  describeDifficultyLevel,
  getDefaultInterviewRuntimeMode,
  getAdaptiveCoachingSignal,
  buildRealtimeFailureMessage,
  getInteractionFormat,
  getSupportedInterviewRuntimeModes,
  isStrictRealtimeMode,
  resolveSubmittedAnswer,
  CODE_DELIMITER_MARKER,
} from './aiInterviewRuntime';

describe('aiInterviewRuntime', () => {
  it('exposes realtime-only runtime modes', () => {
    expect(getSupportedInterviewRuntimeModes()).toEqual(['full_realtime']);
    expect(getDefaultInterviewRuntimeMode()).toBe('full_realtime');
  });

  it('treats full_realtime mode as strict realtime', () => {
    expect(isStrictRealtimeMode('full_realtime')).toBe(true);
  });

  it('uses voice interaction format for realtime mode', () => {
    expect(getInteractionFormat('full_realtime')).toBe('voice');
  });

  it('builds a user-facing failure message with reason fallback', () => {
    expect(buildRealtimeFailureMessage('bridge offline')).toContain('bridge offline');
    expect(buildRealtimeFailureMessage('')).toContain('Realtime voice infrastructure is unavailable');
  });

  it('prefers a realtime provided answer over cleared form state', () => {
    expect(
      resolveSubmittedAnswer({
        providedAnswer: 'Final spoken answer',
        userInput: '',
        transcript: '',
        code: 'print("hello")',
      })
    ).toEqual({
      answer: 'Final spoken answer',
      fullAnswer: `Final spoken answer\n\n${CODE_DELIMITER_MARKER}\nprint("hello")`,
    });
  });

  it('extracts adaptive coaching signal from follow-up payloads', () => {
    expect(
      getAdaptiveCoachingSignal({
        adaptiveNote: 'Increasing challenge for stronger signal',
        difficultyLevel: 'hard',
      })
    ).toEqual({
      adaptiveNote: 'Increasing challenge for stronger signal',
      difficultyLevel: 'hard',
    });

    expect(
      getAdaptiveCoachingSignal({
        adaptive_update: {
          note: 'Slowing down to reinforce fundamentals',
          level: 'easy',
        },
      })
    ).toEqual({
      adaptiveNote: 'Slowing down to reinforce fundamentals',
      difficultyLevel: 'easy',
    });
  });

  it('maps difficulty levels to user-facing labels', () => {
    expect(describeDifficultyLevel('hard')).toBe('Challenge Up');
    expect(describeDifficultyLevel('medium')).toBe('Balanced');
    expect(describeDifficultyLevel('easy')).toBe('Reinforcement');
    expect(describeDifficultyLevel('unknown')).toBe('Adaptive');
  });

  it('builds adaptive timeline entries from feedback conversation', () => {
    const conversation = [
      { role: 'interviewer', content: 'Opening question' },
      {
        role: 'feedback',
        content: 'Strong signal',
        adaptiveSignal: { adaptiveNote: 'Increasing challenge', difficultyLevel: 'hard' },
      },
      { role: 'interviewer', content: 'Second question' },
      {
        role: 'feedback',
        content: 'Need more fundamentals',
        adaptiveSignal: { adaptiveNote: 'Reinforcing basics', difficultyLevel: 'easy' },
      },
    ];

    expect(buildAdaptiveTimelineEntries(conversation)).toEqual([
      {
        id: 'adaptive-1',
        turn: 1,
        difficultyLevel: 'hard',
        difficultyLabel: 'Challenge Up',
        adaptiveNote: 'Increasing challenge',
      },
      {
        id: 'adaptive-2',
        turn: 2,
        difficultyLevel: 'easy',
        difficultyLabel: 'Reinforcement',
        adaptiveNote: 'Reinforcing basics',
      },
    ]);
  });

  it('builds sparkline data from adaptive timeline entries', () => {
    const timeline = [
      { id: 'adaptive-1', turn: 1, difficultyLevel: 'easy', adaptiveNote: 'Foundation first' },
      { id: 'adaptive-2', turn: 2, difficultyLevel: 'medium', adaptiveNote: 'Back to balanced' },
      { id: 'adaptive-3', turn: 3, difficultyLevel: 'hard', adaptiveNote: 'Raise challenge' },
    ];

    expect(buildAdaptiveSparklineData(timeline)).toEqual({
      path: 'M 0 26 L 56 13 L 112 0',
      points: [
        { id: 'adaptive-1', x: 0, y: 26, value: 3, turn: 1 },
        { id: 'adaptive-2', x: 56, y: 13, value: 6, turn: 2 },
        { id: 'adaptive-3', x: 112, y: 0, value: 9, turn: 3 },
      ],
      minValue: 3,
      maxValue: 9,
    });
  });

  it('builds adaptive point tooltip text', () => {
    expect(
      buildAdaptivePointTooltip({
        turn: 2,
        difficultyLabel: 'Balanced',
        adaptiveNote: 'Back to balanced questioning',
      })
    ).toBe('Turn 2: Balanced — Back to balanced questioning');

    expect(
      buildAdaptivePointTooltip({
        turn: 4,
        difficultyLabel: 'Challenge Up',
        adaptiveNote: '',
      })
    ).toBe('Turn 4: Challenge Up');
  });

  it('builds stage-aware fallback recovery prompts for fresher HR interviews', () => {
    expect(
      buildFollowUpRecoveryBundle({
        stage: 'HR',
        experienceLevel: 'fresher',
      })
    ).toEqual({
      feedback: "Thanks for sharing that. Let's keep this practical and structured.",
      nextQuestion: 'Can you walk me through a real situation where you handled a challenge and what you learned from it?',
    });
  });

  it('builds stage-aware fallback recovery prompts for coding interviews', () => {
    expect(
      buildFollowUpRecoveryBundle({
        stage: 'DSA / Coding',
        experienceLevel: 'experienced',
      })
    ).toEqual({
      feedback: 'Good start. Let\'s make the solution more interview-ready.',
      nextQuestion: 'How would you optimize this approach for time and space complexity, and what trade-offs would you accept?',
    });
  });
});
