import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApi } from './adminApi.js';
import { authFetch } from '../../../utils/authFetch';

vi.mock('../../../utils/authFetch', () => ({
  authFetch: vi.fn(),
}));

describe('adminApi utility client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('executes simple GET requests successfully', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ stats: { users: 10 } }),
      });

      const res = await adminApi.get('/api/admin/stats');
      expect(authFetch).toHaveBeenCalledWith('/api/admin/stats', { method: 'GET' });
      expect(res).toEqual({ data: { stats: { users: 10 } }, status: 200 });
    });

    it('serializes query parameters including filtering out null/undefined/empty string', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [] }),
      });

      await adminApi.get('/api/admin/users', {
        params: {
          page: 2,
          search: 'alice',
          empty: '',
          nil: null,
          undef: undefined,
        },
      });

      expect(authFetch).toHaveBeenCalledWith('/api/admin/users?page=2&search=alice', { method: 'GET' });
    });

    it('appends query parameters correctly when url already has a query string', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [] }),
      });

      await adminApi.get('/api/admin/users?sort=asc', {
        params: { page: 1 },
      });

      expect(authFetch).toHaveBeenCalledWith('/api/admin/users?sort=asc&page=1', { method: 'GET' });
    });

    it('throws structured error with response details on failure', async () => {
      authFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden access' }),
      });

      await expect(adminApi.get('/api/admin/secret')).rejects.toThrow('Forbidden access');
    });
  });

  describe('POST requests', () => {
    it('sends JSON body and Content-Type header', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'new-id' }),
      });

      const payload = { title: 'New Job' };
      const res = await adminApi.post('/api/jobs', payload);

      expect(authFetch).toHaveBeenCalledWith('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res).toEqual({ data: { id: 'new-id' }, status: 201 });
    });
  });

  describe('PUT requests', () => {
    it('updates resources using PUT with JSON payload', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ updated: true }),
      });

      const payload = { role: 'admin' };
      const res = await adminApi.put('/api/admin/users/1/role', payload);

      expect(authFetch).toHaveBeenCalledWith('/api/admin/users/1/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res).toEqual({ data: { updated: true }, status: 200 });
    });
  });

  describe('PATCH requests', () => {
    it('sends PATCH request with headers and payload', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ active: false }),
      });

      const res = await adminApi.patch('/api/jobs/1/toggle');

      expect(authFetch).toHaveBeenCalledWith('/api/jobs/1/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res).toEqual({ data: { active: false }, status: 200 });
    });
  });

  describe('DELETE requests', () => {
    it('sends DELETE request without body', async () => {
      authFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const res = await adminApi.delete('/api/admin/users/1');

      expect(authFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'DELETE',
      });
      expect(res).toEqual({ data: { success: true }, status: 200 });
    });

    it('handles non-JSON error response gracefully', async () => {
      authFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON'); },
      });

      await expect(adminApi.delete('/api/admin/users/1')).rejects.toThrow('Request failed with status 500');
    });
  });
});
