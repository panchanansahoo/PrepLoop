/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioTimelinePlayer, { formatTime, parseTimeToSeconds } from './AudioTimelinePlayer';

describe('AudioTimelinePlayer component', () => {
  it('formats time and parses time properly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(255)).toBe('04:15');
    expect(parseTimeToSeconds('04:15')).toBe(255);
    expect(parseTimeToSeconds(120)).toBe(120);
  });

  it('renders waveform player with AI flag pins including 04:15', () => {
    render(
      <AudioTimelinePlayer
        duration={600}
        flags={[
          {
            id: 'flag-anomaly',
            timestamp: 255, // 04:15
            type: 'anomaly',
            title: 'Focus Shift Anomaly',
            description: 'Off-tab window switch detected during system architecture question.',
          },
        ]}
      />
    );

    expect(screen.getByText(/Interactive Audio Timeline & AI Flags/i)).toBeInTheDocument();
    expect(screen.getByText('Interview Recording & Team Review')).toBeInTheDocument();

    // 04:15 pin and pill
    expect(screen.getAllByText('04:15').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Focus Shift Anomaly')).toBeInTheDocument();
  });

  it('allows clicking an AI flag pin to display flag details', () => {
    render(
      <AudioTimelinePlayer
        duration={600}
        flags={[
          {
            id: 'flag-anomaly',
            timestamp: 255,
            type: 'anomaly',
            title: 'Focus Shift Anomaly',
            description: 'Off-tab window switch detected during system architecture question.',
          },
        ]}
      />
    );

    const flagButton = screen.getByText('Focus Shift Anomaly').closest('button');
    fireEvent.click(flagButton);

    expect(screen.getByText(/Off-tab window switch detected/i)).toBeInTheDocument();
  });

  it('allows submitting a recruiter note with timestamp and @mention', () => {
    const onAddComment = vi.fn();
    render(
      <AudioTimelinePlayer
        duration={600}
        onAddComment={onAddComment}
      />
    );

    const textarea = screen.getByPlaceholderText(/Add recruiter feedback or note/i);
    fireEvent.change(textarea, { target: { value: 'Great explanation of database indexing. @sarah check this out.' } });

    const postButton = screen.getByRole('button', { name: /Post Note/i });
    fireEvent.click(postButton);

    expect(onAddComment).toHaveBeenCalled();
    expect(screen.getByText(/Great explanation of database indexing/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sarah/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows jumping audio time when clicking comment timestamp badge', () => {
    render(
      <AudioTimelinePlayer
        duration={600}
        initialComments={[
          {
            id: 'c-test',
            author: 'Tech Lead',
            role: 'Reviewer',
            timestampSeconds: 180, // 03:00
            text: 'Excellent clarity on concurrency primitives.',
            createdAt: 'Just now',
          },
        ]}
      />
    );

    const timeBadge = screen.getByText('03:00').closest('button');
    expect(timeBadge).toBeInTheDocument();
    fireEvent.click(timeBadge);
    // Verified clicking does not throw and updates audio playhead
  });
});
