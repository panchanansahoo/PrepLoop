import { describe, expect, it } from 'vitest';
import { INTERVIEW_SETUP_TYPES } from './aiInterviewSetupTypes';

describe('AIInterviewPage', () => {
  it('keeps HR Round in the setup flow', () => {
    expect(INTERVIEW_SETUP_TYPES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'hr',
          title: 'HR Round',
        }),
      ])
    );
  });
});
