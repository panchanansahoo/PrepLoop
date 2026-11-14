import { describe, it, expect } from 'vitest';
import { QUESTION_SET_TEMPLATES, getTemplateById } from '../data/questionSetTemplates.js';

describe('Question Set Presets & Templates', () => {
  it('provides all 4 industry-standard presets', () => {
    const ids = QUESTION_SET_TEMPLATES.map(t => t.id);
    expect(ids).toContain('frontend-react');
    expect(ids).toContain('backend-nodejs');
    expect(ids).toContain('system-design');
    expect(ids).toContain('behavioral-star');
    expect(QUESTION_SET_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it('contains complete metadata and valid interview types for each template', () => {
    const validInterviewTypes = ['technical', 'behavioral', 'system-design', 'coding'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    for (const template of QUESTION_SET_TEMPLATES) {
      expect(typeof template.id).toBe('string');
      expect(typeof template.title).toBe('string');
      expect(typeof template.description).toBe('string');
      expect(validInterviewTypes).toContain(template.interviewType);
      expect(validDifficulties).toContain(template.difficulty);
      expect(typeof template.roleName).toBe('string');
      expect(Array.isArray(template.questions)).toBe(true);
      expect(template.questions.length).toBeGreaterThanOrEqual(4);

      for (const q of template.questions) {
        expect(typeof q.question).toBe('string');
        expect(q.question.trim().length).toBeGreaterThan(15);
        expect(typeof q.context).toBe('string');
        expect(Array.isArray(q.expectedTopics)).toBe(true);
        expect(q.expectedTopics.length).toBeGreaterThan(0);
        expect(typeof q.timeLimit).toBe('number');
        expect(q.timeLimit).toBeGreaterThanOrEqual(60);
      }
    }
  });

  it('retrieves presets correctly by ID using getTemplateById', () => {
    const reactTemplate = getTemplateById('frontend-react');
    expect(reactTemplate).not.toBeNull();
    expect(reactTemplate.title).toContain('React');

    const nodeTemplate = getTemplateById('backend-nodejs');
    expect(nodeTemplate).not.toBeNull();
    expect(nodeTemplate.title).toContain('Node.js');

    const nonExistent = getTemplateById('non-existent-template');
    expect(nonExistent).toBeNull();
  });
});
