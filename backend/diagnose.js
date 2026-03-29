#!/usr/bin/env node

console.log('🔍 Diagnosing Backend Startup Issues...\n');

async function runDiagnostic() {
  // Load environment variables first.
  await import('./config/env.js');
  console.log('✅ Environment variables loaded\n');

  const routes = [
    { name: 'auth', path: './routes/auth.js' },
    { name: 'dsa', path: './routes/dsa.js' },
    { name: 'practice', path: './routes/practice.js' },
    { name: 'ai', path: './routes/ai.js' },
    { name: 'user', path: './routes/user.js' },
    { name: 'resume', path: './routes/resume.js' },
    { name: 'systemDesign', path: './routes/systemDesign.js' },
    { name: 'community', path: './routes/community.js' },
    { name: 'coach', path: './routes/coach.js' },
    { name: 'interview', path: './routes/interview.js' },
    { name: 'interviewEnhanced', path: './routes/interview-enhanced.js' },
    { name: 'contact', path: './routes/contact.js' },
    { name: 'blog', path: './routes/blog.js' },
    { name: 'activity', path: './routes/activity.js' },
    { name: 'companyInterview', path: './routes/companyInterview.js' },
    { name: 'payment', path: './routes/payment.js' },
    { name: 'voice', path: './routes/voice.js' },
    { name: 'notes', path: './routes/notes.js' }
  ];

  console.log('🧪 Testing route imports:\n');

  const failed = [];
  for (const route of routes) {
    try {
      await import(route.path);
      console.log(`✅ ${route.name}`);
    } catch (error) {
      console.log(`❌ ${route.name}`);
      console.log(`   Error: ${error.message}\n`);
      failed.push(route);
    }
  }

  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} route(s) failed to import:`);
    for (const route of failed) {
      console.log(`   - ${route.name}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('✅ All routes loaded successfully!');

  const shouldStartServer = process.argv.includes('--start');
  if (!shouldStartServer) {
    console.log('\nℹ️ Diagnostic completed. Use "node backend/diagnose.js --start" to also boot the server.');
    return;
  }

  console.log('\n🚀 Attempting to start server...\n');
  await import('./index.js');
}

runDiagnostic().catch((err) => {
  console.error('❌ Diagnostic failed:', err.message);
  process.exit(1);
});
