#!/usr/bin/env node

/**
 * Phase 2 Data Collection Validator
 * Validates each collected problem against the required schema
 * Usage: node validatePhase2Problems.js < problems.json
 */

import fs from 'fs';
import path from 'path';

// 25 Approved Patterns
const APPROVED_PATTERNS = [
  'Array', 'Linked List', 'Tree', 'Binary Tree', 'Binary Search Tree',
  'Graph', 'String', 'Stack', 'Queue', 'Heap', 'Hash Map', 'Hash Set',
  'Dynamic Programming', 'Two Pointers', 'Sliding Window', 'Binary Search',
  'Bit Manipulation', 'Greedy', 'Trie', 'Union Find', 'Topological Sort',
  'DFS', 'BFS', 'Matrix', 'Backtracking'
];

// Validation rules
const VALIDATION_RULES = {
  id: {
    required: true,
    type: 'number',
    message: 'ID must be a unique integer'
  },
  title: {
    required: true,
    type: 'string',
    minLength: 3,
    message: 'Title must be unique and 3+ characters'
  },
  description: {
    required: true,
    type: 'string',
    minLength: 50,
    message: 'Description must be 50+ characters'
  },
  difficulty: {
    required: true,
    type: 'string',
    enum: ['Easy', 'Medium', 'Hard'],
    message: 'Difficulty must be Easy, Medium, or Hard'
  },
  pattern: {
    required: true,
    type: 'string',
    enum: APPROVED_PATTERNS,
    message: `Pattern must be one of: ${APPROVED_PATTERNS.join(', ')}`
  },
  companies: {
    required: true,
    type: 'array',
    minItems: 1,
    message: 'Must have at least 1 company'
  },
  examples: {
    required: true,
    type: 'array',
    minItems: 2,
    message: 'Must have at least 2 examples'
  },
  test_cases: {
    required: true,
    type: 'array',
    minItems: 3,
    message: 'Must have at least 3 test cases'
  },
  starter_code: {
    required: true,
    type: 'object',
    requiredKeys: ['python', 'javascript', 'cpp', 'java'],
    message: 'Must have starter code for: Python, JavaScript, C++, Java'
  },
  constraints: {
    required: true,
    type: 'array',
    minItems: 2,
    message: 'Must have at least 2 constraints'
  },
  function_name: {
    required: true,
    type: 'string',
    message: 'Function name must be provided'
  },
  time_complexity: {
    required: true,
    type: 'string',
    message: 'Time complexity must be in Big O notation (e.g., O(n))'
  },
  space_complexity: {
    required: true,
    type: 'string',
    message: 'Space complexity must be in Big O notation (e.g., O(n))'
  }
};

/**
 * Validate a single problem against schema
 */
function validateProblem(problem, index, allProblems = []) {
  const errors = [];

  // Check each required field
  for (const [field, rule] of Object.entries(VALIDATION_RULES)) {
    // Check if field exists
    if (rule.required && !(field in problem)) {
      errors.push(`❌ Missing required field: ${field}`);
      continue;
    }

    if (!(field in problem)) continue; // Optional field not present

    const value = problem[field];

    // Type checking
    if (rule.type && typeof value !== rule.type && rule.type !== 'array' && rule.type !== 'object') {
      errors.push(`❌ ${field}: Expected ${rule.type}, got ${typeof value}`);
      continue;
    }

    // Array type checking
    if (rule.type === 'array' && !Array.isArray(value)) {
      errors.push(`❌ ${field}: Expected array, got ${typeof value}`);
      continue;
    }

    // Object type checking
    if (rule.type === 'object' && typeof value !== 'object') {
      errors.push(`❌ ${field}: Expected object, got ${typeof value}`);
      continue;
    }

    // Min length for strings
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`❌ ${field}: Must be at least ${rule.minLength} characters (got ${value.length})`);
    }

    // Min items for arrays
    if (rule.minItems && Array.isArray(value) && value.length < rule.minItems) {
      errors.push(`❌ ${field}: Must have at least ${rule.minItems} items (got ${value.length})`);
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`❌ ${field}: Invalid value "${value}". Must be one of: ${rule.enum.join(', ')}`);
    }

    // Required keys for objects
    if (rule.requiredKeys && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of rule.requiredKeys) {
        if (!(key in value)) {
          errors.push(`❌ ${field}.${key}: Missing required key`);
        }
      }
    }
  }

  // Check for duplicate titles
  const duplicates = allProblems.filter((p, i) => i !== index && p.title === problem.title);
  if (duplicates.length > 0) {
    errors.push(`❌ Title is a duplicate: "${problem.title}"`);
  }

  // Validate example structure
  if (Array.isArray(problem.examples)) {
    for (let i = 0; i < problem.examples.length; i++) {
      const ex = problem.examples[i];
      if (!('input' in ex) || !('output' in ex) || !('explanation' in ex)) {
        errors.push(`❌ Example ${i + 1}: Missing input, output, or explanation`);
      }
    }
  }

  // Validate test_cases structure
  if (Array.isArray(problem.test_cases)) {
    for (let i = 0; i < problem.test_cases.length; i++) {
      const tc = problem.test_cases[i];
      if (!('input' in tc) || !('output' in tc)) {
        errors.push(`❌ Test case ${i + 1}: Missing input or output`);
      }
    }
  }

  return errors;
}

/**
 * Main validation function
 */
function validateCollection(filePath) {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 PHASE 2 DATA COLLECTION VALIDATOR');
  console.log('='.repeat(70) + '\n');

  // Read file
  let problems = [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Try to parse as JSON
    problems = JSON.parse(content);
    if (!Array.isArray(problems)) {
      console.error('❌ Error: Root must be an array of problems');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
  }

  console.log(`📊 Total problems to validate: ${problems.length}\n`);

  // Validate each problem
  let validCount = 0;
  let errorCount = 0;
  const problemErrors = [];

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const errors = validateProblem(problem, i, problems);

    if (errors.length === 0) {
      console.log(`✅ Problem ${i + 1}: ${problem.title || 'UNTITLED'}`);
      validCount++;
    } else {
      console.log(`❌ Problem ${i + 1}: ${problem.title || 'UNTITLED'}`);
      errors.forEach(err => console.log(`   ${err}`));
      problemErrors.push({ index: i + 1, title: problem.title, errors });
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(70));

  if (errorCount === 0) {
    console.log(`\n✅ ALL ${validCount} PROBLEMS VALIDATED SUCCESSFULLY!\n`);
    
    // Check distribution
    const distributed = {
      easy: problems.filter(p => p.difficulty === 'Easy').length,
      medium: problems.filter(p => p.difficulty === 'Medium').length,
      hard: problems.filter(p => p.difficulty === 'Hard').length
    };
    
    console.log('📊 Difficulty Distribution:');
    console.log(`   Easy:   ${distributed.easy} (target: 150)`);
    console.log(`   Medium: ${distributed.medium} (target: 200)`);
    console.log(`   Hard:   ${distributed.hard} (target: 75)`);
    
    // Check pattern distribution
    const patterns = {};
    problems.forEach(p => {
      patterns[p.pattern] = (patterns[p.pattern] || 0) + 1;
    });
    
    console.log('\n🏗️ Pattern Distribution:');
    const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
    for (const [pattern, count] of sortedPatterns) {
      console.log(`   ${pattern}: ${count}`);
    }
    
    // Check company distribution
    const companies = {};
    problems.forEach(p => {
      p.companies.forEach(c => {
        companies[c] = (companies[c] || 0) + 1;
      });
    });
    
    console.log(`\n🏢 Company Count: ${Object.keys(companies).length} unique companies`);
    
    process.exit(0);
  } else {
    console.log(`\n❌ VALIDATION FAILED`);
    console.log(`   Valid: ${validCount}/${problems.length}`);
    console.log(`   Errors: ${errorCount} problems have issues\n`);
    
    if (errorCount <= 10) {
      console.log('📌 First errors to fix:');
      for (const err of problemErrors.slice(0, 10)) {
        console.log(`\n   Problem ${err.index}: ${err.title}`);
        err.errors.forEach(e => console.log(`   ${e}`));
      }
    }
    
    process.exit(1);
  }
}

// Main
const filePath = process.argv[2] || 'PHASE2_COLLECTED_PROBLEMS.json';

if (!fs.existsSync(filePath)) {
  console.error(`\n❌ Error: File not found: ${filePath}`);
  console.log(`\nUsage: node validatePhase2Problems.js [file.json]`);
  console.log(`Example: node validatePhase2Problems.js PHASE2_COLLECTED_PROBLEMS.json\n`);
  process.exit(1);
}

validateCollection(filePath);
