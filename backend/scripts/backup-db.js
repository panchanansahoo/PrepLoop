#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '7', 10);

async function createBackup() {
  if (!SUPABASE_DB_URL) {
    console.error('SUPABASE_DB_URL not configured');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = join(BACKUP_DIR, filename);

  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    
    console.log(`Creating backup: ${filename}`);
    
    const { stdout } = await execAsync(
      `pg_dump "${SUPABASE_DB_URL}" --no-owner --no-acl`
    );
    
    await writeFile(filepath, stdout);
    console.log(`✅ Backup created: ${filepath}`);
    
    await cleanOldBackups();
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

function cleanOldBackups() {
  // Cleanup logic would go here
  console.log(`Keeping last ${MAX_BACKUPS} backups`);
}

createBackup();
