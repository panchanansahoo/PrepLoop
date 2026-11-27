/* @vitest-environment jsdom */
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

import ExamPractice, { CalcWidget, ExamResults } from '../pages/ExamPractice';
import {
  getExamById,
  getExamSectionQuestions,
  getFullExamQuestions,
} from '../data/examData';
import { verbalQuestions } from '../data/verbalQuestions';

function renderExamRoute(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/exam/:examId" element={<ExamPractice />} />
        <Route path="/exam-hub" element={<div data-testid="exam-hub">Exam Hub</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ExamPractice & examData bug regressions (#1, #2, #3, #10, #11)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  describe('Bug #1: Pass calculation uses unrounded percentage and consistent display', () => {
    it('fails Cognizant Superset at 71.75/120 (59.79% < 60% cutoff) and displays 59.79%', () => {
      const supersetExam = getExamById('cognizant-superset');
      const sectionResults = [
        { title: 'Quantitative Aptitude', icon: '🔢', scored: 11.75, maxMarks: 16, correct: 12, wrong: 1, skipped: 3, negativePenalty: 0.25, total: 16 },
        { title: 'Logical Reasoning', icon: '🧩', scored: 10, maxMarks: 14, correct: 10, wrong: 0, skipped: 4, negativePenalty: 0, total: 14 },
        { title: 'Verbal Ability', icon: '📝', scored: 10, maxMarks: 15, correct: 10, wrong: 0, skipped: 5, negativePenalty: 0, total: 15 },
        { title: 'Technical MCQ', icon: '🖥️', scored: 16, maxMarks: 30, correct: 8, wrong: 0, skipped: 7, negativePenalty: 0, total: 15 },
        { title: 'Advanced Coding & Problem Solving', icon: '⚡', scored: 24, maxMarks: 45, correct: 8, wrong: 0, skipped: 7, negativePenalty: 0, total: 15 },
      ];

      render(
        <ExamResults
          exam={supersetExam}
          sectionResults={sectionResults}
          totalTime={3600}
          navigate={vi.fn()}
          isLight={false}
        />
      );

      expect(screen.getByText(/Keep Practicing!/i)).toBeInTheDocument();
      expect(screen.getByText(/Need 60% to pass/i)).toBeInTheDocument();
      expect(screen.queryByText(/You passed!/i)).not.toBeInTheDocument();
      expect(screen.getByText('71.75/120')).toBeInTheDocument();
      expect(screen.getByText('59.79%')).toBeInTheDocument();
    });

    it('passes Cognizant Superset at exact 72/120 (60%)', () => {
      const supersetExam = getExamById('cognizant-superset');
      const sectionResults = [
        { title: 'Quantitative Aptitude', icon: '🔢', scored: 12, maxMarks: 16, correct: 12, wrong: 0, skipped: 4, negativePenalty: 0, total: 16 },
        { title: 'Logical Reasoning', icon: '🧩', scored: 10, maxMarks: 14, correct: 10, wrong: 0, skipped: 4, negativePenalty: 0, total: 14 },
        { title: 'Verbal Ability', icon: '📝', scored: 10, maxMarks: 15, correct: 10, wrong: 0, skipped: 5, negativePenalty: 0, total: 15 },
        { title: 'Technical MCQ', icon: '🖥️', scored: 16, maxMarks: 30, correct: 8, wrong: 0, skipped: 7, negativePenalty: 0, total: 15 },
        { title: 'Advanced Coding & Problem Solving', icon: '⚡', scored: 24, maxMarks: 45, correct: 8, wrong: 0, skipped: 7, negativePenalty: 0, total: 15 },
      ];

      render(
        <ExamResults
          exam={supersetExam}
          sectionResults={sectionResults}
          totalTime={3600}
          navigate={vi.fn()}
          isLight={false}
        />
      );

      expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
      expect(screen.getByText(/You passed!/i)).toBeInTheDocument();
      expect(screen.getByText('72/120')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('never rounds displayed percentage up to passing cutoff when score is just below cutoff', () => {
      const supersetExam = getExamById('cognizant-superset');
      const sectionResults = [
        { title: 'Mock Section', icon: '🔢', scored: 59.996, maxMarks: 100, correct: 60, wrong: 0, skipped: 0, negativePenalty: 0, total: 60 },
      ];

      render(
        <ExamResults
          exam={supersetExam}
          sectionResults={sectionResults}
          totalTime={120}
          navigate={vi.fn()}
          isLight={false}
        />
      );

      expect(screen.getByText(/Need 60% to pass/i)).toBeInTheDocument();
      expect(screen.getByText('59.99%')).toBeInTheDocument();
    });
  });

  describe('Bug #2: Section timeout navigates to remaining sections instead of ending entire exam', () => {
    it('advances from timed-out final section to earlier open section and blocks re-entering expired section', async () => {
      vi.useFakeTimers();
      renderExamRoute('/exam/tcs-nqt-foundation');

      fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));
      expect(screen.getByText(/Numerical Ability/)).toBeInTheDocument();
      expect(screen.getByText('(1/4)')).toBeInTheDocument();

      // Jump to the final section (Traits (Behavioural), 15 mins = 900s)
      fireEvent.click(screen.getByRole('button', { name: '🎭' }));
      expect(screen.getByText(/Traits \(Behavioural\)/)).toBeInTheDocument();
      expect(screen.getByText('(4/4)')).toBeInTheDocument();

      // Let final section expire completely (15 * 60s)
      await act(async () => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });

      // Must NOT submit the entire exam; should move to next non-expired section (Numerical Ability)
      expect(screen.queryByText(/Section‑wise Breakdown/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Numerical Ability/)).toBeInTheDocument();
      expect(screen.getByText('(1/4)')).toBeInTheDocument();

      // Expired section jump button and progress bar are disabled and marked timed out
      const expiredJumpBtn = screen.getByRole('button', { name: '🎭' });
      expect(expiredJumpBtn).toBeDisabled();
      expect(expiredJumpBtn).toHaveAttribute('title', 'Traits (Behavioural) (Timed out)');

      const expiredElements = screen.getAllByTitle('Traits (Behavioural) (Timed out)');
      expect(expiredElements).toHaveLength(2);
      fireEvent.click(expiredElements[0]);
      expect(screen.getByText(/Numerical Ability/)).toBeInTheDocument();
      expect(screen.getByText('(1/4)')).toBeInTheDocument();

      // Question Navigator also disables expired section's questions and shows Timed out
      fireEvent.click(screen.getByTitle('Question Grid'));
      expect(screen.getByText(/• Timed out/)).toBeInTheDocument();

      // Close grid, let remaining 3 sections (25m, 20m, 30m) expire -> then auto-submits
      fireEvent.click(screen.getByTitle('Question Grid'));

      await act(async () => {
        vi.advanceTimersByTime(25 * 60 * 1000);
      });
      expect(screen.getByText(/Verbal Ability/)).toBeInTheDocument();
      expect(screen.queryByText(/Section‑wise Breakdown/i)).not.toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(20 * 60 * 1000);
      });
      expect(screen.getByText(/Reasoning Ability/)).toBeInTheDocument();
      expect(screen.queryByText(/Section‑wise Breakdown/i)).not.toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });
      expect(screen.getByText(/Section‑wise Breakdown/i)).toBeInTheDocument();
    });

    it('auto-submits in single-section mode when that section times out', async () => {
      vi.useFakeTimers();
      renderExamRoute('/exam/tcs-nqt-foundation?mode=section&section=traits');

      fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));
      expect(screen.getByText(/Traits \(Behavioural\)/)).toBeInTheDocument();
      expect(screen.getByText('(1/1)')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });

      expect(screen.getByText(/Section‑wise Breakdown/i)).toBeInTheDocument();
    });
  });

  describe('Bug #3: ExamPractice CalcWidget chained operations', () => {
    it('evaluates chained operations accurately (2 + 3 + 4 = 9) and handles edge cases', () => {
      render(<CalcWidget onClose={vi.fn()} isLight={false} />);
      const pressSeq = (seq) => {
        seq.forEach((btn) => fireEvent.click(screen.getByRole('button', { name: btn })));
      };
      const display = () => screen.getByTestId('calc-display');

      pressSeq(['2', '+', '3', '+', '4', '=']);
      expect(display()).toHaveTextContent('9');

      pressSeq(['C', '1', '0', '-', '3', '-', '2', '=']);
      expect(display()).toHaveTextContent('5');

      pressSeq(['C', '2', '+', '×', '4', '=']);
      expect(display()).toHaveTextContent('8');

      pressSeq(['C', '1', '.', '5', '+', '2', '.', '.', '5', '=']);
      expect(display()).toHaveTextContent('4');

      pressSeq(['C', '5', '÷', '0', '=']);
      expect(display()).toHaveTextContent('Error');

      // Recovers cleanly from Error
      pressSeq(['2', '+', '3', '=']);
      expect(display()).toHaveTextContent('5');
    });

    it('works inside active ExamPractice session via Calculator button', () => {
      renderExamRoute('/exam/tcs-nqt-foundation');
      fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));
      fireEvent.click(screen.getByTitle('Calculator'));

      const pressSeq = (seq) => {
        seq.forEach((btn) => fireEvent.click(screen.getByRole('button', { name: btn })));
      };
      pressSeq(['2', '+', '3', '+', '4', '=']);
      expect(screen.getByTestId('calc-display')).toHaveTextContent('9');
    });
  });

  describe('Bug #10: Defer recording seen questions until exam actually starts', () => {
    it('does not write seen_questions_* to localStorage on intro screen, and records only after Start Exam', () => {
      renderExamRoute('/exam/tcs-nqt-foundation');

      expect(screen.getByRole('button', { name: /Start Exam/i })).toBeInTheDocument();
      expect(localStorage.getItem('seen_questions_quant')).toBeNull();
      expect(localStorage.getItem('seen_questions_verbal')).toBeNull();
      expect(localStorage.getItem('seen_questions_reasoning')).toBeNull();
      expect(localStorage.getItem('seen_questions_behavioural')).toBeNull();

      // Leaving without starting still keeps practice history untouched
      fireEvent.click(screen.getByText(/Back to Exam Hub/i));
      expect(screen.getByTestId('exam-hub')).toBeInTheDocument();
      expect(localStorage.getItem('seen_questions_quant')).toBeNull();

      cleanup();

      // Re-open and actually press Start Exam
      renderExamRoute('/exam/tcs-nqt-foundation');
      expect(localStorage.getItem('seen_questions_quant')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));

      expect(JSON.parse(localStorage.getItem('seen_questions_quant'))).toHaveLength(20);
      expect(JSON.parse(localStorage.getItem('seen_questions_verbal'))).toHaveLength(20);
      expect(JSON.parse(localStorage.getItem('seen_questions_reasoning'))).toHaveLength(20);
      expect(JSON.parse(localStorage.getItem('seen_questions_behavioural'))).toHaveLength(12);
    });

    it('supports section mode without recording seen_questions_* prior to Start Exam', () => {
      renderExamRoute('/exam/tcs-nqt-foundation?mode=section&section=traits');

      expect(localStorage.getItem('seen_questions_behavioural')).toBeNull();
      expect(localStorage.getItem('seen_questions_verbal')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /Start Exam/i }));
      expect(JSON.parse(localStorage.getItem('seen_questions_behavioural'))).toHaveLength(12);
      expect(localStorage.getItem('seen_questions_verbal')).toBeNull();
    });
  });

  describe('Bug #11: TCS Foundation behavioural section serves genuine behavioural questions', () => {
    it('serves 12 behavioural questions instead of verbal-ability questions', () => {
      const verbalIds = new Set(
        Object.values(verbalQuestions).flatMap((sub) => sub.questions.map((q) => q.id))
      );

      const traitsQuestions = getExamSectionQuestions('tcs-nqt-foundation', 'traits');
      expect(traitsQuestions).toHaveLength(12);
      traitsQuestions.forEach((q) => {
        expect(q.id).toMatch(/^beh_/);
        expect(verbalIds.has(q.id)).toBe(false);
        expect(q.options).toHaveLength(4);
        expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
      });

      localStorage.clear();
      const fullExam = getFullExamQuestions('tcs-nqt-foundation');
      const traitsSection = fullExam.sections.find((s) => s.id === 'traits');
      const verbalSection = fullExam.sections.find((s) => s.id === 'verbal-ability');

      expect(traitsSection.pool).toBe('behavioural');
      expect(traitsSection.questions).toHaveLength(12);
      expect(verbalSection.questions).toHaveLength(20);

      const verbalSectionIds = new Set(verbalSection.questions.map((q) => q.id));
      traitsSection.questions.forEach((q) => {
        expect(q.id).toMatch(/^beh_/);
        expect(verbalSectionIds.has(q.id)).toBe(false);
        expect(verbalIds.has(q.id)).toBe(false);
      });
    });
  });
});
