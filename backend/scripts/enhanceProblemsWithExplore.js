import { supabaseAdmin } from '../db/supabaseClient.js';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate exploratory questions for a problem
 * These help students understand the problem deeply
 */
async function generateExploreQuestions(problemTitle, description, difficulty) {
  try {
    const message = await client.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Given this ${difficulty} DSA problem: "${problemTitle}"
        
Problem Description: ${description?.substring(0, 300) || 'N/A'}

Generate 5 exploratory learning questions that help someone understand this problem deeply. These should guide them to think about:
1. How to break down the problem
2. What data structures to consider
3. Edge cases to think about
4. Follow-up variations
5. Real-world applications

Format the response as a JSON array with 5 objects, each having "question" and "hint" fields.
Example: [{"question": "How would you...", "hint": "Consider..."}, ...]

Return ONLY the JSON array, no other text.`
        }
      ]
    });

    const content = message.content[0]?.text || '[]';
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error generating explore questions for ${problemTitle}:`, error.message);
    return [];
  }
}

/**
 * Generate extended test cases for comprehensive testing
 */
async function generateExtendedTestCases(problemTitle, description, difficulty) {
  try {
    const message = await client.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Given this ${difficulty} DSA problem: "${problemTitle}"

Problem Description: ${description?.substring(0, 300) || 'N/A'}

Generate 5-8 additional comprehensive test cases that cover:
1. Edge cases (empty inputs, single elements, etc.)
2. Boundary conditions
3. Large inputs (if applicable)
4. Special patterns (all same, alternating, etc.)
5. Performance edge cases

For each test case, provide realistic input and expected output.

Format as JSON array with objects containing "input" (describe as string what this tests) and "expected" (what should happen).
Example: [{"input": "Empty array", "expected": "Return null or empty result"}, ...]

Return ONLY the JSON array, no other text.`
        }
      ]
    });

    const content = message.content[0]?.text || '[]';
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error generating test cases for ${problemTitle}:`, error.message);
    return [];
  }
}

/**
 * Enhance a single problem with explore questions and extended test cases
 */
async function enhanceProblem(problem) {
  try {
    console.log(`\n📚 Enhancing: ${problem.title}`);

    // Generate explore questions
    const exploreQuestions = await generateExploreQuestions(
      problem.title,
      problem.description,
      problem.difficulty
    );

    // Generate extended test cases
    const extendedTestCases = await generateExtendedTestCases(
      problem.title,
      problem.description,
      problem.difficulty
    );

    // Prepare update data
    const updateData = {
      explore_questions: exploreQuestions,
      extended_test_cases: extendedTestCases,
      exploration_metadata: {
        enhanced_at: new Date().toISOString(),
        questions_count: exploreQuestions.length,
        extended_cases_count: extendedTestCases.length
      }
    };

    // Update in database
    const { error } = await supabaseAdmin
      .from('problems')
      .update(updateData)
      .eq('id', problem.id);

    if (error) {
      console.error(`❌ Failed to update problem ${problem.id}:`, error);
      return false;
    }

    console.log(`✅ Enhanced with ${exploreQuestions.length} explore questions and ${extendedTestCases.length} test cases`);
    return true;
  } catch (error) {
    console.error(`Error enhancing problem ${problem.id}:`, error);
    return false;
  }
}

/**
 * Batch enhance all problems
 */
async function enhanceAllProblems() {
  try {
    console.log('🚀 Starting problem enhancement...');

    // Fetch all problems
    const { data: problems, error } = await supabaseAdmin
      .from('problems')
      .select('id, title, description, difficulty, explore_questions, extended_test_cases')
      .is('explore_questions', null); // Only enhance if not already done

    if (error) throw error;

    console.log(`\n📊 Found ${problems?.length || 0} problems to enhance`);

    if (!problems || problems.length === 0) {
      console.log('✅ All problems already enhanced!');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process problems in batches of 5 with delays to respect API rate limits
    for (let i = 0; i < problems.length; i += 5) {
      const batch = problems.slice(i, i + 5);

      // Process batch in parallel
      const results = await Promise.all(
        batch.map(problem => enhanceProblem(problem))
      );

      successCount += results.filter(r => r === true).length;
      failureCount += results.filter(r => r === false).length;

      // Rate limiting delay
      if (i + 5 < problems.length) {
        console.log(`\n⏸️  Rate limit pause (2 seconds)...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n✨ Enhancement complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Total: ${problems.length}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run enhancement
console.log('🔧 Problem Enhancement Script');
console.log('='.repeat(50));

enhanceAllProblems().then(() => {
  console.log('\n✅ Enhancement process completed!');
  process.exit(0);
});
