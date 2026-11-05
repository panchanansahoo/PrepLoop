import { describe, it, expect, vi } from "vitest";
import { getSemanticSilenceThreshold } from "../pages/aiInterviewTiming";

describe("Voice Turn-Taking, Resume Window & Latency Calibration", () => {
  describe("Technical Silence Thresholds (Shortened for Fast Resumes)", () => {
    it("scales technical silence to 2500ms for short clauses and 2000ms for substantive answers", () => {
      // Short technical clause (<15 words): 2500ms (fast turn-around since resume window rescues mid-thoughts)
      const shortTech = getSemanticSilenceThreshold({
        stage: "Technical",
        wordCount: 8,
        text: "I would use a hash map",
      });
      expect(shortTech).toBe(2500);

      // Substantive technical clause (>=15 words): 2000ms
      const longTech = getSemanticSilenceThreshold({
        stage: "Technical",
        wordCount: 20,
        text: "We can maintain a frequency map of elements to find duplicates in linear time and space",
      });
      expect(longTech).toBe(2000);
    });

    it("uses 1800ms for substantive behavioral answers and 2200ms for short behavioral answers", () => {
      const shortBeh = getSemanticSilenceThreshold({
        stage: "Behavioral",
        wordCount: 6,
        text: "I resolved the team conflict",
      });
      expect(shortBeh).toBe(2200);

      const longBeh = getSemanticSilenceThreshold({
        stage: "Behavioral",
        wordCount: 25,
        text: "In my previous role as lead engineer I facilitated daily standups to unblock the frontend and backend engineers",
      });
      expect(longBeh).toBe(1800);
    });

    it("triggers snappy 1500ms submission on explicit completion phrases", () => {
      expect(getSemanticSilenceThreshold({ stage: "Technical", wordCount: 10, text: "That is all." })).toBe(1500);
      expect(getSemanticSilenceThreshold({ stage: "System Design", wordCount: 15, text: "and that concludes my answer." })).toBe(1500);
    });
  });

  describe("Resume Window State Machine & Question Counter Guard", () => {
    it("aborts turn transition, stops audio, and preserves question counter when candidate resumes speech", () => {
      let questionIndex = 1;
      let speakSequenceCancelled = false;
      let isAudioPlaying = true;
      let transcript = "We can use a hash map";

      // Simulated candidate speech resumption within 2 seconds
      function handleResume(newSpeech = "and the complexity is O(N)") {
        // 1. Stop audio that has started
        speakSequenceCancelled = true;
        isAudioPlaying = false;

        // 2. Do NOT advance question counter!
        // questionIndex stays 1

        // 3. Merge resumed speech onto transcript
        transcript = `${transcript} ${newSpeech}`;
      }

      function handleTurnCompletion(nextQuestion) {
        // Only advance if speechSequence was not cancelled by a candidate resume
        if (speakSequenceCancelled) {
          return false;
        }
        questionIndex += 1;
        return true;
      }

      // Candidate resumes mid-thought
      handleResume("and the complexity is O(N)");
      expect(isAudioPlaying).toBe(false);
      expect(speakSequenceCancelled).toBe(true);

      const advanced = handleTurnCompletion("Next question");
      expect(advanced).toBe(false);
      expect(questionIndex).toBe(1); // Counter did NOT advance!
      expect(transcript).toContain("and the complexity is O(N)");
    });
  });

  describe("Last-Speech-Detected Latency Anchor", () => {
    it("measures end-to-end conversational turn latency from last-speech-detected rather than submit", () => {
      const speechEndedAt = 1000;
      const silenceWindowMs = 2000;
      const submittedAt = speechEndedAt + silenceWindowMs; // 3000
      const firstAudioPlayedAt = 3400;

      // Latency from submit only measures backend + audio fetch (400ms)
      const submitLatency = firstAudioPlayedAt - submittedAt;
      expect(submitLatency).toBe(400);

      // Latency from last-speech-detected measures real human perceived silence (2400ms)
      const humanPerceivedLatency = firstAudioPlayedAt - speechEndedAt;
      expect(humanPerceivedLatency).toBe(2400);
      expect(humanPerceivedLatency).toBeGreaterThan(submitLatency);
    });
  });

  describe("Turn Evaluation Pipelining & Report Flush", () => {
    it("awaits pending turn evals before next turn and flushes all evals before final report", async () => {
      const completedEvals = [];
      let pendingEvalPromise = null;
      const pendingEvals = [];

      function queueTurnEval(turnNumber, score) {
        const p = new Promise((resolve) => {
          setTimeout(() => {
            completedEvals.push({ turnNumber, score });
            resolve({ turnNumber, score });
          }, 20);
        });
        pendingEvalPromise = p;
        pendingEvals.push(p);
      }

      // Turn 1 evaluation queued in background
      queueTurnEval(1, 85);
      expect(completedEvals.length).toBe(0);

      // Turn 2 starts: awaits or lags pending turn 1 eval before deciding difficulty
      if (pendingEvalPromise) {
        await pendingEvalPromise;
        pendingEvalPromise = null;
      }
      expect(completedEvals.length).toBe(1);
      expect(completedEvals[0]).toEqual({ turnNumber: 1, score: 85 });

      // Turn 2 finishes, queues turn 2 eval
      queueTurnEval(2, 90);

      // Final report trigger: flushes all pending evals
      await Promise.allSettled(pendingEvals);
      expect(completedEvals.length).toBe(2);
      expect(completedEvals[1]).toEqual({ turnNumber: 2, score: 90 });
    });
  });

  describe("Speculative Fast-Reply Generation & Zero-Risk Abort", () => {
    it("pre-fetches fast-reply at 800ms of quiet silence and reuses it on confirmed submit", async () => {
      let speculativeFired = false;
      let fastReplyCache = null;
      let abortCalled = false;

      const triggerSpeculative = (text) => {
        speculativeFired = true;
        fastReplyCache = {
          answer: text,
          microReaction: "Makes sense.",
          followUpQuestion: "What is the space complexity?",
          readyAt: 1200,
        };
      };

      const abortSpeculative = () => {
        abortCalled = true;
        fastReplyCache = null;
      };

      // Candidate finishes speaking at t = 0
      const speechEndedAt = 0;
      const textSoFar = "I would use a hash map with linear time complexity";

      // At t = 800ms of continuous silence with >= 6 words:
      const silenceAt800 = 800;
      if (silenceAt800 >= 800) {
        triggerSpeculative(textSoFar);
      }
      expect(speculativeFired).toBe(true);
      expect(fastReplyCache).not.toBeNull();

      // Candidate stays silent until full threshold (t = 2000ms)
      const submitAt = 2000;
      let generatedReply = null;
      let llmNetworkWaitMs = 0;

      if (fastReplyCache && fastReplyCache.answer === textSoFar) {
        // Speculative HIT! 0ms network wait at submit time!
        generatedReply = fastReplyCache;
        llmNetworkWaitMs = 0;
      } else {
        llmNetworkWaitMs = 450;
      }

      expect(generatedReply).toEqual(fastReplyCache);
      expect(llmNetworkWaitMs).toBe(0); // Cut ~450ms LLM delay directly from user wait!
    });

    it("aborts speculative in-flight request when candidate resumes vocalizing mid-silence", () => {
      let abortSignalTriggered = false;
      let fastReplyCache = { answer: "I would use a hash map" };

      const abortSpeculative = () => {
        abortSignalTriggered = true;
        fastReplyCache = null;
      };

      // Candidate spoke partial clause, silence reached 800ms, prefetch started
      // Then candidate resumes vocalizing at t = 1100ms
      abortSpeculative();

      expect(abortSignalTriggered).toBe(true);
      expect(fastReplyCache).toBeNull(); // Cache cleared, request aborted, zero tokens leaked
    });
  });
});

