import { describe, it, expect } from 'vitest';
import {
    getSemanticSilenceThreshold,
    getThinkingDelayMs,
    getInterviewerReaction,
    communicationScore,
    technicalScore,
    problemSolvingScore,
    codeQualityScore,
    getQuestionTimeLimit,
    getSilencePrompt,
    QUESTION_TIME_LIMITS,
} from './aiInterviewTiming';

describe('aiInterviewTiming', () => {
    describe('getThinkingDelayMs', () => {
        it('returns 400-900ms conversational gap for empty input', () => {
            for (const input of ['', undefined, null]) {
                const r = getThinkingDelayMs(input);
                // Bounded 400-900ms conversational gap (Part B Section 3)
                expect(r).toBeGreaterThanOrEqual(400);
                expect(r).toBeLessThanOrEqual(500);
            }
        });

        it('scales linearly with text length within 400-900ms bound', () => {
            const short = getThinkingDelayMs('hello', { deterministic: true });
            const medium = getThinkingDelayMs('a'.repeat(200), { deterministic: true });
            expect(short).toBeLessThanOrEqual(medium);
            expect(short).toBeGreaterThanOrEqual(400);
            expect(medium).toBeLessThanOrEqual(900);
        });

        it('caps at 900ms for very long answers', () => {
            const result1 = getThinkingDelayMs('a'.repeat(1000));
            const result2 = getThinkingDelayMs('a'.repeat(5000));
            expect(result1).toBeGreaterThanOrEqual(400);
            expect(result1).toBeLessThanOrEqual(900);
            expect(result2).toBeGreaterThanOrEqual(400);
            expect(result2).toBeLessThanOrEqual(900);
        });

        it('handles whitespace-only input as empty within [400, 500]ms', () => {
            const result = getThinkingDelayMs('   ');
            expect(result).toBeGreaterThanOrEqual(400);
            expect(result).toBeLessThanOrEqual(500);
        });
    });

    describe('getInterviewerReaction', () => {
        it('returns strong reaction for high scores', () => {
            const reaction = getInterviewerReaction(85);
            expect(reaction.emoji).toBe('👍');
            expect(reaction.text).toContain('strong');
        });

        it('returns follow-up reaction for mid-range scores', () => {
            const reaction = getInterviewerReaction(65);
            expect(reaction.emoji).toBe('🤔');
            expect(reaction.text).toContain('follow up');
        });

        it('returns neutral reaction for low scores', () => {
            const reaction = getInterviewerReaction(40);
            expect(reaction.emoji).toBe('😐');
            expect(reaction.text).toContain('explore');
        });

        it('uses correct boundary thresholds', () => {
            expect(getInterviewerReaction(80).emoji).toBe('👍');  // exactly 80
            expect(getInterviewerReaction(79).emoji).toBe('🤔');  // just below
            expect(getInterviewerReaction(60).emoji).toBe('🤔');  // exactly 60
            expect(getInterviewerReaction(59).emoji).toBe('😐');  // just below
        });

        // ── Type-specific reaction tests ──────────────────────────────
        it('returns DSA-specific reactions when type is provided', () => {
            const high = getInterviewerReaction(90, 'dsa');
            expect(high.emoji).toBe('🎯');
            expect(high.text).toContain('complexity');

            const mid = getInterviewerReaction(70, 'dsa');
            expect(mid.text).toContain('trade-offs');
        });

        it('returns behavioral-specific reactions', () => {
            const high = getInterviewerReaction(85, 'behavioral');
            expect(high.emoji).toBe('⭐');
            expect(high.text).toContain('impact');
        });

        it('returns HR-specific reactions', () => {
            const high = getInterviewerReaction(90, 'hr');
            expect(high.emoji).toBe('👏');
            expect(high.text).toContain('Authentic');
        });

        it('returns system-design specific reactions', () => {
            const high = getInterviewerReaction(85, 'system-design');
            expect(high.emoji).toBe('🏗️');
            expect(high.text).toContain('architecture');
        });

        it('handles system_design alias (underscore)', () => {
            const high = getInterviewerReaction(85, 'system_design');
            expect(high.emoji).toBe('🏗️');
        });

        it('falls back to default when type is unknown', () => {
            const reaction = getInterviewerReaction(85, 'unknown_type');
            expect(reaction.emoji).toBe('👍');
            expect(reaction.text).toContain('strong');
        });
    });

    describe('getSilencePrompt', () => {
        it('returns DSA-specific silence encouragement', () => {
            const prompt = getSilencePrompt('dsa', 0);
            expect(prompt).toContain('think out loud');
        });

        it('returns behavioral-specific silence encouragement', () => {
            const prompt = getSilencePrompt('behavioral', 0);
            expect(prompt).toContain('example');
        });

        it('returns HR-specific silence encouragement', () => {
            const prompt = getSilencePrompt('hr', 0);
            expect(prompt).toContain('no wrong answer');
        });

        it('cycles through prompts with silenceIndex', () => {
            const first = getSilencePrompt('dsa', 0);
            const second = getSilencePrompt('dsa', 1);
            expect(first).not.toBe(second);
        });

        it('handles system_design alias', () => {
            const prompt = getSilencePrompt('system_design', 0);
            expect(prompt).toContain('architecture');
        });

        it('returns a fallback for unknown types', () => {
            const prompt = getSilencePrompt('unknown', 0);
            expect(typeof prompt).toBe('string');
            expect(prompt.length).toBeGreaterThan(5);
        });
    });

    describe('scoring heuristics', () => {
        it('produces deterministic communication scores', () => {
            const s1 = communicationScore(80, 5, 6);
            const s2 = communicationScore(80, 5, 6);
            expect(s1).toBe(s2);
            expect(s1).toBeGreaterThanOrEqual(0);
            expect(s1).toBeLessThanOrEqual(10);
        });

        it('produces deterministic technical scores', () => {
            const code = 'function sort(arr) { return arr.sort(); } // O(n log n) algorithm';
            const s = technicalScore(code, 3);
            expect(s).toBeGreaterThanOrEqual(0);
            expect(s).toBeLessThanOrEqual(10);
            // same input → same output
            expect(technicalScore(code, 3)).toBe(s);
        });

        it('rewards more code lines in technical score', () => {
            const code = 'x = 1';
            const short = technicalScore(code, 2);
            const long = technicalScore(code, 10);
            expect(long).toBeGreaterThanOrEqual(short);
        });

        it('produces deterministic problem-solving scores', () => {
            const s = problemSolvingScore(4, 5);
            expect(s).toBeGreaterThanOrEqual(0);
            expect(s).toBeLessThanOrEqual(10);
            expect(problemSolvingScore(4, 5)).toBe(s);
        });

        it('produces deterministic code-quality scores', () => {
            const s = codeQualityScore('array edge case', 15);
            expect(s).toBeGreaterThanOrEqual(0);
            expect(s).toBeLessThanOrEqual(10);
            expect(codeQualityScore('array edge case', 15)).toBe(s);
        });

        it('handles empty/null inputs gracefully', () => {
            expect(communicationScore(0, 0, 0)).toBeGreaterThanOrEqual(0);
            expect(technicalScore(null, 0)).toBeGreaterThanOrEqual(0);
            expect(problemSolvingScore(0, 0)).toBeGreaterThanOrEqual(0);
            expect(codeQualityScore('', 0)).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getQuestionTimeLimit', () => {
        it('returns correct limits for each stage', () => {
            expect(getQuestionTimeLimit('DSA / Coding')).toBe(120);
            expect(getQuestionTimeLimit('System Design')).toBe(150);
            expect(getQuestionTimeLimit('Behavioral')).toBe(90);
            expect(getQuestionTimeLimit('Technical')).toBe(90);
            expect(getQuestionTimeLimit('HR')).toBe(75);
        });

        it('returns default 90s for unknown stages', () => {
            expect(getQuestionTimeLimit('Unknown')).toBe(90);
            expect(getQuestionTimeLimit('')).toBe(90);
            expect(getQuestionTimeLimit(undefined)).toBe(90);
        });

        it('exports QUESTION_TIME_LIMITS with expected keys', () => {
            expect(QUESTION_TIME_LIMITS).toHaveProperty('default', 90);
            expect(Object.keys(QUESTION_TIME_LIMITS).length).toBeGreaterThan(3);
        });
    });
    describe('Semantic Silence & Turn-Taking Threshold Engine', () => {
        it('returns 1500ms for explicit conclusion phrases', () => {
            expect(getSemanticSilenceThreshold({ stage: 'Technical', wordCount: 20, text: "That is all." })).toBe(1500);
            expect(getSemanticSilenceThreshold({ stage: 'Technical', wordCount: 8, text: "and that's my approach." })).toBe(1500);
        });

        it('gives technical answers 2500ms if short (<15 words) and 2000ms when substantive', () => {
            expect(getSemanticSilenceThreshold({ stage: 'Technical', wordCount: 8, text: "I would use a hash map" })).toBe(2500);
            expect(getSemanticSilenceThreshold({ stage: 'DSA / Coding', wordCount: 12, text: "We can maintain two pointers" })).toBe(2500);
            expect(getSemanticSilenceThreshold({ stage: 'Technical', wordCount: 25, text: "We iterate through the array once and store seen elements in a hash set to get linear time" })).toBe(2000);
        });

        it('gives behavioral answers 1800ms when substantive and 2200ms when short', () => {
            expect(getSemanticSilenceThreshold({ stage: 'Behavioral', wordCount: 25, text: "In my previous project I led the migration" })).toBe(1800);
            expect(getSemanticSilenceThreshold({ stage: 'Behavioral', wordCount: 5, text: "I worked on teams" })).toBe(2200);
        });

        it('clamps candidate pacing offset and enforces hard 3600ms ceiling for deliberate speakers with trailing fillers', () => {
            // Deliberate offset (+500ms) with trailing filler (+1200ms) on short technical question (2500ms) = 4200ms -> clamped to 3600ms
            const clamped = getSemanticSilenceThreshold({
                stage: 'Technical',
                wordCount: 8,
                text: "I think we can use a trie, um...",
                candidatePacingOffset: 800, // excessive offset passed
            });
            expect(clamped).toBe(3600);
            expect(clamped).toBeLessThanOrEqual(3600);
        });
    });
});
