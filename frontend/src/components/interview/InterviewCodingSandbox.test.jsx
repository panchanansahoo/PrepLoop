/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
    InterviewCodingSandbox,
    SUPPORTED_LANGUAGES,
    DEFAULT_STARTER_CODES,
    analyzeTestRunnerResults,
} from './InterviewCodingSandbox';

// Mock Monaco Editor for jsdom testing
vi.mock('@monaco-editor/react', () => ({
    default: ({ value, onChange, language }) => (
        <textarea
            data-testid="mock-monaco-editor"
            data-language={language}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

// Mock authFetch
vi.mock('../../utils/authFetch', () => ({
    authFetch: vi.fn(),
}));

describe('InterviewCodingSandbox (Pillar 2 Live Coding Execution)', () => {
    const mockProblem = {
        id: 'two-sum-1',
        title: 'Two Sum',
        difficulty: 'Easy',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
        ],
        constraints: ['2 <= nums.length <= 10^4'],
        starter_code: {
            javascript: 'function twoSum(nums, target) { return [0, 1]; }',
            python: 'def twoSum(nums, target):\n    return [0, 1]',
            java: 'public class Solution {}',
            cpp: 'int main() {}',
        },
        test_cases: [
            { input: '[2, 7, 11, 15], 9', output: '[0, 1]', description: 'Basic test case' },
            { input: '[3, 2, 4], 6', output: '[1, 2]', description: 'Secondary test case' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders problem title, difficulty badge, and split-screen panels', () => {
        render(<InterviewCodingSandbox problem={mockProblem} />);

        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('Easy')).toBeInTheDocument();
        expect(screen.getByTestId('sandbox-left-panel')).toBeInTheDocument();
        expect(screen.getByTestId('sandbox-right-panel')).toBeInTheDocument();
        expect(screen.getByTestId('run-tests-btn')).toBeInTheDocument();
        expect(screen.getByTestId('language-select')).toBeInTheDocument();
    });

    it('supports 4 languages: JavaScript, Python, Java, and C++', () => {
        expect(SUPPORTED_LANGUAGES.map((l) => l.id)).toEqual(['javascript', 'python', 'java', 'cpp']);

        const onLanguageChange = vi.fn();
        render(<InterviewCodingSandbox problem={mockProblem} onLanguageChange={onLanguageChange} />);

        const select = screen.getByTestId('language-select');
        expect(select.value).toBe('javascript');

        // Switch to Python
        fireEvent.change(select, { target: { value: 'python' } });
        expect(select.value).toBe('python');
        expect(onLanguageChange).toHaveBeenCalledWith('python');

        // Switch to Java
        fireEvent.change(select, { target: { value: 'java' } });
        expect(select.value).toBe('java');

        // Switch to C++
        fireEvent.change(select, { target: { value: 'cpp' } });
        expect(select.value).toBe('cpp');
    });

    it('switches tabs between Problem, Test Cases, and Results', () => {
        render(<InterviewCodingSandbox problem={mockProblem} />);

        // Default tab: Problem
        expect(screen.getByText(/Given an array of integers/i)).toBeInTheDocument();

        // Switch to Test Cases
        const testCasesTab = screen.getByTestId('test-cases-tab');
        fireEvent.click(testCasesTab);
        expect(screen.getByText(/Basic test case/i)).toBeInTheDocument();

        // Switch to Results
        const resultsTab = screen.getByTestId('test-results-tab');
        fireEvent.click(resultsTab);
        expect(screen.getByText(/Click "Run Tests"/i)).toBeInTheDocument();
    });

    it('executes Run Tests and displays test summary and contextual AI feedback', async () => {
        const onRunTests = vi.fn();
        render(<InterviewCodingSandbox problem={mockProblem} onRunTests={onRunTests} />);

        const runBtn = screen.getByTestId('run-tests-btn');
        fireEvent.click(runBtn);

        await waitFor(() => {
            expect(screen.getByTestId('test-results-summary')).toBeInTheDocument();
        });

        // AI Feedback panel is rendered with headline and insights
        expect(screen.getByTestId('ai-feedback-panel')).toBeInTheDocument();
        expect(onRunTests).toHaveBeenCalled();
    });

    it('resets code to starter template when Reset button is clicked', () => {
        const onCodeChange = vi.fn();
        render(<InterviewCodingSandbox problem={mockProblem} onCodeChange={onCodeChange} />);

        const editor = screen.getByTestId('mock-monaco-editor');
        fireEvent.change(editor, { target: { value: 'console.log("edited code");' } });
        expect(editor.value).toBe('console.log("edited code");');

        const resetBtn = screen.getByTestId('reset-code-btn');
        fireEvent.click(resetBtn);

        expect(editor.value).toBe(mockProblem.starter_code.javascript);
    });

    describe('analyzeTestRunnerResults (AI Contextual Feedback)', () => {
        it('detects timeouts and generates time complexity hints and interviewer cues', () => {
            const timeoutResults = {
                passed: 0,
                total: 2,
                executionTime: 3500,
                code: 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) {} }',
                error: 'Execution timed out',
            };
            const feedback = analyzeTestRunnerResults(timeoutResults);
            expect(feedback.category).toBe('timeout');
            expect(feedback.status).toBe('timeout');
            expect(feedback.headline).toMatch(/timeout/i);
            expect(feedback.timeComplexityObservation).toMatch(/nested|O\(N²\)/i);
            expect(feedback.interviewerQuestionCue).toMatch(/time complexity/i);
        });

        it('detects edge case failures on empty inputs', () => {
            const edgeCaseResults = {
                passed: 1,
                total: 2,
                testResults: [
                    { input: '[1,2,3]', expected: '3', actual: '3', passed: true },
                    { input: '[]', expected: '0', actual: 'undefined', passed: false },
                ],
            };
            const feedback = analyzeTestRunnerResults(edgeCaseResults);
            expect(feedback.category).toBe('edge_case_failure');
            expect(feedback.status).toBe('failed');
            expect(feedback.headline).toMatch(/edge case failure/i);
            expect(feedback.actionableHints[0]).toMatch(/guard clause|null/i);
        });

        it('identifies 100% all passed with follow-up scaling questions', () => {
            const passedResults = {
                passed: 3,
                total: 3,
                executionTime: 18,
                code: 'function solve() { return 42; }',
            };
            const feedback = analyzeTestRunnerResults(passedResults);
            expect(feedback.category).toBe('all_passed');
            expect(feedback.status).toBe('passed');
            expect(feedback.interviewerQuestionCue).toMatch(/stream|unbounded/i);
        });
    });
});
