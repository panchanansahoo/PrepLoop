#!/usr/bin/env node

import { executeCustomTests } from '../services/customTestService.js';

console.log('Testing error case execution:\n');

const result = await executeCustomTests({
  code: 'undefined_function()',
  testCases: [
    { id: 't1', input: '', expected: 'result', description: 'Error case' }
  ],
  language: 'javascript',
  timeout: 5000,
});

console.log('Result:');
console.log(JSON.stringify(result, null, 2));
