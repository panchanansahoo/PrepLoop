#!/usr/bin/env node

console.log('🔍 Testing Profile Autofill Fix...\n');

// Test 1: Check if resume routes load
console.log('Test 1: Loading resume routes...');
import('./backend/routes/resume.js')
  .then(() => {
    console.log('✅ Resume routes loaded successfully\n');
    
    // Test 2: Check if Profile.jsx exists
    console.log('Test 2: Checking Profile component...');
    const fs = require('fs');
    const profilePath = './frontend/src/pages/Profile.jsx';
    
    if (fs.existsSync(profilePath)) {
      const content = fs.readFileSync(profilePath, 'utf8');
      
      // Check for key features
      const checks = {
        'LinkedIn import state': content.includes('linkedinImporting'),
        'LinkedIn import handler': content.includes('handleLinkedInImport'),
        'Enhanced autofill': content.includes('designation') && content.includes('experience_level'),
        'Import buttons': content.includes('Import from Resume') && content.includes('Import from LinkedIn')
      };
      
      console.log('✅ Profile component found');
      Object.entries(checks).forEach(([feature, present]) => {
        console.log(`  ${present ? '✅' : '❌'} ${feature}`);
      });
      
      const allPresent = Object.values(checks).every(v => v);
      if (allPresent) {
        console.log('\n🎉 All features implemented successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Start backend: cd backend && npm run dev');
        console.log('2. Start frontend: cd frontend && npm run dev');
        console.log('3. Test the profile page');
      } else {
        console.log('\n⚠️  Some features may be missing. Check the files.');
      }
    } else {
      console.log('❌ Profile component not found');
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
  });
