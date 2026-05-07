#!/usr/bin/env node
/**
 * Phase 2 Security Integration Verification Script
 * Checks that all security middleware is properly integrated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, '..', 'backend');

console.log('🔍 Phase 2 Security Integration Verification\n');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;
let warnings = 0;

function check(description, condition, details = '') {
  if (condition) {
    console.log(`✅ ${description}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

function warn(description, details = '') {
  console.log(`⚠️  ${description}`);
  if (details) console.log(`   ${details}`);
  warnings++;
}

// 1. Check JWT Secrets
console.log('\n📋 1. JWT Token Security');
console.log('-'.repeat(70));

try {
  const envContent = fs.readFileSync(path.join(backendDir, '.env'), 'utf8');
  
  const accessSecretMatch = envContent.match(/ACCESS_TOKEN_SECRET=(.+)/);
  const refreshSecretMatch = envContent.match(/REFRESH_TOKEN_SECRET=(.+)/);
  
  check('ACCESS_TOKEN_SECRET exists', 
    accessSecretMatch && accessSecretMatch[1].length >= 64,
    accessSecretMatch ? `Length: ${accessSecretMatch[1].length} chars` : 'Not found'
  );
  
  check('REFRESH_TOKEN_SECRET exists',
    refreshSecretMatch && refreshSecretMatch[1].length >= 64,
    refreshSecretMatch ? `Length: ${refreshSecretMatch[1].length} chars` : 'Not found'
  );
  
  // Check for legacy secret warning
  if (envContent.includes('JWT_SECRET=')) {
    warn('Legacy JWT_SECRET still present',
      'Consider removing after migration is complete'
    );
  }
} catch (error) {
  check('.env file readable', false, error.message);
}

// 2. Check Rate Limiting
console.log('\n📋 2. Rate Limiting');
console.log('-'.repeat(70));

try {
  const enhancedRateLimiterPath = path.join(backendDir, 'middleware', 'enhancedRateLimiter.js');
  check('enhancedRateLimiter.js exists',
    fs.existsSync(enhancedRateLimiterPath)
  );
  
  const indexContent = fs.readFileSync(path.join(backendDir, 'index.js'), 'utf8');
  
  check('Rate limiters imported in index.js',
    indexContent.includes('authLimiter') && indexContent.includes('standardLimiter')
  );
  
  check('Auth routes use authLimiter',
    indexContent.includes("app.use('/api/auth', authLimiter)")
  );
  
  check('AI routes use aiLimiter',
    indexContent.includes('aiLimiter')
  );
  
  // Check specific route files
  const authRoutesContent = fs.readFileSync(path.join(backendDir, 'routes', 'auth.js'), 'utf8');
  check('Auth routes have rate limiting',
    authRoutesContent.includes('authLoginLimiter') || authRoutesContent.includes('rateLimit')
  );
} catch (error) {
  check('Rate limiter verification', false, error.message);
}

// 3. Check Input Validation
console.log('\n📋 3. Input Validation');
console.log('-'.repeat(70));

try {
  const validationSchemasPath = path.join(backendDir, 'middleware', 'validationSchemas.js');
  check('validationSchemas.js exists',
    fs.existsSync(validationSchemasPath)
  );
  
  const schemasContent = fs.readFileSync(validationSchemasPath, 'utf8');
  
  check('Signup schema defined',
    schemasContent.includes('signupSchema')
  );
  
  check('Login schema defined',
    schemasContent.includes('loginSchema')
  );
  
  check('Password validation pattern',
    schemasContent.includes('passwordPattern')
  );
  
  check('Email validation pattern',
    schemasContent.includes('emailPattern')
  );
  
  // Check if validation is applied to routes
  const authRoutesContent = fs.readFileSync(path.join(backendDir, 'routes', 'auth.js'), 'utf8');
  check('Validation applied to signup',
    authRoutesContent.includes('validateBody(signupSchema)')
  );
  
  check('Validation applied to login',
    authRoutesContent.includes('validateBody(loginSchema)')
  );
} catch (error) {
  check('Input validation verification', false, error.message);
}

// 4. Check File Upload Security
console.log('\n📋 4. File Upload Security');
console.log('-'.repeat(70));

try {
  const secureUploadPath = path.join(backendDir, 'middleware', 'secureFileUpload.js');
  check('secureFileUpload.js exists',
    fs.existsSync(secureUploadPath)
  );
  
  const uploadContent = fs.readFileSync(secureUploadPath, 'utf8');
  
  check('File size limits defined',
    uploadContent.includes('maxSize')
  );
  
  check('MIME type validation',
    uploadContent.includes('mimeTypes')
  );
  
  check('Secure filename generation',
    uploadContent.includes('crypto') || uploadContent.includes('random')
  );
  
  // Check if used in routes
  const resumeRoutesPath = path.join(backendDir, 'routes', 'resume.js');
  if (fs.existsSync(resumeRoutesPath)) {
    const resumeContent = fs.readFileSync(resumeRoutesPath, 'utf8');
    check('Secure upload used in resume routes',
      resumeContent.includes('secureUpload')
    );
  } else {
    warn('No resume.js route file found',
      'File upload security may not be applied'
    );
  }
} catch (error) {
  check('File upload security verification', false, error.message);
}

// 5. Check CSRF Protection
console.log('\n📋 5. CSRF Protection');
console.log('-'.repeat(70));

try {
  const csrfPath = path.join(backendDir, 'middleware', 'csrfProtection.js');
  check('csrfProtection.js exists',
    fs.existsSync(csrfPath)
  );
  
  const indexContent = fs.readFileSync(path.join(backendDir, 'index.js'), 'utf8');
  
  check('CSRF protection imported',
    indexContent.includes('setupCsrfProtection')
  );
  
  check('CSRF protection configured',
    indexContent.includes('setupCsrfProtection(app')
  );
  
  const csrfContent = fs.readFileSync(csrfPath, 'utf8');
  check('CSRF uses secure cookies',
    csrfContent.includes('httpOnly') && csrfContent.includes('sameSite')
  );
} catch (error) {
  check('CSRF protection verification', false, error.message);
}

// 6. Check Dependencies
console.log('\n📋 6. Security Dependencies');
console.log('-'.repeat(70));

try {
  const packageJsonPath = path.join(backendDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  check('express-rate-limit installed',
    'express-rate-limit' in dependencies
  );
  
  check('joi installed',
    'joi' in dependencies
  );
  
  check('multer installed',
    'multer' in dependencies
  );
  
  check('csurf installed',
    'csurf' in dependencies
  );
  
  check('helmet installed',
    'helmet' in dependencies
  );
} catch (error) {
  check('Dependencies verification', false, error.message);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed:   ${passed}`);
console.log(`❌ Failed:   ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log('='.repeat(70));

if (failed === 0) {
  console.log('\n🎉 SUCCESS! All Phase 2 security features are properly integrated!');
  console.log('\nNext steps:');
  console.log('1. Test the application to ensure no breaking changes');
  console.log('2. Monitor rate limiting in production');
  console.log('3. Review logs for CSRF violations');
  console.log('4. Proceed to Phase 3 or Phase 4 implementation');
  process.exit(0);
} else {
  console.log('\n❌ FAILED! Some security features need attention.');
  console.log('\nPlease review the failed checks above and fix them.');
  process.exit(1);
}
