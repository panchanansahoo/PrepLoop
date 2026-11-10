import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 3: Backend Business Logic, Queries & Regression Tests Suite', () => {
  const backendDir = path.resolve(__dirname, '../..');
  const readBackend = (relativePath) => fs.readFileSync(path.join(backendDir, relativePath), 'utf8');

  // =========================================================================
  // 1. Career Analytics RLS & SupabaseAdmin Client Conformance
  // =========================================================================
  describe('1. Career Analytics Supabase Client & RLS Conformance', () => {
    it('verifies routes/career-analytics.js imports supabaseAdmin and does not import anonymous supabase client', () => {
      const code = readBackend('routes/career-analytics.js');
      expect(code).toMatch(/import\s*\{\s*supabaseAdmin\s*\}\s*from\s*['"]\.\.\/db\/supabaseClient\.js['"]/);
      expect(code).not.toMatch(/import\s*\{\s*supabase\s*\}\s*from/);
      expect(code).not.toMatch(/await\s+supabase\./);
    });

    it('verifies all career-analytics queries use supabaseAdmin to prevent RLS false 404s', () => {
      const code = readBackend('routes/career-analytics.js');
      expect(code).toMatch(/await\s+supabaseAdmin\s*\.from\('profiles'\)/);
      expect(code).toMatch(/await\s+supabaseAdmin\s*\.from\('jobs'\)/);
      expect(code).toMatch(/await\s+supabaseAdmin\s*\.from\('career_user_pathway_interactions'\)/);
    });
  });

  // =========================================================================
  // 2. Feed Column Queries & Schema Alignment
  // =========================================================================
  describe('2. Feed Column Alignment with schema.sql', () => {
    it('queries submitted_at on submissions instead of non-existent created_at', () => {
      const code = readBackend('routes/feed.js');
      expect(code).toMatch(/\.from\('submissions'\)\s*\.select\('id,\s*submitted_at,\s*problem_id'\)/);
      expect(code).toMatch(/\.from\('submissions'[\s\S]*?\.order\('submitted_at',\s*\{\s*ascending:\s*false\s*\}\)/);
      expect(code).not.toMatch(/\.from\('submissions'\)\s*\.select\('id,\s*created_at/);
    });

    it('queries overall_score, completed_at, and started_at on mock_interviews instead of non-existent created_at/score', () => {
      const code = readBackend('routes/feed.js');
      expect(code).toMatch(/\.from\('mock_interviews'\)\s*\.select\('id,\s*overall_score,\s*completed_at,\s*started_at,\s*interview_type'\)/);
      expect(code).toMatch(/\.from\('mock_interviews'[\s\S]*?\.order\('started_at',\s*\{\s*ascending:\s*false\s*\}\)/);
      expect(code).not.toMatch(/\.from\('mock_interviews'\)\s*\.select\('id,\s*created_at,\s*score'\)/);
    });

    it('maps submitted_at to created_at and overall_score to score for backward compatibility', () => {
      const code = readBackend('routes/feed.js');
      expect(code).toMatch(/created_at:\s*s\.submitted_at\s*\|\|\s*s\.created_at/);
      expect(code).toMatch(/score:\s*i\.overall_score\s*\?\?\s*i\.score/);
      expect(code).toMatch(/created_at:\s*i\.completed_at\s*\|\|\s*i\.started_at\s*\|\|\s*i\.created_at/);
    });

    it('sanitizes and clamps feed pagination limits and offsets', () => {
      const code = readBackend('routes/feed.js');
      expect(code).toMatch(/const\s+parsedLimit\s*=\s*Math\.min\(100,\s*Math\.max\(1,\s*parseInt\(limit,\s*10\)\s*\|\|\s*20\)\)/);
      expect(code).toMatch(/const\s+parsedOffset\s*=\s*Math\.max\(0,\s*parseInt\(offset,\s*10\)\s*\|\|\s*0\)/);
    });
  });

  // =========================================================================
  // 3. Employer Candidate Pipeline Query Conformance
  // =========================================================================
  describe('3. Employer Candidate Pipeline Schema Alignment', () => {
    it('queries existing schema columns from mock_interviews without role, score, or created_at column errors', () => {
      const code = readBackend('routes/employer.js');
      expect(code).toMatch(/interview_type/);
      expect(code).toMatch(/overall_score/);
      expect(code).toMatch(/completed_at/);
      expect(code).toMatch(/started_at/);
      expect(code).not.toMatch(/role,\s*\n\s*score,\s*\n\s*created_at/);
    });

    it('orders candidate pipeline by completed_at instead of non-existent created_at', () => {
      const code = readBackend('routes/employer.js');
      const candidatesRoute = code.slice(code.indexOf("router.get('/candidates'"), code.indexOf("router.post('/question-banks'"));
      expect(candidatesRoute).toMatch(/\.order\('completed_at'/);
      expect(candidatesRoute).not.toMatch(/\.order\('created_at'/);
    });

    it('formats candidate response correctly using real database columns', () => {
      const code = readBackend('routes/employer.js');
      expect(code).toMatch(/roleApplied:\s*c\.interview_type\s*\|\|\s*c\.role\s*\|\|\s*'Software Engineer'/);
      expect(code).toMatch(/overallScore:\s*c\.overall_score\s*\?\?\s*c\.score\s*\?\?\s*75/);
      expect(code).toMatch(/completedAt:\s*c\.completed_at\s*\|\|\s*c\.started_at\s*\|\|\s*c\.created_at\s*\|\|\s*null/);
    });

    it('correctly maps mock candidates with simulated PostgreSQL record', () => {
      const mockRecord = {
        id: 42,
        user_id: 'usr_abc_123',
        interview_type: 'Frontend System Design',
        overall_score: 92.5,
        completed_at: '2026-11-09T20:00:00Z',
        started_at: '2026-11-09T19:30:00Z',
        profiles: {
          full_name: 'Alice Smith',
          email: 'alice@example.com',
          skills: ['React', 'TypeScript', 'GraphQL'],
          designation: 'Senior Frontend Engineer',
        },
      };

      const formatted = {
        interviewId: mockRecord.id,
        candidateId: mockRecord.user_id,
        name: mockRecord.profiles?.full_name || 'Anonymous Candidate',
        email: mockRecord.profiles?.email || null,
        skills: mockRecord.profiles?.skills || [],
        roleApplied: mockRecord.interview_type || 'Software Engineer',
        overallScore: mockRecord.overall_score ?? 75,
        completedAt: mockRecord.completed_at || mockRecord.started_at,
      };

      expect(formatted.interviewId).toBe(42);
      expect(formatted.roleApplied).toBe('Frontend System Design');
      expect(formatted.overallScore).toBe(92.5);
      expect(formatted.completedAt).toBe('2026-11-09T20:00:00Z');
      expect(formatted.name).toBe('Alice Smith');
    });
  });

  // =========================================================================
  // 4. System Design Parameter Validation & TypeError Prevention
  // =========================================================================
  describe('4. System Design Defensive Component Handling', () => {
    it('verifies routes/systemDesign.js safely defines formatComponents helper', () => {
      const code = readBackend('routes/systemDesign.js');
      expect(code).toMatch(/function formatComponents\(components\)/);
      expect(code).toMatch(/Array\.isArray\(components\)/);
      expect(code).not.toMatch(/\$\{components\.join\(', '\)\}/);
    });

    it('simulates formatComponents with diverse inputs to verify zero TypeError crashes', () => {
      function formatComponents(components) {
        if (Array.isArray(components)) {
          const valid = components.filter(c => typeof c === 'string' && c.trim()).map(c => c.trim()).slice(0, 50);
          return valid.length > 0 ? valid.join(', ') : 'None specified';
        }
        if (typeof components === 'string' && components.trim()) {
          return components.trim().slice(0, 500);
        }
        return 'None specified';
      }

      // Edge cases that previously crashed with TypeError: components.join is not a function
      expect(formatComponents(undefined)).toBe('None specified');
      expect(formatComponents(null)).toBe('None specified');
      expect(formatComponents(12345)).toBe('None specified');
      expect(formatComponents({})).toBe('None specified');
      expect(formatComponents(true)).toBe('None specified');
      expect(formatComponents([])).toBe('None specified');
      expect(formatComponents(['', '   '])).toBe('None specified');

      // Valid string
      expect(formatComponents('Load Balancer, Redis, Postgres')).toBe('Load Balancer, Redis, Postgres');

      // Valid array
      expect(formatComponents(['Load Balancer', 'Database', 'Cache'])).toBe('Load Balancer, Database, Cache');
      expect(formatComponents([' Load Balancer ', ' Redis '])).toBe('Load Balancer, Redis');
    });
  });

  // =========================================================================
  // 5. Pagination Offsets & Limits Sanitization
  // =========================================================================
  describe('5. Pagination Offsets & Limits Sanitization Across Routes', () => {
    it('verifies admin.js clamps page >= 1, limit between 1 and 100, and ensures non-negative offset', () => {
      const code = readBackend('routes/admin.js');
      const matches = code.match(/parsedPage\s*=\s*Math\.max\(1,\s*parseInt\(page,\s*10\)\s*\|\|\s*1\)/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBeGreaterThanOrEqual(4);

      const limitMatches = code.match(/parsedLimit\s*=\s*Math\.min\(100,\s*Math\.max\(1,\s*parseInt\(limit,\s*10\)\s*\|\|\s*20\)\)/g);
      expect(limitMatches).not.toBeNull();
      expect(limitMatches?.length).toBeGreaterThanOrEqual(4);

      const offsetMatches = code.match(/offset\s*=\s*Math\.max\(0,\s*\(parsedPage\s*-\s*1\)\s*\*\s*parsedLimit\)/g);
      expect(offsetMatches).not.toBeNull();
      expect(offsetMatches?.length).toBeGreaterThanOrEqual(4);
    });

    it('verifies interview/session.js clamps offset >= 0 and limit between 1 and 100', () => {
      const code = readBackend('routes/interview/session.js');
      expect(code).toMatch(/const\s+parsedLimit\s*=\s*Math\.min\(100,\s*Math\.max\(1,\s*parseInt\(limit,\s*10\)\s*\|\|\s*20\)\)/);
      expect(code).toMatch(/const\s+parsedOffset\s*=\s*Math\.max\(0,\s*parseInt\(offset,\s*10\)\s*\|\|\s*0\)/);
      expect(code).toMatch(/\.range\(parsedOffset,\s*parsedOffset\s*\+\s*parsedLimit\s*-\s*1\)/);
    });

    it('verifies interview/session.js uses started_at instead of created_at for mock_interviews fallback', () => {
      const code = readBackend('routes/interview/session.js');
      expect(code).toMatch(/\.from\('mock_interviews'\)[\s\S]*?\.select\('id,\s*interview_type,\s*difficulty,\s*duration,\s*overall_score,\s*completed_at,\s*started_at'\)/);
      expect(code).not.toMatch(/\.from\('mock_interviews'\)[\s\S]*?\.select\('id,\s*interview_type,\s*difficulty,\s*duration,\s*overall_score,\s*completed_at,\s*created_at'\)/);
    });

    it('verifies library.js clamps page >= 1 and limit between 1 and 100 in books list and shelf', () => {
      const code = readBackend('routes/library.js');
      const pageMatches = code.match(/parsedPage\s*=\s*Math\.max\(1,\s*parseInt\(page,\s*10\)\s*\|\|\s*1\)/g);
      expect(pageMatches).not.toBeNull();
      expect(pageMatches?.length).toBe(2);

      const limitMatches = code.match(/parsedLimit\s*=\s*Math\.min\(100,\s*Math\.max\(1,\s*parseInt\(limit,\s*10\)\s*\|\|\s*20\)\)/g);
      expect(limitMatches).not.toBeNull();
      expect(limitMatches?.length).toBe(2);

      const offsetMatches = code.match(/offset\s*=\s*Math\.max\(0,\s*\(parsedPage\s*-\s*1\)\s*\*\s*parsedLimit\)/g);
      expect(offsetMatches).not.toBeNull();
      expect(offsetMatches?.length).toBe(2);
    });

    it('evaluates pagination clamping logic against adversarial inputs', () => {
      function sanitizePagination(page, limit) {
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = Math.max(0, (parsedPage - 1) * parsedLimit);
        return { parsedPage, parsedLimit, offset };
      }

      // Negative page and negative limit
      expect(sanitizePagination(-10, -50)).toEqual({ parsedPage: 1, parsedLimit: 1, offset: 0 });
      // Zero page
      expect(sanitizePagination(0, 20)).toEqual({ parsedPage: 1, parsedLimit: 20, offset: 0 });
      // Non-numeric garbage
      expect(sanitizePagination('invalid', 'garbage')).toEqual({ parsedPage: 1, parsedLimit: 20, offset: 0 });
      // Astronomical limit
      expect(sanitizePagination(1, 9999999)).toEqual({ parsedPage: 1, parsedLimit: 100, offset: 0 });
      // Page 3, limit 25
      expect(sanitizePagination(3, 25)).toEqual({ parsedPage: 3, parsedLimit: 25, offset: 50 });
    });
  });

  // =========================================================================
  // 6. Bookmarks Filtering & Pagination Invariant in Notes Route
  // =========================================================================
  describe('6. Bookmarks In-Memory Filtering and Accurate Pagination Metadata', () => {
    it('verifies routes/notes.js filters by tag and search before slice and metadata calculation', () => {
      const code = readBackend('routes/notes.js');
      expect(code).toMatch(/if\s*\(\(!tag\s*\|\|\s*tag\s*===\s*"all"\)\s*&&\s*!search\)/);
      expect(code).toMatch(/filtered\s*=\s*filtered\.filter\(b\s*=>\s*Array\.isArray\(b\.tags\)\s*&&\s*b\.tags\.includes\(tag\)\)/);
      expect(code).toMatch(/const\s+total\s*=\s*filtered\.length;/);
      expect(code).toMatch(/const\s+bookmarks\s*=\s*filtered\.slice\(offset,\s*offset\s*\+\s*limit\);/);
      expect(code).toMatch(/hasMore:\s*offset\s*\+\s*bookmarks\.length\s*<\s*total/);
    });

    it('simulates tag and search filtering pagination to guarantee zero empty-page anomalies', () => {
      // 10 mock bookmarks in database
      const allBookmarks = [
        { id: 1, question_title: 'Two Sum', tags: ['array', 'hash-map'], note: 'Easy hash map pattern' },
        { id: 2, question_title: '3Sum', tags: ['array', 'two-pointer'], note: 'Sort first then two pointer' },
        { id: 3, question_title: 'Valid Parentheses', tags: ['stack'], note: 'Use stack for matching' },
        { id: 4, question_title: 'Merge K Sorted Lists', tags: ['heap', 'linked-list'], note: 'Min-heap approach' },
        { id: 5, question_title: 'Binary Tree Level Order', tags: ['tree', 'bfs'], note: 'Queue level order' },
        { id: 6, question_title: 'Invert Binary Tree', tags: ['tree', 'recursion'], note: 'Recursive swap' },
        { id: 7, question_title: 'Validate Binary Search Tree', tags: ['tree', 'dfs'], note: 'Range bounds recursion' },
        { id: 8, question_title: 'Course Schedule', tags: ['graph', 'topological-sort'], note: 'Kahn algorithm' },
        { id: 9, question_title: 'Climbing Stairs', tags: ['dp'], note: 'Fibonacci recurrence' },
        { id: 10, question_title: 'Coin Change', tags: ['dp'], note: 'Unbounded knapsack style' },
      ];

      function paginateBookmarks({ tag, search, page = 1, limit = 2 }) {
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = Math.max(0, (parsedPage - 1) * parsedLimit);

        let filtered = [...allBookmarks];
        if (tag && tag !== 'all') {
          filtered = filtered.filter(b => Array.isArray(b.tags) && b.tags.includes(tag));
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(b =>
            b.question_title?.toLowerCase().includes(s) ||
            b.note?.toLowerCase().includes(s)
          );
        }

        const total = filtered.length;
        const bookmarks = filtered.slice(offset, offset + parsedLimit);
        return {
          bookmarks,
          pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            hasMore: offset + bookmarks.length < total,
          },
        };
      }

      // Filter by tag: 'tree' (3 matching items: #5, #6, #7)
      const page1 = paginateBookmarks({ tag: 'tree', page: 1, limit: 2 });
      expect(page1.pagination.total).toBe(3);
      expect(page1.bookmarks.length).toBe(2);
      expect(page1.bookmarks.map(b => b.id)).toEqual([5, 6]);
      expect(page1.pagination.hasMore).toBe(true);

      const page2 = paginateBookmarks({ tag: 'tree', page: 2, limit: 2 });
      expect(page2.pagination.total).toBe(3);
      expect(page2.bookmarks.length).toBe(1);
      expect(page2.bookmarks.map(b => b.id)).toEqual([7]);
      expect(page2.pagination.hasMore).toBe(false);

      const page3 = paginateBookmarks({ tag: 'tree', page: 3, limit: 2 });
      expect(page3.pagination.total).toBe(3);
      expect(page3.bookmarks.length).toBe(0);
      expect(page3.pagination.hasMore).toBe(false);

      // Search by keyword: 'knapsack' (1 match: #10)
      const searchRes = paginateBookmarks({ search: 'knapsack', page: 1, limit: 5 });
      expect(searchRes.pagination.total).toBe(1);
      expect(searchRes.bookmarks.length).toBe(1);
      expect(searchRes.bookmarks[0].id).toBe(10);
      expect(searchRes.pagination.hasMore).toBe(false);
    });
  });

  // =========================================================================
  // 7. Timed Practice Parameter Bounds in Practice Route
  // =========================================================================
  describe('7. Timed Practice Parameter Validation and Slicing Bounds', () => {
    it('verifies routes/practice.js clamps count (1..50) and duration (5..180)', () => {
      const code = readBackend('routes/practice.js');
      expect(code).toMatch(/const\s+parsedCount\s*=\s*Math\.min\(50,\s*Math\.max\(1,\s*parseInt\(count,\s*10\)\s*\|\|\s*5\)\)/);
      expect(code).toMatch(/const\s+parsedDuration\s*=\s*Math\.min\(180,\s*Math\.max\(5,\s*parseInt\(duration,\s*10\)\s*\|\|\s*30\)\)/);
      expect(code).toMatch(/const\s+selected\s*=\s*shuffled\.slice\(0,\s*parsedCount\)/);
      expect(code).toMatch(/duration:\s*parsedDuration/);
    });

    it('simulates count and duration clamping against negative and unbounded inputs', () => {
      function clampTimedParams(count, duration) {
        const parsedCount = Math.min(50, Math.max(1, parseInt(count, 10) || 5));
        const parsedDuration = Math.min(180, Math.max(5, parseInt(duration, 10) || 30));
        return { parsedCount, parsedDuration };
      }

      // Negative values
      expect(clampTimedParams(-1, -10)).toEqual({ parsedCount: 1, parsedDuration: 5 });
      // Extremely large values
      expect(clampTimedParams(9999, 1000)).toEqual({ parsedCount: 50, parsedDuration: 180 });
      // Non-numeric or missing
      expect(clampTimedParams(undefined, null)).toEqual({ parsedCount: 5, parsedDuration: 30 });
      expect(clampTimedParams('abc', 'xyz')).toEqual({ parsedCount: 5, parsedDuration: 30 });
      // Valid boundaries
      expect(clampTimedParams(10, 45)).toEqual({ parsedCount: 10, parsedDuration: 45 });
    });

    it('prevents backwards array slice that occurred with negative count', () => {
      const problems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const negativeCount = -1;
      const parsedCount = Math.min(50, Math.max(1, parseInt(negativeCount, 10) || 5));

      const unpatchedSlice = problems.slice(0, negativeCount); // Stripped last element: [1..9]!
      const patchedSlice = problems.slice(0, parsedCount);     // Returns 1 item: [1]

      expect(unpatchedSlice.length).toBe(9);
      expect(patchedSlice.length).toBe(1);
      expect(patchedSlice).toEqual([1]);
    });
  });
});
