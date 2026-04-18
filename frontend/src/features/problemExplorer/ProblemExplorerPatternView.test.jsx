import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProblemExplorerPatternView } from './ProblemExplorerPatternView';

const ROMAN = ['I'];
const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const patternCategories = [
  {
    id: 'array',
    name: 'Array',
    patternIds: ['p1'],
    topics: ['Array'],
  },
];

const dsaPatterns = [
  {
    id: 'p1',
    name: 'Two Pointer - Opposite Ends',
    theory: true,
    problems: [
      {
        id: 101,
        title: 'Two Sum',
        difficulty: 'Easy',
      },
    ],
  },
];

function renderView(overrides = {}) {
  const props = {
    viewMode: 'patterns',
    isLight: false,
    dsaPatterns,
    patternCategories,
    problems: [],
    solvedSet: new Set(),
    expandedCategories: { array: true },
    setExpandedCategories: vi.fn(),
    expandedSubPatterns: { 'array__p1': true },
    setExpandedSubPatterns: vi.fn(),
    search: '',
    selectedDifficulties: [],
    initialLoading: false,
    roman: ROMAN,
    getExplanationSnippet: () => 'sample snippet',
    onSolveProblem: vi.fn(),
    ...overrides,
  };

  render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <ProblemExplorerPatternView {...props} />
    </MemoryRouter>
  );

  return props;
}

describe('ProblemExplorerPatternView', () => {
  it('does not render when view mode is not patterns', () => {
    renderView({ viewMode: 'all' });

    expect(screen.queryByText('Array')).not.toBeInTheDocument();
  });

  it('toggles category expansion when category header is clicked', () => {
    const setExpandedCategories = vi.fn();

    renderView({ setExpandedCategories });

    fireEvent.click(screen.getByText('Array'));

    expect(setExpandedCategories).toHaveBeenCalledTimes(1);
    expect(typeof setExpandedCategories.mock.calls[0][0]).toBe('function');
  });

  it('invokes solve callback with the selected problem id', () => {
    const onSolveProblem = vi.fn();

    renderView({ onSolveProblem });

    fireEvent.click(screen.getByRole('button', { name: 'Solve' }));

    expect(onSolveProblem).toHaveBeenCalledWith(101);
  });
});
