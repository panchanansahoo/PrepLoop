/**
 * Tests for Enhanced Hints Panel - Phase 1.1 Frontend
 * Core tests: Component rendering and API integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedHintsPanel from './EnhancedHintsPanel';

// Mock API client
vi.mock('../../utils/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../utils/apiFetch';

describe('EnhancedHintsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ stats: { total_hints_revealed: 0 } });
  });

  it('should render hint panel with title', async () => {
    render(<EnhancedHintsPanel problemId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Progressive Hints')).toBeInTheDocument();
    });
  });

  it('should render three hint type buttons', async () => {
    render(<EnhancedHintsPanel problemId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Approach Hint')).toBeInTheDocument();
      expect(screen.getByText('Code Hint')).toBeInTheDocument();
      expect(screen.getByText('Edge Case Hint')).toBeInTheDocument();
    });
  });

  it('should display user hint statistics', async () => {
    apiFetch.mockResolvedValue({
      stats: { total_hints_revealed: 5 },
    });

    render(<EnhancedHintsPanel problemId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/5 hints revealed/i)).toBeInTheDocument();
    });
  });

  it('should call hint API on button click', async () => {
    apiFetch.mockImplementation((url) => {
      if (url.includes('/hints/stats')) {
        return Promise.resolve({ stats: { total_hints_revealed: 0 } });
      }
      if (url.includes('/hints/1')) {
        return Promise.resolve({
          hint: {
            can_reveal: true,
            hint_text: 'Test hint',
            first_reveal: true,
          },
        });
      }
      return Promise.resolve({});
    });

    render(<EnhancedHintsPanel problemId={1} />);

    const button = await screen.findByText('General algorithm strategy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/hints/1'),
        expect.any(Object)
      );
    });
  });

  it('should show error when problemId is missing', async () => {
    render(<EnhancedHintsPanel />);

    const button = await screen.findByText('General algorithm strategy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Problem ID is required/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    apiFetch.mockImplementation((url) => {
      if (url.includes('/hints/stats')) {
        return Promise.resolve({ stats: { total_hints_revealed: 0 } });
      }
      return Promise.reject(new Error('API failed'));
    });

    render(<EnhancedHintsPanel problemId={1} />);

    const button = await screen.findByText('General algorithm strategy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/API failed/)).toBeInTheDocument();
    });
  });

  it('should call callback when hint revealed', async () => {
    const callback = vi.fn();

    apiFetch.mockImplementation((url) => {
      if (url.includes('/hints/stats')) {
        return Promise.resolve({ stats: { total_hints_revealed: 0 } });
      }
      if (url.includes('/hints/1')) {
        return Promise.resolve({
          hint: {
            can_reveal: true,
            hint_text: 'Strategy hint',
            first_reveal: true,
          },
        });
      }
      return Promise.resolve({});
    });

    render(<EnhancedHintsPanel problemId={1} onHintRevealed={callback} />);

    const button = await screen.findByText('General algorithm strategy');
    fireEvent.click(button);

    await waitFor(() => {
      expect(callback).toHaveBeenCalledWith({
        hintType: 'approach',
        hintText: 'Strategy hint',
        firstReveal: true,
      });
    });
  });
});
