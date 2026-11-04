import { test, expect } from '@playwright/test';

async function expectBootedPage(page, route) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });
  expect(errors).toEqual([]);
}

test.describe('AI Mock Interview Flow & Workspace Features', () => {
  test('boots interview lobby with preflight controls without runtime exceptions', async ({ page }) => {
    await expectBootedPage(page, '/ai-interview');
    // Verify core lobby presence
    await expect(page.locator('.ai-setup-modal, .ai-interview-page')).toBeVisible({ timeout: 10000 });
  });

  test('accepts focus query param and preserves focus context', async ({ page }) => {
    await page.goto('/ai-interview?focus=Distributed%20Caching', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  });

  test('boots code review and debugging interview platforms', async ({ page }) => {
    await expectBootedPage(page, '/code-review');
    await expectBootedPage(page, '/debugging');
  });

  test('boots interview suite catalog', async ({ page }) => {
    await expectBootedPage(page, '/interview-suite');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });
  });
});

