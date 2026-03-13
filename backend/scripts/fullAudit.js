/**
 * Full audit of all problems for description/examples/constraints mismatches.
 * Dumps results to /tmp/full_audit.json for analysis.
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
    // Fetch all problems in batches using gt(id) pagination
    const allProblems = [];
    let lastId = 0;
    while (true) {
        const { data, error } = await sb.from('problems')
            .select('id, title, description, examples, constraints, difficulty')
            .gt('id', lastId)
            .order('id')
            .limit(100);
        if (error) { console.error('Query error:', error.message); break; }
        if (!data || data.length === 0) break;
        allProblems.push(...data);
        lastId = data[data.length - 1].id;
        if (data.length < 100) break;
    }
    console.log(`Fetched ${allProblems.length} problems`);

    // Keyword mapping: what keywords should appear in descriptions for specific problem types
    const titleKeywords = {
        'Two Sum': ['sum', 'target', 'indices'],
        'Binary Search': ['sorted', 'search', 'target'],
        'Linked List': ['linked list', 'head', 'node'],
        'Tree': ['tree', 'root', 'node'],
        'BST': ['binary search tree', 'BST'],
        'Graph': ['graph', 'node', 'edge', 'vertex'],
        'Stack': ['stack', 'push', 'pop'],
        'Queue': ['queue'],
        'Heap': ['heap', 'priority'],
        'Sort': ['sort', 'order'],
        'Matrix': ['matrix', 'grid', 'row', 'column'],
        'Palindrom': ['palindrom'],
        'Parenthes': ['parenthes', '(', ')'],
        'Substring': ['substring', 'string'],
        'Anagram': ['anagram'],
        'Permutation': ['permutation'],
        'Combination': ['combination'],
        'Subarray': ['subarray'],
        'Subsequence': ['subsequence'],
    };

    const issues = [];

    for (const p of allProblems) {
        const problemIssues = [];
        const titleLower = (p.title || '').toLowerCase();
        const descLower = (p.description || '').toLowerCase();

        // 1. Check for empty/placeholder description
        if (!p.description || p.description.trim().length < 20) {
            problemIssues.push('EMPTY_DESCRIPTION');
        }

        // 2. Check for empty/placeholder examples
        if (!p.examples || (Array.isArray(p.examples) && p.examples.length === 0)) {
            problemIssues.push('EMPTY_EXAMPLES');
        } else if (typeof p.examples === 'string' && p.examples.trim().length < 10) {
            problemIssues.push('PLACEHOLDER_EXAMPLES');
        } else if (Array.isArray(p.examples)) {
            // Check if examples are placeholder-style
            const hasPlaceholder = p.examples.some(ex => {
                if (typeof ex === 'object') {
                    return (ex.input === 'Example input' || ex.output === 'Example output' ||
                        ex.input === '' || ex.output === '');
                }
                return false;
            });
            if (hasPlaceholder) problemIssues.push('PLACEHOLDER_EXAMPLES');
        }

        // 3. Check for empty/placeholder constraints
        if (!p.constraints || (Array.isArray(p.constraints) && p.constraints.length === 0)) {
            problemIssues.push('EMPTY_CONSTRAINTS');
        } else if (typeof p.constraints === 'string' && p.constraints.trim().length < 5) {
            problemIssues.push('PLACEHOLDER_CONSTRAINTS');
        } else if (Array.isArray(p.constraints)) {
            const hasPlaceholder = p.constraints.some(c =>
                c === 'Constraints will be added' || c === '' || c === 'TBD'
            );
            if (hasPlaceholder) problemIssues.push('PLACEHOLDER_CONSTRAINTS');
        }

        // 4. Check if description seems to be for a DIFFERENT problem
        // Look for obvious mismatches: title says "Tree" but description talks about "linked list"
        // or title says "Array" but description talks about "tree"
        const descMismatchChecks = [
            { titleHas: 'tree', descShouldNotHave: ['linked list cycle', 'rotate the list', 'robber planning to rob'] },
            { titleHas: 'linked list', descShouldNotHave: ['binary tree', 'BST', 'root of a'] },
            { titleHas: 'parenthes', descShouldNotHave: ['binary tree', 'linked list', 'robber'] },
            { titleHas: 'graph', descShouldNotHave: ['binary tree', 'linked list'] },
            { titleHas: 'matrix', descShouldNotHave: ['linked list', 'binary tree root'] },
            { titleHas: 'string', descShouldNotHave: ['binary tree', 'linked list'] },
            { titleHas: 'palindrom', descShouldNotHave: ['robber', 'linked list'] },
            { titleHas: 'sort', descShouldNotHave: ['binary tree root'] },
            { titleHas: 'jump game', descShouldNotHave: ['binary tree', 'level order'] },
            { titleHas: 'bst', descShouldNotHave: ['robber', 'jump', 'coin'] },
            { titleHas: 'median', descShouldNotHave: ['invert', 'swap'] },
            { titleHas: 'pow', descShouldNotHave: ['valid binary search'] },
        ];

        for (const check of descMismatchChecks) {
            if (titleLower.includes(check.titleHas)) {
                for (const badKeyword of check.descShouldNotHave) {
                    if (descLower.includes(badKeyword.toLowerCase())) {
                        problemIssues.push(`DESC_MISMATCH: title has "${check.titleHas}" but desc mentions "${badKeyword}"`);
                        break;
                    }
                }
            }
        }

        // 5. Check if examples reference different data structures than title
        if (p.examples && typeof p.examples === 'string') {
            const exLower = p.examples.toLowerCase();
            for (const check of descMismatchChecks) {
                if (titleLower.includes(check.titleHas)) {
                    for (const badKeyword of check.descShouldNotHave) {
                        if (exLower.includes(badKeyword.toLowerCase())) {
                            problemIssues.push(`EXAMPLES_MISMATCH: title has "${check.titleHas}" but examples mention "${badKeyword}"`);
                            break;
                        }
                    }
                }
            }
        }

        if (problemIssues.length > 0) {
            issues.push({
                id: p.id,
                title: p.title,
                category: p.category,
                difficulty: p.difficulty,
                issues: problemIssues,
                descPreview: (p.description || '').replace(/\n/g, ' ').substring(0, 100),
                examplesType: Array.isArray(p.examples) ? `array(${p.examples.length})` : typeof p.examples,
                constraintsType: Array.isArray(p.constraints) ? `array(${p.constraints.length})` : typeof p.constraints,
                examplesPreview: JSON.stringify(p.examples).substring(0, 150),
                constraintsPreview: JSON.stringify(p.constraints).substring(0, 150),
            });
        }
    }

    // Write full results
    fs.writeFileSync('/tmp/full_audit.json', JSON.stringify(issues, null, 2));

    // Write summary
    const summary = [];
    summary.push(`Total problems: ${allProblems.length}`);
    summary.push(`Problems with issues: ${issues.length}`);
    summary.push('');

    // Group by issue type
    const issueCounts = {};
    for (const item of issues) {
        for (const iss of item.issues) {
            const key = iss.startsWith('DESC_MISMATCH') ? 'DESC_MISMATCH' :
                iss.startsWith('EXAMPLES_MISMATCH') ? 'EXAMPLES_MISMATCH' : iss;
            issueCounts[key] = (issueCounts[key] || 0) + 1;
        }
    }
    summary.push('Issue Counts:');
    for (const [key, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
        summary.push(`  ${key}: ${count}`);
    }
    summary.push('');

    // List each problem with issues
    summary.push('Detailed Issues:');
    for (const item of issues) {
        summary.push(`  [${item.id}] ${item.title}`);
        for (const iss of item.issues) {
            summary.push(`    - ${iss}`);
        }
        if (item.issues.some(i => i.includes('EMPTY') || i.includes('PLACEHOLDER'))) {
            summary.push(`    desc: ${item.descPreview || '(empty)'}`);
            summary.push(`    examples: ${item.examplesType} ${item.examplesPreview}`);
            summary.push(`    constraints: ${item.constraintsType} ${item.constraintsPreview}`);
        }
    }

    fs.writeFileSync('/tmp/full_audit_summary.txt', summary.join('\n'));
    console.log(`\nAudit complete. Found ${issues.length} problems with issues.`);
    console.log('Details: /tmp/full_audit_summary.txt');
    console.log('Full data: /tmp/full_audit.json');
}

main().catch(console.error);
