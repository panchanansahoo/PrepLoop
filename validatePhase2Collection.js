#!/usr/bin/env node

/**
 * Phase 2 Problem Validator
 * Validates all collected problems against quality checklist
 * 
 * Usage: node validatePhase2Problems.js [path/to/PHASE2_COLLECTED_PROBLEMS.json]
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const APPROVED_PATTERNS = [
  'Array', 'Linked List', 'String',
  'Tree', 'Binary Tree', 'Binary Search Tree',
  'Graph', 'Backtracking', 'DFS', 'BFS', 'Binary Search',
  'Stack', 'Queue', 'Heap', 'Hash Map', 'Hash Set',
  'Dynamic Programming', 'Greedy', 'Bit Manipulation', 'Trie', 'Union Find',
  'Topological Sort', 'Two Pointers', 'Sliding Window'
];

const LANGUAGES = ['python', 'javascript', 'cpp', 'java'];

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const COMMON_COMPANIES = [
  'Google', 'Amazon', 'Facebook', 'Apple', 'Microsoft', 'Netflix', 'Meta',
  'LinkedIn', 'Adobe', 'Uber', 'Tesla', 'Oracle', 'IBM', 'Goldman Sachs',
  'JP Morgan', 'Morgan Stanley', 'Bloomberg', 'Airbnb', 'Dropbox', 'Salesforce',
  'Stripe', 'Twitch', 'PayPal', 'Lyft', 'Yelp', 'Box', 'Snap'
];

class Phase2Validator {
  constructor(filePath) {
    this.filePath = filePath;
    this.problems = [];
    this.errors = [];
    this.warnings = [];
    this.stats = {
      total: 0,
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
      byPattern: {},
      byCompany: {},
      validated: 0,
      failed: 0
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  loadProblems() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      this.problems = JSON.parse(content);
      this.log(`✅ Loaded ${this.problems.length} problems`, 'green');
      return true;
    } catch (error) {
      this.log(`❌ Failed to load file: ${error.message}`, 'red');
      return false;
    }
  }

  validateProblem(problem, index) {
    const checks = [];
    
    // 1. ID Check
    if (!problem.id) {
      checks.push({ pass: false, msg: 'Missing: id' });
    } else if (typeof problem.id !== 'number') {
      checks.push({ pass: false, msg: 'Invalid: id must be number' });
    } else {
      checks.push({ pass: true, msg: 'ID valid' });
    }

    // 2. Title Check
    if (!problem.title || typeof problem.title !== 'string' || problem.title.length < 3) {
      checks.push({ pass: false, msg: 'Invalid: title (min 3 chars)' });
    } else {
      checks.push({ pass: true, msg: 'Title valid' });
    }

    // 3. Description Check
    if (!problem.description || typeof problem.description !== 'string' || problem.description.length < 50) {
      checks.push({ pass: false, msg: 'Invalid: description (min 50 chars)' });
    } else {
      checks.push({ pass: true, msg: 'Description valid' });
    }

    // 4. Difficulty Check
    if (!problem.difficulty || !VALID_DIFFICULTIES.includes(problem.difficulty)) {
      checks.push({ pass: false, msg: `Invalid: difficulty (must be: ${VALID_DIFFICULTIES.join(', ')})` });
    } else {
      checks.push({ pass: true, msg: 'Difficulty valid' });
      this.stats.byDifficulty[problem.difficulty]++;
    }

    // 5. Pattern Check
    if (!problem.pattern || !APPROVED_PATTERNS.includes(problem.pattern)) {
      checks.push({ pass: false, msg: `Invalid: pattern (must use approved 25 patterns)` });
    } else {
      checks.push({ pass: true, msg: 'Pattern valid' });
      this.stats.byPattern[problem.pattern] = (this.stats.byPattern[problem.pattern] || 0) + 1;
    }

    // 6. Companies Check
    if (!problem.companies || !Array.isArray(problem.companies) || problem.companies.length === 0) {
      checks.push({ pass: false, msg: 'Invalid: companies (min 1 company)' });
    } else if (!problem.companies.every(c => typeof c === 'string' && c.length > 0)) {
      checks.push({ pass: false, msg: 'Invalid: company names must be non-empty strings' });
    } else {
      checks.push({ pass: true, msg: 'Companies valid' });
      problem.companies.forEach(c => {
        this.stats.byCompany[c] = (this.stats.byCompany[c] || 0) + 1;
      });
    }

    // 7. Examples Check
    if (!problem.examples || !Array.isArray(problem.examples) || problem.examples.length < 2) {
      checks.push({ pass: false, msg: 'Invalid: examples (min 2 required)' });
    } else if (!problem.examples.every(e => e.input && e.output && e.explanation)) {
      checks.push({ pass: false, msg: 'Invalid: each example needs input, output, explanation' });
    } else {
      checks.push({ pass: true, msg: 'Examples valid' });
    }

    // 8. Test Cases Check
    if (!problem.test_cases || !Array.isArray(problem.test_cases) || problem.test_cases.length < 3) {
      checks.push({ pass: false, msg: 'Invalid: test_cases (min 3 required: normal, edge, large)' });
    } else if (!problem.test_cases.every(t => t.input && t.output && t.type)) {
      checks.push({ pass: false, msg: 'Invalid: each test case needs input, output, type' });
    } else {
      checks.push({ pass: true, msg: 'Test cases valid' });
    }

    // 9. Starter Code Check
    if (!problem.starter_code || typeof problem.starter_code !== 'object') {
      checks.push({ pass: false, msg: 'Invalid: starter_code missing' });
    } else {
      const missingLangs = LANGUAGES.filter(lang => !problem.starter_code[lang]);
      if (missingLangs.length > 0) {
        checks.push({ pass: false, msg: `Invalid: missing languages: ${missingLangs.join(', ')}` });
      } else {
        checks.push({ pass: true, msg: 'Starter code valid (all 4 languages)' });
      }
    }

    // 10. Constraints Check
    if (!problem.constraints || !Array.isArray(problem.constraints) || problem.constraints.length < 2) {
      checks.push({ pass: false, msg: 'Invalid: constraints (min 2 required)' });
    } else {
      checks.push({ pass: true, msg: 'Constraints valid' });
    }

    // 11. Function Name Check
    if (!problem.function_name || typeof problem.function_name !== 'string' || problem.function_name.length < 1) {
      checks.push({ pass: false, msg: 'Invalid: function_name missing' });
    } else {
      checks.push({ pass: true, msg: 'Function name valid' });
    }

    // 12. Complexity Check
    if (!problem.time_complexity || !problem.space_complexity) {
      checks.push({ pass: false, msg: 'Invalid: time_complexity and/or space_complexity missing' });
    } else {
      checks.push({ pass: true, msg: 'Complexity valid' });
    }

    const allPass = checks.every(c => c.pass);
    const failedChecks = checks.filter(c => !c.pass).map(c => c.msg);
    
    return {
      id: problem.id,
      title: problem.title,
      allPass,
      checks,
      failedChecks
    };
  }

  validateAll() {
    this.log('\n📋 VALIDATING PHASE 2 PROBLEMS', 'bold');
    this.log('='.repeat(60), 'cyan');

    this.stats.total = this.problems.length;

    const results = this.problems.map((problem, index) => 
      this.validateProblem(problem, index)
    );

    // Display individual problem results
    let passCount = 0;
    results.forEach((result, index) => {
      if (result.allPass) {
        passCount++;
        this.log(`✅ ID ${result.id}: ${result.title}`, 'green');
      } else {
        this.log(`❌ ID ${result.id}: ${result.title}`, 'red');
        result.failedChecks.forEach(check => {
          this.log(`   └─ ${check}`, 'yellow');
        });
      }
    });

    this.stats.validated = passCount;
    this.stats.failed = results.length - passCount;

    return results;
  }

  printSummary() {
    this.log('\n📊 VALIDATION SUMMARY', 'bold');
    this.log('='.repeat(60), 'cyan');
    
    this.log(`Total Problems: ${this.stats.total}`, 'blue');
    this.log(`Passed: ${colors.green}${this.stats.validated}${colors.reset} | Failed: ${colors.red}${this.stats.failed}${colors.reset}`);
    
    this.log('\n📈 By Difficulty:', 'blue');
    Object.entries(this.stats.byDifficulty).forEach(([diff, count]) => {
      this.log(`  ${diff}: ${count}`);
    });

    if (Object.keys(this.stats.byPattern).length > 0) {
      this.log('\n🔗 By Pattern:', 'blue');
      Object.entries(this.stats.byPattern)
        .sort((a, b) => b[1] - a[1])
        .forEach(([pattern, count]) => {
          this.log(`  ${pattern}: ${count}`);
        });
    }

    if (Object.keys(this.stats.byCompany).length > 0) {
      this.log('\n🏢 Top Companies:', 'blue');
      Object.entries(this.stats.byCompany)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([company, count]) => {
          this.log(`  ${company}: ${count}`);
        });
    }
  }

  printFinalStatus() {
    this.log('\n' + '='.repeat(60), 'cyan');
    if (this.stats.failed === 0 && this.stats.validated > 0) {
      this.log('🎉 ALL PROBLEMS VALIDATED SUCCESSFULLY! ✅', 'green');
      this.log(`Successfully validated ${this.stats.validated} problems`, 'green');
      return true;
    } else if (this.stats.validated === 0) {
      this.log('⚠️  NO VALID PROBLEMS FOUND', 'red');
      return false;
    } else {
      this.log(`⚠️  ${this.stats.failed} problems need fixing`, 'yellow');
      return false;
    }
  }

  run() {
    if (!this.loadProblems()) return false;
    this.validateAll();
    this.printSummary();
    return this.printFinalStatus();
  }
}

// Main execution
const filePath = process.argv[2] || path.join(__dirname, '..', 'PHASE2_COLLECTED_PROBLEMS.json');

const validator = new Phase2Validator(filePath);
const success = validator.run();

process.exit(success ? 0 : 1);
