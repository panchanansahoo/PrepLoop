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
    decideNextTurnAction,
    PACING_MODES,
    getConversationalTransition,
    classifyCandidateAnswer,
    countFillerWords,
    detectStructureBonus,
    detectFillerPenalty,
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

        it('uses correct boundary thresholds (defaulting to medium difficulty >= 78)', () => {
            expect(getInterviewerReaction(78).emoji).toBe('👍');  // exactly 78 (medium threshold)
            expect(getInterviewerReaction(77).emoji).toBe('🤔');  // just below 78
            expect(getInterviewerReaction(60).emoji).toBe('🤔');  // exactly 60
            expect(getInterviewerReaction(59).emoji).toBe('😐');  // just below
        });

        it('adjusts reaction thresholds based on question difficulty', () => {
            // For easy questions (high threshold >= 65)
            const easyHighBoundary = getInterviewerReaction(65, 'dsa', 'easy');
            expect(easyHighBoundary.emoji).toBe('🎯');

            const easyBelowHigh = getInterviewerReaction(64, 'dsa', 'easy');
            expect(easyBelowHigh.emoji).toBe('🤔');

            const easyMid = getInterviewerReaction(52, 'dsa', 'easy');
            expect(easyMid.emoji).toBe('🤔');

            const easyLow = getInterviewerReaction(40, 'dsa', 'easy');
            expect(easyLow.emoji).toBe('💡');

            // For medium questions (high threshold >= 78)
            const medHigh = getInterviewerReaction(78, 'dsa', 'medium');
            expect(medHigh.emoji).toBe('🎯');

            const medBelowHigh = getInterviewerReaction(77, 'dsa', 'medium');
            expect(medBelowHigh.emoji).toBe('🤔');

            // For hard / staff questions (high threshold >= 82)
            const hardBelowHigh = getInterviewerReaction(81, 'dsa', 'hard');
            expect(hardBelowHigh.emoji).toBe('🤔');

            const hardHigh = getInterviewerReaction(82, 'dsa', 'hard');
            expect(hardHigh.emoji).toBe('🎯');

            const staffBelowHigh = getInterviewerReaction(81, 'dsa', 'staff');
            expect(staffBelowHigh.emoji).toBe('🤔');

            const staffHigh = getInterviewerReaction(82, 'dsa', 'staff');
            expect(staffHigh.emoji).toBe('🎯');

            const hardStaffHigh = getInterviewerReaction(82, 'dsa', 'hard/staff');
            expect(hardStaffHigh.emoji).toBe('🎯');

            const staffArchHigh = getInterviewerReaction(82, 'dsa', 'staff_architectural');
            expect(staffArchHigh.emoji).toBe('🎯');
        });

        it('defaults to medium thresholds when difficulty is not provided', () => {
            expect(getInterviewerReaction(78, 'dsa').emoji).toBe('🎯');
            expect(getInterviewerReaction(77, 'dsa').emoji).toBe('🤔');
            expect(getInterviewerReaction(78, null, null).emoji).toBe('👍');
            expect(getInterviewerReaction(77, null, null).emoji).toBe('🤔');
            expect(getInterviewerReaction(78, null, undefined).emoji).toBe('👍');
            expect(getInterviewerReaction(77, null, undefined).emoji).toBe('🤔');
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

        it('extends silence threshold when candidate speaks mid-list or trailing enumeration', () => {
            const listThreshold = getSemanticSilenceThreshold({
                stage: 'Technical',
                wordCount: 20,
                text: "First we partition the array, secondly we sort recursively,",
            });
            expect(listThreshold).toBeGreaterThanOrEqual(2500);
        });

        it('extends silence threshold up to 5000ms when candidate is actively coding', () => {
            const codingThreshold = getSemanticSilenceThreshold({
                stage: 'DSA / Coding',
                wordCount: 5,
                text: "function solve() {",
                isCodingActive: true,
            });
            expect(codingThreshold).toBeGreaterThanOrEqual(3400);
            expect(codingThreshold).toBeLessThanOrEqual(5000);
        });
    });

    describe('Turn Routing Decision Engine (Follow-up vs Next Question)', () => {
        it('handles timed_out turns by advancing with redirect and noScore', () => {
            const decision = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'timed_out' });
            expect(decision.action).toBe('next_question');
            expect(decision.needsRedirect).toBe(true);
            expect(decision.noScore).toBe(true);
            expect(decision.neutralReaction).toBe(true);
        });

        it('handles code_only turns by asking candidate to walk through code', () => {
            const first = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'code_only' });
            expect(first.action).toBe('follow_up');
            expect(first.promptCue).toContain('Walk me through');

            const second = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'code_only' });
            expect(second.action).toBe('next_question');
        });

        it('handles repeated answers with redirection to prevent grounding loops', () => {
            const first = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'repeated' });
            expect(first.action).toBe('follow_up');
            expect(first.needsRedirect).toBe(true);
            expect(first.neutralReaction).toBe(true);

            const second = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'repeated' });
            expect(second.action).toBe('next_question');
            expect(second.needsRedirect).toBe(true);
        });
        it('asks follow-up if topic follow-ups are under 2 and answer type is partial', () => {
            const decision0 = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'partial' });
            expect(decision0.action).toBe('follow_up');
            expect(decision0.nextTopicFollowUpCount).toBe(1);

            const decision1 = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'partial' });
            expect(decision1.action).toBe('follow_up');
            expect(decision1.nextTopicFollowUpCount).toBe(2);
        });

        it('asks follow-up only on the first strong_complete (cap = 1)', () => {
            const decision0 = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'strong_complete' });
            expect(decision0.action).toBe('follow_up');
            expect(decision0.nextTopicFollowUpCount).toBe(1);

            const decision1 = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'strong_complete' });
            expect(decision1.action).toBe('next_question');
            expect(decision1.nextTopicFollowUpCount).toBe(0);
        });

        it('moves to next planned question when 2 follow-ups on the topic have already occurred (partial)', () => {
            const decision = decideNextTurnAction({ topicFollowUpCount: 2, answerType: 'partial' });
            expect(decision.action).toBe('next_question');
            expect(decision.nextTopicFollowUpCount).toBe(0);
        });

        it('moves on after one gentle redirect for dont_know', () => {
            const decision = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'dont_know' });
            expect(decision.action).toBe('next_question');
            expect(decision.nextTopicFollowUpCount).toBe(0);
            expect(decision.needsRedirect).toBe(true);
        });

        it('moves on after one gentle redirect for off_topic', () => {
            const decision = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'off_topic' });
            expect(decision.action).toBe('next_question');
            expect(decision.nextTopicFollowUpCount).toBe(0);
            expect(decision.needsRedirect).toBe(true);
        });

        it('triggers closing and report on the last question with complete: true', () => {
            const decision = decideNextTurnAction({
                topicFollowUpCount: 0,
                answerType: 'strong_complete',
                isLastQuestion: true,
            });
            expect(decision.action).toBe('complete');
            expect(decision.nextTopicFollowUpCount).toBe(0);
        });

        it('wrong: gives one neutral-hint follow-up then moves on', () => {
            const first = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'wrong' });
            expect(first.action).toBe('follow_up');
            expect(first.nextTopicFollowUpCount).toBe(1);
            expect(first.neutralReaction).toBe(true);

            const second = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'wrong' });
            expect(second.action).toBe('next_question');
            expect(second.neutralReaction).toBe(true);
        });

        it('clarification: returns clarification_response, noScore, does not increment counter', () => {
            const result = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'clarification' });
            expect(result.action).toBe('clarification_response');
            expect(result.noScore).toBe(true);
            expect(result.nextTopicFollowUpCount).toBe(1); // unchanged
        });

        it('stuck_silence: gives one hint follow-up then moves on', () => {
            const hint = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'stuck_silence' });
            expect(hint.action).toBe('follow_up');
            expect(hint.nextTopicFollowUpCount).toBe(1);

            const advance = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'stuck_silence' });
            expect(advance.action).toBe('next_question');
        });

        it('skipped: advances immediately, marks noScore', () => {
            const result = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'skipped' });
            expect(result.action).toBe('next_question');
            expect(result.noScore).toBe(true);
            expect(result.nextTopicFollowUpCount).toBe(0);
        });

        it('strong_complete: at most 1 follow-up, 0 when tradeOffsCovered', () => {
            const first = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'strong_complete' });
            expect(first.action).toBe('follow_up');
            expect(first.nextTopicFollowUpCount).toBe(1);

            const done = decideNextTurnAction({ topicFollowUpCount: 1, answerType: 'strong_complete' });
            expect(done.action).toBe('next_question');

            const covered = decideNextTurnAction({ topicFollowUpCount: 0, answerType: 'strong_complete', tradeOffsCovered: true });
            expect(covered.action).toBe('next_question');
            expect(covered.nextTopicFollowUpCount).toBe(0);
        });
    });

    describe('Pacing Modes Configuration', () => {
        it('configures realistic mode with ~12s nudge hint, ~25s check-in, and ~40s auto-advance', () => {
            expect(PACING_MODES.realistic.nudgeMs).toBe(12000);
            expect(PACING_MODES.realistic.checkInMs).toBe(25000);
            expect(PACING_MODES.realistic.autoAdvanceMs).toBe(40000);
        });
    });

    describe('Conversational Transitions with Session Seeding', () => {
        it('returns expected transitions without session seed (backward compatible)', () => {
            const t1 = getConversationalTransition(85, 'Technical', 1);
            const t2 = getConversationalTransition(85, 'Technical', 1);
            expect(t1).toBe(t2);
            expect(typeof t1).toBe('string');
            expect(t1.length).toBeGreaterThan(0);
        });

        it('seeds phrase rotation with sessionId so repeat users get varied transitions', () => {
            // Test with a few different session seeds
            const results = new Set();
            for (let i = 1; i <= 6; i++) {
                const phrase = getConversationalTransition(85, 'Technical', 1, `session-user-${i}`);
                results.add(phrase);
            }
            // With distinct session seeds across 6 calls, there should be more than 1 distinct phrase
            expect(results.size).toBeGreaterThan(1);
        });

        it('supports numeric sessionSeed and object { sessionId }', () => {
            const byNum = getConversationalTransition(70, 'Technical', 2, 42);
            const byObj = getConversationalTransition(70, 'Technical', 2, { sessionId: 'attempt-42' });
            expect(typeof byNum).toBe('string');
            expect(typeof byObj).toBe('string');
        });
    });

    describe('Enhanced communicationScore (Structure & Filler Words)', () => {
        it('rewards STAR framework structure in answers', () => {
            const plainScore = communicationScore(50, 3, 3, "I built a service to handle data processing and delivered it.");
            const starScore = communicationScore(50, 3, 3, "Using the STAR approach: in that situation, my task was to reduce latency. My action was caching hot keys in Redis, and the result was 50% lower response times.");
            expect(starScore).toBeGreaterThan(plainScore);
        });

        it('rewards sequential structure (first, second, finally)', () => {
            const plainScore = communicationScore(50, 3, 3, "We can do this by checking items in the list and returning values.");
            const structuredScore = communicationScore(50, 3, 3, "First, we validate inputs. Second, we traverse the graph with BFS. Finally, we return the shortest path.");
            expect(structuredScore).toBeGreaterThan(plainScore);
        });

        it('penalizes excessive filler words', () => {
            const cleanScore = communicationScore(60, 3, 3, "The system scales by partitioning database shards across regions.");
            const fillerScore = communicationScore(60, 3, 3, "Um like basically the system like uh you know sort of basically scales um like actually uh across regions.");
            expect(fillerScore).toBeLessThan(cleanScore);
        });

        it('clamps scores within [0, 10]', () => {
            const minScore = communicationScore(0, 0, 10, "um uh like you know basically actually sort of kind of er");
            const maxScore = communicationScore(200, 10, 1, "STAR method: Situation, Task, Action, Result. First, second, finally.");
            expect(minScore).toBeGreaterThanOrEqual(0);
            expect(maxScore).toBeLessThanOrEqual(10);
        });

        it('supports object argument with avgResponseLength and text', () => {
            const res = communicationScore({
                avgResponseLength: 60,
                userMsgCount: 4,
                questionCount: 4,
                text: "First we sort the items. Second we binary search.",
            });
            expect(res).toBeGreaterThanOrEqual(0);
            expect(res).toBeLessThanOrEqual(10);
        });
    });

    describe('P0-A Answer Classification (classifyCandidateAnswer)', () => {
        it('classifies clarification questions', () => {
            expect(classifyCandidateAnswer("Could you clarify if the array can contain negative integers?")).toBe('clarification');
            expect(classifyCandidateAnswer("Can you repeat the question please?")).toBe('clarification');
            expect(classifyCandidateAnswer("What are the constraints on memory?")).toBe('clarification');
        });

        it('classifies dont_know responses including expanded phrases', () => {
            expect(classifyCandidateAnswer("I don't know the exact syntax for that.")).toBe('dont_know');
            expect(classifyCandidateAnswer("I am blanking on the name of this algorithm.")).toBe('dont_know');
            expect(classifyCandidateAnswer("I'm drawing a blank right now.")).toBe('dont_know');
            expect(classifyCandidateAnswer("I haven't encountered this design pattern before.")).toBe('dont_know');
            expect(classifyCandidateAnswer("I'd like to pass on this question.")).toBe('dont_know');
            expect(classifyCandidateAnswer("I am not sure how to approach this.")).toBe('dont_know');
            expect(classifyCandidateAnswer("I have no clue how that works.")).toBe('dont_know');
        });

        it('classifies off-topic statements', () => {
            expect(classifyCandidateAnswer("Let's talk about bitcoin and crypto trading.")).toBe('off_topic');
            expect(classifyCandidateAnswer("I went hiking last weekend and the weather was nice.")).toBe('off_topic');
        });

        it('classifies code_only answers', () => {
            const ans = classifyCandidateAnswer("", { code: "function twoSum(nums, target) { return []; }" });
            expect(ans).toBe('code_only');

            const ans2 = classifyCandidateAnswer("[Code submitted]", { code: "const x = 1;" });
            expect(ans2).toBe('code_only');
        });

        it('classifies strong_complete answers with trade-offs and structure', () => {
            const substantiveAnswer = "To solve this problem efficiently, we can use a two-pointer approach with a hash map. First, we sort the array which takes O(n log n) time. Then, we advance the pointers to find complement pairs. The trade-off is O(n) space complexity to store frequencies, but it reduces runtime from O(n^2) to O(n log n). Finally, edge cases like duplicates and negative numbers are handled properly.";
            expect(classifyCandidateAnswer(substantiveAnswer)).toBe('strong_complete');
        });

        it('classifies brief/simple answers as partial', () => {
            expect(classifyCandidateAnswer("We can use an array.")).toBe('partial');
        });

        it('classifies explicit skips and silence timeouts', () => {
            expect(classifyCandidateAnswer("", { meta: { submissionType: 'voluntary_skip' } })).toBe('skipped');
            expect(classifyCandidateAnswer("", { meta: { submissionType: 'timeout_empty', reason: 'silence_timeout' } })).toBe('stuck_silence');
            expect(classifyCandidateAnswer("I was sayi-", { meta: { submissionType: 'timeout_partial', reason: 'silence_timeout' } })).toBe('timed_out');
        });

        it('detects repeated answers from conversation history', () => {
            const previous = ["We should use a hash table to store key value pairs for caching."];
            const answer = "We should use a hash table to store key value pairs for caching.";
            expect(classifyCandidateAnswer(answer, { previousAnswers: previous })).toBe('repeated');
            expect(classifyCandidateAnswer("Like I said before, we cache the results.", { previousAnswers: previous })).toBe('repeated');
        });
    });
});
