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
});
