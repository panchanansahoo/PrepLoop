import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
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

  it('shows the server error and submits a normalized email', async () => {
    loginMock.mockRejectedValueOnce({
      response: { status: 401, data: { error: 'Invalid credentials' } },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: ' User@Example.com ' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(loginMock).toHaveBeenCalledWith('user@example.com', 'wrong-password');
  });

  it('shows the lockout message from the API', async () => {
    loginMock.mockRejectedValueOnce({
      response: {
        status: 429,
        data: { error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minute(s).' },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily locked/i);
  });
});
