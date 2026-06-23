import { supabaseAdmin } from '../db/supabaseClient.js';
import { all425Problems, getAllPatterns } from '../data/allProblems.js';

async function seedAll() {
  try {
    console.log('🌱 Seeding patterns...');
    const uniquePatterns = getAllPatterns();
    
    for (const patternName of uniquePatterns) {
      const { data: existing, error: findError } = await supabaseAdmin
        .from('patterns')
        .select('id')
        .eq('name', patternName)
        .maybeSingle();
        
      if (findError) {
        console.error(`Error finding pattern ${patternName}:`, findError.message);
        continue;
      }
        
      if (!existing) {
        const { error: insertError } = await supabaseAdmin.from('patterns').insert({
          name: patternName,
          category: 'General',
          description: `Problems related to ${patternName}`,
          difficulty: 'Medium'
        });
        if (insertError) {
          console.error(`Error inserting pattern ${patternName}:`, insertError.message);
        }
      }
    }

    // Fetch all patterns to build a mapping of Name -> ID
    const { data: patternsInDb, error: fetchError } = await supabaseAdmin.from('patterns').select('id, name');
    if (fetchError) throw fetchError;
    
    const patternMap = {};
    patternsInDb.forEach(p => patternMap[p.name] = p.id);

    console.log('🌱 Seeding 425 problems...');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const problem of all425Problems) {
      const { data: existingProblem, error: findProbError } = await supabaseAdmin
        .from('problems')
        .select('id')
        .eq('title', problem.title)
        .maybeSingle();

      if (findProbError) {
        console.error(`Error finding problem ${problem.title}:`, findProbError.message);
        continue;
      }

      if (!existingProblem) {
        const patternId = patternMap[problem.pattern] || null;
        const { error: insertProbError } = await supabaseAdmin.from('problems').insert({
          pattern_id: patternId,
          title: problem.title,
          description: `Solve the ${problem.title} problem. This is a ${problem.difficulty} problem covering ${problem.pattern}.`,
          difficulty: problem.difficulty,
          constraints: 'N/A',
          examples: [],
          hints: [],
          solution_approach: 'N/A',
          starter_code: {},
          test_cases: [],
          companies: problem.companies || [],
          tags: [problem.pattern.toLowerCase().replace(/\s+/g, '-')]
        });
        
        if (insertProbError) {
          console.error(`Error inserting problem ${problem.title}:`, insertProbError.message);
        } else {
          insertedCount++;
          if (insertedCount % 50 === 0) console.log(`  Inserted ${insertedCount} problems...`);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`✅ Database seeded successfully! Inserted: ${insertedCount}, Skipped (already exist): ${skippedCount}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedAll();
