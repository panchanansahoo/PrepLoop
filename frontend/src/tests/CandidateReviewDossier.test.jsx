import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CandidateReviewDossier from '../components/interview/CandidateReviewDossier.jsx';

describe('CandidateReviewDossier Component (Stage 4 Candidate Dossier)', () => {
  const mockSubmission = {
    id: 'sub-test-999',
    user_name: 'Alex Mercer',
    user_email: 'alex@example.com',
    overall_score: 84,
    duration: 1800,
    completed_at: new Date('2026-11-14T10:00:00Z').toISOString(),
    scores: {
      serverOverallScore: 84,
      passingScore: 70,
      decision: 'qualified',
      integrity: {
        flagged: false,
        tabSwitchCount: 0,
        pasteCount: 0,
        integrityRating: 'clean',
      },
      executiveSummary: {
        keyStrengths: 'Solid comprehension of microservices decomposition and event-driven patterns.',
        growthAreas: 'Could discuss circuit breakers and latency budgets more deeply.',
        hiringRecommendation: 'Strong Hire / Advance - Cleared benchmark with 84%.',
        bullets: [
          'Key Strengths: Solid comprehension of microservices decomposition and event-driven patterns.',
          'Growth Areas: Could discuss circuit breakers and latency budgets more deeply.',
          'Hiring Recommendation: Strong Hire / Advance - Cleared benchmark with 84%.',
        ],
      },
      reviewerNotes: 'Candidate spoke with high conviction on asynchronous processing.',
      breakdown: [
        {
          questionIndex: 1,
          question: 'How do you design a high-throughput message consumer?',
          score: 85,
          coveredTopics: ['kafka', 'consumer groups', 'backpressure'],
          missedTopics: ['dead letter queue'],
          answer: 'We used Kafka consumer groups with backpressure monitoring.',
          elapsedSeconds: 120,
          timeLimit: 180,
        },
      ],
    },
  };

  const mockQuestionSet = {
    title: 'Senior Systems Architecture',
    share_code: 'sys-arch-99',
    interview_type: 'Technical',
  };

  it('renders candidate details, score pill, and decision badge accurately', () => {
    render(<CandidateReviewDossier submission={mockSubmission} questionSet={mockQuestionSet} inline />);

    expect(screen.getByText('Alex Mercer')).toBeDefined();
    expect(screen.getByText('alex@example.com')).toBeDefined();
    expect(screen.getByText('Senior Systems Architecture')).toBeDefined();
    expect(screen.getByText(/QUALIFIED/i)).toBeDefined();
    expect(screen.getAllByText('84').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Clean Focus/i)).toBeDefined();
  });

  it('renders the 3-bullet Executive Summary clearly', () => {
    render(<CandidateReviewDossier submission={mockSubmission} questionSet={mockQuestionSet} inline />);

    expect(screen.getByText(/Executive Summary/i)).toBeDefined();
    expect(screen.getByText(/Key Strengths:/i)).toBeDefined();
    expect(screen.getByText(/Growth Areas:/i)).toBeDefined();
    expect(screen.getByText(/Hiring Recommendation:/i)).toBeDefined();
    expect(screen.getByText(/Solid comprehension of microservices/i)).toBeDefined();
    expect(screen.getByText(/circuit breakers/i)).toBeDefined();
    expect(screen.getByText(/Strong Hire \/ Advance/i)).toBeDefined();
  });

  it('renders question breakdown with covered and missed topics', () => {
    render(<CandidateReviewDossier submission={mockSubmission} questionSet={mockQuestionSet} inline />);

    expect(screen.getByText(/How do you design a high-throughput message consumer/i)).toBeDefined();
    expect(screen.getAllByText('kafka').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('consumer groups').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('dead letter queue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/We used Kafka consumer groups/i)).toBeDefined();
  });

  it('triggers window.print when Print / PDF Dossier button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<CandidateReviewDossier submission={mockSubmission} questionSet={mockQuestionSet} inline />);

    const printButton = screen.getByRole('button', { name: /Print \/ PDF Dossier/i });
    expect(printButton).toBeDefined();

    fireEvent.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it('calls onClose when close button is clicked in modal mode', () => {
    const onClose = vi.fn();
    render(<CandidateReviewDossier submission={mockSubmission} questionSet={mockQuestionSet} onClose={onClose} />);

    const closeButton = screen.getByTitle('Close dossier');
    expect(closeButton).toBeDefined();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
