import assert from 'node:assert/strict';
import { getEmailProvider, isEmailConfigured, sendEmail } from '../services/emailService.js';

const originalEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  EMAIL_FROM: process.env.EMAIL_FROM,
};
const originalFetch = globalThis.fetch;

const restoreEnv = () => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

try {
  process.env.SMTP_PASS = 're_test_key';
  delete process.env.RESEND_API_KEY;
  process.env.SMTP_HOST = 'smtp.resend.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'resend';
  process.env.EMAIL_FROM = '"PrepLoop" <support@preploop.me>';

  assert.equal(getEmailProvider(), 'resend');
  assert.equal(isEmailConfigured(), true);

  let capturedRequest = null;
  globalThis.fetch = (url, options) => {
    capturedRequest = { url, options };
    return Promise.resolve(new Response(JSON.stringify({ id: 'email_test_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  };

  const result = await sendEmail({
    to: 'delivered@resend.dev',
    subject: 'PrepLoop email service test',
    html: '<p>Test</p>',
  });

  assert.equal(result.provider, 'resend');
  assert.equal(result.id, 'email_test_123');
  assert.equal(capturedRequest?.url, 'https://api.resend.com/emails');
  assert.equal(capturedRequest?.options?.headers?.Authorization, 'Bearer re_test_key');

  const requestBody = JSON.parse(capturedRequest.options.body);
  assert.deepEqual(requestBody.to, ['delivered@resend.dev']);
  assert.equal(requestBody.from, '"PrepLoop" <support@preploop.me>');
  assert.equal(requestBody.subject, 'PrepLoop email service test');
  assert.equal(requestBody.html, '<p>Test</p>');

  globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify({ message: 'Invalid API key' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  }));

  await assert.rejects(
    () => sendEmail({ to: 'delivered@resend.dev', subject: 'Failure test', text: 'Test' }),
    /Resend API error \(401\): Invalid API key/
  );

  process.env.SMTP_PASS = 're_your_resend_api_key_here';
  delete process.env.RESEND_API_KEY;
  assert.equal(isEmailConfigured(), false);
  await assert.rejects(
    () => sendEmail({ to: 'delivered@resend.dev', subject: 'No config', text: 'Test' }),
    /Email delivery is not configured/
  );

  console.log('✅ Email service tests passed');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
}
