import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AIJobCopilot from './AIJobCopilot';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

describe('AIJobCopilot', () => {
  it('renders core sections and keeps Analyze button disabled initially', () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <AIJobCopilot />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'AI Job Copilot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyse CV/i })).toBeDisabled();
    expect(screen.getByText('Cover Letter')).toBeInTheDocument();
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
  }, 15000);
});
