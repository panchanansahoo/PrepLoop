import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProblemExplorerViewControls } from './ProblemExplorerViewControls';

const STUDY_PLANS = [
  { id: 'grind75', label: 'Grind 75', desc: 'Important interview set' },
  { id: 'week1', label: 'Week 1', desc: 'First week' },
];

function renderControls(overrides = {}) {
  const props = {
    isLight: false,
    studyPlans: STUDY_PLANS,
    activePlan: null,
    setActivePlan: vi.fn(),
    setViewMode: vi.fn(),
    setPage: vi.fn(),
    viewMode: 'all',
    filteredCount: 24,
    solvedInFiltered: 5,
    hideSolved: false,
    setHideSolved: vi.fn(),
    ...overrides,
  };

  render(<ProblemExplorerViewControls {...props} />);
  return props;
}

describe('ProblemExplorerViewControls', () => {
  it('switches between view mode tabs and clears active plan', () => {
    const props = renderControls({ viewMode: 'patterns' });

    fireEvent.click(screen.getByRole('button', { name: /all questions/i }));
    expect(props.setViewMode).toHaveBeenCalledWith('all');
    expect(props.setActivePlan).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: /study plans/i }));
    expect(props.setViewMode).toHaveBeenCalledWith('plans');
  });

  it('toggles hide solved using a functional state update and resets page', () => {
    const props = renderControls({ hideSolved: false });

    fireEvent.click(screen.getByRole('button', { name: /hide solved/i }));

    expect(props.setHideSolved).toHaveBeenCalledTimes(1);
    const updater = props.setHideSolved.mock.calls[0][0];
    expect(updater(false)).toBe(true);
    expect(props.setPage).toHaveBeenCalledWith(1);
  });

  it('shows solved count badge when solved items are present', () => {
    renderControls({ solvedInFiltered: 3 });

    expect(screen.getByText('3 solved')).toBeInTheDocument();
  });
});
