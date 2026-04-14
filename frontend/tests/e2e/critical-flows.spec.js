import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5173';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('User can sign up and login', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.click('text=Sign Up');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('User can solve a DSA problem', async ({ page, context }) => {
    await loginUser(page, context);
    await page.click('text=Practice');
    await page.click('text=DSA Problems');
    await page.click('.problem-card:first-child');
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type('def solution():\n    return True');
    await page.click('button:has-text("Submit")');
    await expect(page.locator('text=Submission')).toBeVisible({ timeout: 10000 });
  });

  test('User can start AI interview', async ({ page, context }) => {
    await loginUser(page, context);
    await page.click('text=Interview');
    await page.click('text=Start Interview');
    await page.click('.problem-select:first-child');
    await page.click('button:has-text("Begin")');
    await expect(page.locator('text=Interviewer')).toBeVisible({ timeout: 5000 });
    await page.fill('textarea', 'I would approach this problem by...');
    await page.click('button:has-text("Send")');
    await expect(page.locator('.interview-message')).toHaveCount(2, { timeout: 10000 });
  });
});

async function loginUser(page, context) {
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 5000 });
}
