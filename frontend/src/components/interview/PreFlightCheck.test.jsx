/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PreFlightCheck from './PreFlightCheck';

describe('PreFlightCheck component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock AudioContext for Web Audio API chime synthesis
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

    it('renders pre-flight header and system diagnostic badges', () => {
        render(<PreFlightCheck />);

        expect(screen.getByText(/Pre-Flight Device & System Check/i)).toBeInTheDocument();
        expect(screen.getByText(/WebRTC: Ready/i)).toBeInTheDocument();
        expect(screen.getByText(/AudioContext: Active/i)).toBeInTheDocument();
    });

    it('displays mic equalizer and live volume feedback', () => {
        const onCheckMicrophone = vi.fn();
        const { rerender } = render(
            <PreFlightCheck
                micCheckStatus="ready:Default Microphone"
                onCheckMicrophone={onCheckMicrophone}
                micLevel={0.02}
            />
        );

        expect(screen.getByText('Default Microphone')).toBeInTheDocument();
        expect(screen.getByText(/Speak into your mic to test volume/i)).toBeInTheDocument();

        // Rerender with speech level above threshold
        rerender(
            <PreFlightCheck
                micCheckStatus="ready:Default Microphone"
                onCheckMicrophone={onCheckMicrophone}
                micLevel={0.15}
            />
        );
        expect(screen.getByText(/Voice detected!/i)).toBeInTheDocument();

        // Clicking test microphone invokes callback
        const micBtn = screen.getByRole('button', { name: /Retest Mic/i });
        fireEvent.click(micBtn);
        expect(onCheckMicrophone).toHaveBeenCalledTimes(1);
    });

    it('plays synthesized speaker chime and updates sound ready state', async () => {
        const onTestSpeaker = vi.fn();
        render(<PreFlightCheck onTestSpeaker={onTestSpeaker} />);

        const chimeBtn = screen.getByRole('button', { name: /Play Test Chime/i });
        expect(chimeBtn).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(chimeBtn);
        });

        expect(onTestSpeaker).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Playing harmonic test chime.../i)).toBeInTheDocument();
    });

    it('toggles permissions helper and auto-expands when microphone is denied', () => {
        const { rerender } = render(<PreFlightCheck micCheckStatus="not_checked" />);

        expect(screen.queryByTestId('permissions-helper-panel')).not.toBeInTheDocument();

        // Click toggle button
        const helpBtn = screen.getByRole('button', { name: /Need help with permissions\?/i });
        fireEvent.click(helpBtn);
        expect(screen.getByTestId('permissions-helper-panel')).toBeInTheDocument();
        expect(screen.getByText(/How to allow Camera & Microphone access/i)).toBeInTheDocument();

        // When mic is denied, permissions helper auto-opens
        rerender(<PreFlightCheck micCheckStatus="denied" />);
        expect(screen.getByTestId('permissions-helper-panel')).toBeInTheDocument();
        expect(screen.getByText(/Microphone access denied/i)).toBeInTheDocument();
    });

    it('calls onReadyChange when all checks pass', () => {
        const onReadyChange = vi.fn();
        render(
            <PreFlightCheck
                micCheckStatus="ready:Built-in Mic"
                speakerCheckStatus="ready"
                cameraCheckStatus="ready"
                onReadyChange={onReadyChange}
            />
        );

        expect(onReadyChange).toHaveBeenCalledWith(true);
        expect(screen.getByText(/All pre-flight checks passed!/i)).toBeInTheDocument();
    });
});
