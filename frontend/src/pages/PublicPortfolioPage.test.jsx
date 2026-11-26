import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicPortfolioPage from './PublicPortfolioPage';

const mockAuthFetch = vi.fn();

vi.mock('../utils/authFetch', () => ({
  authFetch: (...args) => mockAuthFetch(...args),
}));

function renderPublicPage(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/u/:slug" element={<PublicPortfolioPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicPortfolioPage template and custom branding (Bug 11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies template data attribute, custom colors, and allowlisted font from public site payload', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        portfolio: {
          basics: { name: 'Jane Doe', title: 'Staff Engineer', summary: 'Builds tools' },
          socials: {},
          skills: { languages: ['TypeScript'], frameworks: [], tools: [], domains: [] },
          experience: [],
          education: [],
          projects: [],
          achievements: [],
          portfolioMeta: {
            slug: 'jane-doe',
            visibility: 'public',
            template: 'creative',
            branding: {
              primaryColor: '#123456',
              accentColor: '#abcdef',
              fontFamily: "'Poppins', sans-serif",
            },
          },
        },
      }),
    });

    const { container } = renderPublicPage('/u/jane-doe?site=1');

    expect(await screen.findByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/portfolio/public/jane-doe?site=1'),
      expect.any(Object)
    );

    const pageEl = container.querySelector('.pp-page');
    expect(pageEl).toHaveAttribute('data-template', 'creative');
    expect(pageEl.style.getPropertyValue('--pp-brand-primary')).toBe('#123456');
    expect(pageEl.style.getPropertyValue('--pp-brand-accent')).toBe('#abcdef');
    expect(pageEl.style.fontFamily).toContain('Poppins');
  });

  it('ignores non-allowlisted fonts and invalid hex colors while still applying valid template', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        portfolio: {
          basics: { name: 'Alex Smith' },
          socials: {},
          skills: { languages: [], frameworks: [], tools: [], domains: [] },
          experience: [],
          education: [],
          projects: [],
          achievements: [],
          portfolioMeta: {
            slug: 'alex-smith',
            visibility: 'unlisted',
            template: 'fresher',
            branding: {
              primaryColor: 'red; background: url(bad)',
              accentColor: '#zzz',
              fontFamily: 'Comic Sans MS',
            },
          },
        },
      }),
    });

    const { container } = renderPublicPage('/u/alex-smith?site=1');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alex Smith' })).toBeInTheDocument();
    });

    const pageEl = container.querySelector('.pp-page');
    expect(pageEl).toHaveAttribute('data-template', 'fresher');
    expect(pageEl.style.getPropertyValue('--pp-brand-primary')).toBe('');
    expect(pageEl.style.getPropertyValue('--pp-brand-accent')).toBe('');
    expect(pageEl.style.fontFamily).toBe('');
  });
});
