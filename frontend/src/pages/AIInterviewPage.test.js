import { describe, it, expect } from 'vitest';
import { getThinkingDelayMs } from './aiInterviewTiming';

describe('getThinkingDelayMs', () => {
    it('scales with answer length and caps at two seconds', () => {
        expect(getThinkingDelayMs('short answer')).toBe(636);
        expect(getThinkingDelayMs('a'.repeat(1000))).toBe(2000);
    });
});
