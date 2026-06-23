import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithGithub: vi.fn(),
    loginWithLinkedin: vi.fn(),
  }),
}));

describe('Login page', () => {
  it('renders interview prep feature bullets without runtime reference errors', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/ATS-optimized scoring/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });
});
