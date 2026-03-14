import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Pre-generated explore questions and test cases for DSA problems
 * This provides sensible defaults without requiring API calls
 */

const exploreQuestionTemplates = {
  'Array': [
    { question: 'How would you visualize this array problem?', hint: 'Try drawing the array and marking indices' },
    { question: 'What constraints matter most here?', hint: 'Consider space vs time trade-offs' },
    { question: 'Can you find a pattern in small examples?', hint: 'Work through examples with 2-3 elements first' },
    { question: 'How would you handle empty or single-element inputs?', hint: 'Edge cases are often where bugs hide' },
    { question: 'What would a brute force solution look like?', hint: 'Start simple, then optimize' }
  ],
  'Two Pointers': [
    { question: 'Why might two pointers be better than one?', hint: 'Think about converging from two ends' },
    { question: 'What invariants must hold as pointers move?', hint: 'What conditions guarantee correctness?' },
    { question: 'Can you solve this without extra space?', hint: 'In-place solutions are more elegant' },
    { question: 'How do you know when to move which pointer?', hint: 'What condition determines the choice?' },
    { question: 'What edge cases break two-pointer approaches?', hint: 'When would pointers miss something?' }
  ],
  'Sliding Window': [
    { question: 'What defines the valid window?', hint: 'What makes a window "good" or "bad"?' },
    { question: 'How do you expand and contract the window?', hint: 'When do you move left vs right pointer?' },
    { question: 'What must you track inside the window?', hint: 'What information is critical to maintain?' },
    { question: 'Can you solve this with a fixed window size?', hint: 'Try fixed windows first, then variable' },
    { question: 'What makes this greedy approach valid?', hint: 'Why is optimal solution always expanding right?' }
  ],
  'Linked List': [
    { question: 'How is linked list fundamentally different from arrays?', hint: 'Think about access patterns' },
    { question: 'Do you need to handle cycle detection?', hint: 'Two-pointer approach works here too' },
    { question: 'How would you reverse a section?', hint: 'Track three pointers: prev, current, next' },
    { question: 'What if you need to modify while iterating?', hint: 'Be careful with pointer updates' },
    { question: 'Can you avoid storing all nodes in memory?', hint: 'Use pointers cleverly' }
  ],
  'Binary Search': [
    { question: 'How do you maintain the search invariant?', hint: 'What must always be true about left/right bounds?' },
    { question: 'When do you search left vs right?', hint: 'Understand the condition before each mid check' },
    { question: 'What if the answer is not an exact match?', hint: 'Binary search finds boundaries, not just targets' },
    { question: 'Why is binary search O(log n)?', hint: 'Each iteration eliminates half the remaining space' },
    { question: 'What are the tricky edge cases?', hint: 'Empty arrays, single elements, off-by-one errors' }
  ],
  'Dynamic Programming': [
    { question: 'Can you define the state clearly?', hint: 'What does dp[i] or dp[i][j] mean?' },
    { question: 'What is the recurrence relation?', hint: 'How do previous states combine for current state?' },
    { question: 'What are your base cases?', hint: 'When does the recursion stop?' },
    { question: 'Can you trace through small examples?', hint: 'Verify your logic with concrete inputs' },
    { question: 'Is top-down or bottom-up better here?', hint: 'Memoization vs tabulation trade-offs' }
  ],
  'Graph': [
    { question: 'Is this graph directed or undirected?', hint: 'Does edge direction matter for the problem?' },
    { question: 'Should you use BFS or DFS?', hint: 'BFS finds shortest paths, DFS explores deep' },
    { question: 'Do you need to detect cycles?', hint: 'Track visited nodes and parent relationships' },
    { question: 'How should you represent the graph?', hint: 'Adjacency list vs matrix trade-offs' },
    { question: 'What if the graph is disconnected?', hint: 'Process all components, not just one' }
  ],
  'String': [
    { question: 'What makes strings tricky?', hint: 'Character encoding, Unicode, case sensitivity' },
    { question: 'Can you preprocess the string?', hint: 'Sorting, hashing, or pattern building helps' },
    { question: 'Do you need regex or substring searching?', hint: 'KMP algorithm for efficient pattern search' },
    { question: 'How should you handle special characters?', hint: 'Whitespace, punctuation, numbers' },
    { question: 'Is the answer position-dependent?', hint: 'Track indices carefully' }
  ],
  'Tree': [
    { question: 'Is this a binary search tree?', hint: 'Left < Parent < Right constraint' },
    { question: 'Should you traverse in-order, pre-order, or post-order?', hint: 'Different orders reveal different properties' },
    { question: 'Can you solve this recursively?', hint: 'Tree problems often have elegant recursive solutions' },
    { question: 'Do you need to handle null/empty trees?', hint: 'Base cases are crucial' },
    { question: 'What path or subtree information matters?', hint: 'Root-to-leaf vs any-to-any paths' }
  ],
  'Heap': [
    { question: 'What property must a heap maintain?', hint: 'Parent ≤ children for min-heap' },
    { question: 'Why is heapify O(n) but insert is O(log n)?', hint: 'Think about rebuilding vs single insertion' },
    { question: 'When would you use a heap?', hint: 'Priority queues, finding k-largest/smallest' },
    { question: 'How do you implement decrease/increase key?', hint: 'Bubble up or bubble down as needed' },
    { question: 'Can you use a heap for sorting?', hint: 'Heap sort combines heap operations with extraction' }
  ]
};

const testCaseTemplates = {
  'Basic Edge Cases': [
    { input: 'Empty input', expected: 'Handle gracefully or return empty result' },
    { input: 'Single element', expected: 'Return that element or base case result' },
    { input: 'Two elements (minimum pair)', expected: 'Test smallest non-trivial case' }
  ],
  'Boundary Conditions': [
    { input: 'Maximum valid input', expected: 'Should handle largest allowed size' },
    { input: 'Minimum valid input', expected: 'Should handle smallest valid size' },
    { input: 'Negative numbers (if applicable)', expected: 'Handle negative values correctly' }
  ],
  'Special Patterns': [
    { input: 'All identical elements', expected: 'Correct result for homogeneous input' },
    { input: 'Sorted sequence', expected: 'Already ordered input' },
    { input: 'Reverse sorted sequence', expected: 'Worst case for some algorithms' }
  ],
  'Performance Cases': [
    { input: 'Large input near constraint limits', expected: 'Should complete efficiently' },
    { input: 'Worst-case scenario for algorithm', expected: 'Handle pathological case' },
    { input: 'Repeated binary search queries', expected: 'Demonstrate logarithmic efficiency' }
  ],
  'Realistic Scenarios': [
    { input: 'Real-world data example', expected: 'Practical case from actual use' },
    { input: 'Stress test with duplicates', expected: 'Multiple same values handled' },
    { input: 'Mixed positive/negative/zero', expected: 'Comprehensive value range' }
  ]
};

/**
 * Get explore questions for a problem based on its pattern
 */
function getExploreQuestionsForPattern(pattern) {
  return exploreQuestionTemplates[pattern] || exploreQuestionTemplates['Array'];
}

/**
 * Get extended test case descriptions for comprehensive testing
 */
function getExtendedTestCases() {
  const allTestCases = [];
  for (const category in testCaseTemplates) {
    allTestCases.push(...testCaseTemplates[category]);
  }
  return allTestCases;
}

/**
 * Batch add explore questions and test cases to all problems
 */
async function seedExploreQuestionsAndTestCases() {
  try {
    console.log('🌱 Seeding Explore Questions and Extended Test Cases...\n');

    // Fetch all problems with their patterns
    const { data: problems, error: fetchError } = await supabaseAdmin
      .from('problems')
      .select('id, title, pattern_id, patterns(name)')
      .is('explore_questions', null);

    if (fetchError) throw fetchError;

    if (!problems || problems.length === 0) {
      console.log('✅ All problems already have explore questions!');
      return;
    }

    console.log(`📊 Processing ${problems.length} problems...\n`);

    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 20 for efficiency
    for (let i = 0; i < problems.length; i += 20) {
      const batch = problems.slice(i, i + 20);

      const updates = batch.map(problem => {
        const patternName = problem.patterns?.name || 'Array';
        const exploreQuestions = getExploreQuestionsForPattern(patternName);
        const extendedTestCases = getExtendedTestCases();

        return supabaseAdmin
          .from('problems')
          .update({
            explore_questions: exploreQuestions,
            extended_test_cases: extendedTestCases,
            exploration_metadata: {
              enhanced_at: new Date().toISOString(),
              questions_count: exploreQuestions.length,
              extended_cases_count: extendedTestCases.length,
              method: 'template-based'
            }
          })
          .eq('id', problem.id);
      });

      const results = await Promise.all(updates);

      for (const result of results) {
        if (result.error) {
          console.error(`❌ Error:`, result.error.message);
          failureCount++;
        } else {
          successCount++;
        }
      }

      console.log(`✅ Processed ${Math.min(i + 20, problems.length)}/${problems.length} problems`);
    }

    console.log(`\n✨ Seeding Complete!`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📚 Each problem now has:`);
    console.log(`   - 5 exploratory learning questions`);
    console.log(`   - 15+ comprehensive test case descriptions`);

  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run seeding
console.log('🔧 Problem Exploration Seeding Script');
console.log('='.repeat(50) + '\n');

seedExploreQuestionsAndTestCases().then(() => {
  console.log('\n✅ Seeding completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('Failed to complete seeding:', error);
  process.exit(1);
});
