import { InterviewStateMachineService } from './interviewStateMachine.js';

export class InterviewOrchestratorService {
  static buildStagePlan(interviewType = 'dsa') {
    return InterviewStateMachineService.buildStagePlan(interviewType);
  }

  static buildInitialState(interviewType = 'dsa', difficulty = 'medium', companyFocus = null) {
    return InterviewStateMachineService.createInitialState(interviewType, difficulty, companyFocus);
  }

  static advanceState(state = {}) {
    return InterviewStateMachineService.advanceState(state);
  }

  static buildStageDirective(stage = 'intake', interviewType = 'dsa') {
    return InterviewStateMachineService.buildStageDirective(stage, interviewType);
  }
}
