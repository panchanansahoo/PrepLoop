// Phase 5.1: Solution Insight Service
// Analyzes code solutions for approach detection, complexity scoring, and quality metrics

import { supabaseAdmin } from '../db/supabaseClient.js';

class SolutionInsightService {
  /**
   * Analyze a solution and extract insights
   * @param {string} solutionId - Solution ID
   * @param {string} code - Solution code
   * @param {string} language - Programming language
   * @param {object} executionResult - Optional execution metrics {timeMs, memoryMb}
   * @returns {Promise<{approach, timeComplexity, spaceComplexity, efficiencyScore, codeQualityScore, readabilityScore}>}
   */
  async analyzeSolution(solutionId, code, language, executionResult = {}) {
    if (!solutionId || !code) {
      throw new Error('solutionId and code are required');
    }

    const insights = {
      approach: this._detectApproach(code, language),
      timeComplexity: this._estimateTimeComplexity(code, language),
      spaceComplexity: this._estimateSpaceComplexity(code, language),
      efficiencyScore: this._calculateEfficiencyScore(code, language, executionResult),
      codeQualityScore: this._scoreCodeQuality(code, language),
      readabilityScore: this._scoreReadability(code, language),
      hasComments: /\/\/|\/\*/.test(code),
      hasConstants: /const\s+\w+\s*=\s*\d+|final\s+\w+\s*=\s*\d+/.test(code),
    };

    // Store insights in database
    try {
      await supabaseAdmin
        .from('solution_insights')
        .update({
          approach: insights.approach,
          time_complexity: insights.timeComplexity,
          space_complexity: insights.spaceComplexity,
          efficiency_score: insights.efficiencyScore,
          code_quality_score: insights.codeQualityScore,
          readability_score: insights.readabilityScore,
          has_comments: insights.hasComments,
          has_constants: insights.hasConstants,
          updated_at: new Date(),
        })
        .eq('solution_id', solutionId);
    } catch (error) {
      console.error(`Failed to store insights: ${error.message}`);
    }

    return insights;
  }

  /**
   * Detect the algorithmic approach used in the solution
   * @private
   */
  _detectApproach(code, language) {
    // JavaScript/TypeScript patterns
    if (language === 'javascript' || language === 'typescript') {
      if (/\breturn\b.*\(.*\1/.test(code) || /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\1/.test(code)) {
        return 'recursive';
      }
      if (/while\s*\(|for\s*\(.*while/.test(code)) {
        return 'iterative';
      }
      if (/dp\[|memo|cache|Map\(\)|Object\(\)/.test(code)) {
        return 'dp';
      }
      if (/queue|Queue|BFS|bfs|\.shift\(\)|\.push\(\).*queue/.test(code)) {
        return 'bfs';
      }
      if (/stack|Stack|DFS|dfs|\.pop\(\)|recursion/.test(code)) {
        return 'dfs';
      }
      if (/sort|Sort|binary|Binary/.test(code)) {
        return 'sorting';
      }
      if (/graph|Graph|adj|edge|node/.test(code)) {
        return 'graph';
      }
    }

    // Python patterns
    if (language === 'python') {
      if (/return\s+\w+\s*\(/ .test(code) && /def\s+\w+\s*\(.*\):\s*\./.test(code)) {
        return 'recursive';
      }
      if (/while|for.*while/.test(code)) {
        return 'iterative';
      }
      if (/dp\[|memo|cache|{.*:.*}/.test(code)) {
        return 'dp';
      }
      if (/queue|deque|BFS|bfs|pop\(0\)|append/.test(code)) {
        return 'bfs';
      }
      if (/stack|Stack|DFS|dfs|pop\(\)|recursion/.test(code)) {
        return 'dfs';
      }
      if (/sorted|sort|binary|Binary/.test(code)) {
        return 'sorting';
      }
    }

    return 'unknown';
  }

  /**
   * Estimate time complexity from code patterns
   * @private
   */
  _estimateTimeComplexity(code, language) {
    // Count nested loops
    const loopDepth = (code.match(/for|while/g) || []).length;

    if (loopDepth === 0) {
      // Check for recursion
      if (/\breturn\b.*\(/.test(code) && /function.*\(.*\)/.test(code)) {
        return 'O(n)'; // Assume linear recursion
      }
      return 'O(1)';
    } else if (loopDepth === 1) {
      return 'O(n)';
    } else if (loopDepth === 2) {
      return 'O(n²)';
    } else if (loopDepth === 3) {
      return 'O(n³)';
    }

    // Check for binary search pattern
    if (/log|binary|Binary|/i.test(code)) {
      return 'O(log n)';
    }

    return `O(n^${loopDepth})`;
  }

  /**
   * Estimate space complexity from code patterns
   * @private
   */
  _estimateSpaceComplexity(code, language) {
    // Check for explicit data structures
    if (/new Array|new Map|new Set|\[\]|Map\(\)|Set\(\)|\{.*\}/.test(code)) {
      // Count dynamic allocations
      if (/(new Array|new Map|new Set|Map\(\)|Set\(\))/g.test(code)) {
        return 'O(n)';
      }
    }

    // Check for recursion depth
    if (/\breturn\b.*\(/.test(code)) {
      return 'O(n)'; // Recursion stack
    }

    return 'O(1)';
  }

  /**
   * Calculate efficiency score (0-100) based on code patterns
   * @private
   */
  _calculateEfficiencyScore(code, language, executionResult) {
    let score = 50; // Base score

    // Penalize for inefficient patterns
    const inefficientPatterns = [
      { pattern: /\.slice\(\).*loop|loop.*\.slice\(\)/, penalty: 15, reason: 'Array copying in loop' },
      { pattern: /nested.*loop.*nested.*loop/, penalty: 10, reason: 'Triple nested loops' },
      { pattern: /replaceAll|replace\(.*g\)/, penalty: 5, reason: 'Repeated string replacement' },
    ];

    for (const { pattern, penalty } of inefficientPatterns) {
      if (pattern.test(code)) {
        score -= penalty;
      }
    }

    // Reward for efficient patterns
    const efficientPatterns = [
      { pattern: /cache|memo|dp\[/, bonus: 15, reason: 'Uses memoization/DP' },
      { pattern: /binary.*search|binarySearch/, bonus: 10, reason: 'Uses binary search' },
      { pattern: /two.*pointer|twoPointer/, bonus: 10, reason: 'Uses two-pointer technique' },
      { pattern: /hash.*set|Set\(\)/, bonus: 8, reason: 'Uses hash set for O(1) lookup' },
    ];

    for (const { pattern, bonus } of efficientPatterns) {
      if (pattern.test(code)) {
        score += bonus;
      }
    }

    // Adjust based on execution metrics
    if (executionResult.timeMs && executionResult.timeMs > 1000) {
      score -= 20; // Slow execution
    }

    if (executionResult.memoryMb && executionResult.memoryMb > 50) {
      score -= 15; // High memory usage
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score code quality (0-100)
   * @private
   */
  _scoreCodeQuality(code, language) {
    let score = 50; // Base score

    // Check for error handling
    if (/try|catch|throw|Error|if.*!|if.*null|if.*undefined/.test(code)) {
      score += 15;
    }

    // Check for comments
    const commentDensity = (code.match(/\/\/|\/\*.*\*\//g) || []).length / (code.length / 100);
    if (commentDensity > 0.5) {
      score += 15;
    } else if (commentDensity > 0.2) {
      score += 10;
    }

    // Penalize for long functions
    const functionMatches = code.match(/function|=>|def|def\s+\w+\s*\(/g) || [];
    const avgFunctionLength = code.length / Math.max(1, functionMatches.length);
    if (avgFunctionLength > 500) {
      score -= 15;
    }

    // Check for code duplication
    const lines = code.split('\n');
    const uniqueLines = new Set(lines.map((l) => l.trim())).size;
    const duplicationRatio = 1 - uniqueLines / Math.max(1, lines.length);
    if (duplicationRatio > 0.3) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score readability (0-100)
   * @private
   */
  _scoreReadability(code, language) {
    let score = 50; // Base score

    // Check variable naming conventions
    const camelCaseVars = (code.match(/[a-z]+[A-Z][a-zA-Z]+/g) || []).length;
    const snake_case_vars = (code.match(/_[a-z]+/g) || []).length;
    const UPPERCASE_CONST = (code.match(/[A-Z_]+/g) || []).length;

    if (camelCaseVars > 5) {
      score += 10; // Good variable naming
    }

    if (snake_case_vars > 5 && snake_case_vars > camelCaseVars) {
      score += 5; // Pythonic convention
    }

    // Check indentation consistency
    const indentPatterns = code.match(/^\s+/gm) || [];
    if (indentPatterns.length > 0) {
      score += 8; // Has proper indentation
    }

    // Check for excessive nesting
    const maxIndent = Math.max(
      0,
      ...indentPatterns.map((indent) => indent.length)
    );
    if (maxIndent > 24) {
      // 6 levels of indentation
      score -= 15; // Too deeply nested
    }

    // Check line length
    const lines = code.split('\n');
    const longLines = lines.filter((l) => l.length > 120).length;
    const longLineRatio = longLines / Math.max(1, lines.length);
    if (longLineRatio > 0.3) {
      score -= 10; // Many long lines
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get insights for a solution
   * @param {string} solutionId - Solution ID
   * @returns {Promise<insights object>}
   */
  async getInsights(solutionId) {
    if (!solutionId) throw new Error('solutionId is required');

    const { data: insights, error } = await supabaseAdmin
      .from('solution_insights')
      .select('*')
      .eq('solution_id', solutionId)
      .single();

    if (error) throw new Error(`Insights not found: ${error.message}`);

    return {
      solutionId: insights.solution_id,
      approach: insights.approach,
      timeComplexity: insights.time_complexity,
      spaceComplexity: insights.space_complexity,
      efficiencyScore: insights.efficiency_score,
      codeQualityScore: insights.code_quality_score,
      readabilityScore: insights.readability_score,
      hasComments: insights.has_comments,
      hasConstants: insights.has_constants,
      overallScore: Math.round(
        (insights.efficiency_score + insights.code_quality_score + insights.readability_score) / 3
      ),
    };
  }
}

export default new SolutionInsightService();
