import { test, expect } from '@playwright/test';

const publicRoutes = ['/', '/login', '/signup', '/pricing'];

for (const route of publicRoutes) {
  test(`renders ${route} without boot errors`, async ({ page }) => {
    const uncaughtErrors = [];
    const failedChunks = [];

    page.on('pageerror', (error) => uncaughtErrors.push(error.message));
    page.on('requestfailed', (request) => {
      if (/\.(js|css)(\?|$)/.test(request.url())) {
        failedChunks.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`);
      }
    });

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10000 });

    expect(uncaughtErrors).toEqual([]);
    expect(failedChunks).toEqual([]);
  });
}

test('opens the AI interview lobby without boot errors', async ({ page }) => {
  const uncaughtErrors = [];
  page.on('pageerror', (error) => uncaughtErrors.push(error.message));

  await page.goto('/ai-interview', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  await expect(page.getByText('Interview Setup')).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();

  expect(uncaughtErrors).toEqual([]);
});

test('completes the AI interview UI flow with mocked interview services', async ({ page }) => {
  await page.route('**/api/company-interview/start', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        question: 'Tell me about a project you are proud of.',
        context: { totalQuestions: 4 },
        questionMeta: { id: 'e2e-question-1' },
      }),
    });
  });
  await page.route('**/api/company-interview/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overallScore: 78,
        performanceLabel: 'Strong Hire',
        summary: 'Clear and structured interview performance.',
        categoryScores: {
          technicalSkills: 72,
          communication: 84,
          problemSolving: 76,
          cultureFit: 80,
        },
        strengths: ['Clear communication'],
        improvements: ['Add more measurable outcomes'],
        questionBreakdown: [],
      }),
    });
  });
  await page.route('**/api/voice/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ audio: null, text: '' }),
    });
  });
  await page.route('**/api/voice/analyze-answer', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ score: 8 }),
    });
  });

  await page.goto('/ai-interview', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Interview Setup')).toBeVisible({ timeout: 15000 });

  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: /^Next/i }).click();
  }
  await page.getByRole('button', { name: /Start Interview/i }).click();

  await expect(page.getByRole('button', { name: /End Interview/i })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /End Interview/i }).click();
  await expect(page.getByText('End Interview?')).toBeVisible();
  await page.getByRole('button', { name: /^End Interview$/i }).last().click();

  await expect(page.getByText('Session Results')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Strong Hire').first()).toBeVisible({ timeout: 15000 });
});
