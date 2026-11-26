import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JobUpdates from '../pages/JobUpdates';
import * as AuthContext from '../context/AuthContext';
import * as authFetchModule from '../utils/authFetch';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockJobs = [
  {
    id: 'job-101',
    company: 'Google',
    title: 'Software Engineer III',
    type: 'full-time',
    location: 'Bangalore, India',
    experience: '3+ years',
    salary_range: '30-45 LPA',
    apply_link: 'https://careers.google.com/jobs/101',
    description: 'Build large-scale distributed systems and cloud services.',
  },
  {
    id: 'job-102',
    company: 'Microsoft',
    title: 'Frontend Developer',
    type: 'full-time',
    location: 'Hyderabad, India',
    experience: '1-3 years',
    salary_range: '20-30 LPA',
    apply_link: 'https://careers.microsoft.com/jobs/102',
    description: 'Develop rich web applications using React and TypeScript.',
  },
];

describe('JobUpdates Job Discovery <-> Job Tracker Integration', () => {
  let authFetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    authFetchMock = vi.spyOn(authFetchModule, 'authFetch').mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/jobs')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ jobs: mockJobs, totalPages: 1 }),
        });
      }
      if (urlStr.includes('/api/job-applications')) {
        if (!options || options.method === 'GET' || !options.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ applications: [] }),
          });
        }
        if (options.method === 'POST') {
          const body = JSON.parse(options.body);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              application: {
                id: 'app-999',
                company: body.company,
                role: body.role,
                status: body.status || 'bookmarked',
                jobUrl: body.jobUrl,
                location: body.location,
                salaryRange: body.salaryRange,
                notes: body.notes,
              },
            }),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    authFetchMock.mockRestore();
  });

  it('maintains backward compatibility with localStorage for guest users', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <JobUpdates />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Software Engineer III')).toBeInTheDocument();
    });

    const bookmarkBtns = screen.getAllByLabelText(/Bookmark & Add to Job Tracker/i);
    expect(bookmarkBtns.length).toBeGreaterThan(0);

    // Click bookmark as guest
    fireEvent.click(bookmarkBtns[0]);

    // Should be saved in localStorage
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    expect(saved).toContain('job-101');

    // Should NOT have made a POST to /job-applications
    const postCalls = authFetchMock.mock.calls.filter(([url, opts]) =>
      String(url).includes('/job-applications') && opts?.method === 'POST'
    );
    expect(postCalls.length).toBe(0);
  });

  it('authenticated user clicking "Add to Tracker" sends POST to /job-applications with valid payload and updates UI', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'user-abc-123', email: 'test@example.com' },
    });

    render(
      <MemoryRouter>
        <JobUpdates />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Software Engineer III')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /Add to Tracker/i });
    expect(addButtons.length).toBe(2);

    // Click Add to Tracker on the first job (Google)
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      const postCalls = authFetchMock.mock.calls.filter(([url, opts]) =>
        String(url).includes('/job-applications') && opts?.method === 'POST'
      );
      expect(postCalls.length).toBe(1);

      const [url, opts] = postCalls[0];
      expect(String(url)).toContain('/api/job-applications');
      const payload = JSON.parse(opts.body);
      expect(payload.company).toBe('Google');
      expect(payload.role).toBe('Software Engineer III');
      expect(payload.status).toBe('bookmarked');
      expect(payload.jobUrl).toBe('https://careers.google.com/jobs/101');
      expect(payload.location).toBe('Bangalore, India');
      expect(payload.salaryRange).toBe('30-45 LPA');
      expect(payload.notes).toContain('[job_id:job-101]');
    });

    // Button should now show "In Tracker (Bookmarked)"
    await waitFor(() => {
      expect(screen.getByText(/In Tracker \(Bookmarked\)/i)).toBeInTheDocument();
    });

    // LocalStorage savedJobs should also be synced
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    expect(saved).toContain('job-101');
  });

  it('handles duplicate bookmarks gracefully and navigates to tracker when already tracked', async () => {
    // Mock user having job-101 already tracked in phone_screen stage
    authFetchMock.mockImplementation((url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/jobs')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ jobs: mockJobs, totalPages: 1 }),
        });
      }
      if (urlStr.includes('/api/job-applications')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            applications: [
              {
                id: 'existing-app-1',
                company: 'Google',
                role: 'Software Engineer III',
                status: 'phone_screen',
                jobUrl: 'https://careers.google.com/jobs/101',
                notes: '[job_id:job-101]',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'user-abc-123', email: 'test@example.com' },
    });

    render(
      <MemoryRouter>
        <JobUpdates />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Software Engineer III')).toBeInTheDocument();
    });

    // Should recognize Google is already tracked in phone_screen stage
    await waitFor(() => {
      expect(screen.getByText(/In Tracker \(Phone Screen\)/i)).toBeInTheDocument();
    });

    // Clicking it should navigate to /job-tracker instead of duplicating POST
    const trackedBtn = screen.getByRole('button', { name: /In Tracker \(Phone Screen\)/i });
    fireEvent.click(trackedBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/job-tracker');

    // No POST calls should have been made
    const postCalls = authFetchMock.mock.calls.filter(([url, opts]) =>
      String(url).includes('/job-applications') && opts?.method === 'POST'
    );
    expect(postCalls.length).toBe(0);
  });

  it('surfaces backend error details and omits cache-busting _t param on /api/jobs', async () => {
    authFetchMock.mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/jobs')) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ error: 'Too many requests. Please try again in 30 seconds.' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ applications: [] }) });
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <JobUpdates />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Too many requests. Please try again in 30 seconds.')).toBeInTheDocument();
    });

    const jobCall = authFetchMock.mock.calls.find(([url]) => String(url).includes('/api/jobs'));
    expect(jobCall).toBeDefined();
    expect(String(jobCall[0])).not.toContain('_t=');
  });
});
