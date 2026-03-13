import { supabaseAdmin } from '../db/supabaseClient.js';

async function checkAllSolutions() {
    console.log('🔍 Checking all problem solutions...\n');

    // Fetch all problems with solution_code, starter_code, and test_cases
    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, difficulty, solution_code, starter_code, test_cases, solution_approach')
        .order('id');

    if (error) {
        console.error('Error fetching problems:', error);
        process.exit(1);
    }

    console.log(`Total problems in DB: ${problems.length}\n`);

    const issues = {
        noSolutionCode: [],
        emptySolutionCode: [],
        noStarterCode: [],
        noTestCases: [],
        solutionMismatchFnName: [],
        placeholderSolution: [],
    };

    for (const p of problems) {
        // Check for missing solution_code
        if (p.solution_code === null || p.solution_code === undefined) {
            issues.noSolutionCode.push({ id: p.id, title: p.title, difficulty: p.difficulty });
            continue;
        }

        // Check if solution_code is empty object or has empty values
        const solCode = typeof p.solution_code === 'object' ? p.solution_code : {};
        const langs = Object.keys(solCode);

        if (langs.length === 0) {
            issues.emptySolutionCode.push({ id: p.id, title: p.title, difficulty: p.difficulty });
            continue;
        }

        // Check each language solution
        for (const lang of langs) {
            const code = solCode[lang];
            if (!code || code.trim().length < 10) {
                issues.emptySolutionCode.push({ id: p.id, title: p.title, difficulty: p.difficulty, lang });
            }

            // Check for placeholder patterns
            if (code && (
                code.includes('// TODO') ||
                code.includes('pass  # TODO') ||
                code.includes('return None  # placeholder') ||
                code.includes('return null; // placeholder') ||
                code === 'null' ||
                code.trim().length < 20
            )) {
                issues.placeholderSolution.push({ id: p.id, title: p.title, lang, snippet: code.substring(0, 80) });
            }
        }

        // Check for missing starter_code
        if (!p.starter_code || Object.keys(p.starter_code).length === 0) {
            issues.noStarterCode.push({ id: p.id, title: p.title });
        }

        // Check for missing test_cases
        if (!p.test_cases || (Array.isArray(p.test_cases) && p.test_cases.length === 0)) {
            issues.noTestCases.push({ id: p.id, title: p.title });
        }

        // Check function name match between starter_code and solution_code
        if (p.starter_code && p.solution_code) {
            const starterCode = p.starter_code;
            for (const lang of ['python', 'javascript']) {
                if (starterCode[lang] && solCode[lang]) {
                    const starterFnMatch = starterCode[lang].match(/(?:def |function |const |let |var )(\w+)/);
                    const solFnMatch = solCode[lang].match(/(?:def |function |const |let |var )(\w+)/);
                    if (starterFnMatch && solFnMatch && starterFnMatch[1] !== solFnMatch[1]) {
                        issues.solutionMismatchFnName.push({
                            id: p.id,
                            title: p.title,
                            lang,
                            starterFn: starterFnMatch[1],
                            solutionFn: solFnMatch[1]
                        });
                    }
                }
            }
        }
    }

    // Report
    console.log('='.repeat(70));
    console.log('SOLUTION AUDIT REPORT');
    console.log('='.repeat(70));

    console.log(`\n❌ Problems with NO solution_code: ${issues.noSolutionCode.length}`);
    if (issues.noSolutionCode.length > 0) {
        issues.noSolutionCode.forEach(p => console.log(`   #${p.id} ${p.title} [${p.difficulty}]`));
    }

    console.log(`\n⚠️  Problems with EMPTY solution_code: ${issues.emptySolutionCode.length}`);
    if (issues.emptySolutionCode.length > 0) {
        issues.emptySolutionCode.forEach(p => console.log(`   #${p.id} ${p.title} ${p.lang ? `[${p.lang}]` : ''} [${p.difficulty}]`));
    }

    console.log(`\n🔧 Problems with PLACEHOLDER solutions: ${issues.placeholderSolution.length}`);
    if (issues.placeholderSolution.length > 0) {
        issues.placeholderSolution.forEach(p => console.log(`   #${p.id} ${p.title} [${p.lang}]: "${p.snippet}..."`));
    }

    console.log(`\n🔀 Problems with FUNCTION NAME MISMATCH (starter vs solution): ${issues.solutionMismatchFnName.length}`);
    if (issues.solutionMismatchFnName.length > 0) {
        issues.solutionMismatchFnName.forEach(p => console.log(`   #${p.id} ${p.title} [${p.lang}]: starter="${p.starterFn}" solution="${p.solutionFn}"`));
    }

    console.log(`\n📋 Problems with NO starter_code: ${issues.noStarterCode.length}`);
    if (issues.noStarterCode.length > 0) {
        issues.noStarterCode.slice(0, 20).forEach(p => console.log(`   #${p.id} ${p.title}`));
        if (issues.noStarterCode.length > 20) console.log(`   ... and ${issues.noStarterCode.length - 20} more`);
    }

    console.log(`\n🧪 Problems with NO test_cases: ${issues.noTestCases.length}`);
    if (issues.noTestCases.length > 0) {
        issues.noTestCases.slice(0, 20).forEach(p => console.log(`   #${p.id} ${p.title}`));
        if (issues.noTestCases.length > 20) console.log(`   ... and ${issues.noTestCases.length - 20} more`);
    }

    // Summary
    const totalWithSolutions = problems.length - issues.noSolutionCode.length - issues.emptySolutionCode.length;
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total problems:          ${problems.length}`);
    console.log(`With solutions:          ${totalWithSolutions}`);
    console.log(`Missing solutions:       ${issues.noSolutionCode.length}`);
    console.log(`Empty solutions:         ${issues.emptySolutionCode.length}`);
    console.log(`Placeholder solutions:   ${issues.placeholderSolution.length}`);
    console.log(`Fn name mismatches:      ${issues.solutionMismatchFnName.length}`);
    console.log(`Missing starter code:    ${issues.noStarterCode.length}`);
    console.log(`Missing test cases:      ${issues.noTestCases.length}`);

    // Check how many have all 3 languages
    let withPython = 0, withJS = 0, withJava = 0, withCpp = 0;
    for (const p of problems) {
        if (p.solution_code && typeof p.solution_code === 'object') {
            if (p.solution_code.python) withPython++;
            if (p.solution_code.javascript) withJS++;
            if (p.solution_code.java) withJava++;
            if (p.solution_code.cpp || p.solution_code['c++']) withCpp++;
        }
    }
    console.log(`\nLanguage coverage:`);
    console.log(`  Python:     ${withPython}/${problems.length}`);
    console.log(`  JavaScript: ${withJS}/${problems.length}`);
    console.log(`  Java:       ${withJava}/${problems.length}`);
    console.log(`  C++:        ${withCpp}/${problems.length}`);

    process.exit(0);
}

checkAllSolutions().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
