import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreCueToast from './ScoreCueToast';

describe('ScoreCueToast — Adaptive Difficulty & Micro-coaching', () => {
    it('renders step-up adaptive difficulty notification and does not suppress it', () => {
        const cue = {
            isDifficultyChange: true,
            isStepUp: true,
            text: 'Difficulty Stepped Up: HARD',
            color: 'purple',
            adaptiveNotification: 'Candidate demonstrating strong performance. Stepping up difficulty to challenge your depth.',
            questionIndex: 1, // normally suppressed for <= 2, but adaptive change MUST show
        };

        render(<ScoreCueToast cue={cue} onDismiss={vi.fn()} />);

        expect(screen.getByText('Difficulty Stepped Up: HARD')).toBeInTheDocument();
        expect(screen.getByText(/Stepping up difficulty to challenge your depth/i)).toBeInTheDocument();
    });

    it('renders scaffolding support notification with encouraging guidance', () => {
        const cue = {
            isDifficultyChange: true,
            isScaffolding: true,
            text: 'Scaffolding Support Active',
            color: 'cyan',
            adaptiveNotification: "We've broken this down into guided steps to help you build toward the complete solution.",
            questionIndex: 2,
        };

        render(<ScoreCueToast cue={cue} onDismiss={vi.fn()} />);

        expect(screen.getByText('Scaffolding Support Active')).toBeInTheDocument();
        expect(screen.getByText(/broken this down into guided steps/i)).toBeInTheDocument();
    });

    it('suppresses normal micro-coaching during questions 1 and 2 if not an adaptive difficulty change', () => {
        const normalEarlyCue = {
            level: 'strong',
            text: 'Strong Answer',
            score: 90,
            questionIndex: 1,
            strength: 'Great structure',
        };

        const { container } = render(<ScoreCueToast cue={normalEarlyCue} onDismiss={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders normal micro-coaching from question 3 onwards', () => {
        const lateCue = {
            level: 'good',
            text: 'Good Response',
            score: 78,
            questionIndex: 3,
            strength: 'Clear communication',
            improvement: 'Add metric-backed results',
        };

        render(<ScoreCueToast cue={lateCue} onDismiss={vi.fn()} />);

        expect(screen.getByText('Good Response')).toBeInTheDocument();
        expect(screen.getByText('78/100')).toBeInTheDocument();
        expect(screen.getByText(/Clear communication/i)).toBeInTheDocument();
        expect(screen.getByText(/Add metric-backed results/i)).toBeInTheDocument();
    });
});
