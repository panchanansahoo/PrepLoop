#!/usr/bin/env node

/**
 * Generate Strong JWT Secrets
 * Creates cryptographically secure secrets for access and refresh tokens
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Generating Strong JWT Secrets\n');
console.log('=' .repeat(70));

// Generate cryptographically secure secrets
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

const accessTokenSecret = generateSecret(64); // 512 bits
const refreshTokenSecret = generateSecret(64); // 512 bits

console.log('\n✅ Generated cryptographically secure JWT secrets:\n');
console.log('ACCESS_TOKEN_SECRET (512 bits):');
console.log(accessTokenSecret);
console.log('\nREFRESH_TOKEN_SECRET (512 bits):');
console.log(refreshTokenSecret);

console.log('\n' + '='.repeat(70));
console.log('\n📝 Add these to your backend/.env file:\n');
console.log(`ACCESS_TOKEN_SECRET=${accessTokenSecret}`);
console.log(`REFRESH_TOKEN_SECRET=${refreshTokenSecret}`);

console.log('\n' + '='.repeat(70));

// Option to auto-update .env file
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  console.log('\n🔧 Would you like to update backend/.env automatically? (y/n)');
  
  // For non-interactive mode, just show instructions
  console.log('\n⚠️  Running in non-interactive mode.');
  console.log('   Please manually add the secrets to backend/.env\n');
} else {
  console.log('\n⚠️  backend/.env not found.');
  console.log('   Create it and add the secrets above.\n');
}

console.log('💡 Security Tips:');
console.log('   • Never commit .env files to git');
console.log('   • Use different secrets for each environment');
console.log('   • Rotate secrets periodically (every 90 days)');
console.log('   • Minimum secret length: 32 characters (256 bits)');
console.log('   • These secrets are 64 characters (512 bits) - very strong!\n');

console.log('='.repeat(70));
console.log('\n✅ Secret generation complete!\n');

// Also update .env.example
if (fs.existsSync(envExamplePath)) {
  let exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  
  // Replace placeholder secrets
  exampleContent = exampleContent.replace(
    /ACCESS_TOKEN_SECRET=.*/,
    'ACCESS_TOKEN_SECRET=your_access_token_secret_here'
  );
  exampleContent = exampleContent.replace(
    /REFRESH_TOKEN_SECRET=.*/,
    'REFRESH_TOKEN_SECRET=your_refresh_token_secret_here'
  );
  
  fs.writeFileSync(envExamplePath, exampleContent);
  console.log('📄 Updated backend/.env.example with placeholders\n');
}
