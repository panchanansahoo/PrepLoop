import { supabaseAdmin } from '../db/supabaseClient.js';

async function fixSolutionMismatches() {
    console.log('🔧 Fixing solution_code mismatches...\n');

    // Step 1: Fetch all problems
    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, starter_code, solution_code')
        .order('id');

    if (error) {
        console.error('Error fetching problems:', error);
        process.exit(1);
    }

    console.log(`Total problems: ${problems.length}\n`);

    // Step 2: Build a map of function_name -> solution_code for each language
    // This maps the function name found IN a solution to the full solution code object
    const solutionByFnName = {}; // { python: { fnName: { problemId, code } }, javascript: { ... } }
    const languages = ['python', 'javascript', 'java', 'cpp', 'c++'];

    for (const lang of languages) {
        solutionByFnName[lang] = {};
    }

    for (const p of problems) {
        if (!p.solution_code || typeof p.solution_code !== 'object') continue;

        for (const lang of languages) {
            const code = p.solution_code[lang];
            if (!code) continue;

            let fnName;
            if (lang === 'python') {
                // Match class name or def name
                const classMatch = code.match(/class\s+(\w+)/);
                const defMatch = code.match(/def\s+(\w+)/);
                fnName = defMatch ? defMatch[1] : (classMatch ? classMatch[1] : null);
            } else {
                const fnMatch = code.match(/(?:function\s+|const\s+|let\s+|var\s+|class\s+)(\w+)/);
                fnName = fnMatch ? fnMatch[1] : null;
            }

            if (fnName) {
                // Store the solution code keyed by the function name found in the solution
                if (!solutionByFnName[lang][fnName]) {
                    solutionByFnName[lang][fnName] = [];
                }
                solutionByFnName[lang][fnName].push({
                    problemId: p.id,
                    title: p.title,
                    code: code
                });
            }
        }
    }

    // Step 3: For each problem, find the correct solution based on starter_code function name
    const updates = [];
    let matchCount = 0;
    let alreadyCorrect = 0;
    let noMatch = [];

    for (const p of problems) {
        if (!p.starter_code || !p.solution_code) continue;

        const newSolution = { ...p.solution_code };
        let needsUpdate = false;

        for (const lang of languages) {
            const starterCode = p.starter_code[lang];
            const solutionCode = p.solution_code[lang];
            if (!starterCode || !solutionCode) continue;

            // Extract function name from starter code
            let starterFn;
            if (lang === 'python') {
                const classMatch = starterCode.match(/class\s+(\w+)/);
                const defMatch = starterCode.match(/def\s+(\w+)/);
                starterFn = defMatch ? defMatch[1] : (classMatch ? classMatch[1] : null);
            } else {
                const fnMatch = starterCode.match(/(?:function\s+|const\s+|let\s+|var\s+|class\s+)(\w+)/);
                starterFn = fnMatch ? fnMatch[1] : null;
            }

            // Extract function name from current solution code
            let solutionFn;
            if (lang === 'python') {
                const classMatch = solutionCode.match(/class\s+(\w+)/);
                const defMatch = solutionCode.match(/def\s+(\w+)/);
                solutionFn = defMatch ? defMatch[1] : (classMatch ? classMatch[1] : null);
            } else {
                const fnMatch = solutionCode.match(/(?:function\s+|const\s+|let\s+|var\s+|class\s+)(\w+)/);
                solutionFn = fnMatch ? fnMatch[1] : null;
            }

            if (!starterFn || !solutionFn) continue;

            // Skip __init__ - these are class-based problems, check class name instead
            if (starterFn === '__init__') {
                // For class-based problems, extract class name from starter
                const starterClassMatch = starterCode.match(/class\s+(\w+)/);
                const solClassMatch = solutionCode.match(/class\s+(\w+)/);
                if (starterClassMatch && solClassMatch && starterClassMatch[1] === solClassMatch[1]) {
                    continue; // Already correct
                }
                // Try to find by class name
                const targetClass = starterClassMatch ? starterClassMatch[1] : null;
                if (targetClass && solutionByFnName[lang][targetClass]) {
                    // Found an exact class name match
                    continue; // The solution should already define the class
                }
            }

            if (starterFn === solutionFn) {
                continue; // Already correct
            }

            // Find the correct solution: look for a solution whose function name matches starterFn
            const candidates = solutionByFnName[lang][starterFn];
            if (candidates && candidates.length > 0) {
                // Use the first candidate (ideally there's only one)
                newSolution[lang] = candidates[0].code;
                needsUpdate = true;
                matchCount++;
            } else {
                noMatch.push({ id: p.id, title: p.title, lang, starterFn });
            }
        }

        if (needsUpdate) {
            updates.push({ id: p.id, title: p.title, solution_code: newSolution });
        } else {
            alreadyCorrect++;
        }
    }

    console.log(`\nMatched solutions: ${matchCount}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`No match found: ${noMatch.length}`);

    if (noMatch.length > 0) {
        console.log('\n⚠️  No matching solution found for:');
        noMatch.forEach(m => console.log(`   #${m.id} ${m.title} [${m.lang}] needs fn: ${m.starterFn}`));
    }

    console.log(`\n📝 Will update ${updates.length} problems...\n`);

    // Step 4: Apply updates in batches
    let updated = 0;
    let failed = 0;

    for (const update of updates) {
        const { error: updateError } = await supabaseAdmin
            .from('problems')
            .update({ solution_code: update.solution_code })
            .eq('id', update.id);

        if (updateError) {
            console.error(`  ❌ Failed to update #${update.id} ${update.title}: ${updateError.message}`);
            failed++;
        } else {
            updated++;
            if (updated % 20 === 0) {
                console.log(`  ✅ Updated ${updated}/${updates.length}...`);
            }
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`RESULTS`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`No match: ${noMatch.length}`);

    process.exit(0);
}

fixSolutionMismatches().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
