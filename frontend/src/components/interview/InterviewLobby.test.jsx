/* @vitest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InterviewLobby from './InterviewLobby';

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'candidate@example.com' },
    }),
}));

describe('InterviewLobby component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        class MockAudioContext {
            constructor() {
                this.state = 'running';
                this.currentTime = 0;
                this.destination = {};
            }
            async resume() {}
            async close() {}
            createOscillator() {
                return {
                    type: 'sine',
                    frequency: { setValueAtTime: vi.fn() },
                    connect: vi.fn(),
                    start: vi.fn(),
                    stop: vi.fn(),
                };
            }
            createGain() {
                return {
                    gain: {
                        setValueAtTime: vi.fn(),
                        exponentialRampToValueAtTime: vi.fn(),
                    },
                    connect: vi.fn(),
                };
            }
        }

        Object.defineProperty(window, 'AudioContext', {
            value: MockAudioContext,
            configurable: true,
            writable: true,
        });

        class MockRTCPeerConnection {}
        Object.defineProperty(window, 'RTCPeerConnection', {
            value: MockRTCPeerConnection,
            configurable: true,
            writable: true,
        });
    });

    const defaultProps = {
        setupStep: 5,
        setSetupStep: vi.fn(),
        experienceLevel: 'experienced',
        setExperienceLevel: vi.fn(),
        interviewType: 'technical',
        setInterviewType: vi.fn(),
        interviewerGender: 'female',
        setInterviewerGender: vi.fn(),
        targetRole: 'Full Stack Engineer',
        setTargetRole: vi.fn(),
        targetCompany: 'Google',
        setTargetCompany: vi.fn(),
        companySearch: '',
        setCompanySearch: vi.fn(),
        companyTab: 'all',
        setCompanyTab: vi.fn(),
        resumeFile: null,
        loading: false,
        savedSession: null,
        interviewer: { name: 'Sarah Chen', role: 'Staff Engineer' },
        formatTime: (s) => `${s}s`,
        onStartInterview: vi.fn(),
        onRestoreSession: vi.fn(),
        onClearSavedSession: vi.fn(),
        onResumeDragOver: vi.fn(),
        onResumeDragLeave: vi.fn(),
        onResumeDrop: vi.fn(),
        onResumeFileChange: vi.fn(),
        micCheckStatus: 'ready:HighDef Microphone',
        onCheckMicrophone: vi.fn(),
        cameraCheckStatus: 'ready',
        onCheckCamera: vi.fn(),
        micLevel: 0.12,
    };

    it('renders PreFlightCheck in Step 5 before starting interview', () => {
        render(
            <MemoryRouter>
                <InterviewLobby {...defaultProps} />
            </MemoryRouter>
        );

        // PreFlightCheck heading and elements
        expect(screen.getByText(/Pre-Flight Device & System Check/i)).toBeInTheDocument();
        expect(screen.getByText(/HighDef Microphone/i)).toBeInTheDocument();
        expect(screen.getByText(/Voice detected!/i)).toBeInTheDocument();
        expect(screen.getByText(/WebRTC: Ready/i)).toBeInTheDocument();
        expect(screen.getByText(/AudioContext: Active/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start Interview/i })).toBeInTheDocument();
    });

    it('shows scheduled time in candidate local time and UTC, plus calendar links in Custom Question Set view', () => {
        const scheduledDateIso = '2026-11-20T14:30:00.000Z';
        const customQuestionSet = {
            id: 'qs_123',
            title: 'Senior Distributed Systems Interview',
            description: '45-minute comprehensive technical assessment',
            scheduledAt: scheduledDateIso,
            scheduledDurationMinutes: 45,
            questionCount: 5,
            difficulty: 'hard',
            settings: {
                roleName: 'Principal Architect',
                companyName: 'PrepLoop Labs',
            },
        };

        // Mock URL.createObjectURL and revokeObjectURL for ICS download
        const createObjectURLMock = vi.fn(() => 'blob:mock-ics-url');
        const revokeObjectURLMock = vi.fn();
        Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURLMock, writable: true });
        Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURLMock, writable: true });

        render(
            <MemoryRouter>
                <InterviewLobby
                    {...defaultProps}
                    questionSetCode="TOKEN_XYZ"
                    customQuestionSet={customQuestionSet}
                />
            </MemoryRouter>
        );

        // Assert title and custom question set headers
        expect(screen.getByText('Senior Distributed Systems Interview')).toBeInTheDocument();

        // Local and UTC time display
        expect(screen.getByText(/Local Time:/i)).toBeInTheDocument();
        expect(screen.getByText(/Universal Time:/i)).toBeInTheDocument();
        expect(screen.getAllByText(/UTC/i).length).toBeGreaterThanOrEqual(1);

        // Calendar links: Google Calendar, Outlook Calendar, and Download .ics
        const gcalLink = screen.getByRole('link', { name: /Google Calendar/i });
        expect(gcalLink).toBeInTheDocument();
        expect(gcalLink.getAttribute('href')).toContain('calendar.google.com');

        const outlookLink = screen.getByRole('link', { name: /Outlook Calendar/i });
        expect(outlookLink).toBeInTheDocument();
        expect(outlookLink.getAttribute('href')).toContain('outlook.live.com');

        const icsBtn = screen.getByRole('button', { name: /Download \.ics/i });
        expect(icsBtn).toBeInTheDocument();

        // Clicking download .ics creates blob URL
        fireEvent.click(icsBtn);
        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });

    it('formats candidate instructions politely and displays PrepLoop Assessment fallback for company', () => {
        const customQuestionSet = {
            id: 'qs_behavioral',
            title: 'Behavioral Leadership & Engineering Collaboration (STAR)',
            description: 'STAR behavioral evaluation',
            questionCount: 5,
            difficulty: 'medium',
            settings: {
                roleName: 'Senior Software Engineer',
                customInstructions: 'Probe candidates for concrete STAR storytelling: clear ownership (use of I vs we), measurable outcomes.',
            },
        };

        render(
            <MemoryRouter>
                <InterviewLobby
                    {...defaultProps}
                    questionSetCode="TOKEN_STAR"
                    customQuestionSet={customQuestionSet}
                />
            </MemoryRouter>
        );

        // Header shows "Candidate Guidance & Focus Areas"
        expect(screen.getByText(/Candidate Guidance & Focus Areas/i)).toBeInTheDocument();

        // Third person "Probe candidates for" is rewritten to polite candidate guidance
        expect(screen.getByText(/Please focus on concrete STAR storytelling/i)).toBeInTheDocument();

        // Company fallback is "PrepLoop Assessment" instead of "Assigned"
        expect(screen.getByText('PrepLoop Assessment')).toBeInTheDocument();

        // Begin interview button is visible and enabled when mic is ready
        const beginBtn = screen.getByRole('button', { name: /Begin Interview/i });
        expect(beginBtn).toBeInTheDocument();
        expect(beginBtn).not.toBeDisabled();
    });

    it('prompts user to complete microphone check on Begin Interview button when mic is not ready', () => {
        const customQuestionSet = {
            id: 'qs_test',
            title: 'Frontend React Assessment',
            questionCount: 3,
            difficulty: 'easy',
            settings: { companyName: 'Acme Corp', roleName: 'Frontend Dev' },
        };

        render(
            <MemoryRouter>
                <InterviewLobby
                    {...defaultProps}
                    micCheckStatus="not_checked"
                    questionSetCode="TOKEN_MIC"
                    customQuestionSet={customQuestionSet}
                />
            </MemoryRouter>
        );

        // Button should guide the candidate instead of being confusingly disabled
        const micCheckPromptBtn = screen.getByRole('button', { name: /Complete Microphone Check to Begin/i });
        expect(micCheckPromptBtn).toBeInTheDocument();
        expect(micCheckPromptBtn).toBeDisabled();
    });

    it('shows expired warning banner and disables Start button when link is expired', () => {
        const customQuestionSet = {
            id: 'qs_expired',
            title: 'Backend Node Assessment',
            expiresAt: '2020-01-01T00:00:00.000Z',
            questionCount: 4,
            difficulty: 'hard',
            settings: { companyName: 'Acme Corp', roleName: 'Backend Dev' },
        };

        render(
            <MemoryRouter>
                <InterviewLobby
                    {...defaultProps}
                    questionSetCode="TOKEN_EXP"
                    customQuestionSet={customQuestionSet}
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/Invitation Link Expired:/i)).toBeInTheDocument();
        const expiredBtn = screen.getByRole('button', { name: /Interview Link Expired/i });
        expect(expiredBtn).toBeInTheDocument();
        expect(expiredBtn).toBeDisabled();
    });
});
