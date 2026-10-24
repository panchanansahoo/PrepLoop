import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/login', '/signup', '/pricing'];

test.describe('Accessibility and mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  for (const route of publicRoutes) {
    test(`has no serious accessibility violations on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
      await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });

      const results = await new AxeBuilder({ page })
        .withRules([
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
        ])
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
