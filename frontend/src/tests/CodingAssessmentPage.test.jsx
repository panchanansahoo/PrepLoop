import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CodingAssessmentPage from '../pages/CodingAssessmentPage';

// Mock Monaco Editor for JSDOM environment
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language }) => (
    <textarea
      data-testid="monaco-editor"
      data-language={language}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

// Mock authFetch to trigger clean offline simulation fallback
vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn().mockRejectedValue(new Error('Network offline - fallback to simulation')),
}));

describe('CodingAssessmentPage - HackerRank-style Online Assessment', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    // Mock document.documentElement.requestFullscreen for JSDOM
    if (!document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen = vi.fn().mockResolvedValue();
    } else {
      vi.spyOn(document.documentElement, 'requestFullscreen').mockResolvedValue();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Scenario 1: Lobby View
  it('1. renders Lobby View with company name, role, problem count, time limit, and start button', () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Company and Role
    expect(screen.getByText(/Google Online Assessment/i)).toBeInTheDocument();
    expect(screen.getByText('SDE')).toBeInTheDocument();
    expect(screen.getByText(/Medium Level/i)).toBeInTheDocument();

    // Exam Specs
    expect(screen.getByText(/2 Coding Challenges/i)).toBeInTheDocument();
    expect(screen.getByText(/60 Minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/Tab Focus Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/70% to Advance/i)).toBeInTheDocument();

    // Guidelines & Instructions
    expect(screen.getByText(/Exam Guidelines & Instructions/i)).toBeInTheDocument();
    expect(screen.getByText(/Timed Environment/i)).toBeInTheDocument();
    expect(screen.getByText(/Fullscreen & Tab Proctoring/i)).toBeInTheDocument();

    // Start Button
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).not.toBeDisabled();
  });

  // Scenario 2: Transition into Exam IDE view
  it('2. transitions into Exam IDE view on clicking Start Assessment with header, selector, panel, and buttons', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Header displaying company brand, role, timer and tab-switch warning counter
    expect(screen.getByText('Coding Assessment')).toBeInTheDocument();
    expect(screen.getByText(/— SDE/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Time Remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Tab Switches: 0 \/ 3/i)).toBeInTheDocument();

    // Problem selector buttons (Problem 1 and Problem 2)
    const prob1Tab = screen.getByRole('button', { name: /Problem 1:/i });
    const prob2Tab = screen.getByRole('button', { name: /Problem 2:/i });
    expect(prob1Tab).toBeInTheDocument();
    expect(prob2Tab).toBeInTheDocument();

    // Problem statement panel with description, constraints, and sample cases / examples
    expect(screen.getByText(/Constraints/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sample Examples|Sample Test Cases/i).length).toBeGreaterThanOrEqual(1);

    // Action buttons in test drawer
    expect(screen.getByRole('button', { name: /Run Code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Code/i })).toBeInTheDocument();

    // Monaco Editor is rendered
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  // Scenario 3: Switching problems updates active problem panel
  it('3. updates the active problem panel when switching problems via tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enter exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Check Problem 1 is initially active in the heading
    const prob1Heading = screen.getByRole('heading', { level: 2 });
    const initialTitle = prob1Heading.textContent;
    expect(initialTitle).toMatch(/1\./);

    // Click Problem 2 selector button
    const prob2Tab = screen.getByRole('button', { name: /Problem 2:/i });
    await act(async () => {
      fireEvent.click(prob2Tab);
    });

    // Heading should now show Problem 2
    const updatedHeading = screen.getByRole('heading', { level: 2 });
    expect(updatedHeading.textContent).toMatch(/2\./);
    expect(updatedHeading.textContent).not.toBe(initialTitle);
  });

  // Scenario 4: Tab switch / visibilitychange triggers proctoring warning counter
  it('4. triggers proctoring warning counter and toast on tab switch / visibilitychange event', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enter exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Initially 0 switches
    expect(screen.getByText(/Tab Switches: 0 \/ 3/i)).toBeInTheDocument();

    // Trigger visibilitychange to hidden
    await act(async () => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Warning counter in header updates to 1 / 3
    expect(screen.getByText(/Tab Switches: 1 \/ 3/i)).toBeInTheDocument();

    // Toast banner appears with warning message
    expect(screen.getByText(/Warning 1\/3: You navigated away from the exam window!/i)).toBeInTheDocument();
  });

  // Scenario 5: Finishing assessment transitions to HackerRank Scorecard view
  it('5. transitions to HackerRank Scorecard view with score, breakdown matrix, and Advance to Round 2 button', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium&multiRound=true']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enter exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Click Finish & Submit Exam button
    const finishBtn = screen.getByRole('button', { name: /Finish & Submit Exam/i });
    await act(async () => {
      fireEvent.click(finishBtn);
    });

    // Confirmation modal should be visible
    expect(screen.getByText(/Finish & Submit Exam\?/i)).toBeInTheDocument();

    // Confirm submission
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Submit/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Scorecard view rendered
    expect(screen.getByText(/Online Assessment Evaluation/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Coding Assessment Report/i)).toBeInTheDocument();

    // Overall Score and points display
    expect(screen.getAllByText(/pts/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Problem Breakdown Matrix/i)).toBeInTheDocument();

    // Proctoring integrity indicator
    expect(screen.getByText(/Proctoring/i)).toBeInTheDocument();

    // Advance to Round 2 button
    const advanceBtn = screen.getByRole('button', { name: /Advance to Round 2: Technical Interview/i });
    expect(advanceBtn).toBeInTheDocument();

    // Clicking Advance to Round 2 executes without error
    await act(async () => {
      fireEvent.click(advanceBtn);
    });
  });
});
