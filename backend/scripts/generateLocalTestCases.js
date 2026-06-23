import { all425Problems } from '../data/allProblems.js';
import { problemTestCases } from '../../frontend/src/data/problemTestCases.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const BATCH_SIZE = 5; // Generate 5 problems at a time to avoid rate limits

async function generateTestCasesForProblem(problem) {
  const prompt = `You are an expert competitive programming judge.
Generate exactly 3 JSON test cases for the problem: "${problem.title}".
The problem is about: ${problem.description?.substring(0, 500)}...
The starter code is:
${problem.starter_code?.javascript || problem.starter_code?.python || ''}

Return ONLY a raw JSON array of objects. Each object must have:
- "input": an array of arguments to pass to the function.
- "output": the expected return value.

Ensure the input arguments exactly match the function signature in the starter code. No markdown formatting, just raw JSON.`;

  try {
    const response = await geminiAi.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].input !== undefined) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error(`Failed to generate test cases for ${problem.title}:`, error.message);
    return null;
  }
}

async function run() {
  console.log('Starting bulk test case generation...');
  
  // Find problems missing test cases
  const missingProblems = all425Problems.filter(p => !problemTestCases[p.id]);
  console.log(`Found ${missingProblems.length} problems missing test cases.`);

  const generatedTestCases = {};
  
  // Process in batches
  for (let i = 0; i < Math.min(missingProblems.length, 10); i += BATCH_SIZE) { // Limit to 10 for safety in this script
    const batch = missingProblems.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1}...`);
    
    const promises = batch.map(async (problem) => {
      console.log(`Generating for ${problem.id}: ${problem.title}`);
      const testCases = await generateTestCasesForProblem(problem);
      if (testCases) {
        generatedTestCases[problem.id] = testCases;
        console.log(`✓ Success: ${problem.id}`);
      }
    });
    
    await Promise.all(promises);
    
    // Sleep to avoid rate limiting
    if (i + BATCH_SIZE < Math.min(missingProblems.length, 10)) {
      console.log('Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Save to file
  const outputPath = path.resolve(__dirname, '../../frontend/src/data/problemTestCases_generated.json');
  fs.writeFileSync(outputPath, JSON.stringify(generatedTestCases, null, 2));
  console.log(`Saved ${Object.keys(generatedTestCases).length} generated test cases to ${outputPath}`);
}

run().catch(console.error);
