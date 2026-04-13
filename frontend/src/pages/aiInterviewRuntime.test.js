import { describe, expect, it } from 'vitest';
import {
  getDefaultInterviewRuntimeMode,
  buildRealtimeFailureMessage,
  getInteractionFormat,
  getSupportedInterviewRuntimeModes,
  isStrictRealtimeMode,
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
});
