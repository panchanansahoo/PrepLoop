#!/usr/bin/env node
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';

const execFileAsync = promisify(execFile);

export const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
export const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
export const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '7', 10);

export async function cleanOldBackups(backupDir = BACKUP_DIR, maxBackups = MAX_BACKUPS) {
  try {
    const entries = await readdir(backupDir);
    const backupFiles = entries.filter((file) => file.startsWith('backup-') && file.endsWith('.sql'));

    if (backupFiles.length <= maxBackups) {
      console.log(`Retaining ${backupFiles.length} backup(s) (retention limit: ${maxBackups})`);
      return { retained: backupFiles.length, deleted: 0 };
    }

    const filesWithStats = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = join(backupDir, file);
        const stats = await stat(filePath);
        return { file, filePath, mtime: stats.mtimeMs };
      })
    );

    // Sort descending by modification time (newest first)
    filesWithStats.sort((a, b) => b.mtime - a.mtime);

    const toDelete = filesWithStats.slice(maxBackups);
    for (const item of toDelete) {
      await unlink(item.filePath);
      console.log(`Deleted old backup: ${item.file}`);
    }

    console.log(`Cleaned up ${toDelete.length} old backup(s). Retained ${maxBackups} latest backups.`);
    return { retained: maxBackups, deleted: toDelete.length };
  } catch (error) {
    console.warn(`Warning during backup cleanup: ${error.message}`);
    return { retained: 0, deleted: 0, error: error.message };
  }
}

export async function createBackup() {
  if (!DB_URL) {
    console.error('Neither DATABASE_URL nor SUPABASE_DB_URL configured');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = join(BACKUP_DIR, filename);

  try {
    await mkdir(BACKUP_DIR, { recursive: true });

    console.log(`Creating backup: ${filename}`);

    // Use execFile with explicit arguments array to avoid shell injection
    const { stdout } = await execFileAsync('pg_dump', [
      '--dbname', DB_URL,
      '--no-owner',
      '--no-acl',
    ]);

    await writeFile(filepath, stdout);
    console.log(`✅ Backup created: ${filepath}`);

    await cleanOldBackups();
    return { success: true, filepath };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Only execute when run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('backup-db.js')) {
  createBackup();
}
