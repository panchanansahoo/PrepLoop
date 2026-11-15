import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroShowcase from '../components/HeroShowcase';

describe('HeroShowcase - Aptitude Test Showcase on Home', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Aptitude test as Round 01 with correct labels and links', () => {
    render(
      <MemoryRouter>
        <HeroShowcase />
      </MemoryRouter>
    );

    // Round 01 badge & title
    expect(screen.getAllByText('Aptitude test').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Speed & accuracy · 30 min')).toBeInTheDocument();

    // Link to Aptitude
    const aptLink = screen.getByRole('link', { name: /Take an aptitude test/i });
    expect(aptLink).toHaveAttribute('href', '/aptitude');

    // Link to Coding round
    const codingLink = screen.getByRole('link', { name: /Practise a coding round/i });
    expect(codingLink).toHaveAttribute('href', '/coding-round');
  });

  it('runs the automated aptitude test live demo with question, option selection, evaluation and shortcut steps', () => {
    render(
      <MemoryRouter>
        <HeroShowcase />
      </MemoryRouter>
    );

    // Initial problem card & options
    expect(screen.getByText('Quantitative')).toBeInTheDocument();
    expect(screen.getByText(/Q14 of 25 · Speed & Distance/i)).toBeInTheDocument();
    expect(screen.getByText(/A train running at/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /120 m/i })).toBeInTheDocument();

    // Step 1: Option C chosen (after 400ms)
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(screen.getByText(/Evaluating response.../i)).toBeInTheDocument();

    // Step 2: Evaluation correct (after 850ms)
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(screen.getByText(/Correct · \+3 pts/i)).toBeInTheDocument();

    // Step 3: Breakdown & shortcuts revealed (after 1350ms)
    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(screen.getByText(/Convert km\/h to m\/s: 54 × \(5\/18\) = 15 m\/s/i)).toBeInTheDocument();
    expect(screen.getByText(/Total distance: 15 m\/s × 20 s = 300 m/i)).toBeInTheDocument();
    expect(screen.getByText(/Train length: 300 m − 180 m =/i)).toBeInTheDocument();
    expect(screen.getByText(/Top 5% Speed · 93% Accuracy/i)).toBeInTheDocument();
  });
});
