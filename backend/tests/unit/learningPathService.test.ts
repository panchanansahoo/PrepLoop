import { describe, it, expect } from 'vitest';
import { LearningPathService } from '../../services/learningPathService.ts';

describe('LearningPathService', () => {
  it('returns complete learning path catalog', () => {
    const catalog = LearningPathService.getCatalog();
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog.length).toBeGreaterThanOrEqual(8);

    const arrayTrack = catalog.find((c) => c.id === 'array');
    expect(arrayTrack).toBeDefined();
    expect(arrayTrack?.title).toBe('Array Interview Track');
  });

  it('returns path details with structured modules and lessons', () => {
    const arrayPath = LearningPathService.getPathDetail('array');
    expect(arrayPath).toBeDefined();
    expect(arrayPath?.modules?.length).toBeGreaterThan(0);
    expect(arrayPath?.outcomes?.length).toBeGreaterThan(0);
  });

  it('returns null for unknown learning path id', () => {
    const nonExistent = LearningPathService.getPathDetail('unknown-non-existent-track');
    expect(nonExistent).toBeNull();
  });
});

