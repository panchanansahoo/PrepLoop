/**
 * Test Suite: annotationService
 * Coverage: CRUD operations, validation, sorting, bulk operations
 * Total: 15 tests
 */

import {
  addAnnotation,
  getAnnotations,
  updateAnnotation,
  deleteAnnotation,
  bulkAddAnnotations,
  getAnnotationStats,
  getMaxSeverityAnnotation,
} from '../services/annotationService.js';

describe('annotationService', () => {
  let testReviewId, testMentorId, testAnnotationId;

  beforeEach(async () => {
    testReviewId = 'test-review-' + Date.now();
    testMentorId = 'test-mentor-' + Date.now();
  });

  describe('addAnnotation', () => {
    test('should add a single annotation to a review', async () => {
      const annotation = {
        lineNumber: 15,
        codeSnippet: 'const x = arr.sort();',
        suggestionType: 'performance',
        suggestionText: 'This sort is inefficient. Consider using a heap.',
        severity: 'medium',
      };

      const result = await addAnnotation(testReviewId, testMentorId, annotation);
      expect(result).toBeDefined();
      expect(result.line_number).toBe(15);
      expect(result.suggestion_type).toBe('performance');
      expect(result.severity).toBe('medium');

      testAnnotationId = result.id;
    });

    test('should default severity to medium', async () => {
      const annotation = {
        lineNumber: 10,
        suggestionType: 'style',
        suggestionText: 'Consider using camelCase for variable names',
      };

      const result = await addAnnotation(testReviewId, testMentorId, annotation);
      expect(result.severity).toBe('medium');
    });

    test('should accept all valid suggestion types', async () => {
      const types = ['bug', 'style', 'performance', 'clarity', 'design'];

      for (const type of types) {
        const result = await addAnnotation(testReviewId, testMentorId, {
          lineNumber: 10,
          suggestionType: type,
          suggestionText: 'Test annotation',
        });
        expect(result.suggestion_type).toBe(type);
      }
    });

    test('should reject invalid suggestion type', async () => {
      await expect(
        addAnnotation(testReviewId, testMentorId, {
          lineNumber: 10,
          suggestionType: 'invalid',
          suggestionText: 'Test',
        })
      ).rejects.toThrow('Invalid suggestionType');
    });

    test('should reject invalid severity', async () => {
      await expect(
        addAnnotation(testReviewId, testMentorId, {
          lineNumber: 10,
          suggestionType: 'bug',
          suggestionText: 'Test',
          severity: 'critical',
        })
      ).rejects.toThrow('Invalid severity');
    });

    test('should require mentorId authorization', async () => {
      const otherMentorId = 'other-mentor-' + Date.now();

      await expect(
        addAnnotation(testReviewId, otherMentorId, {
          lineNumber: 10,
          suggestionType: 'bug',
          suggestionText: 'Test',
        })
      ).rejects.toThrow('Unauthorized');
    });

    test('should require all mandatory fields', async () => {
      await expect(
        addAnnotation(testReviewId, testMentorId, {
          lineNumber: 10,
          // missing suggestionType
          suggestionText: 'Test',
        })
      ).rejects.toThrow('Missing required');
    });
  });

  describe('getAnnotations', () => {
    test('should return all annotations for a review', async () => {
      // Add annotations
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test 1',
      });
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 20,
        suggestionType: 'style',
        suggestionText: 'Test 2',
      });

      const annotations = await getAnnotations(testReviewId, testMentorId);
      expect(Array.isArray(annotations)).toBe(true);
      expect(annotations.length).toBeGreaterThanOrEqual(2);
    });

    test('should sort by line number by default', async () => {
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 30,
        suggestionType: 'bug',
        suggestionText: 'Line 30',
      });
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Line 10',
      });

      const annotations = await getAnnotations(testReviewId, testMentorId, { sortBy: 'line' });
      expect(annotations[0].line_number).toBe(10);
      expect(annotations[1].line_number).toBe(30);
    });

    test('should sort by severity', async () => {
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test',
        severity: 'low',
      });
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 20,
        suggestionType: 'bug',
        suggestionText: 'Test',
        severity: 'high',
      });

      const annotations = await getAnnotations(testReviewId, testMentorId, {
        sortBy: 'severity',
      });
      expect(annotations[0].severity).toBe('high');
    });

    test('should filter by severity', async () => {
      const annotations = await getAnnotations(testReviewId, testMentorId, {
        filterSeverity: 'high',
      });
      expect(annotations.every((a) => a.severity === 'high')).toBe(true);
    });

    test('should filter by suggestion type', async () => {
      const annotations = await getAnnotations(testReviewId, testMentorId, {
        filterType: 'bug',
      });
      expect(annotations.every((a) => a.suggestion_type === 'bug')).toBe(true);
    });
  });

  describe('updateAnnotation', () => {
    test('should update annotation text', async () => {
      const anno = await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Original text',
      });

      const updated = await updateAnnotation(anno.id, testMentorId, {
        suggestion_text: 'Updated text',
      });
      expect(updated.suggestion_text).toBe('Updated text');
    });

    test('should update severity', async () => {
      const anno = await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test',
        severity: 'low',
      });

      const updated = await updateAnnotation(anno.id, testMentorId, {
        severity: 'high',
      });
      expect(updated.severity).toBe('high');
    });

    test('should update suggestion type', async () => {
      const anno = await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'style',
        suggestionText: 'Test',
      });

      const updated = await updateAnnotation(anno.id, testMentorId, {
        suggestion_type: 'bug',
      });
      expect(updated.suggestion_type).toBe('bug');
    });

    test('should reject unauthorized updates', async () => {
      const anno = await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test',
      });

      const otherMentorId = 'other-' + Date.now();
      await expect(
        updateAnnotation(anno.id, otherMentorId, { suggestion_text: 'Updated' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteAnnotation', () => {
    test('should delete an annotation', async () => {
      const anno = await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test',
      });

      const result = await deleteAnnotation(anno.id, testMentorId);
      expect(result.success).toBe(true);
    });

    test('should reject unauthorized deletion', async () => {
      const anno = await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test',
      });

      const otherMentorId = 'other-' + Date.now();
      await expect(deleteAnnotation(anno.id, otherMentorId)).rejects.toThrow('Unauthorized');
    });
  });

  describe('bulkAddAnnotations', () => {
    test('should add multiple annotations at once', async () => {
      const annotations = [
        {
          lineNumber: 10,
          suggestionType: 'bug',
          suggestionText: 'First annotation',
        },
        {
          lineNumber: 20,
          suggestionType: 'style',
          suggestionText: 'Second annotation',
        },
        {
          lineNumber: 30,
          suggestionType: 'performance',
          suggestionText: 'Third annotation',
        },
      ];

      const result = await bulkAddAnnotations(testReviewId, testMentorId, annotations);
      expect(result.count).toBe(3);
      expect(result.inserted.length).toBe(3);
    });

    test('should reject empty array', async () => {
      await expect(bulkAddAnnotations(testReviewId, testMentorId, [])).rejects.toThrow(
        'non-empty array'
      );
    });

    test('should validate all annotations before inserting', async () => {
      const annotations = [
        {
          lineNumber: 10,
          suggestionType: 'bug',
          suggestionText: 'Valid',
        },
        {
          lineNumber: 20,
          suggestionType: 'invalid',
          suggestionText: 'Invalid type',
        },
      ];

      await expect(bulkAddAnnotations(testReviewId, testMentorId, annotations)).rejects.toThrow(
        'Invalid suggestionType'
      );
    });
  });

  describe('getAnnotationStats', () => {
    test('should return annotation statistics', async () => {
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Test',
        severity: 'high',
      });
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 20,
        suggestionType: 'style',
        suggestionText: 'Test',
        severity: 'low',
      });

      const stats = await getAnnotationStats(testReviewId);
      expect(stats.total).toBe(2);
      expect(stats.byType.bug).toBe(1);
      expect(stats.byType.style).toBe(1);
      expect(stats.bySeverity.high).toBe(1);
      expect(stats.bySeverity.low).toBe(1);
    });

    test('should return zero counts for empty reviews', async () => {
      const emptyReviewId = 'empty-' + Date.now();
      const stats = await getAnnotationStats(emptyReviewId);
      expect(stats.total).toBe(0);
    });
  });

  describe('getMaxSeverityAnnotation', () => {
    test('should return highest severity annotation', async () => {
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 10,
        suggestionType: 'bug',
        suggestionText: 'Medium severity',
        severity: 'medium',
      });
      await addAnnotation(testReviewId, testMentorId, {
        lineNumber: 20,
        suggestionType: 'bug',
        suggestionText: 'High severity',
        severity: 'high',
      });

      const result = await getMaxSeverityAnnotation(testReviewId);
      expect(result.severity).toBe('high');
    });

    test('should return null for review with no annotations', async () => {
      const emptyReviewId = 'empty-' + Date.now();
      const result = await getMaxSeverityAnnotation(emptyReviewId);
      expect(result).toBeNull();
    });
  });
});
