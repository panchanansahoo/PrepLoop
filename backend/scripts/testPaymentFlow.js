import process from 'process';
import assert from 'assert';

const BASE_URL = process.env.INTERVIEW_SUITE_BASE_URL || 'http://localhost:5000';

async function requestJson(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json, text: await response.text().catch(() => '') };
}

async function runPaymentSmoke() {
  console.log(`Running Payment smoke tests against ${BASE_URL}...`);

  // Test 1: POST /api/payment/create-order without auth should fail (401)
  const orderFail = await requestJson('/api/payment/create-order', {
    method: 'POST',
    body: { planId: 'plan_123' }
  });
  assert(orderFail.status === 401 || orderFail.status === 403, `Expected 401/403 for unauth order creation, got ${orderFail.status}`);
  console.log('OK /api/payment/create-order auth validation');

  // Test 2: POST /api/payment/webhook with invalid signature should fail
  const webhookFail = await requestJson('/api/payment/webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': 'invalid_signature' },
    body: { event: 'payment.captured' }
  });
  // The webhook usually validates the signature and returns 400 or 401 for bad sigs
  assert(webhookFail.status === 400 || webhookFail.status === 401 || webhookFail.status === 500, `Expected error for invalid webhook signature, got ${webhookFail.status}`);
  console.log('OK /api/payment/webhook signature validation');

  console.log('Payment smoke tests passed.');
}

runPaymentSmoke().catch(err => {
  console.error('Payment smoke failed:', err.message);
  process.exitCode = 1;
});
