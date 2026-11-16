import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CompanyPrep from '../pages/CompanyPrep';

describe('CompanyPrep Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing and displays header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        questions: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
      }),
    });

    render(
      <MemoryRouter>
        <CompanyPrep />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Company Prep Hub')).toBeInTheDocument();
    });

    expect(screen.getByText('Coding Exam (OA)')).toBeInTheDocument();
    expect(screen.getByText('Voice Interview')).toBeInTheDocument();
  });

  it('fetches paginated questions from backend API and renders cards', async () => {
    const mockQuestions = [
      {
        id: 'google_1',
        company: 'google',
        role: 'SDE',
        stage: 'Technical',
        difficulty: 'Medium',
        question: 'Design an LRU Cache with O(1) operations',
        answer: 'Hash map and doubly linked list',
        tags: ['design', 'linked-list'],
        frequencyScore: 4,
        lastReported: '2026-01-01',
      },
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes('/api/company-interview/questions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            questions: mockQuestions,
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <MemoryRouter>
        <CompanyPrep />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Design an LRU Cache with O(1) operations')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/company-interview/questions?page=1&limit=25'),
      expect.any(Object)
    );
  });

  it('gracefully engages offline fallback when API call rejects without crashing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error: offline'));

    render(
      <MemoryRouter>
        <CompanyPrep />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Company Prep Hub')).toBeInTheDocument();
      expect(screen.getByText('Offline Mode Active')).toBeInTheDocument();
    });
  });
});
