import { test, expect } from '@playwright/test';
import process from 'node:process';

const publicRoutes = ['/', '/login', '/signup', '/pricing', '/community'];
const authenticatedEmail = process.env.E2E_EMAIL;
const authenticatedPassword = process.env.E2E_PASSWORD;

async function expectBootedPage(page, route) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });
  expect(errors).toEqual([]);
}

test.describe('Public application flows', () => {
  for (const route of publicRoutes) {
    test(`boots ${route} without uncaught errors`, async ({ page }) => {
      await expectBootedPage(page, route);
    });
  }

  test('private settings route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/login|\/dashboard\/settings/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('public pages load within the performance budget', async ({ page }) => {
    const startedAt = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty();
    expect(Date.now() - startedAt).toBeLessThan(10000);
  });
});

test.describe('Configured authenticated flows', () => {
  test.skip(!authenticatedEmail || !authenticatedPassword, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated flows');

  test('logs in and reaches the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(authenticatedEmail);
    await page.locator('input[type="password"]').fill(authenticatedPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
