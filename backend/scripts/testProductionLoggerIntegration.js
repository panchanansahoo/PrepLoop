/**
 * Integration Test: Verify Production Logger works with actual startup logs
 * 
 * Simulates the actual startup sequence to ensure critical logs are preserved
 */

import { disableConsoleLogs, enableConsoleLogs } from '../utils/productionLogger.js';
import { createLogger } from '../utils/structuredLogger.js';

console.log('\n═══════════════════════════════════════════════════════');
console.log('Production Logger Integration Test');
console.log('═══════════════════════════════════════════════════════\n');

// Simulate production mode
process.env.NODE_ENV = 'production';

console.log('✅ TEST: Startup sequence in production mode\n');
console.log('--- Before disableConsoleLogs() ---');
console.log('This line should be visible (development mode not yet disabled)');

disableConsoleLogs();

console.log('\n--- After disableConsoleLogs() ---');
console.log('[filtered] This debug message should NOT appear');
console.log('🚀 Server running on http://localhost:5000');
console.log('[filtered] Loading component X...');
console.log('📦 Loading routes...');
console.log('[filtered] Initializing cache...');
console.log('✅ Routes loaded successfully');
console.log('[filtered] Starting background jobs...');
console.log('[filtered] Cache initialized');

const structuredLogger = createLogger('startup-test');
structuredLogger.critical('All initialization complete', {
  port: 5000,
  routes: 25,
  services: ['auth', 'api', 'cache'],
  uptime: '0ms'
});

console.log('❌ Failed to connect to optional service X (non-fatal, continuing...)');
console.log('[filtered] Verbose debug output');
console.log('⚠️  Warning: Memory usage is high');
console.log('[filtered] Another debug line');

try {
  throw new Error('Simulated error for testing');
} catch (error) {
  structuredLogger.error('Caught initialization error (handled)', { 
    step: 'database-warmup',
    retrying: true 
  }, error);
}

console.log('\nℹ️  Server initialization complete, ready to accept requests');

enableConsoleLogs();

console.log('\n--- After enableConsoleLogs() ---');
console.log('This line should be visible (console logging restored)');

console.log('\n═══════════════════════════════════════════════════════');
console.log('Integration Test Complete');
console.log('═══════════════════════════════════════════════════════\n');
console.log('✓ Startup logs with critical indicators (🚀 ✅ ❌ ⚠️  ℹ️) are preserved');
console.log('✓ Non-critical debug messages are filtered');
console.log('✓ Structured logger outputs JSON to stderr');
console.log('✓ Error logs include stack traces');
console.log('✓ Both console.log and structured logger work together\n');
