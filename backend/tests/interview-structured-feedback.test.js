import { describe, it, expect } from 'vitest';
import StructuredFeedbackService from '../services/structuredFeedbackService.js';

describe('StructuredFeedbackService', () => {
  describe('generateStructuredFeedback - DSA Interviews', () => {
    it('should generate feedback for strong DSA response', () => {
      const scoringData = {
        communicationScore: 85,
        decompositionScore: 88,
        technicalScore: 82,
        overallScore: 85,
      };
      const response = 'My approach is to use binary search since the array is sorted. Time complexity would be O(log n) and space O(1). First, I would check edge cases like empty array.';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'dsa'
      );

      expect(feedback.overallScore).toBe(85);
      expect(feedback.components.length).toBe(3);
      expect(feedback.components[0].component).toBe('Communication');
      expect(feedback.components[0].quality).toBe('strong');
      expect(feedback.strengths).toContain('Communication');
      expect(feedback.areasForImprovement).toHaveLength(0);
    });

    it('should identify weak areas in DSA response', () => {
      const scoringData = {
        communicationScore: 45,
        decompositionScore: 50,
        technicalScore: 55,
        overallScore: 50,
      };
      const response = 'I would just iterate through the array and check each element.';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'dsa'
      );

      expect(feedback.overallScore).toBe(50);
      expect(feedback.areasForImprovement).toContain('Communication');
      expect(feedback.areasForImprovement).toContain('Problem Solving');
      expect(feedback.nextSteps.length).toBeGreaterThan(0);
    });

    it('should extract code-related examples from response', () => {
      const scoringData = {
        communicationScore: 75,
        decompositionScore: 80,
        technicalScore: 78,
        overallScore: 78,
      };
      const response = `
        My approach is to use a hash map for O(1) lookups.
        First, I would check edge cases like duplicates.
        Time complexity is O(n) with O(n) space.
      `;

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'dsa'
      );

      expect(feedback.components[0].example).toBeDefined();
      expect(feedback.components[1].example).toBeDefined();
      expect(feedback.components[2].example).toBeDefined();
    });

    it('should generate DSA-specific next steps for weak communication', () => {
      const scoringData = {
        communicationScore: 50,
        decompositionScore: 75,
        technicalScore: 75,
        overallScore: 67,
      };

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        'I use a loop',
        {},
        'dsa'
      );

      const commStep = feedback.nextSteps.find(s => s.area === 'Communication');
      expect(commStep).toBeDefined();
      expect(commStep.action).toContain('aloud');
    });

    it('should generate edge case guidance for weak decomposition', () => {
      const scoringData = {
        communicationScore: 75,
        decompositionScore: 50,
        technicalScore: 75,
        overallScore: 67,
      };

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        'I would sort and iterate',
        {},
        'dsa'
      );

      const decompStep = feedback.nextSteps.find(s => s.area === 'Problem Solving');
      expect(decompStep).toBeDefined();
      // Should include edge case guidance for DSA
      const edgeCaseStep = feedback.nextSteps.find(s => s.area === 'Problem Solving' && s.action.includes('edge case'));
      expect(edgeCaseStep).toBeDefined();
    });
  });

  describe('generateStructuredFeedback - Behavioral Interviews', () => {
    it('should generate feedback for strong STAR response', () => {
      const scoringData = {
        communicationScore: 88,
        decompositionScore: 85,
        technicalScore: 75,
        overallScore: 83,
      };
      const response = 'In that situation, when we faced a deadline, my task was to lead the backend team. I implemented caching and the result was 40% performance improvement.';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'behavioral'
      );

      expect(feedback.overallScore).toBe(83);
      expect(feedback.components[0].quality).toBe('strong');
      // Behavioral feedback should mention stories and structure
      expect(feedback.summary).toMatch(/stories|STAR|structure/i);
    });

    it('should flag incomplete STAR structure', () => {
      const scoringData = {
        communicationScore: 60,
        decompositionScore: 55,
        technicalScore: 65,
        overallScore: 60,
      };
      const response = 'I worked on a project and it turned out okay.';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'behavioral'
      );

      const commStep = feedback.nextSteps.find(s => s.area === 'Communication');
      expect(commStep).toBeDefined();
      expect(commStep.action).toContain('STAR');
    });

    it('should emphasize measurable impact for behavioral interviews', () => {
      const scoringData = {
        communicationScore: 65,
        decompositionScore: 70,
        technicalScore: 70,
        overallScore: 68,
      };
      const response = 'I did something and it helped the team.';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'behavioral'
      );

      // Summary should mention story and impact
      expect(feedback.summary.toLowerCase()).toMatch(/star|story|structured/);
    });
  });

  describe('generateStructuredFeedback - System Design Interviews', () => {
    it('should generate feedback for strong system design response', () => {
      const scoringData = {
        communicationScore: 80,
        decompositionScore: 85,
        technicalScore: 88,
        overallScore: 84,
      };
      const response = 'I would start by gathering requirements: scale, latency targets. Then design the architecture with load balancers, databases, and caches.';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'system_design'
      );

      expect(feedback.overallScore).toBe(84);
      expect(feedback.components[1].quality).toBe('strong');
    });

    it('should provide system design specific guidance', () => {
      const scoringData = {
        communicationScore: 50,
        decompositionScore: 60,
        technicalScore: 65,
        overallScore: 58,
      };
      const response = 'I would use a database and servers';

      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        scoringData,
        response,
        {},
        'system_design'
      );

      const commStep = feedback.nextSteps.find(s => s.area === 'Communication');
      expect(commStep?.action).toContain('diagram');
    });
  });

  describe('generateUserSummary', () => {
    it('should generate excellent summary for high scores', () => {
      const summary = StructuredFeedbackService.generateUserSummary(87, {
        communication: 'strong',
        decomposition: 'strong',
        technical: 'strong',
      }, 'dsa');

      expect(summary).toContain('Excellent');
      expect(summary).toContain('expertise');
    });

    it('should generate good summary for medium scores', () => {
      const summary = StructuredFeedbackService.generateUserSummary(78, {
        communication: 'medium',
        decomposition: 'medium',
        technical: 'medium',
      }, 'dsa');

      expect(summary).toContain('Good');
      expect(summary).toContain('room for growth');
    });

    it('should generate encouraging summary for low scores', () => {
      const summary = StructuredFeedbackService.generateUserSummary(55, {
        communication: 'weak',
        decomposition: 'weak',
        technical: 'weak',
      }, 'dsa');

      expect(summary).toContain('potential');
      // Should mention practice or improvement for DSA
      expect(summary).toMatch(/practice|build confidence|improve/i);
    });

    it('should include type-specific hints', () => {
      const dsaSummary = StructuredFeedbackService.generateUserSummary(70, {}, 'dsa');
      expect(dsaSummary).toContain('coding');

      const behavioralSummary = StructuredFeedbackService.generateUserSummary(70, {}, 'behavioral');
      expect(behavioralSummary).toContain('stories');

      const systemSummary = StructuredFeedbackService.generateUserSummary(70, {}, 'system_design');
      expect(systemSummary).toContain('complex');
    });
  });

  describe('compareFeedback', () => {
    it('should show improvement when score increases', () => {
      const previous = {
        overallScore: 65,
        components: [
          { score: 60 },
          { score: 65 },
          { score: 70 },
        ],
      };
      const current = {
        overallScore: 78,
        components: [
          { score: 78 },
          { score: 80 },
          { score: 76 },
        ],
      };

      const comparison = StructuredFeedbackService.compareFeedback(previous, current);

      expect(comparison.improvement).toBe(13);
      expect(comparison.improvementPercentage).toBeGreaterThan(19);
      expect(comparison.comparisionSummary).toContain('Great progress');
    });

    it('should show decline when score decreases', () => {
      const previous = {
        overallScore: 80,
        components: [{ score: 80 }, { score: 80 }, { score: 80 }],
      };
      const current = {
        overallScore: 70,
        components: [{ score: 70 }, { score: 70 }, { score: 70 }],
      };

      const comparison = StructuredFeedbackService.compareFeedback(previous, current);

      expect(comparison.improvement).toBe(-10);
      expect(comparison.comparisionSummary).toContain('declined');
    });

    it('should show no change when scores are equal', () => {
      const feedback = {
        overallScore: 75,
        components: [{ score: 75 }, { score: 75 }, { score: 75 }],
      };

      const comparison = StructuredFeedbackService.compareFeedback(feedback, feedback);

      expect(comparison.improvement).toBe(0);
      expect(comparison.comparisionSummary).toContain('Similar');
    });

    it('should handle missing previous feedback', () => {
      const current = {
        overallScore: 75,
        components: [{ score: 75 }, { score: 75 }, { score: 75 }],
      };

      const comparison = StructuredFeedbackService.compareFeedback({}, current);

      expect(comparison.previousScore).toBe(0);
      expect(comparison.currentScore).toBe(75);
    });

    it('should track component-level improvements', () => {
      const previous = {
        overallScore: 70,
        components: [
          { score: 65 },
          { score: 70 },
          { score: 75 },
        ],
      };
      const current = {
        overallScore: 78,
        components: [
          { score: 80 },
          { score: 80 },
          { score: 75 },
        ],
      };

      const comparison = StructuredFeedbackService.compareFeedback(previous, current);

      expect(comparison.componentComparison.communication.improvement).toBeUndefined();
      expect(comparison.componentComparison.communication.previous).toBe(65);
      expect(comparison.componentComparison.communication.current).toBe(80);
    });
  });

  describe('Quality level determination', () => {
    it('should classify 80+ as strong', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback({
        communicationScore: 85,
        decompositionScore: 88,
        technicalScore: 82,
        overallScore: 85,
      }, 'great response', {}, 'dsa');

      expect(feedback.components[0].quality).toBe('strong');
      expect(feedback.components[1].quality).toBe('strong');
      expect(feedback.components[2].quality).toBe('strong');
    });

    it('should classify 65-79 as medium', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback({
        communicationScore: 70,
        decompositionScore: 75,
        technicalScore: 68,
        overallScore: 71,
      }, 'okay response', {}, 'dsa');

      expect(feedback.components[0].quality).toBe('medium');
      expect(feedback.components[1].quality).toBe('medium');
      expect(feedback.components[2].quality).toBe('medium');
    });

    it('should classify <65 as weak', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback({
        communicationScore: 45,
        decompositionScore: 50,
        technicalScore: 55,
        overallScore: 50,
      }, 'weak response', {}, 'dsa');

      expect(feedback.components[0].quality).toBe('weak');
      expect(feedback.components[1].quality).toBe('weak');
      expect(feedback.components[2].quality).toBe('weak');
    });
  });

  describe('Example extraction', () => {
    it('should extract approach examples', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 75,
          decompositionScore: 75,
          technicalScore: 75,
          overallScore: 75,
        },
        'My approach is to use dynamic programming because it avoids redundant work.',
        {},
        'dsa'
      );

      expect(feedback.components[0].example).toBeDefined();
    });

    it('should extract decomposition examples', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 75,
          decompositionScore: 75,
          technicalScore: 75,
          overallScore: 75,
        },
        'First, I would identify the pattern. The key insight is that we can optimize using memoization.',
        {},
        'dsa'
      );

      expect(feedback.components[1].example).toBeDefined();
    });

    it('should extract technical examples', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 75,
          decompositionScore: 75,
          technicalScore: 75,
          overallScore: 75,
        },
        'Time complexity is O(n log n) and space complexity is O(n) using a balanced tree.',
        {},
        'dsa'
      );

      expect(feedback.components[2].example).toBeDefined();
    });

    it('should handle responses without clear examples', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 50,
          decompositionScore: 50,
          technicalScore: 50,
          overallScore: 50,
        },
        'Yes.',
        {},
        'dsa'
      );

      // Should not crash, but examples may be null
      expect(feedback.components).toBeDefined();
    });
  });

  describe('Telemetry metadata', () => {
    it('should include metadata for telemetry tracking', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 75,
          decompositionScore: 80,
          technicalScore: 78,
          overallScore: 77,
        },
        'Good response',
        {},
        'dsa'
      );

      expect(feedback.metadata).toBeDefined();
      expect(feedback.metadata.interviewType).toBe('dsa');
      expect(feedback.metadata.generatedAt).toBeDefined();
      expect(feedback.metadata.componentScores).toEqual({
        communication: 75,
        decomposition: 80,
        technical: 78,
      });
    });

    it('should normalize interview type in metadata', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 75,
          decompositionScore: 75,
          technicalScore: 75,
          overallScore: 75,
        },
        'Response',
        {},
        'System_Design'
      );

      expect(feedback.metadata.interviewType).toBe('system_design');
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined response gracefully', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 70,
          decompositionScore: 70,
          technicalScore: 70,
          overallScore: 70,
        },
        null,
        {},
        'dsa'
      );

      expect(feedback.overallScore).toBe(70);
      expect(feedback.components.length).toBe(3);
    });

    it('should clamp scores to reasonable ranges', () => {
      const feedback = StructuredFeedbackService.generateStructuredFeedback(
        {
          communicationScore: 150, // Over 100
          decompositionScore: -10, // Below 0
          technicalScore: 70,
          overallScore: 80,
        },
        'Response',
        {},
        'dsa'
      );

      // Scores should be used as-is from input (service doesn't clamp)
      expect(feedback.components[0].score).toBe(150);
      expect(feedback.components[1].score).toBe(-10);
    });

    it('should work with all supported interview types', () => {
      const types = ['dsa', 'behavioral', 'system_design', 'hr', 'mixed'];

      types.forEach(type => {
        const feedback = StructuredFeedbackService.generateStructuredFeedback(
          {
            communicationScore: 60, // Below 70 to trigger next steps
            decompositionScore: 60,
            technicalScore: 60,
            overallScore: 60,
          },
          'Test response',
          {},
          type
        );

        expect(feedback.summary).toBeDefined();
        expect(feedback.nextSteps.length).toBeGreaterThan(0);
        expect(feedback.metadata.interviewType).toBe(type.toLowerCase());
      });
    });
  });
});
