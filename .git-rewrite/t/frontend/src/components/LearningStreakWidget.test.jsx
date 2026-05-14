import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LearningStreakWidget from './LearningStreakWidget';
import { ThemeProvider } from '../context/ThemeContext';

function renderWidget(data) {
  return render(
    <ThemeProvider>
      <LearningStreakWidget data={data} />
    </ThemeProvider>
  );
}

describe('LearningStreakWidget', () => {
  it('renders backend streak values when provided, including 0', () => {
    renderWidget({
      streak: 0,
      bestStreak: 5,
      weekProgress: [false, false, false, false, false, false, false],
    });

    expect(screen.getByText('0')).toBeInTheDocument();
    const bestLabels = screen.getAllByText((_, element) =>
      element?.textContent?.includes('Best:') && element.textContent.includes('5')
    );
    expect(bestLabels.length).toBeGreaterThan(0);
  });

  it('uses safe defaults when data is missing', () => {
    renderWidget(undefined);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
