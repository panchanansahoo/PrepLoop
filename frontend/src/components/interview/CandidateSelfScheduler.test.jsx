/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CandidateSelfScheduler from './CandidateSelfScheduler';

describe('CandidateSelfScheduler (Calendly-style Slot Picker)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuestionSet = {
    title: 'Senior Systems Engineer Evaluation',
    role: 'Staff Infrastructure Engineer',
    scheduled_duration_minutes: 60,
    settings: {
      companyName: 'CloudPlatform Inc',
      roleName: 'Staff Infrastructure Engineer',
      scheduledDurationMinutes: 60,
    },
  };

  const mockSlots = [
    {
      slotId: 'slot_20261118_1400',
      dateStr: '2026-11-18',
      time: '14:00',
      utcTimestamp: '2026-11-18T14:00:00.000Z',
    },
    {
      slotId: 'slot_20261118_1630',
      dateStr: '2026-11-18',
      time: '16:30',
      utcTimestamp: '2026-11-18T16:30:00.000Z',
    },
  ];

  it('renders interview title, company, role, duration, and timezone selector', () => {
    render(
      <CandidateSelfScheduler
        questionSet={mockQuestionSet}
        availabilitySlots={mockSlots}
        initialTimezone="UTC"
      />
    );

    expect(screen.getByText('Senior Systems Engineer Evaluation')).toBeInTheDocument();
    expect(screen.getByText('CloudPlatform Inc')).toBeInTheDocument();
    expect(screen.getByText('Staff Infrastructure Engineer')).toBeInTheDocument();
    expect(screen.getByText('60 minutes')).toBeInTheDocument();
    expect(screen.getByText(/WebRTC Voice & Code Sandbox/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate Timezone/i)).toBeInTheDocument();
  });

  it('allows candidate to switch timezones and recomputes local slot time displays', () => {
    render(
      <CandidateSelfScheduler
        questionSet={mockQuestionSet}
        availabilitySlots={mockSlots}
        initialTimezone="UTC"
      />
    );

    // In UTC, 14:00 is 2:00 PM
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'America/New_York' } });

    // In America/New_York (UTC-5), 14:00 UTC is 9:00 AM
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
  });

  it('selects a time slot and allows confirming the booking', async () => {
    const onConfirmed = vi.fn();

    render(
      <CandidateSelfScheduler
        token="inv_cand_789"
        questionSet={mockQuestionSet}
        availabilitySlots={mockSlots}
        initialTimezone="UTC"
        onSlotConfirmed={onConfirmed}
      />
    );

    // Click the 2:00 PM slot
    const slotButton = screen.getByText('2:00 PM');
    fireEvent.click(slotButton);

    // Confirmation bar should display
    expect(screen.getByText(/Selected Interview Slot/i)).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /Confirm & Schedule/i });
    expect(confirmButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Check confirmed view
    expect(screen.getByText(/Interview Confirmed!/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Google Calendar/i)).toBeInTheDocument();
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(onConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'inv_cand_789',
        candidateTimezone: 'UTC',
      })
    );
  });

  it('allows rescheduling from confirmation screen', async () => {
    render(
      <CandidateSelfScheduler
        token="inv_cand_789"
        questionSet={mockQuestionSet}
        availabilitySlots={mockSlots}
        initialTimezone="UTC"
      />
    );

    // Book slot
    fireEvent.click(screen.getByText('2:00 PM'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Confirm & Schedule/i }));
    });

    expect(screen.getByText(/Interview Confirmed!/i)).toBeInTheDocument();

    // Click reschedule
    const rescheduleButton = screen.getByRole('button', { name: /Reschedule Slot/i });
    fireEvent.click(rescheduleButton);

    // Back to slot picker
    expect(screen.getByText(/Select a Date & Time/i)).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
  });
});
