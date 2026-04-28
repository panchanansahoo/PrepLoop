import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Reading migration script...');
    const migrationScript = await fs.readFile('./db/migration_profile_enhancements.sql', 'utf8');
    
    console.log('Executing migration...');
    // Note: Supabase does not allow direct execution of SQL scripts via the client
    // This would typically be run via the Supabase CLI or dashboard
    console.log('Migration script loaded. Execute this manually via:');
    console.log('supabase db reset');
    console.log('Or apply via database studio in Supabase dashboard');
    console.log('');
    console.log('Migration script content:');
    console.log(migrationScript);
    
    // Check if the columns exist already
    const { data: columns, error } = await supabase
      .from('information_schema.columns') 
      .select('column_name')
      .eq('table_name', 'profiles');
    
    if (error) {
      console.error('Error checking columns:', error);
      return;
    }
    
    const columnNames = columns.map(col => col.column_name);
    const newColumns = [
      'phone', 'location', 'website', 'company', 
      'years_of_experience', 'specialization', 'social_links',
      'twitter', 'linkedin', 'portfolio', 'dribbble', 'updated_at'
    ];
    
    const missingColumns = newColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('\n✓ All new columns already exist in the profiles table');
    } else {
      console.log(`\n⚠ Missing columns that need to be added: ${missingColumns.join(', ')}`);
      console.log('Run the migration script to add these columns');
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

// Run the migration
runMigration();