import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { ThemeProvider } from '../context/ThemeContext';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    createRadialGradient: () => ({
      addColorStop: vi.fn(),
    }),
    createLinearGradient: () => ({
      addColorStop: vi.fn(),
    }),
  });
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Alex Rivera', email: 'alex@example.com' },
    isAuthenticated: true,
    isAdmin: false,
  }),
}));

// Mock useDashboardData
vi.mock('../hooks/useDashboardData', () => ({
  default: () => ({
    data: {
      streak: 5,
      bestStreak: 12,
      avgScore: 84,
      heatmapData: {},
      stats: { problemsSolved: 42, mockInterviews: 8 },
      readinessData: { practiceCount: 20, mockCount: 4, streak: 5, timedSessions: 3 },
      skillBreakdown: [
        { subject: 'DSA', A: 85, fullMark: 100 },
        { subject: 'System Design', A: 70, fullMark: 100 },
      ],
      recentActivity: [],
      dailyChallenge: {
        id: '1',
        title: 'Two Sum',
        difficulty: 'Easy',
        dsa: [{ title: 'Two Sum', difficulty: 'Easy', internalId: 1 }],
        sql: [{ title: 'Employees Earning More', difficulty: 'Easy', internalId: 2 }],
      },
      upcomingContests: [
        {
          platform: 'Codeforces',
          name: 'Codeforces Round 1000',
          date: new Date(Date.now() + 86400000),
          duration: '2 hrs',
          link: 'https://codeforces.com/contest/1000',
          live: true,
        },
      ],
      thisWeekProblems: 14,
      thisWeekTime: 120,
      thisWeekXP: 350,
      lastWeekProblems: 10,
      lastWeekTime: 90,
      lastWeekXP: 250,
    },
    loading: false,
    error: null,
  }),
}));

describe('Dashboard Online Assessments and External Contests Widgets', () => {
  it('renders both native PrepLoop Company Online Assessments and external 3rd-party upcoming contests', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Dashboard />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Header greeting
    expect(screen.getByText(/Alex/i)).toBeInTheDocument();

    // Check Upcoming Contests widget is rendered
    const upcomingHeading = screen.getByText(/Upcoming Contests/i);
    expect(upcomingHeading).toBeInTheDocument();
    expect(screen.getByText(/Codeforces Round 1000/i)).toBeInTheDocument();

    // Check Company Online Assessments widget is rendered
    const companyHeading = screen.getByText('Company Online Assessments');
    expect(companyHeading).toBeInTheDocument();
    expect(screen.getByText(/PrepLoop OA Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Google OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazon OA/i)).toBeInTheDocument();

    // Check Quick Actions and Weekly Progress widgets are rendered
    const quickActionsHeading = screen.getByText('Quick Actions');
    expect(quickActionsHeading).toBeInTheDocument();

    const weeklyProgressHeading = screen.getByText('Weekly Progress');
    expect(weeklyProgressHeading).toBeInTheDocument();

    // Verify DOM order: Upcoming Contests -> Company Online Assessments -> Quick Actions -> Weekly Progress
    expect(upcomingHeading.compareDocumentPosition(companyHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(companyHeading.compareDocumentPosition(quickActionsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(quickActionsHeading.compareDocumentPosition(weeklyProgressHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
