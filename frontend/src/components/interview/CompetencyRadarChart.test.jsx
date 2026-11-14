/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CompetencyRadarChart, { calculateCompetencies } from './CompetencyRadarChart';

describe('CompetencyRadarChart component', () => {
  it('calculates competencies accurately from breakdown topics and question text', () => {
    const breakdown = [
      {
        question: 'Solve two sum using hash map and discuss time complexity',
        score: 90,
        coveredTopics: ['Hash Map', 'Time Complexity'],
      },
      {
        question: 'Explain React useEffect hooks and dependency arrays',
        score: 85,
        coveredTopics: ['React', 'Hooks', 'State'],
      },
      {
        question: 'Design a scalable caching layer with Redis and microservices',
        score: 95,
        coveredTopics: ['Redis', 'Microservices', 'Cache'],
      },
      {
        question: 'Tell me about a time you handled conflict on your team using STAR',
        score: 80,
        coveredTopics: ['STAR', 'Conflict', 'Communication'],
      },
    ];

    const result = calculateCompetencies({ breakdown, overallScore: 88 });

    expect(result).toHaveLength(4);

    const problemSolving = result.find((r) => r.key === 'problem_solving');
    const techDepth = result.find((r) => r.key === 'technical_depth');
    const comms = result.find((r) => r.key === 'communication');
    const arch = result.find((r) => r.key === 'system_architecture');

    expect(problemSolving.score).toBeGreaterThanOrEqual(80);
    expect(techDepth.score).toBeGreaterThanOrEqual(80);
    expect(comms.score).toBeGreaterThanOrEqual(75);
    expect(arch.score).toBeGreaterThanOrEqual(85);
  });

  it('renders SVG radar chart and all 4 competency cards', () => {
    render(
      <CompetencyRadarChart
        overallScore={82}
        targetScore={70}
        customScores={{
          problem_solving: 85,
          technical_depth: 88,
          communication: 78,
          system_architecture: 82,
        }}
      />
    );

    expect(screen.getByText(/Competency Radar & Weighted Mastery/i)).toBeInTheDocument();
    expect(screen.getAllByText('Problem Solving').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Technical Depth').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Communication').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('System Architecture').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/85/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/88/).length).toBeGreaterThanOrEqual(1);
  });

  it('allows clicking a competency card to toggle selection state', () => {
    render(<CompetencyRadarChart overallScore={75} />);

    const psCard = screen.getAllByText('Problem Solving')[0].closest('div');
    if (psCard) fireEvent.click(psCard);
    // Should render smoothly without errors
    expect(screen.getByText(/Algorithmic mapping across Problem Solving/i)).toBeInTheDocument();
  });
});
