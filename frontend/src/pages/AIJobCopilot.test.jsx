import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AIJobCopilot from './AIJobCopilot';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

describe('AIJobCopilot', () => {
  it('renders core sections and keeps Analyze button disabled initially', () => {
    render(
      <MemoryRouter>
        <AIJobCopilot />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'AI Job Copilot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyse CV/i })).toBeDisabled();
    expect(screen.getByText('Cover Letter')).toBeInTheDocument();
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
  });
});
