/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CandidateFeedbackPortal from './CandidateFeedbackPortal';

describe('CandidateFeedbackPortal (Branded Safe Candidate Feedback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSafeReport = {
    reportId: 'cfr_abc12345',
    candidateName: 'Morgan Smith',
    roleName: 'Senior Frontend Architect',
    companyName: 'FinTech Dynamics',
    interviewTitle: 'React & System Design Assessment',
    completedAt: '2026-11-14T10:00:00Z',
    durationMinutes: 45,
    evaluationSummary: {
      headline: 'Comprehensive Assessment Feedback',
      strengths: [
        'Exceptional component composition and mastery of React memoization patterns.',
        'Clear and structured explanation of client-side caching trade-offs.',
      ],
      growthTips: [
        'Consider elaborating on server-driven UI degradation during network latency.',
        'Outline automated regression test coverage for complex micro-frontend integrations.',
      ],
      topicBreakdown: [
        {
          topic: 'React Architecture',
          proficiency: 'Strong Mastery',
          feedback: 'High fluency in state machines and render optimizations.',
        },
        {
          topic: 'Communication',
          proficiency: 'Proficient',
          feedback: 'Articulated trade-offs clearly.',
        },
      ],
    },
    recommendedResources: [
      {
        title: 'DSA Patterns Roadmap',
        category: 'Algorithms',
        path: '/roadmap/dsa',
        description: 'Interactive roadmap.',
      },
    ],
  };

  it('renders candidate feedback with constructive strengths and growth tips', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        report: mockSafeReport,
      }),
    });

    render(
      <MemoryRouter initialEntries={['/candidate-feedback/cfb_test_cand']}>
        <Routes>
          <Route path="/candidate-feedback/:token" element={<CandidateFeedbackPortal />} />
        </Routes>
      </MemoryRouter>
    );

    // Shows loading skeleton first
    await waitFor(() => {
      expect(screen.getByText(/Performance Review for Morgan Smith/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText('FinTech Dynamics').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Senior Frontend Architect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Key Strengths & Mastery')).toBeInTheDocument();
    expect(screen.getByText(/Exceptional component composition/i)).toBeInTheDocument();
    expect(screen.getByText('Targeted Growth Opportunities')).toBeInTheDocument();
    expect(screen.getByText(/server-driven UI degradation/i)).toBeInTheDocument();
    expect(screen.getByText('React Architecture')).toBeInTheDocument();
    expect(screen.getByText('Strong Mastery')).toBeInTheDocument();
  });

  it('strictly ensures NO internal recruiter rubrics or proctoring metrics appear in the DOM', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        report: mockSafeReport,
      }),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/candidate-feedback/cfb_test_cand']}>
        <Routes>
          <Route path="/candidate-feedback/:token" element={<CandidateFeedbackPortal />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Morgan Smith/i)).toBeInTheDocument();
    });

    const renderedHtml = container.innerHTML.toLowerCase();
    expect(renderedHtml).not.toContain('qualified');
    expect(renderedHtml).not.toContain('rejected');
    expect(renderedHtml).not.toContain('review_needed');
    expect(renderedHtml).not.toContain('no hire');
    expect(renderedHtml).not.toContain('tabswitch');
    expect(renderedHtml).not.toContain('pastecount');
    expect(renderedHtml).not.toContain('cheating');
    expect(renderedHtml).not.toContain('passingscore');
  });

  it('switches between Feedback tab and Self-Scheduling tab seamlessly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        report: mockSafeReport,
      }),
    });

    render(
      <MemoryRouter initialEntries={['/candidate-feedback/cfb_test_cand']}>
        <Routes>
          <Route path="/candidate-feedback/:token" element={<CandidateFeedbackPortal />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Morgan Smith/i)).toBeInTheDocument();
    });

    // Switch to Self-Scheduling tab
    const scheduleTab = screen.getByRole('button', { name: /Self-Scheduling \/ Next Round/i });
    fireEvent.click(scheduleTab);

    // CandidateSelfScheduler should now be visible
    expect(screen.getByText(/Recruiter Availability/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate Timezone/i)).toBeInTheDocument();

    // Switch back to Feedback tab
    const feedbackTab = screen.getByRole('button', { name: /Feedback & Growth Analysis/i });
    fireEvent.click(feedbackTab);

    expect(screen.getByText('Key Strengths & Mastery')).toBeInTheDocument();
  });

  it('handles print and copy-share interactions gracefully', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const clipboardSpy = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardSpy,
      },
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        report: mockSafeReport,
      }),
    });

    render(
      <MemoryRouter initialEntries={['/candidate-feedback/cfb_test_cand']}>
        <Routes>
          <Route path="/candidate-feedback/:token" element={<CandidateFeedbackPortal />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Morgan Smith/i)).toBeInTheDocument();
    });

    // Test Print
    const printButton = screen.getByRole('button', { name: /Print \/ PDF/i });
    fireEvent.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);

    // Test Share
    const shareButton = screen.getByRole('button', { name: /Share/i });
    await act(async () => {
      fireEvent.click(shareButton);
    });
    expect(clipboardSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Link Copied!/i)).toBeInTheDocument();
  });
});
