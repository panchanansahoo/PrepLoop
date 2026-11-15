import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import JobTracker from './JobTracker';
import * as authFetchModule from '../utils/authFetch';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123', email: 'test@preploop.com' } }),
}));

const mockApplications = [
  {
    id: 'app-1',
    company: 'Stripe',
    role: 'Staff Infrastructure Engineer',
    status: 'applied',
    location: 'Remote',
    salaryRange: '$220k - $260k',
    jobUrl: 'https://stripe.com/jobs/1',
    notes: 'Referred by senior engineer',
  },
  {
    id: 'app-2',
    company: 'Google',
    role: 'Senior Software Engineer',
    status: 'phone_screen',
    location: 'Mountain View, CA',
    salaryRange: '$250k - $300k',
    jobUrl: 'https://google.com/jobs/2',
    notes: 'Recruiter screen scheduled for Friday',
  },
  {
    id: 'app-3',
    company: 'Databricks',
    role: 'Distributed Systems Lead',
    status: 'offer',
    location: 'San Francisco, CA',
    salaryRange: '$320k',
    jobUrl: '',
    notes: 'Received written offer',
  },
  {
    id: 'app-4',
    company: 'Meta',
    role: 'Production Engineer',
    status: 'rejected',
    location: 'Menlo Park, CA',
    salaryRange: '$200k',
    jobUrl: '',
    notes: 'Role filled internally',
  },
  {
    id: 'app-5',
    company: 'Linear',
    role: 'Frontend Architect',
    status: 'bookmarked',
    location: 'Remote',
    salaryRange: '$180k',
    jobUrl: '',
    notes: 'Review open source contributions',
  },
];

describe('JobTracker Page Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(authFetchModule, 'authFetch').mockImplementation(async (url, options) => {
      const urlStr = String(url);
      if (!options || options.method === 'GET' || !options.method) {
        return {
          ok: true,
          json: async () => ({ applications: mockApplications }),
        };
      }

      if (options.method === 'PATCH') {
        const body = JSON.parse(options.body || '{}');
        const idMatch = urlStr.match(/\/job-applications\/(.+)$/);
        const appId = idMatch ? idMatch[1] : 'app-1';
        const existing = mockApplications.find((a) => a.id === appId) || {};
        return {
          ok: true,
          json: async () => ({
            application: { ...existing, ...body, id: appId },
          }),
        };
      }

      if (options.method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        return {
          ok: true,
          json: async () => ({
            application: { ...body, id: 'new-app-id' },
          }),
        };
      }

      if (options.method === 'DELETE') {
        return {
          ok: true,
          json: async () => ({ deleted: true, id: 'app-1' }),
        };
      }

      return { ok: true, json: async () => ({}) };
    });
  });

  it('renders pipeline analytics header with correct counts and conversion rate', async () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    // 5 applications in total
    expect(screen.getByText('Total Tracked')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    // Active pipeline: Stripe (applied), Google (phone_screen) -> 2
    expect(screen.getByText('Active Pipeline')).toBeInTheDocument();
    // Interviewing: Google (phone_screen) -> 1
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
    // Offers: Databricks (offer) -> 1
    expect(screen.getAllByText('Offers').length).toBeGreaterThanOrEqual(1);
    // Conversion rate: appliedOrBeyond = 4 (Stripe, Google, Databricks, Meta), interviewing + offers = 2 (Google, Databricks) -> 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('filters applications in real-time by search query and filter pills', async () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by company or role...');
    fireEvent.change(searchInput, { target: { value: 'Distributed Systems' } });

    expect(screen.getByText('Databricks')).toBeInTheDocument();
    expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Stripe')).toBeInTheDocument();

    // Filter pill: In Interview
    const interviewPill = screen.getByRole('button', { name: /In Interview/i });
    fireEvent.click(interviewPill);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
    expect(screen.queryByText('Databricks')).not.toBeInTheDocument();
  });

  it('provides quick stage navigation buttons to move between Kanban columns', async () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    // Stripe is currently 'applied' (index 1)
    // Advance Stripe to 'phone_screen'
    const advanceButton = screen.getByLabelText('Move Stripe to next stage');
    fireEvent.click(advanceButton);

    await waitFor(() => {
      expect(authFetchModule.authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/job-applications/app-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'phone_screen' }),
        })
      );
    });
  });

  it('opens edit modal, allows modifying fields, and updates application via PATCH', async () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText('Edit Stripe Staff Infrastructure Engineer');
    fireEvent.click(editBtn);

    // Edit Modal opens
    expect(screen.getByRole('heading', { name: 'Edit Application' })).toBeInTheDocument();

    const roleInput = screen.getByDisplayValue('Staff Infrastructure Engineer');
    fireEvent.change(roleInput, { target: { value: 'Principal Infrastructure Engineer' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authFetchModule.authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/job-applications/app-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Principal Infrastructure Engineer'),
        })
      );
    });
  });

  it('supports deep linking to Company Prep with query params and AI Copilot with location state', async () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const prepLinks = screen.getAllByRole('link', { name: /Prep →/i });
    expect(prepLinks.some((l) => l.getAttribute('href') === '/company-prep?company=Google')).toBe(true);

    const copilotLinks = screen.getAllByRole('link', { name: /Copilot/i });
    expect(copilotLinks.some((l) => l.getAttribute('href') === '/copilot')).toBe(true);
  });

  it('copies customized follow-up email template to clipboard with visual confirmation', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    const followUpButtons = screen.getAllByRole('button', { name: /Follow-up/i });
    expect(followUpButtons.length).toBeGreaterThan(0);
    fireEvent.click(followUpButtons[0]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('Following Up:')
      );
    });

    expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
  });

  it('allows user to set skills & experience, view matched active jobs, and 1-click track as applied', async () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <JobTracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Matched Opportunities/i)).toBeInTheDocument();
    });

    // Switch to Matched Opportunities view
    const matchedTab = screen.getByRole('button', { name: /Matched Opportunities/i });
    fireEvent.click(matchedTab);

    // Profile configuration is visible
    expect(screen.getByText('Your Skills & Experience Profile')).toBeInTheDocument();
    expect(screen.getByText('Experience Level:')).toBeInTheDocument();

    // Verify matched jobs are shown with match scores
    await waitFor(() => {
      expect(screen.getByText(/Active Jobs Matching Your Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/Software Engineer - Frontend/i)).toBeInTheDocument();
    });

    // 1-Click Track as Applied on Google SWE
    const trackButtons = screen.getAllByRole('button', { name: /Track as Applied/i });
    expect(trackButtons.length).toBeGreaterThan(0);
    fireEvent.click(trackButtons[0]);

    // Should call POST /job-applications with status 'applied'
    await waitFor(() => {
      expect(authFetchModule.authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/job-applications'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"status":"applied"'),
        })
      );
    });

    // Toast confirms addition
    await waitFor(() => {
      expect(screen.getByText(/Added Google/i)).toBeInTheDocument();
    });
  });
});
