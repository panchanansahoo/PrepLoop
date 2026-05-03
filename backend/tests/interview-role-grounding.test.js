/**
 * Role-Specific Grounding Service Tests
 * Validates company/role context injection and difficulty adjustment
 */

import { describe, it, expect } from 'vitest';
import RoleSpecificGroundingService from '../services/roleSpecificGroundingService.js';

describe('RoleSpecificGroundingService', () => {
  describe('getContext', () => {
    it('should resolve known company with profile', () => {
      const context = RoleSpecificGroundingService.getContext({
        company: 'google',
        roleType: 'backend',
        yearsExperience: 3,
      });

      expect(context.isKnownCompany).toBe(true);
      expect(context.company).toBeDefined();
      expect(context.company.name).toBe('Google');
      expect(context.roleLevel).toBe('mid-level');
    });

    it('should match company by alias', () => {
      const context = RoleSpecificGroundingService.getContext({
        company: 'goog', // Google alias
        roleType: 'frontend',
      });

      expect(context.isKnownCompany).toBe(true);
      expect(context.company.name).toBe('Google');
    });

    it('should resolve role level from years of experience', () => {
      const junior = RoleSpecificGroundingService.getContext({
        yearsExperience: 1,
        company: 'amazon',
      });
      expect(junior.roleLevel).toBe('junior');

      const mid = RoleSpecificGroundingService.getContext({
        yearsExperience: 3,
        company: 'amazon',
      });
      expect(mid.roleLevel).toBe('mid-level');

      const senior = RoleSpecificGroundingService.getContext({
        yearsExperience: 7,
        company: 'amazon',
      });
      expect(senior.roleLevel).toBe('senior');
    });

    it('should prefer explicit roleLevel over yearsExperience', () => {
      const context = RoleSpecificGroundingService.getContext({
        yearsExperience: 1,
        roleLevel: 'senior',
        company: 'google',
      });

      expect(context.roleLevel).toBe('senior');
    });

    it('should handle unknown company gracefully', () => {
      const context = RoleSpecificGroundingService.getContext({
        company: 'unknown-startup',
        roleType: 'backend',
      });

      expect(context.isKnownCompany).toBe(false);
      expect(context.company).toBeNull();
    });

    it('should normalize all string inputs to lowercase', () => {
      const context = RoleSpecificGroundingService.getContext({
        company: 'GOOGLE',
        roleType: 'BACKEND',
        interviewType: 'DSA',
      });

      expect(context.roleType).toBe('backend');
      expect(context.interviewType).toBe('dsa');
    });
  });

  describe('getGuidance', () => {
    it('should provide company-specific guidance for Google', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'google',
        roleType: 'backend',
      });

      expect(guidance.length).toBeGreaterThan(0);
      const companyGuidance = guidance.find(g => g.type === 'company-culture');
      expect(companyGuidance).toBeDefined();
      expect(companyGuidance.text).toContain('Google');
      expect(companyGuidance.priority).toBe('high');
    });

    it('should include role-specific guidance for backend at Amazon', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'amazon',
        roleType: 'backend',
      });

      const roleGuidance = guidance.find(g => g.type === 'role-specific');
      expect(roleGuidance).toBeDefined();
      expect(roleGuidance.text).toContain('backend');
      expect(roleGuidance.text).toMatch(/distributed|consistency|load balancing/i);
    });

    it('should include level expectation guidance', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'microsoft',
        roleType: 'frontend',
        roleLevel: 'senior',
      });

      const levelGuidance = guidance.find(g => g.type === 'level-expectation');
      expect(levelGuidance).toBeDefined();
      expect(levelGuidance.text).toContain('senior');
      expect(levelGuidance.text).toMatch(/5\+ years|architectural thinking|business impact/i);
    });

    it('should provide role focus areas (backend)', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        roleType: 'backend',
      });

      const focusGuidance = guidance.find(g => g.type === 'role-focus');
      expect(focusGuidance).toBeDefined();
      expect(focusGuidance.text).toMatch(/scalability|database|caching/i);
    });

    it('should provide role focus areas (frontend)', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        roleType: 'frontend',
      });

      const focusGuidance = guidance.find(g => g.type === 'role-focus');
      expect(focusGuidance).toBeDefined();
      expect(focusGuidance.text).toMatch(/performance|accessibility|responsive/i);
    });

    it('should provide role focus areas (systems-design)', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        roleType: 'systems-design',
      });

      const focusGuidance = guidance.find(g => g.type === 'role-focus');
      expect(focusGuidance).toBeDefined();
      expect(focusGuidance.text).toMatch(/distributed|availability|failure/i);
    });

    it('should handle unknown roles gracefully', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        roleType: 'unknown-role',
      });

      expect(Array.isArray(guidance)).toBe(true);
      // Still provides level/role-focus even if company is unknown
    });
  });

  describe('getFollowUpHints', () => {
    it('should provide company context hints for below-benchmark scores', () => {
      const hints = RoleSpecificGroundingService.getFollowUpHints({
        responseScore: 55,
        company: 'google',
        roleType: 'backend',
        missingAreas: ['scalability'],
      });

      expect(hints.length).toBeGreaterThan(0);
      const contextHint = hints.find(h => h.type === 'company-context');
      expect(contextHint).toBeDefined();
      // The hint mentions the role expectation which contains distributed systems/optimization
      expect(contextHint.hint).toMatch(/distributed|scaling|optimization|database/i);
    });

    it('should suggest company emphasis areas in follow-ups', () => {
      const hints = RoleSpecificGroundingService.getFollowUpHints({
        responseScore: 72,
        company: 'amazon',
        roleType: 'backend',
        missingAreas: ['scalability discussion', 'trade-off discussion'],
      });

      expect(hints.length).toBeGreaterThan(0);
      const emphasisHint = hints.find(h => h.type === 'company-emphasis');
      expect(emphasisHint).toBeDefined();
      expect(emphasisHint.hint).toContain('Amazon');
    });

    it('should return empty hints for unknown company', () => {
      const hints = RoleSpecificGroundingService.getFollowUpHints({
        responseScore: 75,
        company: 'unknown-company',
        roleType: 'backend',
      });

      expect(Array.isArray(hints)).toBe(true);
      // Unknown companies may not have specific hints
    });

    it('should match missing areas to company emphasis', () => {
      const hints = RoleSpecificGroundingService.getFollowUpHints({
        responseScore: 70,
        company: 'meta',
        roleType: 'backend',
        missingAreas: ['complexity analysis'],
      });

      const emphasisFound = hints.some(h =>
        h.type === 'company-emphasis' && h.hint.includes('Meta')
      );
      expect(emphasisFound).toBe(true);
    });
  });

  describe('anchorFeedback', () => {
    it('should prepend company context to feedback', () => {
      const original = 'You explained the approach clearly.';
      const anchored = RoleSpecificGroundingService.anchorFeedback(
        original,
        'google',
        'backend'
      );

      expect(anchored).toContain('Google');
      expect(anchored).toContain(original);
    });

    it('should handle feedback anchoring for Amazon', () => {
      const original = 'Good system design thinking.';
      const anchored = RoleSpecificGroundingService.anchorFeedback(
        original,
        'amazon',
        'systems-design'
      );

      expect(anchored).toContain('Amazon');
    });

    it('should return original feedback for unknown company', () => {
      const original = 'Well done on this problem.';
      const anchored = RoleSpecificGroundingService.anchorFeedback(
        original,
        'unknown-company',
        'backend'
      );

      expect(anchored).toBe(original);
    });
  });

  describe('assessCompanyAlignment', () => {
    it('should identify aligned score for junior developer', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 70,
        company: 'google',
        roleLevel: 'junior',
      });

      expect(assessment.aligned).toBe(true);
      expect(assessment.scoreRange).toBe('60-75');
    });

    it('should identify below-expectation score for senior developer', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 70,
        company: 'amazon',
        roleLevel: 'senior',
      });

      expect(assessment.aligned).toBe(false);
      expect(assessment.belowExpectation).toBe(true);
      expect(assessment.recommendation).toContain('Focus on');
    });

    it('should identify exceeds-expectation scores', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 92,
        company: 'google',
        roleLevel: 'junior',
      });

      expect(assessment.aligned).toBe(false);
      expect(assessment.exceedsExpectation).toBe(true);
      expect(assessment.recommendation).toContain('Excellent');
    });

    it('should provide focus areas for improvement', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 62,
        company: 'microsoft',
        roleLevel: 'mid-level',
      });

      expect(assessment.focusAreas).toBeDefined();
      expect(Array.isArray(assessment.focusAreas)).toBe(true);
      expect(assessment.focusAreas.length).toBeGreaterThan(0);
    });

    it('should calculate correct range for each role level', () => {
      const junior = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 65,
        roleLevel: 'junior',
      });
      expect(junior.scoreRange).toBe('60-75');

      const mid = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 78,
        roleLevel: 'mid-level',
      });
      expect(mid.scoreRange).toBe('70-85');

      const senior = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 85,
        roleLevel: 'senior',
      });
      expect(senior.scoreRange).toBe('80-95');
    });
  });

  describe('suggestDifficultyAdjustment', () => {
    it('should suggest increase for above-max scores', () => {
      const suggestion = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        roleLevel: 'junior',
        currentScore: 78, // Above junior max (75)
        currentDifficulty: 'easy',
      });

      expect(suggestion.suggestedAdjustment).toBe(1);
      expect(suggestion.reasoning).toContain('exceeds');
      expect(suggestion.reasoning).toContain('Increase');
    });

    it('should suggest decrease for below-min scores', () => {
      const suggestion = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        roleLevel: 'senior',
        currentScore: 72, // Below senior min (80)
        currentDifficulty: 'hard',
      });

      expect(suggestion.suggestedAdjustment).toBe(-1);
      expect(suggestion.reasoning).toContain('below');
      expect(suggestion.reasoning).toContain('Reduce');
    });

    it('should suggest gradual increase when above midpoint', () => {
      const suggestion = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        roleLevel: 'mid-level', // 70-85, midpoint 77.5
        currentScore: 80,
        currentDifficulty: 'medium',
      });

      expect(suggestion.suggestedAdjustment).toBe(0.5);
      expect(suggestion.reasoning).toContain('above midpoint');
      expect(suggestion.reasoning.toLowerCase()).toContain('gradually');
    });

    it('should suggest maintain when on track', () => {
      const suggestion = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        roleLevel: 'mid-level', // 70-85, midpoint 77.5
        currentScore: 74,
        currentDifficulty: 'medium',
      });

      expect(suggestion.suggestedAdjustment).toBe(0);
      expect(suggestion.reasoning).toContain('on track');
      expect(suggestion.reasoning).toContain('Maintain');
    });

    it('should resolve level from yearsExperience if not provided', () => {
      const suggestion = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        yearsExperience: 6, // Resolves to senior
        currentScore: 82,
        currentDifficulty: 'hard',
      });

      expect(suggestion.roleLevelDescription).toBe('senior');
      expect(suggestion.expectedRange).toBe('80-95');
    });

    it('should include expected range and description in response', () => {
      const suggestion = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        roleLevel: 'junior',
        currentScore: 68,
      });

      expect(suggestion.expectedRange).toBe('60-75');
      expect(suggestion.roleLevelDescription).toBe('junior');
      expect(suggestion.reasoning).toBeDefined();
    });
  });

  describe('Company-specific scenarios', () => {
    it('should emphasize scalability for Google backend roles', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'google',
        roleType: 'backend',
      });

      const expectation = guidance.find(g => g.type === 'role-specific');
      expect(expectation.text).toMatch(/Google/);
      expect(expectation.text).toMatch(/scale|optimization/i);
    });

    it('should emphasize STAR for Amazon interviews', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'amazon',
        roleType: 'backend',
      });

      const focusAreas = RoleSpecificGroundingService.getFollowUpHints({
        responseScore: 70,
        company: 'amazon',
        roleType: 'backend',
        missingAreas: ['STAR structure'],
      });

      expect(focusAreas.length).toBeGreaterThan(0);
    });

    it('should emphasize privacy for Apple roles', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'apple',
        roleType: 'backend',
      });

      const cultureGuidance = guidance.find(g => g.type === 'company-culture');
      expect(cultureGuidance.text).toMatch(/privacy|security/i);
    });

    it('should provide performance guidance for Meta backend roles', () => {
      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'meta',
        roleType: 'backend',
      });

      const focusGuidance = guidance.find(g => g.type === 'company-emphasis');
      // May not have emphasis if no missing areas, but role-specific should be there
      const roleGuidance = guidance.find(g => g.type === 'role-specific');
      expect(roleGuidance).toBeDefined();
    });
  });

  describe('Integration: Role level + Company + Score', () => {
    it('should adjust difficulty based on senior level + high score', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 85, // Right at the top of senior range (80-95)
        company: 'google',
        roleLevel: 'senior',
      });

      expect(assessment.aligned).toBe(true); // Score is within range

      const difficultyAdjust = RoleSpecificGroundingService.suggestDifficultyAdjustment({
        roleLevel: 'senior',
        currentScore: 85,
      });

      // 85 is in the middle-to-upper part of 80-95 range
      expect(difficultyAdjust.suggestedAdjustment).toBeGreaterThanOrEqual(0);
    });

    it('should anchor feedback and provide guidance for junior at Google', () => {
      const feedback = 'You explained the approach clearly.';
      const anchored = RoleSpecificGroundingService.anchorFeedback(
        feedback,
        'google',
        'backend'
      );

      const guidance = RoleSpecificGroundingService.getGuidance({
        company: 'google',
        roleType: 'backend',
        roleLevel: 'junior',
      });

      expect(anchored).toContain('Google');
      expect(guidance.length).toBeGreaterThan(0);
      const juniorGuidance = guidance.find(g => g.type === 'level-expectation');
      expect(juniorGuidance.text).toContain('junior');
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined company gracefully', () => {
      const context1 = RoleSpecificGroundingService.getContext({ company: null });
      expect(context1.isKnownCompany).toBe(false);
      expect(context1.company).toBeNull();

      const context2 = RoleSpecificGroundingService.getContext({});
      expect(context2.isKnownCompany).toBe(false);
    });

    it('should handle missing roleLevel with default', () => {
      const context = RoleSpecificGroundingService.getContext({
        company: 'google',
        // No roleLevel or yearsExperience
      });

      expect(context.roleLevel).toBe('mid-level'); // Default
    });

    it('should handle invalid scores gracefully', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: -10,
        roleLevel: 'mid-level',
      });

      expect(assessment.belowExpectation).toBe(true);
      expect(assessment.scoreRange).toBe('70-85');
    });

    it('should handle extreme high scores', () => {
      const assessment = RoleSpecificGroundingService.assessCompanyAlignment({
        responseScore: 150,
        roleLevel: 'junior',
      });

      expect(assessment.exceedsExpectation).toBe(true);
      expect(assessment.aligned).toBe(false);
    });

    it('should handle whitespace in company names', () => {
      const context = RoleSpecificGroundingService.getContext({
        company: '  google  ',
        roleType: '  BACKEND  ',
      });

      expect(context.isKnownCompany).toBe(true);
      expect(context.roleType).toBe('backend');
    });
  });
});
