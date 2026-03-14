#!/usr/bin/env node

console.log('🔍 Diagnosing Backend Startup Issues...\n');

// Load environment variables first
import('./config/env.js').then(() => {
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
  
  let failed = [];
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
  } else {
    console.log('✅ All routes loaded successfully!');
    console.log('\n🚀 Attempting to start server...\n');
    
    // Now try to start the actual server
    import('./index.js').catch(err => {
      console.error('❌ Server startup failed:', err);
      process.exit(1);
    });
  }
}).catch(err => {
  console.error('❌ Failed to load environment:', err.message);
  process.exit(1);
});
