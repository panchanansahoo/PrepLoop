import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProblemExplorerFiltersPanel } from './ProblemExplorerFiltersPanel';

function buildProps(overrides = {}) {
    return {
        showFilters: true,
        isLight: false,
        activeFilterCount: 1,
        clearAll: vi.fn(),
        difficulties: ['Easy', 'Medium'],
        selectedDifficulties: ['Easy'],
        setSelectedDifficulties: vi.fn(),
        topics: ['Array'],
        selectedTopics: [],
        setSelectedTopics: vi.fn(),
        companies: [{ id: 'google', name: 'Google', color: '#4285f4' }],
        selectedCompanies: [],
        setSelectedCompanies: vi.fn(),
        patterns: [{ id: 'twopointers', name: 'Two Pointers', color: '#22d3ee', icon: '->', desc: 'Pattern' }],
        selectedPatterns: [],
        setSelectedPatterns: vi.fn(),
        frequencies: ['high', 'medium'],
        selectedFrequency: 'high',
        setSelectedFrequency: vi.fn(),
        timeEstimates: [15, 30],
        maxTime: '',
        setMaxTime: vi.fn(),
        toggleListItem: vi.fn(),
        diffColor: value => (value === 'Easy' ? '#10b981' : '#f59e0b'),
        freqColor: value => (value === 'high' ? '#ef4444' : '#f59e0b'),
        ...overrides,
    };
}

describe('ProblemExplorerFiltersPanel', () => {
    it('does not render when filters are hidden', () => {
        render(<ProblemExplorerFiltersPanel {...buildProps({ showFilters: false })} />);
        expect(screen.queryByText('FILTERS')).toBeNull();
    }, 15000);

    it('calls toggleListItem when a difficulty is clicked', () => {
        const props = buildProps();
        render(<ProblemExplorerFiltersPanel {...props} />);

        fireEvent.click(screen.getByRole('button', { name: 'Medium' }));

        expect(props.toggleListItem).toHaveBeenCalledWith(
            props.selectedDifficulties,
            props.setSelectedDifficulties,
            'Medium'
        );
    }, 15000);

    it('clears selected frequency when active frequency is clicked', () => {
        const props = buildProps();
        render(<ProblemExplorerFiltersPanel {...props} />);

        fireEvent.click(screen.getByRole('button', { name: 'high' }));

        expect(props.setSelectedFrequency).toHaveBeenCalledWith('');
    }, 15000);

    it('shows and triggers clear all when active filters exist', () => {
        const props = buildProps({ activeFilterCount: 2 });
        render(<ProblemExplorerFiltersPanel {...props} />);

        fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

        expect(props.clearAll).toHaveBeenCalledTimes(1);
    }, 15000);
});
