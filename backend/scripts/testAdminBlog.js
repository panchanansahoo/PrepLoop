/*
 * Lightweight smoke test for blog endpoints.
 *
 * Usage:
 *   npm run test:blog:admin
 *
 * Optional env:
 *   API_BASE_URL=http://localhost:5000
 *   ADMIN_JWT=<token with admin role>
 */

import { buildLocalEndpoint, ensureLocalBaseUrl } from './utils/safeLocalUrl.js';

const API_BASE_URL = ensureLocalBaseUrl(process.env.API_BASE_URL || 'http://localhost:5000');
const ADMIN_JWT = process.env.ADMIN_JWT;

async function request(path, options = {}) {
  const response = await fetch(buildLocalEndpoint(API_BASE_URL, path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text when response is not JSON
  }

  return { response, body };
}

async function run() {
  console.log(`Running blog smoke tests against ${API_BASE_URL}`);

  const publicList = await request('/api/blog/public/posts');
  if (!publicList.response.ok) {
    throw new Error(`Public list failed: ${publicList.response.status} ${JSON.stringify(publicList.body)}`);
  }
  console.log('OK GET /api/blog/public/posts');

  if (!ADMIN_JWT) {
    console.log('Skipped admin checks (ADMIN_JWT not provided).');
    return;
  }

  const adminList = await request('/api/blog/admin/posts', {
    headers: { Authorization: `Bearer ${ADMIN_JWT}` },
  });

  if (!adminList.response.ok) {
    throw new Error(`Admin list failed: ${adminList.response.status} ${JSON.stringify(adminList.body)}`);
  }

  console.log('OK GET /api/blog/admin/posts');
}

run()
  .then(() => {
    console.log('Blog smoke test completed successfully.');
  })
  .catch((error) => {
    console.error('Blog smoke test failed:', error.message);
    process.exitCode = 1;
  });
