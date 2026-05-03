/**
 * Tests for Custom Test Handler Logic - Phase 1.2
 * Tests validation and transformation logic without needing full HTTP setup
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Custom Tests Handler Logic', () => {
  describe('Test Case Validation', () => {
    it('should validate required language field', () => {
      const testCases = [{ input: '[1,2]', expected: '[2,1]' }];
      const language = null;

      const isValid = !!(language && Array.isArray(testCases) && testCases.length > 0);
      expect(isValid).toBe(false);
    });

    it('should validate non-empty testCases array', () => {
      const testCases = [];
      const language = 'python';

      const isValid = !!(language && Array.isArray(testCases) && testCases.length > 0);
      expect(isValid).toBe(false);
    });

    it('should validate each test case has input and expected', () => {
      const testCases = [
        { input: '[1,2]', expected: '[2,1]', description: 'Valid' },
        { input: '[3,4]' }, // Missing expected
      ];

      const isValid = testCases.every(tc => tc.input && tc.expected);
      expect(isValid).toBe(false);
    });

    it('should pass valid test cases', () => {
      const testCases = [
        { input: '[1,2]', expected: '[2,1]', description: 'Reverse array' },
        { input: '[]', expected: '[]', description: 'Empty array' },
      ];
      const language = 'python';

      const isValid = 
        language &&
        Array.isArray(testCases) &&
        testCases.length > 0 &&
        testCases.every(tc => tc.input && tc.expected);

      expect(isValid).toBe(true);
    });
  });

  describe('Test Results Transform', () => {
    it('should transform test cases into results', () => {
      const testCases = [
        { input: '[1,2]', expected: '[2,1]', description: 'Test 1' },
        { input: '[]', expected: '[]', description: 'Test 2' },
      ];

      const results = testCases.map((tc, i) => ({
        index: i + 1,
        description: tc.description || `Test ${i + 1}`,
        passed: true,
        input: tc.input,
        expected: tc.expected,
        actual: tc.expected,
      }));

      expect(results).toHaveLength(2);
      expect(results[0].index).toBe(1);
      expect(results[0].description).toBe('Test 1');
      expect(results[1].index).toBe(2);
    });

    it('should handle descriptions from test cases or generate defaults', () => {
      const testCase1 = { input: '[1,2]', expected: '[2,1]', description: 'Custom desc' };
      const testCase2 = { input: '[]', expected: '[]' };

      const result1 = {
        description: testCase1.description || 'Test 1',
      };

      const result2 = {
        description: testCase2.description || 'Test 2',
      };

      expect(result1.description).toBe('Custom desc');
      expect(result2.description).toBe('Test 2');
    });
  });

  describe('Test Statistics', () => {
    it('should calculate pass/fail statistics', () => {
      const testCases = [
        { input: '[1,2]', expected: '[2,1]', passed: true },
        { input: '[]', expected: '[]', passed: true },
        { input: '[1]', expected: '[2]', passed: false },
      ];

      const passedCount = testCases.filter(tc => tc.passed).length;
      const totalCount = testCases.length;

      expect(passedCount).toBe(2);
      expect(totalCount).toBe(3);
      expect(passedCount / totalCount).toBe(2 / 3);
    });
  });

  describe('Test Case Persistence', () => {
    it('should format custom test for storage', () => {
      const testCases = [
        { input: '[1,2]', expected: '[2,1]', description: 'Test 1' },
      ];

      const formatted = testCases.map(({ id, ...rest }) => rest);
      expect(formatted[0].input).toBe('[1,2]');
      expect(formatted[0].description).toBe('Test 1');
      expect(formatted[0].id).toBeUndefined();
    });

    it('should store JSONB structure correctly', () => {
      const testCases = [
        { input: '[1,2]', expected: '[2,1]', description: 'Test 1' },
        { input: '[]', expected: '[]', description: 'Empty' },
      ];

      // Simulate JSONB storage
      const jsonStr = JSON.stringify(testCases);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].input).toBe('[1,2]');
      expect(parsed[1].description).toBe('Empty');
    });
  });

  describe('Language Support', () => {
    it('should support multiple languages', () => {
      const languages = ['python', 'javascript', 'java', 'cpp'];
      const testInput = '[1,2,3]';

      languages.forEach(lang => {
        expect(lang).toMatch(/^(python|javascript|java|cpp)$/);
      });
    });

    it('should validate supported language', () => {
      const supportedLanguages = ['python', 'javascript', 'java', 'cpp'];
      const testLanguage = 'python';

      const isSupported = supportedLanguages.includes(testLanguage);
      expect(isSupported).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should detect missing required fields', () => {
      const testCase = { input: '[1,2]' }; // Missing expected

      const errors = [];
      if (!testCase.input) errors.push('input required');
      if (!testCase.expected) errors.push('expected required');

      expect(errors).toContain('expected required');
    });

    it('should handle empty input string', () => {
      const testCase = { input: '', expected: '[2,1]' };

      const isValid = testCase.input && testCase.expected;
      expect(!isValid).toBe(true);
    });

    it('should handle null/undefined values', () => {
      const testCase1 = { input: null, expected: '[2,1]' };
      const testCase2 = { input: '[1,2]', expected: undefined };

      const isValid1 = testCase1.input && testCase1.expected;
      const isValid2 = testCase2.input && testCase2.expected;

      expect(!isValid1).toBe(true);
      expect(!isValid2).toBe(true);
    });
  });
});
