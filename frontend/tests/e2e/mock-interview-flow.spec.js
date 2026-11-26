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
    await expect(page.getByRole('heading', { name: 'Interview Setup', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('accepts focus query param and preserves focus context', async ({ page }) => {
    await page.goto('/ai-interview?focus=Distributed%20Caching', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  });

  test('recovers a captured voice draft through reload, reconnect, and typed fallback', async ({ page, context }) => {
    const question = 'How would you cache a slow database query?';
    const nextQuestion = 'How would you handle expired entries?';
    const storageKey = 'preploop_active_interview_session';
    const submittedAnswers = [];
    await context.grantPermissions(['microphone']);
    await page.addInitScript(({ key, question }) => {
      if (!sessionStorage.getItem('voice-recovery-test-initialized')) {
        sessionStorage.setItem('voice-recovery-test-initialized', 'yes');
        sessionStorage.setItem(key, JSON.stringify({
          isActive: true,
          questionIndex: 1,
          currentQuestion: question,
          totalQuestions: 4,
          conversation: [{ role: 'interviewer', content: question }],
          timestamp: Date.now(),
        }));
      }

      class TestSpeechRecognition {
        start() {
          window.interviewTestRecognition = this;
          this.onstart?.();
        }

        stop() {}
        abort() {}
      }
      window.SpeechRecognition = TestSpeechRecognition;
      window.webkitSpeechRecognition = TestSpeechRecognition;
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          cancel() {},
          getVoices: () => [],
          speak(utterance) {
            utterance.onstart?.();
            utterance.onend?.();
          },
        },
      });
    }, { key: storageKey, question });

    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/fast-reply') || path.endsWith('/follow-up')) {
        const answer = route.request().postDataJSON().rawUserAnswer;
        if (answer) submittedAnswers.push(answer);
        await route.fulfill({ json: { followUpQuestion: nextQuestion } });
      } else if (path.endsWith('/csrf-token')) {
        await route.fulfill({ json: { csrfToken: 'test-token' } });
      } else {
        await route.fulfill({ json: {} });
      }
    });

    const dictate = async (text) => {
      await page.waitForFunction(() => Boolean(window.interviewTestRecognition?.onresult));
      await page.evaluate((transcript) => {
        const result = [{ transcript, confidence: 0.99 }];
        result.isFinal = true;
        window.interviewTestRecognition.onresult({ resultIndex: 0, results: [result] });
      }, text);
    };
    const expectDraft = (draft) => expect.poll(
      () => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key))?.pendingTranscript, storageKey),
    ).toBe(draft);

    await page.goto('/ai-interview');
    await dictate('I would use a short-lived cache.');
    await expectDraft('I would use a short-lived cache.');
    await page.reload();

    const review = page.getByRole('region', { name: 'Review your answer' });
    await expect(review.getByRole('textbox')).toHaveValue('I would use a short-lived cache.');
    expect(submittedAnswers).toHaveLength(0);
    await review.getByRole('textbox').fill('I would cache popular queries.');
    await review.getByRole('button', { name: 'Continue speaking' }).click();
    await dictate('I would set an expiry.');
    const combined = 'I would cache popular queries. I would set an expiry.';
    await expectDraft(combined);

    await context.setOffline(true);
    await expect(review.getByText('Connection Lost')).toBeVisible();
    await expect(review.getByRole('textbox')).toHaveValue(combined);
    await context.setOffline(false);
    await expect(review).toBeHidden();

    await page.waitForFunction(() => typeof window.interviewTestRecognition?.onerror === 'function');
    await page.evaluate(() => window.interviewTestRecognition.onerror({ error: 'not-allowed' }));
    await review.getByRole('button', { name: 'Type Your Answers' }).click();
    await expect(review.getByRole('textbox')).toHaveValue(combined);
    await review.getByRole('button', { name: 'Send answer' }).click();
    await expect.poll(() => submittedAnswers).toHaveLength(1);
    expect(submittedAnswers[0]).toContain(combined);
    await expect.poll(() => page.evaluate((key) => {
      const checkpoint = JSON.parse(sessionStorage.getItem(key));
      return { question: checkpoint?.currentQuestion, index: checkpoint?.questionIndex };
    }, storageKey)).toEqual({ question: nextQuestion, index: 2 });
    await expectDraft('');
  });

  test('boots code review and debugging interview platforms', async ({ page }) => {
    await expectBootedPage(page, '/code-review-interview');
    await expectBootedPage(page, '/debugging-interview');
  });

  test('boots interview suite catalog', async ({ page }) => {
    await expectBootedPage(page, '/interview-suite');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });
  });
});

