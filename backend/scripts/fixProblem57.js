// Fix problem 57: examples, starter_code, solution_code, test_cases (as plain objects, not JSON strings)
import { supabaseAdmin } from '../db/supabaseClient.js';

async function fix() {
    console.log('Fixing problem 57 remaining fields...\n');

    const { error } = await supabaseAdmin
        .from('problems')
        .update({
            examples: [
                {
                    input: 's = "the sky is blue"',
                    output: '"blue is sky the"',
                    explanation: ''
                },
                {
                    input: 's = "  hello world  "',
                    output: '"world hello"',
                    explanation: 'Your reversed string should not contain leading or trailing spaces.'
                },
                {
                    input: 's = "a good   example"',
                    output: '"example good a"',
                    explanation: 'You need to reduce multiple spaces between two words to a single space in the reversed string.'
                }
            ],
            starter_code: {
                python: `def reverseWords(s):\n    # Your code here\n    pass`,
                javascript: `function reverseWords(s) {\n    // Your code here\n}`,
                java: `class Solution {\n    public String reverseWords(String s) {\n        // Your code here\n    }\n}`,
                cpp: `class Solution {\npublic:\n    string reverseWords(string s) {\n        // Your code here\n    }\n};`
            },
            solution_code: {
                python: `def reverseWords(s):\n    return ' '.join(s.split()[::-1])`
            },
            test_cases: [
                { input: ["the sky is blue"], expected_output: "blue is sky the" },
                { input: ["  hello world  "], expected_output: "world hello" },
                { input: ["a good   example"], expected_output: "example good a" }
            ]
        })
        .eq('id', 57);

    if (error) {
        console.error('FAIL:', error.message);
    } else {
        console.log('✅ Problem 57 examples + starter_code fixed!');
    }
}

fix().catch(console.error);
