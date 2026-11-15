import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RealInterview from './RealInterview';

// Mock authFetch
vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' } }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { authFetch } from '../utils/authFetch';

describe('RealInterview (Real HR Interviews)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Real HR Interviews page with Back button', async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(
      <BrowserRouter>
        <RealInterview />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Real HR Interviews/i })).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: /Back to Interview Hub/i });
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalled();
  });
});
