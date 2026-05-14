import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProblemExplorerAllQuestionsView } from './ProblemExplorerAllQuestionsView';

function makeProblem(overrides = {}) {
  return {
    id: 1,
    title: 'Two Sum',
    companies: ['Amazon', 'Meta'],
    topics: ['Array', 'Hash Table'],
    difficulty: 'Easy',
    acceptance: '49.2%',
    ...overrides,
  };
}

describe('ProblemExplorerAllQuestionsView', () => {
  it('does not render when view mode is not all', () => {
    render(
      <ProblemExplorerAllQuestionsView
        viewMode="pattern"
        isLight={false}
        filteredProblems={[makeProblem()]}
        solvedSet={new Set()}
        sortBy="id"
        sortDir="asc"
        setSortBy={vi.fn()}
        setSortDir={vi.fn()}
        onSolveProblem={vi.fn()}
        getExplanationSnippet={() => 'snippet'}
      />
    );

    expect(screen.queryByText('Problem')).not.toBeInTheDocument();
  });

  it('renders empty state when no problems match filters', () => {
    render(
      <ProblemExplorerAllQuestionsView
        viewMode="all"
        isLight={false}
        filteredProblems={[]}
        solvedSet={new Set()}
        sortBy="id"
        sortDir="asc"
        setSortBy={vi.fn()}
        setSortDir={vi.fn()}
        onSolveProblem={vi.fn()}
        getExplanationSnippet={() => 'snippet'}
      />
    );

    expect(screen.getByText('No problems match your filters.')).toBeInTheDocument();
  });

  it('invokes solve callback with problem id', () => {
    const onSolveProblem = vi.fn();

    render(
      <ProblemExplorerAllQuestionsView
        viewMode="all"
        isLight={false}
        filteredProblems={[makeProblem({ id: 42, title: 'Merge Intervals' })]}
        solvedSet={new Set()}
        sortBy="id"
        sortDir="asc"
        setSortBy={vi.fn()}
        setSortDir={vi.fn()}
        onSolveProblem={onSolveProblem}
        getExplanationSnippet={() => 'interval merging'}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Solve' }));
    expect(onSolveProblem).toHaveBeenCalledWith(42);
  });

  it('changes sort direction when active sort header is clicked', () => {
    const setSortBy = vi.fn();
    const setSortDir = vi.fn();

    render(
      <ProblemExplorerAllQuestionsView
        viewMode="all"
        isLight={false}
        filteredProblems={[makeProblem()]}
        solvedSet={new Set()}
        sortBy="id"
        sortDir="asc"
        setSortBy={setSortBy}
        setSortDir={setSortDir}
        onSolveProblem={vi.fn()}
        getExplanationSnippet={() => 'two pointers'}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /#/i }));

    expect(setSortBy).toHaveBeenCalledWith('id');
    expect(setSortDir).toHaveBeenCalledTimes(1);

    const updater = setSortDir.mock.calls[0][0];
    expect(updater('asc')).toBe('desc');
  });

  it('resets to ascending when a new sort key is clicked', () => {
    const setSortBy = vi.fn();
    const setSortDir = vi.fn();

    render(
      <ProblemExplorerAllQuestionsView
        viewMode="all"
        isLight={true}
        filteredProblems={[makeProblem()]}
        solvedSet={new Set()}
        sortBy="id"
        sortDir="desc"
        setSortBy={setSortBy}
        setSortDir={setSortDir}
        onSolveProblem={vi.fn()}
        getExplanationSnippet={() => 'hash map'}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /difficulty/i }));

    expect(setSortBy).toHaveBeenCalledWith('difficulty');
    expect(setSortDir).toHaveBeenCalledTimes(1);

    const updater = setSortDir.mock.calls[0][0];
    expect(updater('desc')).toBe('asc');
  });
});
