import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OnlineAssessmentsWidget from '../components/OnlineAssessmentsWidget';
import { ThemeProvider } from '../context/ThemeContext';

describe('OnlineAssessmentsWidget', () => {
  const renderWidget = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <OnlineAssessmentsWidget />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders widget title, badge, and default top tech company assessments', () => {
    renderWidget();
    expect(screen.getByText('Company Online Assessments')).toBeInTheDocument();
    expect(screen.getByText(/PrepLoop OA Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Google OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazon OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Meta OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Microsoft OA/i)).toBeInTheDocument();
  });

  it('switches between Top Tech OAs and Campus Placement OAs tabs', () => {
    renderWidget();
    const campusTab = screen.getByRole('button', { name: /Campus Placements/i });
    fireEvent.click(campusTab);

    expect(screen.getByText(/TCS OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Infosys OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Cognizant OA/i)).toBeInTheDocument();
    expect(screen.getByText(/Wipro OA/i)).toBeInTheDocument();

    const techTab = screen.getByRole('button', { name: /Top Tech OAs/i });
    fireEvent.click(techTab);

    expect(screen.getByText(/Google OA/i)).toBeInTheDocument();
  });

  it('renders direct start assessment links pointing to PrepLoop routes', () => {
    renderWidget();
    const startButtons = screen.getAllByRole('link', { name: /Start Assessment/i });
    expect(startButtons.length).toBeGreaterThanOrEqual(4);

    const googleLink = startButtons[0].closest('a');
    expect(googleLink).toHaveAttribute('href', expect.stringContaining('/coding-round?company=google'));
  });

  it('renders bottom feature footer with links to Custom OA and Voice Mock', () => {
    renderWidget();
    expect(screen.getByText(/Authentic Test Environment:/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Launch Custom OA/i })).toHaveAttribute('href', '/coding-round');
    expect(screen.getByRole('link', { name: /AI Voice Mock/i })).toHaveAttribute('href', '/company-interview');
  });
});
