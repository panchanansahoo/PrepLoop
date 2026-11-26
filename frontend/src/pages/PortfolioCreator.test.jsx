import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import PortfolioCreator from './PortfolioCreator';
import { createPortfolioSite, importPortfolioProfile, updatePortfolioProfile } from '../api/portfolioService';

vi.mock('../api/portfolioService', () => ({
  createPortfolioSite: vi.fn(),
  importPortfolioProfile: vi.fn(),
  updatePortfolioProfile: vi.fn(),
  parseLinkedinExport: vi.fn(),
  uploadResumeForPortfolio: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('imports a LinkedIn About excerpt as the only source', async () => {
  importPortfolioProfile.mockResolvedValue({ id: 'p1', basicInfo: { summary: 'I build tools.' } });
  render(<MemoryRouter><PortfolioCreator /></MemoryRouter>);

  fireEvent.change(screen.getByPlaceholderText(/Paste your LinkedIn About/i), { target: { value: 'I build tools.' } });
  fireEvent.click(screen.getByRole('button', { name: /Import and continue/ }));

  expect(await screen.findByLabelText('Summary')).toHaveValue('I build tools.');
  expect(importPortfolioProfile).toHaveBeenLastCalledWith(expect.objectContaining({
    linkedin: expect.objectContaining({ exportText: 'I build tools.' }),
  }));
});

it('carries the saved profile into the builder and renders a private preview', async () => {
  const profile = {
    id: 'p2',
    basicInfo: { fullName: 'Jane Doe', headline: 'Staff Engineer', summary: 'Saved profile summary' },
    skills: { languages: ['TypeScript', 'Python'], frameworks: ['React'], tools: [], domains: [] },
    experience: [{ role: 'Senior Engineer', company: 'Acme' }],
    education: [{ institute: 'State University', degree: 'B.S. CS' }],
    projects: [],
  };
  importPortfolioProfile.mockResolvedValue(profile);
  updatePortfolioProfile.mockResolvedValue(profile);
  createPortfolioSite.mockResolvedValue({ slug: 'jane-doe', published: false });
  render(<MemoryRouter initialEntries={[{ pathname: '/portfolio-creator', state: { form: { useSavedProfile: true, githubUsername: null, linkedinUrl: undefined } } }]}><PortfolioCreator /></MemoryRouter>);

  expect(screen.getByRole('checkbox', { name: /Use my saved PrepLoop profile/ })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: /Import and continue/ }));
  expect(await screen.findByLabelText('Summary')).toHaveValue('Saved profile summary');
  expect(screen.getByLabelText('Skills')).toHaveTextContent('TypeScript');
  expect(screen.getByLabelText('Experience')).toHaveTextContent('Senior Engineer');
  expect(screen.getByLabelText('Education')).toHaveTextContent('State University');
  expect(importPortfolioProfile).toHaveBeenLastCalledWith(expect.objectContaining({ useSavedProfile: true }));

  fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
  expect(updatePortfolioProfile).toHaveBeenLastCalledWith('p2', expect.objectContaining({
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
  }));
  fireEvent.click(await screen.findByRole('button', { name: 'Continue to publish' }));
  fireEvent.change(screen.getByLabelText('Visibility'), { target: { value: 'private' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save private portfolio' }));
  expect(await screen.findByRole('link', { name: 'Preview private portfolio' }))
    .toHaveAttribute('href', '/u/jane-doe?site=1');
  expect(createPortfolioSite).toHaveBeenLastCalledWith(expect.objectContaining({ profileId: 'p2', visibility: 'private' }));
});

it('shows an error when no import source is selected', () => {
  render(<MemoryRouter><PortfolioCreator /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Import and continue/ }));
  expect(screen.getByText(/Add your saved profile, a resume, GitHub, or LinkedIn details/i)).toBeInTheDocument();
  expect(importPortfolioProfile).not.toHaveBeenCalled();
});
