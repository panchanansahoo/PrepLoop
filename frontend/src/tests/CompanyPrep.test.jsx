import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CompanyPrep from '../pages/CompanyPrep';

describe('CompanyPrep Page', () => {
  it('renders without crashing and displays header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
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
});
