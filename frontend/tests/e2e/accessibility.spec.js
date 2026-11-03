import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import process from 'node:process';

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/problems',
  '/aptitude',
  '/exam-hub',
  '/dsa-path',
  '/about',
  '/contact',
  '/community',
];

const authenticatedEmail = process.env.E2E_EMAIL;
const authenticatedPassword = process.env.E2E_PASSWORD;
const authenticatedRoutes = [
  '/dashboard',
  '/profile',
  '/history',
  '/wallet',
  '/company-prep',
  '/settings',
];

const AXE_RULES = [
  'aria-allowed-attr',
  'aria-valid-attr',
  'button-name',
  'document-title',
  'duplicate-id',
  'html-has-lang',
  'image-alt',
  'label',
  'landmark-one-main',
  'link-name',
  'nested-interactive',
];

test.describe('Accessibility and mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  for (const route of publicRoutes) {
    test(`has no serious accessibility violations on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
      await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });

      const results = await new AxeBuilder({ page })
        .withRules(AXE_RULES)
        .analyze();
      const seriousViolations = results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact),
      );

      expect(seriousViolations).toEqual([]);
    });
  }

  test('public pages do not overflow horizontally on mobile', async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
      await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });

      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
    }
  });
});

test.describe('Authenticated accessibility checks', () => {
  test.skip(!authenticatedEmail || !authenticatedPassword, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated accessibility checks');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(authenticatedEmail);
    await page.locator('input[type="password"]').fill(authenticatedPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  for (const route of authenticatedRoutes) {
    test(`has no serious accessibility violations on authenticated ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
      await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });

      const results = await new AxeBuilder({ page })
        .withRules(AXE_RULES)
        .analyze();
      const seriousViolations = results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact),
      );

      expect(seriousViolations).toEqual([]);
    });
  }
});
