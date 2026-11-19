/* @vitest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InterviewResults from './InterviewResults';
import { authFetch } from '../../utils/authFetch';

vi.mock('../../utils/authFetch', () => ({
    authFetch: vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
}));

describe('InterviewResults Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(() => Promise.resolve()),
            },
        });
    });

    const mockAnalysisResult = {
        sessionId: 'test-session-123',
        overallScore: 82,
        performanceLabel: 'Good',
        stats: {
            duration: '18 min',
            questionsAnswered: 5,
            linesOfCode: 42,
            language: 'python',
        },
        categories: [
            { name: 'Communication', score: 8.5, color: '#10b981' },
            { name: 'Problem Solving', score: 8.0, color: '#3b82f6' },
            { name: 'Technical Depth', score: 8.2, color: '#8b5cf6' },
        ],
        strengths: ['Clear explanation of two-pointer strategy'],
        improvements: ['Deepen time complexity edge-case analysis'],
    };

    const mockConversation = [
        { role: 'interviewer', content: 'Tell me about yourself.', stageLabel: 'Warmup' },
        { role: 'candidate', content: 'I am a backend engineer.', stageLabel: 'Warmup' },
        { role: 'interviewer', content: 'How would you reverse a linked list?', stageLabel: 'Technical' },
        { role: 'candidate', content: 'Using three pointers: prev, curr, and next.', stageLabel: 'Technical' },
    ];

    it('renders overview tab with score and competency breakdown', () => {
        render(
            <MemoryRouter>
                <InterviewResults
                    analysisResult={mockAnalysisResult}
                    conversation={mockConversation}
                    interviewType="technical"
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/Competency Breakdown/i)).toBeInTheDocument();
        expect(screen.getByText(/Communication/i)).toBeInTheDocument();
        expect(screen.getByText(/8.5\/10/i)).toBeInTheDocument();
    });

    it('renders scoring anomaly alert banner when divergence exceeds 40 pts', () => {
        const anomalousResult = {
            ...mockAnalysisResult,
            scoringAnomalyDetected: true,
            categories: [
                { name: 'Communication', score: 9.5, color: '#10b981' },
                { name: 'Technical Depth', score: 3.5, color: '#ef4444' },
            ],
        };

        render(
            <MemoryRouter>
                <InterviewResults
                    analysisResult={anomalousResult}
                    conversation={mockConversation}
                    interviewType="technical"
                />
            </MemoryRouter>
        );

        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/Scoring anomaly detected/i);
    });

    it('renders stage dividers in Conversation Transcript tab', () => {
        render(
            <MemoryRouter>
                <InterviewResults
                    analysisResult={mockAnalysisResult}
                    conversation={mockConversation}
                    interviewType="technical"
                />
            </MemoryRouter>
        );

        // Switch to session details tab
        const sessionTabBtn = screen.getByRole('button', { name: /Session Details/i });
        fireEvent.click(sessionTabBtn);

        expect(screen.getByText(/Stage · Warmup/i)).toBeInTheDocument();
        expect(screen.getByText(/Stage · Technical/i)).toBeInTheDocument();
    });

    it('persists turn flags and survey on interaction', async () => {
        render(
            <MemoryRouter>
                <InterviewResults
                    analysisResult={mockAnalysisResult}
                    conversation={mockConversation}
                    interviewType="technical"
                />
            </MemoryRouter>
        );

        // Click copy pilot telemetry and survey
        const copyBtn = screen.getByRole('button', { name: /Copy Pilot Telemetry & Survey/i });
        fireEvent.click(copyBtn);

        expect(authFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/interview/test-session-123/survey'),
            expect.objectContaining({ method: 'POST' })
        );
        expect(authFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/interview/test-session-123/turn-flags'),
            expect.objectContaining({ method: 'POST' })
        );
    });
});
