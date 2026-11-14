/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CandidateReviewDossier from './CandidateReviewDossier';

describe('CandidateReviewDossier component', () => {
  const mockSubmission = {
    id: 'sub-test-123',
    user_name: 'Jordan Lee',
    user_email: 'jordan.lee@example.com',
    overall_score: 84,
    duration: 720, // 12 minutes
    scores: {
      passingScore: 70,
      decision: 'qualified',
      integrity: {
        flagged: false,
        tabSwitchCount: 1,
        pasteCount: 0,
        integrityRating: 'clean',
      },
      executiveSummary: {
        keyStrengths: 'Strong knowledge of React hooks and system architecture caching.',
        growthAreas: 'Could elaborate on database sharding failure modes.',
        hiringRecommendation: 'Strong Hire - Met and exceeded benchmark.',
      },
      breakdown: [
        {
          questionIndex: 1,
          question: 'Implement an LRU Cache with O(1) operations',
          score: 88,
          elapsedSeconds: 150,
          coveredTopics: ['Hash Map', 'Doubly Linked List', 'O(1)'],
          missedTopics: [],
          answer: 'Used a doubly linked list with hash table for constant time get and put.',
        },
        {
          questionIndex: 2,
          question: 'How do you handle distributed race conditions?',
          score: 80,
          elapsedSeconds: 180,
          coveredTopics: ['Distributed Lock', 'Redis', 'Redlock'],
          missedTopics: ['Fencing Tokens'],
          answer: 'Used Redis redlock and database optimistic locking.',
        },
      ],
    },
  };

  it('renders executive summary, 5 stat cards including cohort ranking, radar chart, and audio timeline player', () => {
    render(
      <CandidateReviewDossier
        submission={mockSubmission}
        questionSet={{ title: 'Senior Backend Engineer Assessment', share_code: 'ENG-2026' }}
        inline={true}
      />
    );

    // Header & Executive Summary
    expect(screen.getByText('Senior Backend Engineer Assessment')).toBeInTheDocument();
    expect(screen.getByText('ENG-2026')).toBeInTheDocument();
    expect(screen.getByText(/Executive Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Key Strengths:/i)).toBeInTheDocument();

    // Cohort Ranking Badge Card
    expect(screen.getByText('Cohort Ranking')).toBeInTheDocument();
    expect(screen.getAllByText(/Top \d+%/i).length).toBeGreaterThanOrEqual(1);

    // Embedded Competency Radar Chart
    expect(screen.getByText(/Competency Radar & Weighted Mastery/i)).toBeInTheDocument();
    expect(screen.getAllByText('Problem Solving').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Technical Depth').length).toBeGreaterThanOrEqual(1);

    // Embedded Audio Timeline Player
    expect(screen.getByText(/Interactive Audio Timeline & AI Flags/i)).toBeInTheDocument();
    expect(screen.getByText('Interview Recording & Team Review')).toBeInTheDocument();

    // Question breakdown
    expect(screen.getByText('LRU Cache', { exact: false })).toBeInTheDocument();
  });

  it('supports explicit cohortBenchmark prop data', () => {
    const customCohortBenchmark = {
      percentile: 94,
      topPercentage: 6,
      badgeText: 'Top 6%',
      subtext: '94th percentile',
      rankText: 'Rank 2 of 35',
      color: '#10b981',
    };

    render(
      <CandidateReviewDossier
        submission={mockSubmission}
        cohortBenchmark={customCohortBenchmark}
        inline={true}
      />
    );

    expect(screen.getByText('Top 6%')).toBeInTheDocument();
    expect(screen.getByText(/94th percentile · Rank 2 of 35/i)).toBeInTheDocument();
  });

  it('triggers window.print when Print / PDF Dossier button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <CandidateReviewDossier
        submission={mockSubmission}
        inline={true}
      />
    );

    const printButton = screen.getByRole('button', { name: /Print \/ PDF Dossier/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
