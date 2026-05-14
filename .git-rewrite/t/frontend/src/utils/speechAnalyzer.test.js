import { describe, it, expect, beforeEach } from 'vitest';
import SpeechAnalyzer from './speechAnalyzer';

describe('SpeechAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    // Re-initialize for isolated test runs
    analyzer = new SpeechAnalyzer();
  });

  describe('Empty and reset states', () => {
    it('should return waiting stats when empty transcript is provided', () => {
      const result = analyzer.analyze('', 10);
      expect(result.wordCount).toBe(0);
      expect(result.wpm).toBe(0);
      expect(result.paceStatus).toBe('waiting');
    });

    it('should reset properly', () => {
      analyzer.analyze('This is a test um', 10);
      analyzer.reset();
      const emptyResult = analyzer.analyze('', 0);
      expect(emptyResult.wordCount).toBe(0);
      expect(analyzer.totalFillers).toBe(0);
    });
  });

  describe('Pace (WPM) calculations', () => {
    it('should calculate WPM accurately', () => {
      // 10 words in 10 seconds = 60 WPM
      const result = analyzer.analyze('One two three four five six seven eight nine ten', 10);
      expect(result.wpm).toBe(60);
      expect(result.paceStatus).toBe('slow');
    });

    it('should recognize excellent pace', () => {
      // 25 words in 10 seconds = 150 WPM (should trigger 'excellent' pacing)
      const transcript = Array(25).fill('word').join(' ');
      const result = analyzer.analyze(transcript, 10);
      expect(result.wpm).toBe(150);
      expect(result.paceStatus).toBe('excellent');
    });
  });

  describe('Filler word detection', () => {
    it('should correctly count filler words', () => {
      // "um", "like", "actually"
      const transcript = 'I um think that like we can actually do that um';
      const result = analyzer.analyze(transcript, 10);

      expect(result.totalFillers).toBe(4);
      expect(result.fillerCount['um']).toBe(2);
      expect(result.fillerCount['like']).toBe(1);
      expect(result.fillerCount['actually']).toBe(1);
    });

    it('should calculate filler rate accurately', () => {
      const transcript = 'I um think that like we can actually do that um';
      // Total words: 11
      // Fillers: 4
      // Rate: (4 / 11) * 100 = 36.36 -> rounded to 36.4
      const result = analyzer.analyze(transcript, 10);
      expect(result.fillerRate).toBe(36.4);
    });
  });

  describe('Scoring logic', () => {
    it('should penalize clarity and confidence scores for too many fillers', () => {
      // Create a long flawless transcript (no fillers, good wpm, good sentence len)
      const flawlessTranscript = Array(15).fill('This is a confident statement with perfect clarity').join('. ');
      const perfectResult = analyzer.analyze(flawlessTranscript, 45); // ~100 wpm

      // Create a heavily flawed transcript
      const flawedTranscript = Array(15).fill('um like actually').join('. ');
      const flawedResult = analyzer.analyze(flawedTranscript, 45); // ~60 WPM, 45 fillers

      // Assert perfect score is higher than flawed
      expect(perfectResult.clarityScore).toBeGreaterThan(flawedResult.clarityScore);
      expect(perfectResult.confidenceScore).toBeGreaterThan(flawedResult.confidenceScore);
    });
  });

  describe('Repeated words detection (TDD)', () => {
    it('should detect consecutive repeated words and penalize clarity score', () => {
      // 1 repeated pair: "the the"
      // 1 repeated trio: "I I I"
      const transcript = 'I I I think that the the approach is good for for us';
      const result = analyzer.analyze(transcript, 10);
      
      // Expected: 3 repititions identified ("I I" twice, "the the", "for for")
      expect(result.repeatedWordsCount).toBe(4);
      
      // Expected nudge
      const hasRepetitionNudge = result.nudges.some(n => n.type === 'repetition');
      expect(hasRepetitionNudge).toBe(true);
      
      // Compare to perfect clarity equivalent
      const perfectTranscript = 'I think that the approach is good for us';
      const perfectResult = analyzer.analyze(perfectTranscript, 10);
      expect(perfectResult.clarityScore).toBeGreaterThan(result.clarityScore);
    });
  });
});
