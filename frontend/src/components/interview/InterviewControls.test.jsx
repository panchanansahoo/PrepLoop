/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InterviewControls from './InterviewControls';

describe('InterviewControls — Decoupled Mic Mute & Finish/Submit Controls', () => {
  it('renders dedicated Mic Mute and Finish/Submit buttons separately', () => {
    render(
      <InterviewControls
        micOn={true}
        isListening={true}
        cameraOn={true}
        speakerMuted={false}
        toggleMic={vi.fn()}
        onFinishAnswer={vi.fn()}
      />
    );

    // Both Mute Mic and Finish controls should coexist simultaneously
    const micButton = screen.getByRole('button', { name: /mute environmental noise/i });
    const finishButton = screen.getByRole('button', { name: /finish and review your answer/i });

    expect(micButton).toBeInTheDocument();
    expect(finishButton).toBeInTheDocument();
    expect(screen.getByText('Mic')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('clicking Mute Mic toggles mute state without terminating the active turn or triggering onFinishAnswer', () => {
    const mockFinishAnswer = vi.fn();
    const mockToggleMute = vi.fn();

    render(
      <InterviewControls
        micOn={true}
        isListening={true}
        cameraOn={true}
        onToggleMute={mockToggleMute}
        onFinishAnswer={mockFinishAnswer}
      />
    );

    const micButton = screen.getByRole('button', { name: /mute environmental noise/i });
    fireEvent.click(micButton);

    // Mute toggle must be invoked to suppress background noise
    expect(mockToggleMute).toHaveBeenCalledTimes(1);
    // Finish / submit MUST NOT be triggered prematurely!
    expect(mockFinishAnswer).not.toHaveBeenCalled();
  });

  it('clicking Finish Answer triggers onFinishAnswer without toggling microphone mute', () => {
    const mockFinishAnswer = vi.fn();
    const mockToggleMute = vi.fn();

    render(
      <InterviewControls
        micOn={true}
        isListening={true}
        cameraOn={true}
        onToggleMute={mockToggleMute}
        onFinishAnswer={mockFinishAnswer}
      />
    );

    const finishButton = screen.getByRole('button', { name: /finish and review your answer/i });
    fireEvent.click(finishButton);

    expect(mockFinishAnswer).toHaveBeenCalledTimes(1);
    expect(mockToggleMute).not.toHaveBeenCalled();
  });

  it('shows Muted state with MicOff styling when isMuted is true', () => {
    render(
      <InterviewControls
        micOn={false}
        isMuted={true}
        isListening={true}
        cameraOn={true}
        onToggleMute={vi.fn()}
        onFinishAnswer={vi.fn()}
      />
    );

    const micButton = screen.getByRole('button', { name: /microphone muted/i });
    expect(micButton).toBeInTheDocument();
    expect(screen.getByText('Muted')).toBeInTheDocument();
    expect(micButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('displays Answer prompt when awaitingAnswer is true and candidate has not started speaking', () => {
    const mockFinishAnswer = vi.fn();

    render(
      <InterviewControls
        micOn={true}
        isListening={false}
        awaitingAnswer={true}
        cameraOn={true}
        onFinishAnswer={mockFinishAnswer}
      />
    );

    const answerButton = screen.getByRole('button', { name: /click to start speaking your answer/i });
    expect(answerButton).toBeInTheDocument();
    expect(screen.getByText('Answer')).toBeInTheDocument();

    fireEvent.click(answerButton);
    expect(mockFinishAnswer).toHaveBeenCalledTimes(1);
  });
});
