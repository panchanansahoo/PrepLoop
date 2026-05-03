/**
 * Tests for Custom Test Builder - Phase 1.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomTestBuilder from './CustomTestBuilder';

vi.mock('../../utils/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../utils/apiFetch';

describe('CustomTestBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial test case', () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    expect(screen.getByText('Custom Test Cases')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter expected output')).toBeInTheDocument();
  });

  it('should add test case on Add button click', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('Enter input');
      expect(inputs).toHaveLength(2);
    });
  });

  it('should remove test case when remove button clicked', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Enter input')).toHaveLength(2);
    });

    const removeButton = screen.getAllByTitle('Remove')[0];
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Enter input')).toHaveLength(1);
    });
  });

  it('should update test case input', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    expect(input.value).toBe('[1, 2, 3]');
  });

  it('should update test case description', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const description = screen.getByPlaceholderText('Description');
    fireEvent.change(description, { target: { value: 'Edge case: empty array' } });

    expect(description.value).toBe('Edge case: empty array');
  });

  it('should show error if input is empty on save', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/input cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('should show error if expected output is empty on save', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/expected output cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('should save test cases on Save button click', async () => {
    apiFetch.mockResolvedValue({ testCases: [] });

    render(<CustomTestBuilder problemId={1} language="python" />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    const expected = screen.getByPlaceholderText('Enter expected output');
    fireEvent.change(expected, { target: { value: '[3, 2, 1]' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dsa/custom-tests/1'),
        expect.any(Object)
      );
    });
  });

  it('should run test cases on Run button click', async () => {
    apiFetch.mockResolvedValue({ passedCount: 1, totalCount: 1 });

    render(<CustomTestBuilder problemId={1} language="python" />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    const expected = screen.getByPlaceholderText('Enter expected output');
    fireEvent.change(expected, { target: { value: '[3, 2, 1]' } });

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/1\/1 tests passed/i)).toBeInTheDocument();
    });
  });

  it('should display template buttons for language', () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    expect(screen.getByText('simple input')).toBeInTheDocument();
    expect(screen.getByText('array edge')).toBeInTheDocument();
  });

  it('should insert template on template button click', async () => {
    render(<CustomTestBuilder problemId={1} language="python" />);

    const templateButton = screen.getByText('simple input');
    fireEvent.click(templateButton);

    const input = screen.getByPlaceholderText('Enter input');
    expect(input.value).toBe('input_value = [1, 2, 3]');
  });

  it('should copy test case format to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn(() => Promise.resolve()),
    };
    global.navigator.clipboard = mockClipboard;

    render(<CustomTestBuilder problemId={1} language="python" />);

    const copyButton = screen.getByTitle('Copy');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should handle API errors on save', async () => {
    apiFetch.mockRejectedValue(new Error('Network error'));

    render(<CustomTestBuilder problemId={1} language="python" />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    const expected = screen.getByPlaceholderText('Enter expected output');
    fireEvent.change(expected, { target: { value: '[3, 2, 1]' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('should call onTestsUpdate callback when tests saved', async () => {
    const callback = vi.fn();
    apiFetch.mockResolvedValue({ testCases: [] });

    render(<CustomTestBuilder problemId={1} language="python" onTestsUpdate={callback} />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    const expected = screen.getByPlaceholderText('Enter expected output');
    fireEvent.change(expected, { target: { value: '[3, 2, 1]' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
  });

  it('should disable buttons during loading', async () => {
    apiFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CustomTestBuilder problemId={1} language="python" />);

    const input = screen.getByPlaceholderText('Enter input');
    fireEvent.change(input, { target: { value: '[1, 2, 3]' } });

    const expected = screen.getByPlaceholderText('Enter expected output');
    fireEvent.change(expected, { target: { value: '[3, 2, 1]' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(screen.getByText('Add')).toBeDisabled();
      expect(screen.getByText('Run')).toBeDisabled();
    });
  });
});
