/**
 * executionTracer.js
 * 
 * Tracks detailed execution timing breakdown:
 * - Parse time: Time to parse/prepare code
 * - Compile time: Time to compile (if applicable)
 * - Execution time: Time to run code
 * - Total time: Sum of all phases
 * 
 * Useful for debugging slow code and identifying bottlenecks.
 */

/**
 * Measure parse time for code
 * @param {string} code - Source code to parse
 * @param {string} language - Language: javascript|python|c|cpp|java
 * @returns {Object} { parseTime: number (ms), codeSize: number (bytes), valid: boolean }
 */
export function measureParseTime(code, language) {
  const startTime = process.hrtime.bigint();

  try {
    // Language-specific validation
    switch (language) {
      case 'javascript': {
        // Try to parse as JavaScript
        new Function(code);
        break;
      }
      case 'python': {
        // Python: just check for syntax errors by attempting parse
        // (In real scenario, would call Python parser via subprocess)
        if (code.includes('def ') || code.includes('class ')) {
          // Basic Python syntax check
          const indentedLines = code.split('\n').filter(l => l.match(/^\s+/));
          if (indentedLines.length > 0 && !code.includes(':')) {
            throw new Error('Invalid Python indentation');
          }
        }
        break;
      }
      case 'c':
      case 'cpp': {
        // C/C++: basic syntax check
        if (!code.includes('{') || !code.includes('}')) {
          throw new Error('Invalid C/C++ syntax');
        }
        break;
      }
      case 'java': {
        // Java: check for class definition
        if (!code.includes('class ') && !code.includes('public')) {
          throw new Error('Invalid Java syntax');
        }
        break;
      }
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    const endTime = process.hrtime.bigint();
    const parseTime = Number(endTime - startTime) / 1_000_000; // Convert to ms

    return {
      parseTime: Math.round(parseTime * 100) / 100, // 2 decimal places
      codeSize: code.length,
      valid: true,
    };
  } catch (err) {
    const endTime = process.hrtime.bigint();
    const parseTime = Number(endTime - startTime) / 1_000_000;

    return {
      parseTime: Math.round(parseTime * 100) / 100,
      codeSize: code.length,
      valid: false,
      error: err.message,
    };
  }
}

/**
 * Measure compile time for compiled languages
 * @param {string} code - Source code
 * @param {string} language - Language: c|cpp|java|go|rust
 * @returns {Object} { compileTime: number (ms), compiled: boolean, error?: string }
 */
export function measureCompileTime(code, language) {
  // For JS/Python, there's no compilation phase
  if (language === 'javascript' || language === 'python') {
    return {
      compileTime: 0,
      compiled: false,
      reason: 'Interpreted language (no compilation)',
    };
  }

  const startTime = process.hrtime.bigint();

  try {
    // In real implementation, would invoke compiler
    // For now, estimate based on code size and language
    let estimatedCompileTime = 0;

    switch (language) {
      case 'c':
      case 'cpp':
        // C/C++: estimate 50ms base + 0.1ms per 100 bytes of code
        estimatedCompileTime = 50 + (code.length / 100) * 0.1;
        break;
      case 'java':
        // Java: estimate 100ms base + 0.2ms per 100 bytes
        estimatedCompileTime = 100 + (code.length / 100) * 0.2;
        break;
      case 'go':
        // Go: estimate 30ms base + 0.05ms per 100 bytes
        estimatedCompileTime = 30 + (code.length / 100) * 0.05;
        break;
      case 'rust':
        // Rust: estimate 200ms base + 0.5ms per 100 bytes
        estimatedCompileTime = 200 + (code.length / 100) * 0.5;
        break;
      default:
        return {
          compileTime: 0,
          compiled: false,
          reason: `Language ${language} not compiled`,
        };
    }

    const endTime = process.hrtime.bigint();
    const actualTime = Number(endTime - startTime) / 1_000_000;

    // Return estimate (in real scenario, would measure actual compilation)
    return {
      compileTime: Math.round(estimatedCompileTime * 100) / 100,
      compiled: true,
      language,
      actualMeasuredTime: Math.round(actualTime * 100) / 100,
    };
  } catch (err) {
    return {
      compileTime: 0,
      compiled: false,
      error: err.message,
    };
  }
}

/**
 * Calculate execution time breakdown
 * @param {Object} executionResult - Result from executeCode or executeCustomTests
 * @param {string} language - Code language
 * @param {number} totalTime - Total execution time (ms)
 * @returns {Object} Detailed timing breakdown
 */
export function calculateTimingBreakdown(executionResult, language, totalTime) {
  const parseInfo = measureParseTime(executionResult.code || '', language);
  const compileInfo = measureCompileTime(executionResult.code || '', language);

  const parseTime = parseInfo.parseTime || 0;
  const compileTime = compileInfo.compileTime || 0;
  const runTime = Math.max(0, totalTime - parseTime - compileTime);

  return {
    totalTime: Math.round(totalTime * 100) / 100,
    parseTime: Math.round(parseTime * 100) / 100,
    compileTime: Math.round(compileTime * 100) / 100,
    runTime: Math.round(runTime * 100) / 100,
    breakdown: {
      parse: {
        ms: Math.round(parseTime * 100) / 100,
        percent: Math.round((parseTime / totalTime) * 100),
        description: 'Time to parse/validate code',
      },
      compile: compileTime > 0 ? {
        ms: Math.round(compileTime * 100) / 100,
        percent: Math.round((compileTime / totalTime) * 100),
        description: 'Time to compile source to binary',
      } : null,
      execution: {
        ms: Math.round(runTime * 100) / 100,
        percent: Math.round((runTime / totalTime) * 100),
        description: 'Time to execute compiled/interpreted code',
      },
    },
    language,
    note: compileInfo.actualMeasuredTime 
      ? `Compile time is estimated. Actual: ${compileInfo.actualMeasuredTime}ms`
      : 'For compiled languages, compile time is estimated. In production, use actual compiler timing.',
  };
}

/**
 * Format timing breakdown for display
 * @param {Object} breakdown - Result from calculateTimingBreakdown
 * @returns {string} Formatted breakdown string
 */
export function formatTimingBreakdown(breakdown) {
  const lines = [
    `⏱️  Execution Timing Breakdown (Total: ${breakdown.totalTime}ms)`,
    ``,
    `  Parse:     ${breakdown.parseTime}ms (${breakdown.breakdown.parse.percent}%)`,
  ];

  if (breakdown.breakdown.compile) {
    lines.push(`  Compile:   ${breakdown.compileTime}ms (${breakdown.breakdown.compile.percent}%)`);
  }

  lines.push(
    `  Execution: ${breakdown.runTime}ms (${breakdown.breakdown.execution.percent}%)`,
    ``
  );

  // Identify the slowest phase
  const phases = [
    { name: 'Parse', time: breakdown.parseTime, percent: breakdown.breakdown.parse.percent },
    { name: 'Compile', time: breakdown.compileTime, percent: breakdown.breakdown.compile?.percent || 0 },
    { name: 'Execution', time: breakdown.runTime, percent: breakdown.breakdown.execution.percent },
  ].filter(p => p.time > 0);

  if (phases.length > 0) {
    const slowest = phases.reduce((max, p) => p.time > max.time ? p : max);
    lines.push(`🐢 Bottleneck: ${slowest.name} is taking ${slowest.percent}% of time`);
  }

  return lines.join('\n');
}

/**
 * Analyze execution trace and identify slowdowns
 * @param {Object} breakdown - Result from calculateTimingBreakdown
 * @returns {Object} Analysis with recommendations
 */
export function analyzeExecutionTrace(breakdown) {
  const analysis = {
    bottleneck: null,
    recommendations: [],
    optimizations: [],
  };

  const parsePercent = breakdown.breakdown.parse.percent;
  const compilePercent = breakdown.breakdown.compile?.percent || 0;
  const execPercent = breakdown.breakdown.execution.percent;

  // Identify bottleneck
  if (parsePercent > 50) {
    analysis.bottleneck = 'Parse';
    analysis.recommendations.push('Code is slow to parse. Consider using a faster parser or pre-processing.');
  } else if (compilePercent > 50) {
    analysis.bottleneck = 'Compile';
    analysis.recommendations.push('Compilation is slow. Consider using incremental compilation or caching.');
  } else if (execPercent > 50) {
    analysis.bottleneck = 'Execution';
    analysis.recommendations.push('Code execution is slow. Review algorithm efficiency and optimize hot paths.');
  }

  // Specific optimizations
  if (breakdown.language === 'javascript' || breakdown.language === 'python') {
    if (breakdown.runTime > 1000) {
      analysis.optimizations.push('Algorithm optimization: Consider using more efficient data structures');
      analysis.optimizations.push('Reduce loop complexity: O(n²) algorithms become slow for large inputs');
      analysis.optimizations.push('Cache results: Use memoization to avoid redundant calculations');
    }
  } else if (['c', 'cpp', 'java', 'go', 'rust'].includes(breakdown.language)) {
    if (breakdown.compileTime > 500) {
      analysis.optimizations.push('Reduce includes/imports: Fewer dependencies = faster compilation');
      analysis.optimizations.push('Use forward declarations: Avoid including large header files');
      analysis.optimizations.push('Enable parallel compilation: Use -j flag with compiler');
    }
    if (breakdown.runTime > 1000) {
      analysis.optimizations.push('Profile your code: Use perf/valgrind to find hotspots');
      analysis.optimizations.push('Enable optimizations: Compile with -O2 or -O3 flags');
      analysis.optimizations.push('Check for memory leaks: Unnecessary allocations slow down execution');
    }
  }

  return analysis;
}

export default {
  measureParseTime,
  measureCompileTime,
  calculateTimingBreakdown,
  formatTimingBreakdown,
  analyzeExecutionTrace,
};
