import { supabaseAdmin } from './supabaseClient.js';
import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY, // Ensure this is available in your shell or .env
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('Fetching problems without complete solutions...');

    // Fetch all problems
    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, description, solution_code')
        .order('id');

    if (error) {
        console.error('Error fetching problems:', error);
        return;
    }

    const missingSolutions = problems.filter(p => {
        const sol = p.solution_code || {};
        if (sol.python && sol.javascript && sol.cpp && sol.java) {
            return false;
        }
        return true;
    });

    console.log(`Found ${missingSolutions.length} problems needing solutions. Starting processing...`);

    let count = 0;

    for (const problem of missingSolutions) {
        try {
            console.log(`Processing [${problem.id}] ${problem.title}...`);

            const prompt = `
You are an expert algorithm software engineer. 
Write the optimal solution to the following LeetCode/DSA problem in 4 languages: Python, JavaScript, C++, and Java.
Do NOT include any test runner code, just the function or class definition. 
For Python, write classical \`class Solution:\` with \`def functionName(self, ...):\`.
Return the output ONLY as a minified valid JSON object containing exactly 4 keys: "python", "javascript", "cpp", "java", where each value is a raw string of the raw code. Do NOT attach markdown codeblocks (\`\`\`) outside the JSON.
Do NOT include any extra text. Make sure the JSON is totally valid.

Problem Title: ${problem.title}
Problem Description:
${problem.description?.substring(0, 1500)}
`;
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            });

            const responseText = completion.choices[0].message.content;
            const parsedSol = JSON.parse(responseText);

            const existingSol = problem.solution_code || {};
            const newSol = {
                ...existingSol,
                python: parsedSol.python || existingSol.python,
                javascript: parsedSol.javascript || existingSol.javascript,
                cpp: parsedSol.cpp || existingSol.cpp,
                java: parsedSol.java || existingSol.java,
            };

            const { error: updateError } = await supabaseAdmin
                .from('problems')
                .update({ solution_code: newSol })
                .eq('id', problem.id);

            if (updateError) {
                console.error(`  -> Failed to update DB for ${problem.title}: ${updateError.message}`);
            } else {
                console.log(`  -> Successfully updated ${problem.title}`);
                count++;
            }
        } catch (e) {
            console.error(`  -> Error processing ${problem.title}: ${e.message}`);
        }

        // Wait 2s to not exceed rate limits (~ 30 RPM limit on free tier)
        await delay(2000);
    }

    console.log(`Finished! Successfully updated ${count} problems.`);
}

main();
