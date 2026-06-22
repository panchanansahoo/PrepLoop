import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(backendDir, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertRegex(source, regex, message) {
  assert(regex.test(source), message);
}

function assertNotRegex(source, regex, message) {
  assert(!regex.test(source), message);
}

function run() {
  const hrRoutes = read('routes/hr.js');
  const voiceRoutes = read('routes/voice.js');
  const authMiddleware = read('middleware/auth.js');

  // No insecure JWT fallback literals.
  assertNotRegex(
    hrRoutes,
    /preploop-jwt-secret-key/,
    'hr.js must not include hardcoded JWT fallback secrets',
  );

  // Ensure HR role gate exists and is used for privileged HR mutations.
  assertRegex(authMiddleware, /export const requireHR\s*=\s*\(/, 'auth.js must export requireHR middleware');

  const protectedHrRoutes = [
    /router\.post\('\/slots',\s*authenticateToken,\s*requireHR,\s*async/s,
    /router\.delete\('\/slots\/:id',\s*authenticateToken,\s*requireHR,\s*async/s,
    /router\.put\('\/complete\/:bookingId',\s*authenticateToken,\s*requireHR,\s*async/s,
    /router\.post\('\/jobs',\s*authenticateToken,\s*requireHR,\s*async/s,
    /router\.delete\('\/jobs\/:id',\s*authenticateToken,\s*requireHR,\s*async/s,
  ];

  for (const pattern of protectedHrRoutes) {
    assertRegex(hrRoutes, pattern, `Missing required HR authz middleware on route pattern: ${pattern}`);
  }

  // Ensure identity field is consistent with auth middleware shape.
  assertNotRegex(hrRoutes, /req\.user\.userId/, 'hr.js must use req.user.id, not req.user.userId');

  // Ownership check must constrain interview completion updates.
  assertRegex(
    hrRoutes,
    /UPDATE\s+interview_bookings[\s\S]*FROM\s+interview_slots[\s\S]*s\.hr_id\s*=\s*\$4/s,
    'Interview completion query must enforce HR ownership via interview_slots.hr_id',
  );

  // Voice LLM endpoint must require authentication.
  assertRegex(
    voiceRoutes,
    /router\.post\('\/analyze-answer',\s*authenticateToken,\s*async/s,
    'voice analyze-answer endpoint must require authenticateToken',
  );

  console.log('Security fixes regression test passed.');
}

try {
  run();
} catch (error) {
  console.error(`Security fixes regression test failed: ${error.message}`);
  process.exit(1);
}
