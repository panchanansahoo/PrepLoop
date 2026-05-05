/**
 * Config Tests — CORS
 * 
 * Tests the CORS origin validation logic to ensure
 * production security and development flexibility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to re-import for each test to pick up env changes
let isOriginAllowed;

async function loadCors(envOverrides = {}) {
  // Reset module cache
  vi.resetModules();
  
  // Set env vars before importing
  const originalEnv = { ...process.env };
  Object.assign(process.env, envOverrides);

  const mod = await import('../../config/cors.js');
  isOriginAllowed = mod.isOriginAllowed;

  return { originalEnv, mod };
}

describe('CORS isOriginAllowed', () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    // Restore original env
    process.env = { ...savedEnv };
    vi.resetModules();
  });

  it('should allow configured FRONTEND_URL', async () => {
    await loadCors({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://preploop.com',
    });

    expect(isOriginAllowed('https://preploop.com')).toBe(true);
  });

  it('should reject unknown origins in production', async () => {
    await loadCors({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://preploop.com',
    });

    expect(isOriginAllowed('https://evil.com')).toBe(false);
  });

  it('should reject missing origin in production', async () => {
    await loadCors({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://preploop.com',
    });

    expect(isOriginAllowed(undefined)).toBe(false);
    expect(isOriginAllowed(null)).toBe(false);
  });

  it('should allow missing origin in development (API testing tools)', async () => {
    await loadCors({
      NODE_ENV: 'development',
    });

    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it('should allow localhost in development', async () => {
    await loadCors({
      NODE_ENV: 'development',
    });

    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://localhost:5174')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
  });

  it('should reject non-allowed localhost ports in development', async () => {
    await loadCors({
      NODE_ENV: 'development',
    });

    expect(isOriginAllowed('http://localhost:9999')).toBe(false);
  });

  it('should reject localhost in production', async () => {
    await loadCors({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://preploop.com',
    });

    expect(isOriginAllowed('http://localhost:5173')).toBe(false);
  });

  it('should match production domain subdomains', async () => {
    await loadCors({
      NODE_ENV: 'production',
      PRODUCTION_DOMAIN: 'preploop.com',
    });

    expect(isOriginAllowed('https://app.preploop.com')).toBe(true);
    expect(isOriginAllowed('https://staging.preploop.com')).toBe(true);
    expect(isOriginAllowed('https://preploop.com')).toBe(true);
  });

  it('should not match similar domains (regex escape)', async () => {
    await loadCors({
      NODE_ENV: 'production',
      PRODUCTION_DOMAIN: 'preploop.com',
    });

    // The dot should be escaped — "preploopXcom" should not match
    expect(isOriginAllowed('https://preploopXcom.evil.com')).toBe(false);
  });

  it('should allow Vercel preview URLs when configured', async () => {
    await loadCors({
      NODE_ENV: 'production',
      VERCEL_URL: 'my-app-abc123.vercel.app',
    });

    expect(isOriginAllowed('https://my-app-abc123.vercel.app')).toBe(true);
  });
});
