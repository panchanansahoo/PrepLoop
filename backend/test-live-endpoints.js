// Lightweight live endpoint verification for interview-enhanced routes
// - Stubs auth middleware by replacing it in the router stack
// - Stubs supabaseAdmin query methods to return safe dummy data
// - Ensures groq is disabled via env so AI calls fall back to static responses

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost/dummy';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || '';

import express from 'express';
import interviewEnhancedRouter from './routes/interview-enhanced.js';
import * as supabaseClient from './db/supabaseClient.js';

// Monkeypatch supabaseAdmin to avoid external DB calls
const makeChain = (result) => {
  // thenable chain that supports common supabase query methods
  const chain = {
    select() { return chain; },
    eq() { return chain; },
    order() { return chain; },
    limit() { return chain; },
    single() { return chain; },
    then(onFulfilled, onRejected) { return Promise.resolve(result).then(onFulfilled, onRejected); },
    catch(onRejected) { return Promise.resolve(result).catch(onRejected); }
  };
  return chain;
};

if (supabaseClient && supabaseClient.supabaseAdmin) {
  supabaseClient.supabaseAdmin.from = () => makeChain({ data: [], error: null });

  // Stub auth.getUser to emulate Supabase auth behavior for protected routes
  if (!supabaseClient.supabaseAdmin.auth) supabaseClient.supabaseAdmin.auth = {};
  supabaseClient.supabaseAdmin.auth.getUser = async (token) => {
    // Basic validation: accept any non-empty token in harness
    if (!token) return { data: { user: null }, error: { message: 'No token' } };
    return {
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          user_metadata: {}
        }
      },
      error: null
    };
  };
}

// Replace authenticateToken middleware in the imported router with a passthrough
const stubAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user', email: 'test@example.com', role: 'user' };
  next();
};

// Replace any middleware named 'authenticateToken' or matching the function source
try {
  for (const layer of interviewEnhancedRouter.stack) {
    if (layer && layer.route && Array.isArray(layer.route.stack)) {
      for (const routeLayer of layer.route.stack) {
        if (routeLayer && routeLayer.handle && routeLayer.handle.name === 'authenticateToken') {
          routeLayer.handle = stubAuthMiddleware;
        }
        // Fallback: if stringified function mentions 'supabaseAdmin.auth.getUser' assume it's auth
        else if (routeLayer && routeLayer.handle && routeLayer.handle.toString().includes('getUser')) {
          routeLayer.handle = stubAuthMiddleware;
        }
      }
    }
  }
} catch (e) {
  console.warn('Could not patch router middleware safely:', e.message);
}

const app = express();
app.use(express.json());
// Mount the enhanced interview router at the test path and production mount points
app.use('/test-api/interview', interviewEnhancedRouter);
app.use('/api/ai/interview/v2', interviewEnhancedRouter);
app.use('/api/ai', interviewEnhancedRouter);

const run = async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const mountBases = ['/test-api/interview', '/api/ai/interview/v2', '/api/ai'];
  console.log('🔎 Live endpoint verification starting on', `http://localhost:${port}`, '— testing mounts:', mountBases.join(', '));

  const results = [];

  // Helper to fetch and parse safely
  const tryFetch = async (method, path, body, base) => {
    const url = base + path;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer faketoken' },
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      return { status: res.status, body: parsed };
    } catch (err) {
      return { error: err.message };
    }
  };

  // Call representative endpoints for each mounted base path
  for (const mountBase of mountBases) {
    const base = `http://localhost:${port}${mountBase}`;
    results.push({ mount: mountBase, endpoint: '/prepare/google', result: await tryFetch('GET', '/prepare/google', null, base) });
    results.push({ mount: mountBase, endpoint: '/feedback/realtime', result: await tryFetch('POST', '/feedback/realtime', { question: 'What is a binary search?', answer: 'It divides...', type: 'dsa', difficulty: 'medium' }, base) });
    results.push({ mount: mountBase, endpoint: '/questions/adaptive', result: await tryFetch('POST', '/questions/adaptive', { recentResponses: [], currentPerformance: {} }, base) });
    results.push({ mount: mountBase, endpoint: '/recommendations/personalized', result: await tryFetch('GET', '/recommendations/personalized', null, base) });
    results.push({ mount: mountBase, endpoint: '/analysis/detailed', result: await tryFetch('POST', '/analysis/detailed', { responses: [{ q: 'a', ans: 'b' }] }, base) });
    results.push({ mount: mountBase, endpoint: '/trends/performance', result: await tryFetch('GET', '/trends/performance', null, base) });
  }

  console.log('\n📦 Results:');
  for (const r of results) {
    const mountInfo = r.mount ? `[mount ${r.mount}] ` : '';
    console.log('-', mountInfo + r.endpoint, '=>', r.result.error ? `ERROR: ${r.result.error}` : `HTTP ${r.result.status}`);
    if (!r.result.error) console.log('  ', JSON.stringify(r.result.body).slice(0, 400));
  }
  // Determine overall success: any network/error or non-2xx status should fail CI
  let failed = false;
  for (const r of results) {
    if (r.result.error) { failed = true; break; }
    if (typeof r.result.status === 'number' && (r.result.status < 200 || r.result.status >= 300)) { failed = true; break; }
  }

  server.close();

  if (failed) {
    console.error('\n❌ Some live endpoint checks failed. Exiting with code 1 for CI.');
    process.exit(1);
  } else {
    console.log('\n✅ All live endpoint checks returned 2xx or OK responses.');
    process.exit(0);
  }
};

run().catch(e => {
  console.error('Live endpoint test failed:', e);
  process.exit(1);
});
