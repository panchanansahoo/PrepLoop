import { seedDatabase } from './db/seed.js';

async function setup() {
  console.log('🚀 Starting database setup...');
  
  try {
    // Schema is managed via Supabase Dashboard SQL Editor
    // Run the schema.sql file in Supabase SQL Editor to create tables
    console.log('ℹ️  Note: Run server/db/schema.sql in Supabase SQL Editor to create tables');
    
    console.log('🌱 Seeding database...');
    await seedDatabase();
    
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();
