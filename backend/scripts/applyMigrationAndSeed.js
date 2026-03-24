import { supabaseAdmin } from '../db/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printMigrationInstructions() {
  const migrationPath = path.join(__dirname, '..', 'db', 'migration_add_exploration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('\n' + '='.repeat(70));
  console.log('📌 MIGRATION REQUIRED - MANUAL STEP');
  console.log('='.repeat(70));
  console.log('\n1️⃣  Go to: Supabase Dashboard → SQL Editor');
  console.log('2️⃣  Create a new query and paste this SQL:\n');
  console.log('-'.repeat(70));
  console.log(migrationSQL);
  console.log('-'.repeat(70));
  console.log('\n3️⃣  Execute the query');
  console.log('4️⃣  Then run the seeding script:');
  console.log('   node backend/scripts/seedExploreQuestions.js\n');
  console.log('='.repeat(70) + '\n');
}

async function checkMigrationNeeded() {
  try {
    // Try to select from explore_questions column
    const { error } = await supabaseAdmin
      .from('problems')
      .select('explore_questions')
      .limit(1);
    
    if (error && error.code === '42703') {
      return true; // Migration needed
    }
    return false; // Column already exists
  } catch (error) {
    return true; // Assume migration needed if we can't check
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Exploration Enhancement - Apply LeetCode Format to All Questions');
  console.log('='.repeat(70) + '\n');

  // Check if migration is needed
  console.log('🔍 Checking if migration is needed...\n');
  const migrationNeeded = await checkMigrationNeeded();
  
  if (migrationNeeded) {
    console.log('❌ Migration not yet applied.\n');
    printMigrationInstructions();
    process.exit(1);
  }
  
  console.log('✅ Migration already applied! Proceeding with seed...\n');
  
  // Run seeding script
  console.log('🌱 Running seeding script...\n');
  
  return new Promise((resolve, reject) => {
    const seedProcess = spawn('node', ['backend/scripts/seedExploreQuestions.js'], {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });

    seedProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✨ SUCCESS!');
        console.log('✅ All problems now have LeetCode-style explore questions.');
        console.log('   Format: Example | Input/Output | Constraints | Explanation\n');
        resolve();
      } else {
        console.error('\n❌ Seeding failed with exit code:', code);
        reject(new Error('Seeding process failed'));
      }
    });

    seedProcess.on('error', (error) => {
      console.error('❌ Failed to run seeding script:', error);
      reject(error);
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
