#!/usr/bin/env node
/**
 * Test startup environment validation
 */
import { getProductionEnvValidationErrors, getConfigDebugInfo } from './config/startupEnvValidation.js';

console.log('🧪 Backend Startup Validation Test\n');
console.log('Current Config:');
console.log(JSON.stringify(getConfigDebugInfo(), null, 2));

console.log('\nValidation Status:');
const errors = getProductionEnvValidationErrors();
if (errors.length === 0) {
  console.log('✅ No validation errors in current environment');
} else {
  console.log(`⚠️  Found ${errors.length} validation error(s):`);
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });
}
