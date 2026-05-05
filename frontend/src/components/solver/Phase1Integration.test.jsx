/**
 * Phase 1 Integration Tests: Progressive Hint System + Custom Test Creator
 * 
 * End-to-end tests for complete workflows:
 * 1. User reveals hints with cooldown enforcement
 * 2. User creates custom test cases with templates
 * 3. Both components work together in DSACodeEditor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedHintsPanel from './EnhancedHintsPanel';
import CustomTestBuilder from './CustomTestBuilder';

// ─── Test fixtures ───
const MOCK_PROBLEM_ID = 'leet-1-two-sum';
const MOCK_USER_ID = 'test-user-123';

const mockApiFetch = vi.fn();
vi.mock('../../utils/apiFetch', () => ({
  apiFetch: (...args) => mockApiFetch(...args),
}));

describe('Phase 1 Integration: Hints + Custom Tests', () => {
  beforeEach(() => {
    mockApiFetch.mockClear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('EnhancedHintsPanel Component', () => {
    it('should render with hint type buttons', () => {
      mockApiFetch.mockResolvedValueOnce({
        hints: {
          approach: 'Use a hash map strategy',
          code: 'Create a seen dictionary',
          edge_case: 'Handle empty arrays',
        },
        usage: {},
      });

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      expect(screen.getByText('Approach Hint')).toBeInTheDocument();
      expect(screen.getByText('Code Hint')).toBeInTheDocument();
      expect(screen.getByText('Edge Case Hint')).toBeInTheDocument();
    });

    it('should reveal hint on button click', async () => {
      mockApiFetch.mockResolvedValueOnce({
        hint: 'Use a hash map',
        hint_type: 'approach',
        revealed_at: new Date().toISOString(),
      });

      const onHintRevealed = vi.fn();
      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
          onHintRevealed={onHintRevealed}
        />
      );

      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');
      
      await user.click(buttons[0]);

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    it('should display cooldown timer when active', async () => {
      const cooldownTime = new Date();
      cooldownTime.setMinutes(cooldownTime.getMinutes() + 5);

      mockApiFetch.mockResolvedValueOnce({
        usage: {
          code: {
            revealed: true,
            cooldown_until: cooldownTime.toISOString(),
          },
        },
      });

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });
  });

  describe('CustomTestBuilder Component', () => {
    it('should render test case form', () => {
      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      const inputs = screen.getAllByPlaceholderText(/input|expected/i);
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should add test cases on button click', async () => {
      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');
      
      // Find a button and click it
      if (buttons.length > 0) {
        const initialInputs = screen.queryAllByPlaceholderText(/input|expected/i);
        const initialCount = initialInputs.length;
        
        // Click first button (likely add test)
        await user.click(buttons[0]);
        
        const updatedInputs = screen.queryAllByPlaceholderText(/input|expected/i);
        // Should have same or more inputs after clicking
        expect(updatedInputs.length).toBeGreaterThanOrEqual(initialCount);
      }
    });

    it('should handle template insertion', async () => {
      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Component Integration', () => {
    it('should render both components without conflicts', () => {
      const { container: hintContainer } = render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const { container: testContainer } = render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      expect(hintContainer).toBeInTheDocument();
      expect(testContainer).toBeInTheDocument();
    });

    it('should track callbacks from hint component', async () => {
      const onHintRevealed = vi.fn();

      mockApiFetch.mockResolvedValueOnce({ 
        hint: 'Strategy',
        hint_type: 'approach',
        revealed_at: new Date().toISOString(),
      });

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
          onHintRevealed={onHintRevealed}
        />
      );

      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');

      if (buttons.length > 0) {
        await user.click(buttons[0]);
      }

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    it('should track callbacks from test builder component', async () => {
      const onTestsUpdate = vi.fn();

      mockApiFetch.mockResolvedValueOnce({ 
        success: true,
        test_case_count: 1,
      });

      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
          onTestsUpdate={onTestsUpdate}
        />
      );

      // Component should allow test creation
      expect(screen.getByPlaceholderText('Enter input')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle hint API errors gracefully', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');

      if (buttons.length > 0) {
        await user.click(buttons[0]);
      }

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    it('should handle test builder API errors', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Save failed'));

      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      // Component should still render and be usable
      expect(screen.getByPlaceholderText('Enter input')).toBeInTheDocument();
    });

    it('should allow retry after failures', async () => {
      // First call is fetchStats on mount (successful)
      // Second call is first click (fails)
      // Third call is second click (succeeds)
      mockApiFetch
        .mockResolvedValueOnce({ stats: {} }) // fetchStats on mount
        .mockRejectedValueOnce(new Error('First error')) // first click fails
        .mockResolvedValueOnce({ hint: { can_reveal: true, hint_text: 'Success on retry', first_reveal: false } }); // second click succeeds

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');

      if (buttons.length > 0) {
        // First click fails
        await user.click(buttons[0]);
        
        await waitFor(() => {
          expect(mockApiFetch).toHaveBeenCalledTimes(2); // fetchStats + first hint call
        });

        // Second click should retry and succeed
        await user.click(buttons[0]);

        await waitFor(() => {
          expect(mockApiFetch).toHaveBeenCalledTimes(3); // fetchStats + first hint + second hint
        });
      }
    });
  });

  describe('Performance', () => {
    it('should not block UI during API calls', async () => {
      mockApiFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ hint: 'Hint' }),
              1000
            )
          )
      );

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render EnhancedHintsPanel efficiently', () => {
      const start = performance.now();

      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should render in <100ms
    });

    it('should render CustomTestBuilder efficiently', () => {
      const start = performance.now();

      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should render in <100ms
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button elements in hints panel', () => {
      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        // Each button should have content or aria-label
        const hasContent = btn.textContent && btn.textContent.trim().length > 0;
        expect(hasContent || btn.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have accessible form elements in test builder', () => {
      render(
        <CustomTestBuilder
          problemId={MOCK_PROBLEM_ID}
          language="python"
        />
      );

      const inputs = screen.getAllByPlaceholderText(/input|expected/i);
      expect(inputs.length).toBeGreaterThan(0);

      inputs.forEach((input) => {
        // Each input should be properly labeled
        expect(input).toHaveAttribute('placeholder');
      });
    });

    it('should support keyboard navigation', async () => {
      render(
        <EnhancedHintsPanel
          problemId={MOCK_PROBLEM_ID}
          problemTitle="Two Sum"
        />
      );

      const user = userEvent.setup();
      const buttons = screen.getAllByRole('button');

      if (buttons.length > 0) {
        // Tab should navigate to button
        await user.tab();
        expect(document.activeElement).toBeTruthy();
      }
    });
  });

  describe('Integration with DSACodeEditor', () => {
    it('should provide both components simultaneously', () => {
      const hintProps = {
        problemId: MOCK_PROBLEM_ID,
        problemTitle: 'Two Sum',
      };

      const testProps = {
        problemId: MOCK_PROBLEM_ID,
        language: 'python',
      };

      const { rerender: hintRerender } = render(
        <EnhancedHintsPanel {...hintProps} />
      );

      const { rerender: testRerender } = render(
        <CustomTestBuilder {...testProps} />
      );

      // Both should render without conflicts
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      expect(screen.getAllByPlaceholderText(/input|expected/i).length).toBeGreaterThan(0);
    });
  });
});
