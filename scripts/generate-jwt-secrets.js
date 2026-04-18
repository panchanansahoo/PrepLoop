#!/usr/bin/env node
import { randomBytes } from 'crypto';

console.log('\n🔐 Generating secure JWT secrets...\n');

const jwtSecret = randomBytes(32).toString('hex');
const jwtRefreshSecret = randomBytes(32).toString('hex');

console.log('Add these to your backend/.env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('\n✅ Secrets generated successfully!\n');
console.log('⚠️  Keep these secrets secure and never commit them to version control.\n');
