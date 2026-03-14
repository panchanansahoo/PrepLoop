import './config/env.js';

console.log('\n🔍 DIAGNOSTIC TEST - Backend Startup Verification\n');

// Test 1: Check environment variables
console.log('📋 TEST 1: Environment Variables');
console.log(`  ✅ PORT: ${process.env.PORT || 5000}`);
console.log(`  ✅ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  ✅ SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓' : '✗'}`);
console.log(`  ✅ SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✓' : '✗'}`);
console.log(`  ✅ GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓' : '✗'}\n`);

// Test 2: Import all routes
console.log('📋 TEST 2: Route Imports');
const routes = [
  'auth', 'dsa', 'practice', 'ai', 'user', 'resume', 
  'systemDesign', 'community', 'coach', 'interview', 
  'interview-enhanced', 'contact', 'blog', 'activity', 
  'companyInterview', 'payment', 'voice', 'notes'
];

let routeErrors = [];
for (const route of routes) {
  try {
    await import(`./routes/${route}.js`);
    console.log(`  ✅ ${route}`);
  } catch (error) {
    console.log(`  ❌ ${route}: ${error.message}`);
    routeErrors.push({ route, error: error.message });
  }
}

// Test 3: Middleware imports
console.log('\n📋 TEST 3: Middleware Imports');
try {
  await import('./middleware/auth.js');
  console.log(`  ✅ auth middleware`);
} catch (e) {
  console.log(`  ❌ auth middleware: ${e.message}`);
  routeErrors.push({ route: 'middleware/auth', error: e.message });
}

try {
  await import('./middleware/rateLimiter.js');
  console.log(`  ✅ rateLimiter middleware`);
} catch (e) {
  console.log(`  ❌ rateLimiter middleware: ${e.message}`);
  routeErrors.push({ route: 'middleware/rateLimiter', error: e.message });
}

// Test 4: Supabase Client
console.log('\n📋 TEST 4: Database Client');
try {
  const { supabaseAdmin, supabaseClient } = await import('./db/supabaseClient.js');
  console.log(`  ✅ supabaseAdmin client initialized`);
  console.log(`  ✅ supabaseClient initialized`);
} catch (error) {
  console.log(`  ❌ Supabase client: ${error.message}`);
  routeErrors.push({ route: 'db/supabaseClient', error: error.message });
}

// Summary
console.log('\n' + '='.repeat(60));
if (routeErrors.length === 0) {
  console.log('✅ ALL TESTS PASSED - Backend is ready to start!');
  console.log('\nTo start the server, run: npm start');
} else {
  console.log(`❌ ${routeErrors.length} ERROR(S) FOUND:`);
  routeErrors.forEach(({ route, error }, i) => {
    console.log(`\n  ${i + 1}. ${route}`);
    console.log(`     Error: ${error}`);
  });
}
console.log('='.repeat(60) + '\n');

process.exit(routeErrors.length > 0 ? 1 : 0);
