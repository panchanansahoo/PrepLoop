import { describe, it, expect } from 'vitest';
import { InterviewStateMachineService } from '../../services/interviewStateMachine.js';

describe('InterviewStateMachineService', () => {
  describe('buildStagePlan', () => {
    it('builds valid stage plans for DSA, Behavioral, HR, and System Design', () => {
      const dsaPlan = InterviewStateMachineService.buildStagePlan('dsa');
      expect(Array.isArray(dsaPlan)).toBe(true);
      expect(dsaPlan[0].key).toBe('intake');

      const behavioralPlan = InterviewStateMachineService.buildStagePlan('behavioral');
      expect(behavioralPlan[2].label).toBe('Story Deep-Dive');

      const hrPlan = InterviewStateMachineService.buildStagePlan('hr');
      expect(Array.isArray(hrPlan)).toBe(true);
      expect(hrPlan.length).toBeGreaterThanOrEqual(5);
      expect(hrPlan.some(s => s.key === 'technical')).toBe(true);

      const sdPlan = InterviewStateMachineService.buildStagePlan('system_design');
      expect(Array.isArray(sdPlan)).toBe(true);
      expect(
        sdPlan.some(s => s.label.toLowerCase().includes('architecture') || s.label.toLowerCase().includes('design'))
      ).toBe(true);
    });
  });

  describe('Proportional Stage Transitions (13 Questions)', () => {
    it('advances stages accurately across a 13-question session', () => {
      const stateFor13 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 13);
      expect(stateFor13.stage).toBe('intake');
      expect(stateFor13.totalQuestions).toBe(13);

      const warmup13 = InterviewStateMachineService.advanceState({ ...stateFor13, turns: 1 });
      expect(warmup13.stage).toBe('warmup');

      const tech13 = InterviewStateMachineService.advanceState({ ...warmup13, turns: 3 });
      expect(tech13.stage).toBe('technical');

      const followup13 = InterviewStateMachineService.advanceState({ ...tech13, turns: 7 });
      expect(followup13.stage).toBe('followup');

      const challenge13 = InterviewStateMachineService.advanceState({ ...followup13, turns: 10 });
      expect(challenge13.stage).toBe('challenge');

      const feedback13 = InterviewStateMachineService.advanceState({ ...challenge13, turns: 12 });
      expect(feedback13.stage).toBe('feedback');
    });
  });

  describe('Compressed Stage Transitions (5 Questions)', () => {
    it('properly compresses stages for rapid 5-question sessions', () => {
      const stateFor5 = InterviewStateMachineService.createInitialState('dsa', 'medium', null, 5);
      expect(stateFor5.totalQuestions).toBe(5);

      const tech5 = InterviewStateMachineService.advanceState({ ...stateFor5, turns: 1 });
      expect(tech5.stage).toBe('technical');

      const followup5 = InterviewStateMachineService.advanceState({ ...tech5, turns: 3 });
      expect(followup5.stage).toBe('followup');

      const challenge5 = InterviewStateMachineService.advanceState({ ...followup5, turns: 4 });
      expect(challenge5.stage).toBe('challenge');

      const feedback5 = InterviewStateMachineService.advanceState({ ...challenge5, turns: 5 });
      expect(feedback5.stage).toBe('feedback');
    });
  });

  describe('Backward Compatibility & Stage Directives', () => {
    it('supports legacy state without totalQuestions', () => {
      const legacyState = InterviewStateMachineService.createInitialState('dsa', 'medium');
      const legacyTech = InterviewStateMachineService.advanceState({ ...legacyState, turns: 3 });
      expect(legacyTech.stage).toBe('technical');

      const legacyFeedback = InterviewStateMachineService.advanceState({ ...legacyTech, turns: 12 });
      expect(legacyFeedback.stage).toBe('feedback');
    });

    it('generates non-empty stage directives for HR and System Design', () => {
      const hrDirective = InterviewStateMachineService.buildStageDirective('technical', 'hr');
      expect(typeof hrDirective).toBe('string');
      expect(hrDirective.length).toBeGreaterThan(10);

      const sdDirective = InterviewStateMachineService.buildStageDirective('technical', 'system_design');
      expect(typeof sdDirective).toBe('string');
      expect(sdDirective.length).toBeGreaterThan(10);
    });
  });
});

