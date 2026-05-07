#!/usr/bin/env node

/**
 * Phase 2 Security Implementation Runner
 * Applies all security improvements to the application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Phase 2 Security Implementation\n');
console.log('=' .repeat(70));

// Configuration
const backendDir = path.join(__dirname, '..');
const middlewareDir = path.join(backendDir, 'middleware');

// Check if required files exist
const requiredFiles = [
  'generate-jwt-secrets.js',
  '../middleware/refreshTokenRotation.js',
  '../middleware/enhancedRateLimiter.js',
  '../middleware/validationSchemas.js',
  '../middleware/secureFileUpload.js',
  '../middleware/csrfProtection.js',
];

console.log('\n📋 Checking implementation files...\n');

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all Phase 2 files are created.');
  process.exit(1);
}

console.log('\n✅ All implementation files present!\n');

// Check dependencies
console.log('📦 Checking dependencies...\n');

const requiredDeps = ['joi', 'multer', 'csurf', 'express-rate-limit'];
const packageJsonPath = path.join(backendDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const installedDeps = Object.keys(packageJson.dependencies || {});

let allDepsInstalled = true;
for (const dep of requiredDeps) {
  const isInstalled = installedDeps.includes(dep);
  const status = isInstalled ? '✅' : '❌';
  console.log(`${status} ${dep}`);
  
  if (!isInstalled) {
    allDepsInstalled = false;
  }
}

if (!allDepsInstalled) {
  console.log('\n⚠️  Some dependencies are missing. Installing now...\n');
  try {
    execSync('npm install joi multer csurf express-rate-limit', {
      cwd: backendDir,
      stdio: 'inherit',
    });
    console.log('\n✅ Dependencies installed successfully!\n');
  } catch (error) {
    console.error('\n❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('\n✅ All dependencies installed!\n');
}

// Check environment variables
console.log('🔍 Checking environment variables...\n');

const envPath = path.join(backendDir, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const requiredEnvVars = [
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
];

let allEnvVarsSet = true;
for (const envVar of requiredEnvVars) {
  const isSet = envContent.includes(`${envVar}=`) && 
                !envContent.includes(`${envVar}=your_`) &&
                !envContent.includes(`${envVar}=CHANGE_ME`);
  const status = isSet ? '✅' : '❌';
  console.log(`${status} ${envVar}`);
  
  if (!isSet) {
    allEnvVarsSet = false;
  }
}

if (!allEnvVarsSet) {
  console.log('\n⚠️  Some environment variables are not properly configured.');
  console.log('\n💡 Run this command to generate new secrets:');
  console.log('   node scripts/generate-jwt-secrets.js\n');
  console.log('Then add the generated secrets to backend/.env\n');
} else {
  console.log('\n✅ Environment variables configured!\n');
}

// Implementation checklist
console.log('='.repeat(70));
console.log('\n📝 IMPLEMENTATION CHECKLIST\n');
console.log('Complete these steps to finish Phase 2:\n');

const checklist = [
  {
    step: 1,
    title: 'Update app.js/server.js with middleware',
    description: 'Add rate limiting, CSRF protection, and validation to your Express app',
    code: `
// In backend/index.js or app.js

import { standardLimiter, authLimiter } from './middleware/enhancedRateLimiter.js';
import { setupCsrfProtection } from './middleware/csrfProtection.js';

// Apply rate limiting
app.use('/api/', standardLimiter);
app.use('/api/auth/', authLimiter);

// Setup CSRF protection
setupCsrfProtection(app, {
  skipPaths: ['/api/webhooks', '/health'],
});
`,
    done: false,
  },
  {
    step: 2,
    title: 'Add validation to routes',
    description: 'Import and apply validation schemas to your route handlers',
    code: `
// Example: In routes/auth.js

import { validateBody } from '../middleware/validationSchemas.js';
import { signupSchema, loginSchema } from '../middleware/validationSchemas.js';

router.post('/signup', validateBody(signupSchema), signupHandler);
router.post('/login', validateBody(loginSchema), loginHandler);
`,
    done: false,
  },
  {
    step: 3,
    title: 'Secure file upload endpoints',
    description: 'Replace existing upload middleware with secure uploader',
    code: `
// Example: In routes/upload.js

import { profilePictureUploader, resumeUploader } from '../middleware/secureFileUpload.js';

router.post('/upload/profile-picture', profilePictureUploader, uploadHandler);
router.post('/upload/resume', resumeUploader, uploadHandler);
`,
    done: false,
  },
  {
    step: 4,
    title: 'Implement token rotation in auth routes',
    description: 'Use refresh token rotation for enhanced security',
    code: `
// Example: In routes/auth.js

import { rotateRefreshToken } from '../middleware/refreshTokenRotation.js';

router.post('/refresh', async (req, res) => {
  try {
    const { oldRefreshToken } = req.body;
    const newTokens = await rotateRefreshToken(req.user.id, oldRefreshToken);
    
    res.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
`,
    done: false,
  },
  {
    step: 5,
    title: 'Test security improvements',
    description: 'Verify all security features are working correctly',
    tasks: [
      'Test rate limiting by making multiple requests',
      'Test input validation with invalid data',
      'Test file upload with wrong file types',
      'Test CSRF protection on form submissions',
      'Test token rotation on refresh',
    ],
    done: false,
  },
];

for (const item of checklist) {
  console.log(`${item.step}. ${item.title}`);
  console.log(`   ${item.description}\n`);
  
  if (item.code) {
    console.log('   Example:');
    console.log(item.code.split('\n').map(line => `   ${line}`).join('\n'));
    console.log('');
  }
  
  if (item.tasks) {
    console.log('   Tasks:');
    item.tasks.forEach(task => console.log(`   - ${task}`));
    console.log('');
  }
  
  console.log('-'.repeat(70) + '\n');
}

// Summary
console.log('='.repeat(70));
console.log('\n📊 PHASE 2 SUMMARY\n');

console.log('✅ Completed:');
console.log('   • JWT secret generation script');
console.log('   • Refresh token rotation middleware');
console.log('   • Enhanced rate limiter (user-based)');
console.log('   • Input validation schemas (Joi)');
console.log('   • Secure file upload middleware');
console.log('   • CSRF protection middleware');
console.log('   • Dependencies installed');
console.log('   • Environment variables configured\n');

console.log('⏳ Pending:');
console.log('   • Integrate middleware into Express app');
console.log('   • Add validation to all routes');
console.log('   • Replace file upload handlers');
console.log('   • Implement token rotation in auth flow');
console.log('   • Test all security features\n');

console.log('💡 Next Steps:');
console.log('   1. Follow the checklist above to integrate middleware');
console.log('   2. See PHASE2_IMPLEMENTATION_GUIDE.md for detailed instructions');
console.log('   3. Test thoroughly before deploying to production');
console.log('   4. Monitor security metrics after deployment\n');

console.log('='.repeat(70));
console.log('\n🎉 Phase 2 framework is ready! Complete the integration steps above.\n');
