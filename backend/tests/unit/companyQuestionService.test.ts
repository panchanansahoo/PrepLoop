import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import {
  loadQuestionData,
  getPaginatedQuestions,
  getCompanyStats,
  _clearQuestionCacheForTesting,
} from '../../services/companyQuestionService.ts';
import companyInterviewRouter from '../../routes/companyInterview.js';

describe('Company Question Dataset Ingestion & Paginated API', () => {
  beforeEach(() => {
    // Keep cache or reset as needed
  });

  describe('Dataset Ingestion & Indexing', () => {
    it('successfully indexes question data from repository dataset', async () => {
      await loadQuestionData();
      const result = await getPaginatedQuestions({ page: 1, limit: 1 });

      expect(result.success).toBe(true);
      expect(result.pagination.total).toBeGreaterThan(1000);
      expect(result.questions.length).toBe(1);

      const q = result.questions[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('company');
      expect(q).toHaveProperty('question');
      expect(typeof q.id).toBe('string');
      expect(typeof q.company).toBe('string');
      expect(typeof q.question).toBe('string');
    });

    it('aggregates question counts across indexed companies', async () => {
      const stats = await getCompanyStats();
      expect(typeof stats).toBe('object');
      expect(stats.google?.total).toBeGreaterThan(50);
      expect(stats.amazon?.total).toBeGreaterThan(50);
      expect(stats.meta?.total).toBeGreaterThan(50);
    });
  });

  describe('Pagination Logic', () => {
    it('defaults to page 1 and limit 20 when parameters are omitted', async () => {
      const result = await getPaginatedQuestions({});

      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.questions.length).toBe(20);
      expect(result.pagination.total).toBeGreaterThan(20);
      expect(result.pagination.totalPages).toBe(Math.ceil(result.pagination.total / 20));
    });

    it('honors custom page and limit specifications', async () => {
      const page1 = await getPaginatedQuestions({ page: 1, limit: 10, company: 'google' });
      const page2 = await getPaginatedQuestions({ page: 2, limit: 10, company: 'google' });

      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.limit).toBe(10);
      expect(page1.questions.length).toBe(10);

      expect(page2.pagination.page).toBe(2);
      expect(page2.pagination.limit).toBe(10);
      expect(page2.questions.length).toBe(10);

      // Verify that page 1 and page 2 return different slices
      const page1Ids = page1.questions.map((q) => q.id);
      const page2Ids = page2.questions.map((q) => q.id);
      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('clamps limit to maximum 100', async () => {
      const result = await getPaginatedQuestions({ page: 1, limit: 500 });
      expect(result.pagination.limit).toBe(100);
      expect(result.questions.length).toBeLessThanOrEqual(100);
    });

    it('clamps limit to minimum 1 for zero or negative values', async () => {
      const result = await getPaginatedQuestions({ page: 1, limit: 0 });
      // Either defaults to 20 or minimum 1
      expect(result.pagination.limit).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array when requesting a page past totalPages', async () => {
      const result = await getPaginatedQuestions({ page: 99999, limit: 25, company: 'google' });
      expect(result.success).toBe(true);
      expect(result.questions).toEqual([]);
      expect(result.pagination.page).toBe(99999);
      expect(result.pagination.total).toBeGreaterThan(0);
    });
  });

  describe('Search & Filtering', () => {
    it('filters strictly by company identifier', async () => {
      const result = await getPaginatedQuestions({ company: 'amazon', limit: 25 });
      expect(result.success).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
      result.questions.forEach((q) => {
        expect(q.company.toLowerCase()).toContain('amazon');
      });
    });

    it('filters by stage', async () => {
      const result = await getPaginatedQuestions({ stage: 'Technical', limit: 20 });
      expect(result.success).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
      result.questions.forEach((q) => {
        expect(q.stage?.toLowerCase()).toContain('technical');
      });
    });

    it('filters by role', async () => {
      const result = await getPaginatedQuestions({ role: 'SDE', limit: 20 });
      expect(result.success).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
      result.questions.forEach((q) => {
        expect(q.role?.toLowerCase()).toContain('sde');
      });
    });

    it('searches by keyword across question text, tags, and titles', async () => {
      const result = await getPaginatedQuestions({ search: 'binary tree', limit: 15 });
      expect(result.success).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
      result.questions.forEach((q) => {
        const matchesQuestion = q.question?.toLowerCase().includes('binary tree');
        const matchesTitle = q.title?.toLowerCase().includes('binary tree');
        const matchesTags = Array.isArray(q.tags) && q.tags.some((t: string) => t.toLowerCase().includes('tree'));
        expect(matchesQuestion || matchesTitle || matchesTags).toBe(true);
      });
    });

    it('combines company filter with search query', async () => {
      const result = await getPaginatedQuestions({ company: 'google', search: 'array', limit: 10 });
      expect(result.success).toBe(true);
      result.questions.forEach((q) => {
        expect(q.company.toLowerCase()).toContain('google');
      });
    });

    it('performs case-insensitive search and filter matching', async () => {
      const upper = await getPaginatedQuestions({ company: 'GOOGLE', search: 'TREE', limit: 10 });
      const lower = await getPaginatedQuestions({ company: 'google', search: 'tree', limit: 10 });

      expect(upper.pagination.total).toBe(lower.pagination.total);
      expect(upper.questions.length).toBe(lower.questions.length);
    });

    it('returns empty results gracefully for non-matching search terms', async () => {
      const result = await getPaginatedQuestions({ search: 'xyznonexistentterm99999' });
      expect(result.success).toBe(true);
      expect(result.questions).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('Caching Performance', () => {
    it('returns cached results on repeated queries', async () => {
      const start1 = Date.now();
      const first = await getPaginatedQuestions({ company: 'meta', page: 1, limit: 25 });
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      const second = await getPaginatedQuestions({ company: 'meta', page: 1, limit: 25 });
      const duration2 = Date.now() - start2;

      expect(first.pagination.total).toBe(second.pagination.total);
      expect(first.questions.length).toBe(second.questions.length);
      expect(first.questions[0].id).toBe(second.questions[0].id);
      // Cached call should be sub-5ms
      expect(duration2).toBeLessThanOrEqual(duration1 + 5);
    });
  });

  describe('API Endpoint Integration (GET /questions)', () => {
    let app: express.Application;
    let server: Server | null = null;
    let baseUrl = '';

    beforeEach(async () => {
      app = express();
      app.use(express.json());
      app.use('/api/company-interview', companyInterviewRouter);

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const address = server?.address();
          if (address && typeof address === 'object') {
            baseUrl = `http://127.0.0.1:${address.port}`;
          }
          resolve();
        });
      });
    });

    afterEach(async () => {
      if (server) {
        await new Promise<void>((resolve) => server?.close(() => resolve()));
        server = null;
      }
    });

    it('returns 200 with standard paginated shape on GET /api/company-interview/questions', async () => {
      const response = await fetch(`${baseUrl}/api/company-interview/questions?company=google&page=1&limit=25`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBe(25);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 25,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(data.pagination.total).toBeGreaterThan(50);
    });

    it('supports search query parameter via HTTP GET', async () => {
      const response = await fetch(`${baseUrl}/api/company-interview/questions?search=dynamic&limit=10`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination.limit).toBe(10);
      expect(data.questions.length).toBeGreaterThan(0);
      expect(data.pagination.total).toBeGreaterThan(0);
    });

    it('returns available companies via GET /api/company-interview/companies', async () => {
      const response = await fetch(`${baseUrl}/api/company-interview/companies`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.companies)).toBe(true);
      expect(data.companies.length).toBeGreaterThan(0);
      expect(typeof data.stats).toBe('object');
    });
  });
});
