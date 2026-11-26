import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BlogList from './BlogList';
import BlogPost from './BlogPost';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

describe('BlogList & BlogPost', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a loading error with retry instead of "No articles found" when the first load fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'ed-1',
            slug: 'editorial-launch',
            title: 'Editorial Launch',
            category: 'General',
            source: 'editorial',
            published_at: '2026-04-05T00:00:00.000Z',
            excerpt: 'Published from admin API',
            author: { full_name: 'PrepLoop Team' },
          },
        ]),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <BlogList />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load articles.');
    expect(screen.queryByText(/No articles found/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Editorial Launch')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Editorial Launch/i })).toHaveAttribute(
      'href',
      '/blog/editorial-launch?source=editorial'
    );
  });

  it('clears previous category articles and shows an error when switching categories fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'legacy-1',
            slug: 'all-post',
            title: 'All Category Post',
            category: 'General',
            created_at: '2026-04-01T00:00:00.000Z',
            excerpt: 'Visible on initial load',
          },
        ]),
      })
      .mockRejectedValueOnce(new Error('Network down'));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <BlogList />
      </MemoryRouter>
    );

    expect(await screen.findByText('All Category Post')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'DSA' }));

    await waitFor(() => {
      expect(screen.queryByText('All Category Post')).not.toBeInTheDocument();
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load articles.');
    expect(screen.queryByText(/No articles found/i)).not.toBeInTheDocument();
  });

  it('requests editorial source and renders editorial post content with published_at date in BlogPost', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'ed-1',
        slug: 'editorial-launch',
        title: 'Editorial Launch',
        category: 'General',
        source: 'editorial',
        published_at: '2026-04-05T12:00:00.000Z',
        content: '<p>Editorial body content</p>',
        author: { full_name: 'PrepLoop Team' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/blog/editorial-launch?source=editorial']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Editorial Launch' })).toBeInTheDocument();
    expect(screen.getByText('Editorial body content')).toBeInTheDocument();
    expect(screen.getByText('PrepLoop Team')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/blog\/editorial-launch\?source=editorial$/),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('shares article via clipboard fallback and Web Share API with status feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'legacy-1',
        slug: 'share-post',
        title: 'Shareable Post',
        created_at: '2026-04-05T12:00:00.000Z',
        content: '<p>Share body</p>',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/blog/share-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    const shareButton = await screen.findByRole('button', { name: 'Share article' });
    fireEvent.click(shareButton);
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByRole('status')).toHaveTextContent('Article link copied.');

    unmount();

    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });

    render(
      <MemoryRouter initialEntries={['/blog/share-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Share article' }));
    expect(shareMock).toHaveBeenCalledWith({ title: 'Shareable Post', url: window.location.href });
    expect(await screen.findByRole('status')).toHaveTextContent('Article shared.');
  });

  it('toggles Save bookmark state, persists in localStorage, and filters Saved articles in BlogList', async () => {
    const postPayload = {
      id: 'ed-save',
      slug: 'saved-editorial',
      title: 'Saved Editorial',
      category: 'General',
      source: 'editorial',
      published_at: '2026-04-05T12:00:00.000Z',
      content: '<p>Saved body</p>',
      excerpt: 'Saved excerpt',
    };
    const otherPost = {
      id: 'leg-other',
      slug: 'other-post',
      title: 'Other Post',
      category: 'General',
      created_at: '2026-04-04T12:00:00.000Z',
      excerpt: 'Other excerpt',
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => postPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => postPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => [postPayload, otherPost] });
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <MemoryRouter initialEntries={['/blog/saved-editorial']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    const saveBtn = await screen.findByRole('button', { name: 'Save article' });
    expect(saveBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(saveBtn);

    expect(saveBtn).toHaveAttribute('aria-pressed', 'true');
    expect(saveBtn).toHaveAttribute('title', 'Remove saved article');
    expect(localStorage.getItem('preploop:article:editorial:saved-editorial')).toBe('1');
    expect(screen.getByRole('status')).toHaveTextContent('Article saved on this browser.');

    firstRender.unmount();

    const secondRender = render(
      <MemoryRouter initialEntries={['/blog/saved-editorial?source=editorial']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    const persistedBtn = await screen.findByRole('button', { name: 'Save article' });
    expect(persistedBtn).toHaveAttribute('aria-pressed', 'true');
    secondRender.unmount();

    render(
      <MemoryRouter>
        <BlogList />
      </MemoryRouter>
    );

    expect(await screen.findByText('Saved Editorial')).toBeInTheDocument();
    expect(screen.getByText('Other Post')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Saved articles' }));
    expect(screen.getByText('Saved Editorial')).toBeInTheDocument();
    expect(screen.queryByText('Other Post')).not.toBeInTheDocument();

    firstRender.unmount();
  });

  it('handles Save removal and storage errors cleanly', async () => {
    localStorage.setItem('preploop:article:legacy-save', '1');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'leg-1',
        slug: 'legacy-save',
        title: 'Legacy Save',
        created_at: '2026-04-05T12:00:00.000Z',
        content: '<p>Body</p>',
      }),
    }));

    render(
      <MemoryRouter initialEntries={['/blog/legacy-save']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    const saveBtn = await screen.findByRole('button', { name: 'Save article' });
    expect(saveBtn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(saveBtn);
    expect(saveBtn).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('preploop:article:legacy-save')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Article removed from saved articles.');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    fireEvent.click(saveBtn);
    expect(saveBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('Could not update saved articles.');
  });
});
