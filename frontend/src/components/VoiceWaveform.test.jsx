import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VoiceWaveform from './VoiceWaveform';

describe('VoiceWaveform', () => {
    it('maps the state prop to the corresponding state class', () => {
        const { container } = render(<VoiceWaveform state="speaking" bars={[0.25, 0.5, 0.75]} />);

        expect(container.firstElementChild?.className).toContain('vw-speaking');
    });
});
