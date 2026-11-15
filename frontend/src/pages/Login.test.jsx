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

  it('detects CapsLock toggling on password input and displays clean warning badge', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText('Password');
    expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument();

    fireEvent.keyDown(passwordInput, { key: 'CapsLock', modifierCapsLock: true });
    expect(screen.getByText('Caps Lock is on')).toBeInTheDocument();

    fireEvent.keyUp(passwordInput, { key: 'CapsLock', modifierCapsLock: false });
    expect(screen.queryByText('Caps Lock is on')).not.toBeInTheDocument();
  });

  it('detects 502/504 gateway waking up error and provides Try Again action', async () => {
    loginMock.mockRejectedValueOnce({
      response: { status: 502 },
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
      target: { value: 'ValidPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Our server is currently waking up. Please wait a few moments and click Try Again.'
    );
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});
