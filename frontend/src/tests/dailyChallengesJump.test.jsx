/* @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { dailyChallenges } from '../data/dailyChallenges';
import DailyChallengesPage from '../pages/DailyChallengesPage';

describe('DailyChallengesPage Jump to Today (Bug #5)', () => {
  afterEach(() => {
    cleanup();
  });

  it('clears hiding filters and scrolls to today company card when Jump to Today is clicked', async () => {
    const d = new Date();
    const seed = d.getDate() + d.getMonth() * 31 + d.getFullYear() * 366;
    const todayCompany = dailyChallenges[seed % dailyChallenges.length];
    const otherCompany = dailyChallenges.find((c) => c.id !== todayCompany.id);

    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    render(
      <ThemeProvider>
        <MemoryRouter>
          <DailyChallengesPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search companies...');
    fireEvent.change(searchInput, { target: { value: otherCompany.name } });

    expect(document.getElementById(`company-${todayCompany.id}`)).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: /Jump to Today/i }));

    await waitFor(() => {
      expect(searchInput.value).toBe('');
      const targetCard = document.getElementById(`company-${todayCompany.id}`);
      expect(targetCard).not.toBeNull();
      expect(scrollSpy).toHaveBeenCalled();
    });
  });
});
