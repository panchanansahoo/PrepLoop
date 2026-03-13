import { supabaseAdmin } from '../db/supabaseClient.js';

async function listMissing() {
    const { data: problems } = await supabaseAdmin
        .from('problems')
        .select('id, title, difficulty, starter_code, solution_code')
        .order('id');

    const missing = problems.filter(p => {
        const sol = p.solution_code || {};
        return !sol.javascript || !sol.java || !sol.cpp;
    });

    console.log(`Problems needing multi-lang solutions: ${missing.length}\n`);

    // Group by ranges
    for (const p of missing) {
        const sol = p.solution_code || {};
        const starter = p.starter_code || {};
        // Get python function name
        let fnName = 'solve';
        if (starter.python) {
            const m = starter.python.match(/(?:class\s+(\w+)|def\s+(\w+))/);
            fnName = m ? (m[2] || m[1]) : 'solve';
        }
        const needs = [];
        if (!sol.javascript) needs.push('js');
        if (!sol.java) needs.push('java');
        if (!sol.cpp) needs.push('cpp');
        console.log(`#${p.id} ${p.title} [${p.difficulty}] fn=${fnName} needs=[${needs.join(',')}]`);
    }
}
listMissing();
