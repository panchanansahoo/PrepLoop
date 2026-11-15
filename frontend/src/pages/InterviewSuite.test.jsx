import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InterviewSuite from './InterviewSuite';

// Mock authFetch
vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

import { authFetch } from '../utils/authFetch';

describe('InterviewSuite (Interview Hub)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upgraded Interview Hub header, stats, and sections', async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ heatmap: [] }),
    });

    render(
      <BrowserRouter>
        <InterviewSuite />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Interview Hub/i })).toBeInTheDocument();
    expect(screen.getByText(/Next-Gen Interview Preparation Suite/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Start AI Mock/i)).toBeInTheDocument();
    expect(screen.getByText(/Join Peer Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Company Calibration/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview Readiness Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Supporting Preparation Tools/i)).toBeInTheDocument();
  });

  it('renders the 5 upgraded practice modes and omits Full Interview Loop, live-coding, and debugging-interview', async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ heatmap: [] }),
    });

    render(
      <BrowserRouter>
        <InterviewSuite />
      </BrowserRouter>
    );

    // Verify presence of upgraded modes
    expect(screen.getByText('AI Technical Interview')).toBeInTheDocument();
    expect(screen.getByText('AI Behavioral & HR Round')).toBeInTheDocument();
    expect(screen.getByText('Peer 1-on-1 Mock Interview')).toBeInTheDocument();
    expect(screen.getByText('Code Review Simulation')).toBeInTheDocument();
    expect(screen.getByText('Expert 1-on-1 Mock Interview')).toBeInTheDocument();

    // Verify strict absence of removed / no-need modes
    expect(screen.queryByText(/Full Interview Loop/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live Coding Copilot/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Debugging Challenge/i)).not.toBeInTheDocument();
  });

  it('filters interview modes by category tabs', async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ heatmap: [] }),
    });

    render(
      <BrowserRouter>
        <InterviewSuite />
      </BrowserRouter>
    );

    // Click on "AI Rounds" filter
    const aiFilterBtn = screen.getByRole('button', { name: /AI Rounds/i });
    fireEvent.click(aiFilterBtn);

    expect(screen.getByText('AI Technical Interview')).toBeInTheDocument();
    expect(screen.getByText('AI Behavioral & HR Round')).toBeInTheDocument();
    expect(screen.queryByText('Peer 1-on-1 Mock Interview')).not.toBeInTheDocument();
    expect(screen.queryByText('Code Review Simulation')).not.toBeInTheDocument();

    // Click on "Peer & Mentor" filter
    const peerFilterBtn = screen.getByRole('button', { name: /Peer & Mentor/i });
    fireEvent.click(peerFilterBtn);

    expect(screen.getByText('Peer 1-on-1 Mock Interview')).toBeInTheDocument();
    expect(screen.getByText('Expert 1-on-1 Mock Interview')).toBeInTheDocument();
    expect(screen.queryByText('AI Technical Interview')).not.toBeInTheDocument();

    // Click on "Engineering Skills" filter
    const skillsFilterBtn = screen.getByRole('button', { name: /Engineering Skills/i });
    fireEvent.click(skillsFilterBtn);

    expect(screen.getByText('Code Review Simulation')).toBeInTheDocument();
    expect(screen.queryByText('AI Technical Interview')).not.toBeInTheDocument();
  });

  it('renders target company quick launchers with 1-click links', async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ heatmap: [] }),
    });

    render(
      <BrowserRouter>
        <InterviewSuite />
      </BrowserRouter>
    );

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
  });

  it('renders weakness items with direct Practice buttons when heatmap data exists', async () => {
    authFetch.mockImplementation(async (url) => {
      if (url.includes('/weakness/heatmap')) {
        return {
          ok: true,
          json: async () => ({
            heatmap: [
              { area: 'binary_search', score: 45 },
              { area: 'dynamic_programming', score: 58 },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ sessions: [] }),
      };
    });

    render(
      <BrowserRouter>
        <InterviewSuite />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('binary search')).toBeInTheDocument();
      expect(screen.getByText('dynamic programming')).toBeInTheDocument();
    });

    const practiceBtns = screen.getAllByRole('button', { name: /Practice/i });
    expect(practiceBtns.length).toBeGreaterThan(0);
  });
});
