import { supabaseAdmin } from './supabaseClient.js';

async function run() {
  const { data, error } = await supabaseAdmin
    .from('problems')
    .select('title, test_cases');

  if (error) {
    console.error(error);
    return;
  }

  const hasTestCases = data.filter(p => p.test_cases !== null && JSON.stringify(p.test_cases) !== '[]' && JSON.stringify(p.test_cases) !== '{}');
  console.log(`Found ${hasTestCases.length} problems with test cases.`);
  if (hasTestCases.length > 0) {
    console.log("First one:", JSON.stringify(hasTestCases[0], null, 2));
  }
}

run();
