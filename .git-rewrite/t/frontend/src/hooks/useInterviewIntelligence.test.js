import { describe, it, expect } from 'vitest';
import { detectFillersInText, normalizeConfidence } from './useInterviewIntelligence';

describe('detectFillersInText', () => {
  it('detects single-word fillers', () => {
    const result = detectFillersInText('um I think uh this is like good');
    expect(result.total).toBe(3);
    expect(result.counts.um).toBe(1);
    expect(result.counts.uh).toBe(1);
    expect(result.counts.like).toBe(1);
  });

  it('detects multi-word fillers (you know, sort of)', () => {
    const result = detectFillersInText('you know it was sort of okay');
    expect(result.total).toBe(2);
    expect(result.counts['you know']).toBe(1);
    expect(result.counts['sort of']).toBe(1);
  });

  it('detects filler words and phrases in a sentence', () => {
    const result = detectFillersInText('Um I was like, you know, basically trying to improve it.');
    expect(result.total).toBeGreaterThanOrEqual(4);
    expect(result.counts.um).toBe(1);
    expect(result.counts.like).toBe(1);
    expect(result.counts['you know']).toBe(1);
  });

  it('returns zero counts for clean speech', () => {
    const result = detectFillersInText('I built a distributed cache using Redis');
    expect(result.total).toBe(0);
  });

  it('handles empty/null input', () => {
    expect(detectFillersInText('').total).toBe(0);
    expect(detectFillersInText(null).total).toBe(0);
    expect(detectFillersInText(undefined).total).toBe(0);
  });

  it('is case-insensitive', () => {
    const result = detectFillersInText('UM Like BASICALLY');
    expect(result.total).toBe(3);
    expect(result.counts.um).toBe(1);
    expect(result.counts.like).toBe(1);
    expect(result.counts.basically).toBe(1);
  });

  it('strips punctuation before counting', () => {
    const result = detectFillersInText('um, like, you know?');
    expect(result.total).toBe(3);
  });

  it('counts repeated fillers correctly', () => {
    const result = detectFillersInText('um um um like like');
    expect(result.total).toBe(5);
    expect(result.counts.um).toBe(3);
    expect(result.counts.like).toBe(2);
  });
});

describe('normalizeConfidence', () => {
  it('converts 0-1 float to 0-100 integer', () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(0.5)).toBe(50);
    expect(normalizeConfidence(0.7)).toBe(70);
    expect(normalizeConfidence(0.85)).toBe(85);
    expect(normalizeConfidence(1)).toBe(100);
  });

  it('clamps values above 1', () => {
    expect(normalizeConfidence(1.5)).toBe(100);
    expect(normalizeConfidence(2)).toBe(100);
  });

  it('clamps negative values', () => {
    expect(normalizeConfidence(-0.3)).toBe(0);
  });

  it('handles NaN / undefined / non-numeric', () => {
    expect(normalizeConfidence(NaN)).toBe(0);
    expect(normalizeConfidence(undefined)).toBe(0);
    expect(normalizeConfidence('abc')).toBe(0);
  });
});
