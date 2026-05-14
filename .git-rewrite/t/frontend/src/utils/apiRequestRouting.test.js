import { describe, it, expect } from 'vitest';
import {
  getConfiguredApiOrigin,
  shouldRouteToApiOrigin,
  routeApiRequestInput,
} from './apiRequestRouting';

describe('apiRequestRouting', () => {
  it('normalizes configured API origin', () => {
    expect(getConfiguredApiOrigin('https://api.preploop.com')).toBe('https://api.preploop.com');
    expect(getConfiguredApiOrigin('')).toBe(null);
    expect(getConfiguredApiOrigin('notaurl')).toBe(null);
  });

  it('routes only /api paths when origin differs', () => {
    const apiOrigin = 'https://api.preploop.com';
    const appOrigin = 'https://preploop.vercel.app';

    expect(shouldRouteToApiOrigin('/api/health', apiOrigin, appOrigin)).toBe(true);
    expect(shouldRouteToApiOrigin('/profile', apiOrigin, appOrigin)).toBe(false);
    expect(shouldRouteToApiOrigin('https://api.preploop.com/api/health', apiOrigin, appOrigin)).toBe(false);
  });

  it('rewrites string inputs to configured API origin', () => {
    const apiOrigin = 'https://api.preploop.com';
    const appOrigin = 'https://preploop.vercel.app';

    const routed = routeApiRequestInput('/api/jobs?page=2', apiOrigin, appOrigin);
    expect(routed).toBe('https://api.preploop.com/api/jobs?page=2');
  });

  it('rewrites Request inputs and preserves method', () => {
    const apiOrigin = 'https://api.preploop.com';
    const appOrigin = 'https://preploop.vercel.app';

    const request = new Request('https://preploop.vercel.app/api/auth/login', { method: 'POST' });
    const routed = routeApiRequestInput(request, apiOrigin, appOrigin);

    expect(routed instanceof Request).toBe(true);
    expect(routed.url).toBe('https://api.preploop.com/api/auth/login');
    expect(routed.method).toBe('POST');
  });
});
