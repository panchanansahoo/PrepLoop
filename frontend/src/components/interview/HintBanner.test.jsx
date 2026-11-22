import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HintBanner, { TIER_CONFIG } from './HintBanner';

describe('HintBanner — 5-Tier Suggestion Hierarchy & Structured Hints', () => {
    it('defines the complete 5-tier suggestion hierarchy with exact colors and labels', () => {
        expect(TIER_CONFIG[0]).toBeDefined();
        expect(TIER_CONFIG[0].label).toBe('Thought Starter');
        expect(TIER_CONFIG[0].color).toBe('#94a3b8');

        expect(TIER_CONFIG[1]).toBeDefined();
        expect(TIER_CONFIG[1].label).toBe('Nudge');
        expect(TIER_CONFIG[1].color).toBe('#818cf8');

        expect(TIER_CONFIG[2]).toBeDefined();
        expect(TIER_CONFIG[2].label).toBe('Approach Options');
        expect(TIER_CONFIG[2].color).toBe('#34d399');

        expect(TIER_CONFIG[3]).toBeDefined();
        expect(TIER_CONFIG[3].label).toBe('Scaffold');
        expect(TIER_CONFIG[3].color).toBe('#f59e0b');

        expect(TIER_CONFIG[4]).toBeDefined();
        expect(TIER_CONFIG[4].label).toBe('Guided Solution');
        expect(TIER_CONFIG[4].color).toBe('#22d3ee');
    });

    it('renders null when hint is not active or null', () => {
        const { container } = render(<HintBanner hint={null} onDismiss={vi.fn()} />);
        expect(container.firstChild).toBeNull();

        const { container: inactiveContainer } = render(
            <HintBanner hint={{ isHint: false, hintTier: 0, hintMessage: 'test' }} onDismiss={vi.fn()} />
        );
        expect(inactiveContainer.firstChild).toBeNull();
    });

    it('renders Tier 0 Thought Starter correctly', () => {
        render(
            <HintBanner
                hint={{
                    isHint: true,
                    hintTier: 0,
                    hintMessage: 'Start by clarifying input constraints and edge cases.',
                }}
                onDismiss={vi.fn()}
            />
        );

        expect(screen.getByText(/Thought Starter/i)).toBeInTheDocument();
        expect(screen.getByText('Start by clarifying input constraints and edge cases.')).toBeInTheDocument();
    });

    it('renders Tier 2 Approach Options with structured options list', () => {
        const selectOptionSpy = vi.fn();
        const options = [
            { title: 'Hash Map Lookup', description: 'Store frequencies in O(N) time', complexity: 'O(N)' },
            { title: 'Two Pointer Approach', description: 'Sort then scan from both ends', complexity: 'O(N log N)' },
        ];

        render(
            <HintBanner
                hint={{
                    isHint: true,
                    hintTier: 2,
                    hintMessage: 'Consider these architectural approaches:',
                    options,
                }}
                onSelectOption={selectOptionSpy}
                onDismiss={vi.fn()}
            />
        );

        expect(screen.getByText(/Approach Options/i)).toBeInTheDocument();
        expect(screen.getByText('Hash Map Lookup')).toBeInTheDocument();
        expect(screen.getByText('Store frequencies in O(N) time')).toBeInTheDocument();
        expect(screen.getByText('Two Pointer Approach')).toBeInTheDocument();

        // Option click triggers selection callback
        fireEvent.click(screen.getByText('Hash Map Lookup'));
        expect(selectOptionSpy).toHaveBeenCalledWith(options[0]);
    });

    it('renders structured guidance bullets when bullets array is passed', () => {
        const bullets = [
            'Define core REST endpoints and payload schema',
            'Estimate database read/write throughput (QPS)',
            'Identify caching layers to reduce latency',
        ];

        render(
            <HintBanner
                hint={{
                    isHint: true,
                    hintTier: 3,
                    hintMessage: 'System Design Scaffolding:',
                    bullets,
                }}
                onDismiss={vi.fn()}
            />
        );

        expect(screen.getAllByText(/Scaffold/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Define core REST endpoints and payload schema')).toBeInTheDocument();
        expect(screen.getByText('Estimate database read/write throughput (QPS)')).toBeInTheDocument();
    });

    it('renders Tier 4 Guided Solution and handles dismiss action', () => {
        const dismissSpy = vi.fn();
        render(
            <HintBanner
                hint={{
                    isHint: true,
                    hintTier: 4,
                    hintMessage: 'Complete optimal solution: Use a Min-Heap of size K.',
                }}
                onDismiss={dismissSpy}
            />
        );

        expect(screen.getByText(/Guided Solution/i)).toBeInTheDocument();
        const closeBtn = screen.getByLabelText('Dismiss hint');
        expect(closeBtn).toBeInTheDocument();
        fireEvent.click(closeBtn);
    });
});
