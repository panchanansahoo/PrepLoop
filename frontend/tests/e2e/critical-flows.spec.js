/**
 * E2E Testing Suite
 * Comprehensive end-to-end tests for critical user flows
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'test@preploop.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

test.describe('Authentication Flow', () => {
  test('should register new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="email"]', `test_${Date.now()}@preploop.com`);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="name"]', TEST_USER.name);
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should login existing user', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
  });
});

test.describe('DSA Practice Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should display problem list', async ({ page }) => {
    await page.goto(`${BASE_URL}/practice/dsa`);
    
    await expect(page.locator('.problem-card')).toHaveCount(20, { timeout: 10000 });
  });

  test('should filter problems by difficulty', async ({ page }) => {
    await page.goto(`${BASE_URL}/practice/dsa`);
    
    await page.click('button[data-difficulty="easy"]');
    
    await page.waitForTimeout(1000);
    
    const problems = page.locator('.problem-card');
    await expect(problems.first()).toContainText('Easy');
  });

  test('should open problem detail', async ({ page }) => {
    await page.goto(`${BASE_URL}/practice/dsa`);
    
    await page.click('.problem-card:first-child');
    
    await expect(page.locator('.problem-description')).toBeVisible();
    await expect(page.locator('.code-editor')).toBeVisible();
  });

  test('should submit solution', async ({ page }) => {
    await page.goto(`${BASE_URL}/practice/dsa`);
    await page.click('.problem-card:first-child');
    
    // Write code in editor
    await page.click('.monaco-editor');
    await page.keyboard.type('function solution() { return true; }');
    
    await page.click('button:has-text("Submit")');
    
    await expect(page.locator('.submission-result')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('AI Interview Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should start AI interview', async ({ page }) => {
    await page.goto(`${BASE_URL}/interview/ai`);
    
    await page.click('button:has-text("Start Interview")');
    
    await expect(page.locator('.interview-question')).toBeVisible({ timeout: 15000 });
  });

  test('should handle voice interview', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    await page.goto(`${BASE_URL}/interview/voice`);
    
    await page.click('button:has-text("Start Voice Interview")');
    
    await expect(page.locator('.recording-indicator')).toBeVisible();
  });
});

test.describe('Job Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should search for jobs', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);
    
    await page.fill('input[placeholder*="skills"]', 'JavaScript');
    await page.fill('input[placeholder*="location"]', 'Remote');
    
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('.job-card')).toHaveCount(10, { timeout: 10000 });
  });

  test('should show job recommendations', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs/recommendations`);
    
    await expect(page.locator('.recommended-job')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Performance Tests', () => {
  test('should load homepage within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array(5).fill(null).map(() => browser.newContext())
    );

    const pages = await Promise.all(
      contexts.map((context) => context.newPage())
    );

    await Promise.all(
      pages.map((page) => page.goto(`${BASE_URL}/practice/dsa`))
    );

    for (const page of pages) {
      await expect(page.locator('.problem-card')).toHaveCount(20, { timeout: 10000 });
    }

    // Cleanup
    await Promise.all(contexts.map((context) => context.close()));
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/practice/dsa`);
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('.problem-description')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    await context.route('**/api/**', (route) => route.abort());
    
    await page.goto(`${BASE_URL}/practice/dsa`);
    
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should show offline indicator', async ({ page, context }) => {
    await page.goto(BASE_URL);
    
    await context.setOffline(true);
    
    await page.reload();
    
    await expect(page.locator('.offline-indicator')).toBeVisible();
  });
});
