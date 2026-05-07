#!/usr/bin/env node
/**
 * Apply user_calendar_events migration
 * Run with: node scripts/apply_calendar_events_migration.js
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../db/supabaseClient.js';
import '../config/env.js';

const migrationFile = new URL('../db/migration_calendar_events.sql', import.meta.url).pathname;

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('⏳ Applying migration to database...');
    
    // Execute the migration SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });

    if (error) {
      // Try alternative approach: split by statements and execute individually
      console.log('⚠️ RPC approach failed, trying alternative method...');
      
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        console.log(`  Executing: ${statement.substring(0, 50)}...`);
        
        // Use raw SQL execution via Postgres
        const { error: execError } = await supabaseAdmin.rpc('execute_migration', {
          sql_statement: statement.trim()
        }).catch(() => {
          // If RPC fails, try to create table directly
          return supabaseAdmin.from('information_schema.tables')
            .select('table_name')
            .eq('table_name', 'user_calendar_events')
            .then(({ data, error }) => {
              if (error) {
                console.log('  Table does not exist yet, needs to be created via dashboard');
              }
              return { error: null };
            });
        });
        
        if (execError) {
          console.warn(`  ⚠️ Warning: ${execError.message}`);
        }
      }
    }

    // Verify table was created
    console.log('✓ Verifying table creation...');
    const { data: tables, error: checkError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_calendar_events');

    if (checkError) {
      console.warn('⚠️ Could not verify table via RLS. Please verify manually in Supabase dashboard.');
      console.log(`\n📋 SQL to run in Supabase SQL Editor:\n${sql}`);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Migration applied successfully!');
      console.log('✅ user_calendar_events table created');
    } else {
      console.log('⚠️ Table not found after migration. Please run the following SQL in Supabase dashboard:');
      console.log(`\n${sql}\n`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please run the following SQL manually in Supabase SQL Editor:');
    console.log(fs.readFileSync(migrationFile, 'utf-8'));
    process.exit(1);
  }
}

applyMigration();
